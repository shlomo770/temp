export function convertStoreEntityToEditable(storeEntity: any) {
  const type = (storeEntity.type || "").toLowerCase();
  const asCoord = (pair: [number, number]) => ({ lng: pair[0], lat: pair[1] });
  if (storeEntity.geometry?.type === "Point") {
    return {
      id: storeEntity.id,
      type: "marker",
      coordinates: [asCoord(storeEntity.geometry.coordinates)],
      properties: { ...storeEntity.properties }
    };
  }
  if (storeEntity.geometry?.type === "LineString") {
    return {
      id: storeEntity.id,
      type: "line",
      coordinates: storeEntity.geometry.coordinates.map(asCoord),
      properties: { ...storeEntity.properties }
    };
  }
  if (storeEntity.geometry?.type === "Polygon") {
    const ring = storeEntity.geometry.coordinates[0].map(asCoord);
    return {
      id: storeEntity.id,
      type: type === "rectangle" ? "rectangle" : "polygon",
      coordinates: ring,
      properties: { ...storeEntity.properties }
    };
  }

  if (type === "circle" || type === "ellipse") {
    if (Array.isArray(storeEntity.coordinates) && storeEntity.coordinates.length >= 2) {
      return {
        id: storeEntity.id,
        type,
        coordinates: storeEntity.coordinates,
        properties: { ...storeEntity.properties }
      };
    }
    const pts = storeEntity.geometry.coordinates[0].map(asCoord);
    const center = {
      lng: pts.reduce((s: any, p: { lng: any; }) => s + p.lng, 0) / pts.length,
      lat: pts.reduce((s: any, p: { lat: any; }) => s + p.lat, 0) / pts.length
    };
    const farthest = pts.reduce((best: { d: number; }, p: { lng: number; lat: number; }) => {
      const d = (p.lng - center.lng) ** 2 + (p.lat - center.lat) ** 2;
      return d > best.d ? { p, d } : best;
    }, { p: pts[0], d: -1 }).p;
    return { id: storeEntity.id, type, coordinates: [center, farthest], properties: { ...storeEntity.properties } };
  }

  return null;
}