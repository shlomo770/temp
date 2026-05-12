import { Coordinates, Entity, EntityType } from "../../types";
import { createCirclePolygon, createEllipsePolygon } from "../../utils/geometry";

export function createEntityFromPending(
  id: string,
  pending: Omit<Entity, "id">,
  name: string,
  category: string
): Entity {
  let coordinates: Coordinates[] = pending.coordinates;

  if (pending.type === "circle" && pending.coordinates.length >= 2) {
    const [center, edge] = pending.coordinates;
    coordinates = createCirclePolygon(center, edge, 64);
  }

  if (pending.type === "ellipse" && pending.coordinates.length >= 2) {
    const [center, edge] = pending.coordinates;
    coordinates = createEllipsePolygon(center, edge, 64);
  }

  if (pending.type === "rectangle" && coordinates.length >= 4) {
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    if (first.lng !== last.lng || first.lat !== last.lat) {
      coordinates = [...coordinates, { ...first }];
    }
  }

  const entityColor = category === 'WCO HOLD' ? '#ff0000' : category === 'WCO FREE' ? '#25ff00' : '#3b82f6';
  return {
  id,
  type: pending.type as EntityType,
  coordinates,
  properties: {
    name,
    category,
    visible: true,
    color: entityColor,
    transparency: 30
  },
  style: {},
  name: undefined,
  category: undefined,
  geometry: undefined,
};
}