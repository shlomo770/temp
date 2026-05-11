import type * as maplibregl from "maplibre-gl";
import { Entity, EntityType, Coordinates } from "../../types";
import { createCirclePolygon, createEllipsePolygon, getEntityAnchor } from "../../utils/geometry";
import { distanceToSegment } from "./Helpers";
import { MapEntityRenderer } from "./MapEntityRenderer";
import { store } from "../../store/store";

type DrawingCallbacks = {
  onEntityDrawn: (entity: Omit<Entity, "id">) => void;
  onEntityUpdated: (id: string, coordinates: Coordinates[]) => void;
  onEntityDeleted: (id: string) => void;
};

type DrawType = "circle" | "ellipse" | "polygon" | "marker" | "line";
type DrawMode = "none" | "create" | "edit";

type DrawingUiState = {
  mode: "create" | "edit";
  type: DrawType;
  anchor: Coordinates;
  entityId?: string;
  canFinish: boolean;
};

export class MapDrawingService {
  private map: maplibregl.Map;
  private entityRenderer: MapEntityRenderer;
  private onEntityDrawn?: (entity: Omit<Entity, "id">) => void;
  private onEntityUpdated?: (id: string, coordinates: Coordinates[]) => void;
  private onUiStateChanged?: (state: DrawingUiState | null) => void;

  private mode: DrawMode = "none";
  private activeType: DrawType | null = null;
  private activeEntityId: string | null = null;
  private points: Coordinates[] = [];
  private dragState: {
    type: "none" | "edge" | "center" | "vertex";
    index?: number;
    start?: Coordinates;
    originPoints?: Coordinates[];
  } = { type: "none" };
  private activeFinishEdit: (() => void) | null = null;
  private activeEntitySnapshot: any | null = null;

  private readonly shapeSourceId = "draw-shape-source";
  private readonly shapeFillLayerId = "draw-shape-fill";
  private readonly shapeLineLayerId = "draw-shape-line";
  private readonly handleSourceId = "draw-handles-source";
  private readonly handleLayerId = "draw-handles-layer";
  private readonly polyLineSourceId = "draw-poly-line-source";
  private readonly polyLineLayerId = "draw-poly-line-layer";
  private readonly polyFillSourceId = "draw-poly-fill-source";
  private readonly polyFillLayerId = "draw-poly-fill-layer";
  private readonly vertexSourceId = "draw-vertices-source";
  private readonly vertexLayerId = "draw-vertices-layer";

  private layerHandlersBound = false;
  private globalHandlersBound = false;

  constructor(map: maplibregl.Map, entityRenderer: MapEntityRenderer) {
    this.map = map;
    this.entityRenderer = entityRenderer;
    this.bindGlobalHandlers();
  }

  public initialize(callbacks: DrawingCallbacks) {
    this.onEntityDrawn = callbacks.onEntityDrawn;
    this.onEntityUpdated = callbacks.onEntityUpdated;
  }

  public setCallbacks(callbacks: DrawingCallbacks) {
    this.onEntityDrawn = callbacks.onEntityDrawn;
    this.onEntityUpdated = callbacks.onEntityUpdated;
  }

  public setUiListener(listener: (state: DrawingUiState | null) => void) {
    this.onUiStateChanged = listener;
  }

  public getDrawControl() {
    return null;
  }

  public removeDrawControl() {
    this.clearOverlays();
  }

  public rebuildDrawControl() {
    this.refreshOverlays();
  }

  public registerFinishEdit(fn: () => void) {
    this.activeFinishEdit = fn;
  }

  public triggerFinishEdit() {
    if (this.activeFinishEdit) {
      this.activeFinishEdit();
    }
  }

  public finishEdit() {
    if (this.mode === "none" || !this.activeType) return;

    if (!this.canFinish()) {
      return;
    }

    if (this.mode === "create") {
      if (this.onEntityDrawn) {
        this.onEntityDrawn({
          type: this.activeType,
          coordinates: this.getCleanPoints(),
          properties: {},
        });
      }
      this.resetState();
      return;
    }

    if (this.mode === "edit" && this.activeEntityId) {
      const coords = this.getCleanPoints();
      if (this.onEntityUpdated) {
        this.onEntityUpdated(this.activeEntityId, coords);
      }
      const snapshot = { ...(this.activeEntitySnapshot || {}) };
      if ("geometry" in snapshot) {
        snapshot.geometry = undefined;
      }
      this.entityRenderer.addEntityToMap({
        ...snapshot,
        id: this.activeEntityId,
        type: this.activeType,
        coordinates: coords,
      });
      this.resetState();
    }
  }

