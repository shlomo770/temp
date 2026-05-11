import { Entity } from '../store/slices/entitiesSlice';

export const handleCenterToEntity = (entity: Entity, map: maplibregl.Map) => {
  if (!map || !entity.geometry) return;
  try {
    let bounds: [number, number, number, number] | null = null;
    if (entity.geometry.type === 'Point') {
      const [lng, lat] = entity.geometry.coordinates;
      if (isNaN(lng) || isNaN(lat)) {
        console.error('Invalid coordinates for entity:', entity.id);
        return;
      }
      bounds = [lng - 0.01, lat - 0.01, lng + 0.01, lat + 0.01];
    } else if (entity.geometry.type === 'Polygon' || entity.geometry.type === 'LineString') {
      const coordinates = entity.geometry.coordinates;
      if (coordinates && coordinates.length > 0) {
        let minLng = Infinity, maxLng = -Infinity;
        let minLat = Infinity, maxLat = -Infinity;
        const flatCoords = Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])
          ? coordinates[0]
          : coordinates;
        let validCoords = true;
        flatCoords.forEach((coord: number[]) => {
          const [lng, lat] = coord;
          if (isNaN(lng) || isNaN(lat)) {
            validCoords = false;
            return;
          }
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        });

        if (!validCoords) {
          console.error('Invalid coordinates for entity:', entity.id);
          return;
        }
        bounds = [minLng, minLat, maxLng, maxLat];
      }
    }

    if (bounds && !bounds.some(coord => isNaN(coord))) {
      map.fitBounds(bounds, {
        padding: 50,
        duration: 1000
      });
    } else {
      console.error('Invalid bounds calculated for entity:', entity.id);
    }
  } catch (error) {
    console.error('Error centering to entity:', error);
  }
};