import maplibregl from "maplibre-gl";
import { store } from "../../store/store";
import { selectDisplayedEntitiesOnMap } from "../../store/selectors/entitiesSelectors";
import { MapDrawingService } from "./MapDrawingService";
import { MapEntityRenderer } from "./MapEntityRenderer";

/** לבדיקה – טילים מהרשת בלבד (ללא שרת מקומי) */
const PUBLIC_RASTER_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export class MapStyleService {
  private map: maplibregl.Map;
  private drawingService: MapDrawingService;
  private entityRenderer: MapEntityRenderer;
  private styleChangeCallbacks: (() => void)[] = [];
  private isChangingStyle: boolean = false;
  private currentMapType: string = "vector-global";

  constructor(map: maplibregl.Map, drawingService: MapDrawingService, entityRenderer: MapEntityRenderer) {
    this.map = map;
    this.drawingService = drawingService;
    this.entityRenderer = entityRenderer;
  }

  public setInitialMapType(mapType: string) {
    this.currentMapType = mapType;
  }

  public getCurrentMapType(): string {
    return this.currentMapType;
  }

  public onStyleChanged(callback: () => void) {
    this.styleChangeCallbacks.push(callback);
  }

  private notifyStyleChanged() {
    this.styleChangeCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error("Error in style change callback:", error);
      }
    });
  }

  public changeMapStylePreservingEntities(newStyle: any) {
    if (!this.map) { return; }
    if (this.isChangingStyle) { this.isChangingStyle = false; }
    if (this.isChangingStyle) { return; }
    this.isChangingStyle = true;
    const safetyTimeout = setTimeout(() => {
      if (this.isChangingStyle) {
        this.isChangingStyle = false;
      }
    }, 10000);

    this.drawingService.removeDrawControl();

    this.map.setStyle(newStyle);
    const restoreEverything = () => {
      try {
        this.drawingService.removeDrawControl();
        this.drawingService.rebuildDrawControl();
        const entitiesForMap = Object.values(selectDisplayedEntitiesOnMap(store.getState()));
        if (entitiesForMap.length > 0) {
          entitiesForMap.forEach((entity) => {
            if (entity) this.entityRenderer.addEntityToMap(entity);
          });
        }
        this.notifyStyleChanged();
        this.isChangingStyle = false;
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error("❌ Error during style restoration:", error);
        this.isChangingStyle = false;
        clearTimeout(safetyTimeout);
      }
    };

    this.map.off("styledata", restoreEverything);
    this.map.off("load", restoreEverything);
    this.map.once("styledata", restoreEverything);
    this.map.once("load", restoreEverything);
  }

  public setRotation(rotation: number) {
    if (this.map) {
      this.map.setBearing(rotation);
    }
  }

  public setBrightness(brightness: number) {
    if (!this.map || !this.map.isStyleLoaded()) return;

    if (this.map.getLayer("darkness-overlay")) {
      this.map.removeLayer("darkness-overlay");
    }
    if (this.map.getSource("darkness-overlay")) {
      this.map.removeSource("darkness-overlay");
    }

    if (brightness <= 2) {
      brightness = brightness * 100;
    }

    let opacity = 0;
    if (brightness < 80) {
      opacity = (80 - brightness) / 80;
      opacity = Math.min(0.85, Math.max(0, opacity));
    }

    if (opacity > 0) {
      this.map.addSource("darkness-overlay", {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[
              [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]
            ]]
          }
        } as any
      });

      let beforeId: string | undefined = undefined;
      const layers = this.map.getStyle().layers;
      if (layers) {
        const entityLayer = layers.find(l => l.id.startsWith("entity-layer-"));
        if (entityLayer) beforeId = entityLayer.id;
      }
      this.map.addLayer({
        id: "darkness-overlay",
        type: "fill",
        source: "darkness-overlay",
        paint: {
          "fill-color": "#000",
          "fill-opacity": opacity
        }
      }, beforeId);
    }
  }

  public setMapType(mapType: string) {
    if (!this.map) return;
    const src = this.map.getSource("rastertiles") as maplibregl.RasterTileSource | undefined;
    if (src && src.setTiles) {
      src.setTiles([`${PUBLIC_RASTER_TILES}?v=${Date.now()}`]);
    }
    const center = this.map.getCenter();
    this.map.easeTo({
      center: [center.lng + 5, center.lat],
      duration: 0
    });
    setTimeout(() => {
      this.map?.easeTo({
        center: [center.lng, center.lat],
        duration: 0
      });
    }, 200);
    this.currentMapType = mapType;
  }
}