  public setDrawingMode(mode: EntityType | null) {
    if (!mode || !this.isSupportedType(mode)) {
      this.resetState();
      return;
    }
    this.resetState();
    this.mode = "create";
    this.activeType = mode;
    this.points = [];
    this.activeFinishEdit = () => this.finishEdit();
    this.updateUiState();
  }

  public setEditMode(entityId: string, entity?: any) {
    if (!entity || !this.isSupportedType(entity.type)) return;
    if (!entity.coordinates || !Array.isArray(entity.coordinates)) return;

    this.resetState();
    this.mode = "edit";
    this.activeType = entity.type;
    this.activeEntityId = entityId;
    this.activeEntitySnapshot = { ...entity };

    if (this.activeType === "polygon" || this.activeType === "line") {
      const coords = [...entity.coordinates];
      if (coords.length > 1) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (first.lng === last.lng && first.lat === last.lat) {
          coords.pop();
        }
      }
      this.points = coords;
    } else {
      const center = entity.coordinates[0];
      let edge = entity.coordinates[1];
      if (!edge || (edge.lng === center.lng && edge.lat === center.lat)) {
        edge = { lng: center.lng + 0.001, lat: center.lat + 0.001 };
      }
      this.points = [center, edge];
    }

    this.entityRenderer.removeEntityFromMap(entityId);
    this.refreshOverlays();
    this.activeFinishEdit = () => this.finishEdit();
    this.updateUiState();
  }

  public removeCirclePreview() {
    this.resetState();
  }

  public removeEllipsePreview() {
    this.resetState();
  }

  public removeSectorPreview() {
    this.resetState();
  }

  public removePolygonPreview() {
    this.resetState();
  }

  public removeLastDrawPreview() {
    this.resetState();
  }

  private bindGlobalHandlers() {
    if (this.globalHandlersBound) return;
    this.map.on("click", this.handleMapClick);
    this.map.on("mousedown", this.handleMapDown);
    this.map.on("touchstart", this.handleMapDown);
    this.map.on("mousemove", this.handleMapMove);
    this.map.on("touchmove", this.handleMapMove);
    this.map.on("mouseup", this.handleMapUp);
    this.map.on("touchend", this.handleMapUp);
    this.map.on("touchcancel", this.handleMapUp);
    this.map.on("mouseout", this.handleMapUp);
    this.globalHandlersBound = true;
  }

  private unbindGlobalHandlers() {
    if (!this.globalHandlersBound) return;
    this.map.off("click", this.handleMapClick);
    this.map.off("mousedown", this.handleMapDown);
    this.map.off("touchstart", this.handleMapDown);
    this.map.off("mousemove", this.handleMapMove);
    this.map.off("touchmove", this.handleMapMove);
    this.map.off("mouseup", this.handleMapUp);
    this.map.off("touchend", this.handleMapUp);
    this.map.off("touchcancel", this.handleMapUp);
    this.map.off("mouseout", this.handleMapUp);
    this.globalHandlersBound = false;
  }

  private bindLayerHandlers() {
    if (this.layerHandlersBound) return;
    if (this.map.getLayer(this.handleLayerId)) {
      this.map.on("mousedown", this.handleLayerId, this.handleHandleDown);
      this.map.on("touchstart", this.handleLayerId, this.handleHandleDown);
    }
    if (this.map.getLayer(this.vertexLayerId)) {
      this.map.on("mousedown", this.vertexLayerId, this.handleVertexDown);
      this.map.on("touchstart", this.vertexLayerId, this.handleVertexDown);
    }
    if (this.map.getLayer(this.polyLineLayerId)) {
      this.map.on("click", this.polyLineLayerId, this.handlePolyLineClick);
    }
    this.layerHandlersBound = true;
  }

  private unbindLayerHandlers() {
    if (!this.layerHandlersBound) return;
    this.map.off("mousedown", this.handleLayerId, this.handleHandleDown);
    this.map.off("touchstart", this.handleLayerId, this.handleHandleDown);
    this.map.off("mousedown", this.vertexLayerId, this.handleVertexDown);
    this.map.off("touchstart", this.vertexLayerId, this.handleVertexDown);
    this.map.off("click", this.polyLineLayerId, this.handlePolyLineClick);
    this.layerHandlersBound = false;
  }

  private handleMapClick = (e: any) => {
    if (this.mode !== "create" || !this.activeType) return;
    if (this.dragState.type !== "none") return;

    if (this.activeType === "marker") {
      const point = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      const iconCode = store.getState().entities.selectedMarkerIcon || "E7BA";
      if (this.onEntityDrawn) {
        this.onEntityDrawn({
          type: "marker",
          coordinates: [point],
          properties: { iconChar: iconCode },
        });
      }
      this.resetState();
      return;
    }

    if (this.activeType === "polygon" || this.activeType === "line") {
      this.points.push({ lng: e.lngLat.lng, lat: e.lngLat.lat });
      this.refreshOverlays();
      this.updateUiState();
      return;
    }

    // circle / ellipse: require two clicks (center, then edge)
    if (this.points.length === 0) {
      const center = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      this.points = [center, center];
    } else {
      this.points[1] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    }
    this.refreshOverlays();
    this.updateUiState();
  };

  private handleMapDown = (_e: any) => {
    if (this.mode !== "create") return;
    if (this.activeType !== "polygon") return;
    // no-op for polygon creation (handled by click)
    return;
  };

  private handleMapMove = (e: any) => {
    if (this.dragState.type === "none") return;
    if (!this.activeType) return;

    if (this.dragState.type === "edge" && (this.activeType === "circle" || this.activeType === "ellipse")) {
      this.points[1] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      this.refreshOverlays();
      this.updateUiState();
      return;
    }

    if (this.dragState.type === "center" && this.dragState.start && this.dragState.originPoints) {
      const dx = e.lngLat.lng - this.dragState.start.lng;
      const dy = e.lngLat.lat - this.dragState.start.lat;
      this.points = this.dragState.originPoints.map(p => ({ lng: p.lng + dx, lat: p.lat + dy }));
      this.refreshOverlays();
      this.updateUiState();
      return;
    }

    if (this.dragState.type === "vertex" && typeof this.dragState.index === "number") {
      this.points[this.dragState.index] = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      this.refreshOverlays();
      this.updateUiState();
    }
  };

  private handleMapUp = () => {
    this.dragState = { type: "none" };
    this.enableMapInteractions();
  };

  private handleHandleDown = (e: any) => {
    if (this.mode === "none" || !this.activeType) return;
    if (!e?.features?.length) return;
    const feature = e.features[0];
    const role = feature?.properties?.role;
    if (role !== "center" && role !== "edge") return;

    this.safePreventDefault(e);
    e.originalEvent?.stopPropagation?.();

    if (role === "edge") {
      this.dragState = { type: "edge" };
    } else {
      this.dragState = {
        type: "center",
        start: { lng: e.lngLat.lng, lat: e.lngLat.lat },
        originPoints: [...this.points],
      };
    }
    this.disableMapInteractions();
  };

  private handleVertexDown = (e: any) => {
    if (this.mode === "none" || (this.activeType !== "polygon" && this.activeType !== "line")) return;
    if (!e?.features?.length) return;
    const feature = e.features[0];
    const index = feature?.properties?.index;
    if (typeof index !== "number") return;

    this.safePreventDefault(e);
    e.originalEvent?.stopPropagation?.();

    this.dragState = { type: "vertex", index };
    this.disableMapInteractions();
  };

  private handlePolyLineClick = (e: any) => {
    if (this.mode !== "edit" || (this.activeType !== "polygon" && this.activeType !== "line")) return;
    if (this.dragState.type !== "none") return;

    const clickPoint = { lng: e.lngLat.lng, lat: e.lngLat.lat };
    if (this.points.length < 2) return;

    let insertIndex = -1;
    let minDist = Infinity;

    for (let i = 0; i < this.points.length - 1; i++) {
      const dist = distanceToSegment(clickPoint, this.points[i], this.points[i + 1]);
      if (dist < minDist) {
        minDist = dist;
        insertIndex = i + 1;
      }
    }

    if (this.activeType === "polygon") {
      const endDist = distanceToSegment(clickPoint, this.points[this.points.length - 1], this.points[0]);
      if (endDist < minDist) {
        insertIndex = this.points.length;
      }
    }

    if (insertIndex >= 0) {
      this.points.splice(insertIndex, 0, clickPoint);
      this.refreshOverlays();
      this.updateUiState();
    }
  };

  private refreshOverlays() {
    if (this.activeType === "circle" || this.activeType === "ellipse") {
      this.updateCircleEllipsePreview();
    } else if (this.activeType === "polygon" || this.activeType === "line") {
      this.updatePolygonPreview();
    }
    this.bindLayerHandlers();
  }

  private updateCircleEllipsePreview() {
    if (!this.map || this.points.length === 0) return;
    const center = this.points[0];
    const edge = this.points[1] || { lng: center.lng + 0.001, lat: center.lat + 0.001 };
    const polygon = this.activeType === "circle"
      ? createCirclePolygon(center, edge, 64)
      : createEllipsePolygon(center, edge, 64);
    const geojson: any = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygon.map(pt => [pt.lng, pt.lat])],
      },
      properties: {}
    };

    this.ensureSource(this.shapeSourceId, geojson);
    this.ensureLayer(this.shapeFillLayerId, "fill", this.shapeSourceId, {
      "fill-color": "#3b82f6",
      "fill-opacity": 0.25,
      "fill-outline-color": "#1e40af",
    });
    this.ensureLayer(this.shapeLineLayerId, "line", this.shapeSourceId, {
      "line-color": "#1e40af",
      "line-width": 2,
    });

    const handlesGeojson: any = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [center.lng, center.lat] },
          properties: { role: "center" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [edge.lng, edge.lat] },
          properties: { role: "edge" },
        },
      ],
    };
    this.ensureSource(this.handleSourceId, handlesGeojson);
    this.ensureLayer(this.handleLayerId, "circle", this.handleSourceId, {
      "circle-radius": 6,
      "circle-color": [
        "case",
        ["==", ["get", "role"], "center"], "#1e40af",
        "#3b82f6"
      ],
      "circle-stroke-color": "#fff",
      "circle-stroke-width": 2
    });
  }

  private updatePolygonPreview() {
    const coords = this.points.map(pt => [pt.lng, pt.lat]);

    if (coords.length >= 2) {
      const lineGeojson: any = {
        type: "Feature",
        geometry: { type: "LineString", coordinates: coords },
        properties: {}
      };
      this.ensureSource(this.polyLineSourceId, lineGeojson);
      this.ensureLayer(this.polyLineLayerId, "line", this.polyLineSourceId, {
        "line-color": "#1e40af",
        "line-width": 2
      });
    } else {
      this.removeLayerAndSource(this.polyLineLayerId, this.polyLineSourceId);
    }

    if (this.activeType === "polygon" && coords.length >= 3) {
      const polyGeojson: any = {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [[...coords, coords[0]]] },
        properties: {}
      };
      this.ensureSource(this.polyFillSourceId, polyGeojson);
      this.ensureLayer(this.polyFillLayerId, "fill", this.polyFillSourceId, {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.25
      });
    } else {
      this.removeLayerAndSource(this.polyFillLayerId, this.polyFillSourceId);
    }

    if (coords.length > 0) {
      const verticesGeojson: any = {
        type: "FeatureCollection",
        features: this.points.map((pt, index) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [pt.lng, pt.lat] },
          properties: { index }
        }))
      };
      this.ensureSource(this.vertexSourceId, verticesGeojson);
      this.ensureLayer(this.vertexLayerId, "circle", this.vertexSourceId, {
        "circle-radius": 6,
        "circle-color": "#3b82f6",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2
      });
    } else {
      this.removeLayerAndSource(this.vertexLayerId, this.vertexSourceId);
    }
  }

  private ensureSource(id: string, data: any) {
    const source = this.map.getSource(id) as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(data);
      return;
    }
    this.map.addSource(id, { type: "geojson", data });
  }

  private ensureLayer(id: string, type: "fill" | "line" | "circle", source: string, paint: any) {
    if (this.map.getLayer(id)) return;
    this.map.addLayer({
      id,
      type,
      source: source as any,
      paint,
    } as any);
  }

  private clearOverlays() {
    this.unbindLayerHandlers();
    // Remove all layers first, then sources. Some layers share same source.
    this.removeLayer(this.shapeFillLayerId);
    this.removeLayer(this.shapeLineLayerId);
    this.removeLayer(this.handleLayerId);
    this.removeLayer(this.polyLineLayerId);
    this.removeLayer(this.polyFillLayerId);
    this.removeLayer(this.vertexLayerId);

    this.removeSource(this.shapeSourceId);
    this.removeSource(this.handleSourceId);
    this.removeSource(this.polyLineSourceId);
    this.removeSource(this.polyFillSourceId);
    this.removeSource(this.vertexSourceId);
  }

  private resetState() {
    this.clearOverlays();
    this.enableMapInteractions();
    this.mode = "none";
    this.activeType = null;
    this.activeEntityId = null;
    this.activeEntitySnapshot = null;
    this.points = [];
    this.dragState = { type: "none" };
    this.activeFinishEdit = null;
    this.updateUiState();
  }

  private isSupportedType(type: EntityType): type is DrawType {
    return (
      type === "circle" ||
      type === "ellipse" ||
      type === "polygon" ||
      type === "marker" ||
      type === "line"
    );
  }

  private canFinish(): boolean {
    if (!this.activeType) return false;
    if (this.activeType === "marker") return this.points.length >= 1;
    if (this.activeType === "polygon") return this.points.length >= 3;
    if (this.points.length < 2) return false;
    const [c, e] = this.points;
    return !(c.lng === e.lng && c.lat === e.lat);
  }

  private getCleanPoints(): Coordinates[] {
    if (this.activeType !== "polygon") return this.points;
    if (this.points.length === 0) return [];
    const first = this.points[0];
    const last = this.points[this.points.length - 1];
    if (first.lng === last.lng && first.lat === last.lat) {
      return this.points.slice(0, -1);
    }
    return this.points;
  }

  private updateUiState() {
    if (this.mode === "none" || !this.activeType) {
      this.onUiStateChanged?.(null);
      return;
    }
    const coords = this.getCleanPoints();
    if (coords.length === 0) {
      this.onUiStateChanged?.(null);
      return;
    }
    const anchor = getEntityAnchor({ type: this.activeType, coordinates: coords });
    this.onUiStateChanged?.({
      mode: this.mode,
      type: this.activeType,
      anchor,
      entityId: this.activeEntityId ?? undefined,
      canFinish: this.canFinish(),
    });
  }

  private disableMapInteractions() {
    this.map.dragPan.disable();
    this.map.touchZoomRotate.disable();
    this.map.scrollZoom.disable();
    this.map.doubleClickZoom.disable();
  }

  private enableMapInteractions() {
    this.map.dragPan.enable();
    this.map.touchZoomRotate.enable();
    this.map.scrollZoom.enable();
    this.map.doubleClickZoom.enable();
  }

  private safePreventDefault(e: any) {
    const ev = e?.originalEvent || e;
    if (ev && typeof ev.preventDefault === "function" && ev.cancelable) {
      ev.preventDefault();
    }
  }

  private removeLayer(id: string) {
    if (this.map.getLayer(id)) {
      this.map.removeLayer(id);
    }
  }

  private removeSource(id: string) {
    if (this.map.getSource(id)) {
      this.map.removeSource(id);
    }
  }

  private removeLayerAndSource(layerId: string, sourceId?: string) {
    this.removeLayer(layerId);
    this.removeSource(sourceId ?? layerId);
  }

  public destroy() {
    this.resetState();
    this.unbindGlobalHandlers();
    this.onEntityDrawn = undefined;
    this.onEntityUpdated = undefined;
    this.onUiStateChanged = undefined;
  }
}