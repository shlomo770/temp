import { createCirclePolygon, createEllipsePolygon, createSectorPolygon, Coordinates } from "../../utils/geometry";
import { EntityType } from "../../types";
import { Entity as StoreEntity } from "../../store/slices/entitiesSlice";
import { EntityCategoryEnum } from "../../enums/entitis.enum";

type GeometryResult = {
  type: string;
  coordinates: any;
};

export const closePolygonCoordinates = (coords: Coordinates[]): Coordinates[] => {
  if (coords.length === 0) return coords;
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first.lng === last.lng && first.lat === last.lat) {
    return coords;
  }
  return [...coords, first];
};

export const openPolygonCoordinates = (
  coords: Coordinates[]
): Coordinates[] => {
  if (coords.length <= 1) return coords;

  const first = coords[0];
  const last = coords[coords.length - 1];

  if (
    first.lng === last.lng &&
    first.lat === last.lat
  ) {
    return coords.slice(0, -1);
  }

  return coords;
};

export const buildGeometryForCreate = (type: EntityType, coordinates: Coordinates[]): GeometryResult => {
  let geoJsonCoordinates: any;
  let finalCoordinates = coordinates;

  if (type === "polygon") {
    finalCoordinates = closePolygonCoordinates(coordinates);
  }

  if (type === "polygon" || type === "rectangle") {
    geoJsonCoordinates = [finalCoordinates.map(coord => [coord.lng, coord.lat])];
  } else if (type === "circle" || type === "ellipse") {
    if (finalCoordinates.length >= 2) {
      const center = finalCoordinates[0];
      const edge = finalCoordinates[1];
      const polygonPoints = type === "circle"
        ? createCirclePolygon(center, edge, 64)
        : createEllipsePolygon(center, edge, 64);
      geoJsonCoordinates = [polygonPoints.map(coord => [coord.lng, coord.lat])];
    } else {
      geoJsonCoordinates = [finalCoordinates.map(coord => [coord.lng, coord.lat])];
    }
  } else if (type === "sector") {
    if (finalCoordinates.length >= 3) {
      const center = finalCoordinates[0];
      const startPoint = finalCoordinates[1];
      const endPoint = finalCoordinates[2];
      const sectorPolygonPoints = createSectorPolygon(center, startPoint, endPoint, 32);
      geoJsonCoordinates = [sectorPolygonPoints.map(coord => [coord.lng, coord.lat])];
    } else {
      geoJsonCoordinates = [finalCoordinates.map(coord => [coord.lng, coord.lat])];
    }
  } else if (type === "line") {
    geoJsonCoordinates = finalCoordinates.map(coord => [coord.lng, coord.lat]);
  } else {
    geoJsonCoordinates = finalCoordinates[0] ? [finalCoordinates[0].lng, finalCoordinates[0].lat] : [0, 0];
  }

  const geometryType =
    type === "polygon" || type === "rectangle" || type === "circle" || type === "ellipse" || type === "sector"
      ? "Polygon"
      : type === "line"
        ? "LineString"
        : "Point";

  return {
    type: geometryType,
    coordinates: geoJsonCoordinates,
  };
};

export const buildGeometryForUpdate = (entity: StoreEntity, coordinates: Coordinates[]): GeometryResult => {
  let geoJsonCoordinates: any;

  if (entity.type === "polygon" || entity.type === "rectangle") {
    geoJsonCoordinates = [coordinates.map(coord => [coord.lng, coord.lat])];
  } else if (entity.type === "line") {
    geoJsonCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);
  } else if (entity.type === "circle" || entity.type === "ellipse") {
    if (coordinates.length >= 2) {
      const center = coordinates[0];
      const edge = coordinates[1];
      const polygonPoints = entity.type === "circle"
        ? createCirclePolygon(center, edge, 64)
        : createEllipsePolygon(center, edge, 64);
      geoJsonCoordinates = [polygonPoints.map(coord => [coord.lng, coord.lat])];
    } else {
      geoJsonCoordinates = [[]];
    }
  } else if (entity.type === "sector") {
    geoJsonCoordinates = coordinates.map(coord => [coord.lng, coord.lat]);
  } else {
    geoJsonCoordinates = coordinates[0] ? [coordinates[0].lng, coordinates[0].lat] : [0, 0];
  }

  return {
    type: entity.geometry.type,
    coordinates: geoJsonCoordinates,
  };
};

export const buildNewEntity = (
  id: string,
  name: string,
  category: EntityCategoryEnum,
  type: EntityType,
  coordinates: Coordinates[],
  extraProperties?: Record<string, unknown>
): Omit<StoreEntity, "geometry"> & { geometry: GeometryResult } => {
  const entityColor = category === EntityCategoryEnum.WCO_HOLD ? '#ff0000' : category === EntityCategoryEnum.WCO_FREE ? '#25ff00' : '#3b82f6';
  const entity: Omit<StoreEntity, "geometry"> & { geometry: GeometryResult } = {
    id,
    type,
    name,
    color: entityColor,
    transparency: 0.3,
    category,
    visible: true,
    coordinates,
    geometry: buildGeometryForCreate(type, coordinates),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (extraProperties && Object.keys(extraProperties).length > 0) {
    entity.properties = { ...(entity.properties || {}), ...extraProperties };
  }
  return entity;
};