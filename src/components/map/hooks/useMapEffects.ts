import { useEffect, useRef } from 'react';
import { MapService } from '../../../services/map/MapService';
import { Entity, EntityType } from '../../../types';

export const useMapEffects = (
  mapServiceRef: React.MutableRefObject<MapService | null>,
  drawingMode: EntityType | null,
  rotation: number,
  brightness: number,
  byId: Record<string, Entity>
) => {
  const prevEntityIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (mapServiceRef.current) {
      const map = (mapServiceRef.current as any).map;
      if (map && map.isStyleLoaded()) {
      }
    }
  }, [drawingMode, mapServiceRef]);

  useEffect(() => {
    if (mapServiceRef.current) {
      const map = (mapServiceRef.current as any).map;
      if (map && map.isStyleLoaded()) {
        mapServiceRef.current.setRotation(rotation);
      }
    }
  }, [rotation, mapServiceRef]);

  useEffect(() => {
    if (mapServiceRef.current) {
      const map = (mapServiceRef.current as any).map;
      if (map && map.isStyleLoaded()) {
      }
    }
  }, [brightness, mapServiceRef]);

  useEffect(() => {
    if (!mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map || !map.isStyleLoaded()) return;
    const currentIds = new Set(Object.keys(byId));
    const removedIds = Array.from(prevEntityIds.current).filter(id => !currentIds.has(id));
    removedIds.forEach(id => {
      mapServiceRef.current?.removeEntityFromMap(id);
    });
    
    Object.entries(byId).forEach(([id, entity]) => {
      if (!prevEntityIds.current.has(id)) {
        mapServiceRef.current?.addEntityToMap(entity as Entity);
      }
    });
    
    prevEntityIds.current = currentIds;
  }, [byId, mapServiceRef]);
}; 