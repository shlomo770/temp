import { useEffect } from 'react';
import { MapService } from '../../../services/map/MapService';
import { Entity } from '../../../types';
import { attachUnifiedMapMove, attachUnifiedMapClick, detachUnifiedMapMove, detachUnifiedMapClick } from '../../../utils/mapEvents';

export const useMapHandlers = (
  mapServiceRef: React.MutableRefObject<MapService | null>,
  isMeasuring: boolean,
  measurePoints: { lng: number; lat: number }[],
  setMeasurePoints: React.Dispatch<React.SetStateAction<{ lng: number; lat: number }[]>>,
  setMouseCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>,
  byId: Record<string, Entity>,
  setContextMenu: React.Dispatch<React.SetStateAction<{ entityId: string; x: number; y: number } | null>>
) => {
  useEffect(() => {
    if (!mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;
    const handleMove = (e: any) => {
      setMouseCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    };
    const wrappedMoveHandler = attachUnifiedMapMove(map, handleMove);
    return () => { detachUnifiedMapMove(map, wrappedMoveHandler); };
  }, [setMouseCoords, mapServiceRef]);

  useEffect(() => {
    if (!isMeasuring || !mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;
    
    const handleClick = (e: any) => {
      if (measurePoints.length < 2) {
        setMeasurePoints(prev => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
      }
    };
    
    const wrappedClickHandler = attachUnifiedMapClick(map, handleClick);
    return () => { detachUnifiedMapClick(map, wrappedClickHandler); };
  }, [isMeasuring, measurePoints, setMeasurePoints, mapServiceRef]);

  useEffect(() => {
    if (!isMeasuring || !mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;
    const handleMouseMove = (e: any) => {
      if (measurePoints.length === 1) {
        const previewLine = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [measurePoints[0].lng, measurePoints[0].lat],
              [e.lngLat.lng, e.lngLat.lat]
            ]
          },
          properties: {}
        };
        
        const sourceId = 'measurement-preview';
        const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(previewLine as any);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: previewLine as any
          });
          map.addLayer({
            id: 'measurement-preview-layer',
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': '#f59e0b',
              'line-width': 2,
              'line-dasharray': [2, 2]
            }
          });
        }
      }
    };
    
    const wrappedMoveHandler = attachUnifiedMapMove(map, handleMouseMove);
    return () => { 
      detachUnifiedMapMove(map, wrappedMoveHandler);
      if (map.getLayer('measurement-preview-layer')) {
        map.removeLayer('measurement-preview-layer');
      }
      if (map.getSource('measurement-preview')) {
        map.removeSource('measurement-preview');
      }
    };
  }, [isMeasuring, measurePoints, mapServiceRef]);

  useEffect(() => {
    if (!mapServiceRef.current) return;
    const map = (mapServiceRef.current as any).map;
    if (!map) return;
    
    const handleContextMenu = (e: any) => {
      const availableLayers = Object.keys(byId)
        .map(id => `entity-layer-${id}`)
        .filter(layerId => map.getLayer(layerId));
      
      if (availableLayers.length === 0) {
        setContextMenu(null);
        return;
      }
      const features = map.queryRenderedFeatures(e.point, { layers: availableLayers });
      if (features.length > 0) {
        const entityId = features[0].layer.id.replace('entity-layer-', '');
        setContextMenu({ entityId, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
        e.preventDefault();
      } else {
        setContextMenu(null);
      }
    };
    
    map.on('contextmenu', handleContextMenu);
    return () => { map.off('contextmenu', handleContextMenu); };
  }, [byId, setContextMenu, mapServiceRef]);
}; 