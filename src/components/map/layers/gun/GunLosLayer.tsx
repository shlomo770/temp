import { useEffect } from 'react';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import destination from '@turf/destination';
import { point } from '@turf/helpers';
import type { Coordinates } from '../../../../types';

const GUN_LOS_SOURCE_ID = 'gun-los-source';
const GUN_LOS_CASING_LAYER_ID = 'gun-los-casing-layer';
const GUN_LOS_LINE_LAYER_ID = 'gun-los-line-layer';
const GUN_LOS_HEAD_LAYER_ID = 'gun-los-head-layer';
const GUN_LOS_HEAD_ROTATION_OFFSET_DEG = -90; // ">" glyph points right (east) at 0deg

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

interface GunLosLayerProps {
  map: Map;
  position: Coordinates;
  gunAzimut?: number;
}

export default function GunLosLayer({ map, position, gunAzimut }: GunLosLayerProps) {
  useEffect(() => {
    let disposed = false;

    const clearGunLosLine = () => {
      if (disposed) return;
      if (!map.getStyle()) return;
      if (map.getLayer(GUN_LOS_HEAD_LAYER_ID)) map.removeLayer(GUN_LOS_HEAD_LAYER_ID);
      if (map.getLayer(GUN_LOS_LINE_LAYER_ID)) map.removeLayer(GUN_LOS_LINE_LAYER_ID);
      if (map.getLayer(GUN_LOS_CASING_LAYER_ID)) map.removeLayer(GUN_LOS_CASING_LAYER_ID);
      if (map.getSource(GUN_LOS_SOURCE_ID)) map.removeSource(GUN_LOS_SOURCE_ID);
    };

    const renderGunLosLine = () => {
      if (disposed) return;
      if (!map.isStyleLoaded()) return;

      const hasDirection = Number.isFinite(gunAzimut);
      const hasPosition = Number.isFinite(position.lat) && Number.isFinite(position.lng);
      if (!hasDirection || !hasPosition) {
        clearGunLosLine();
        return;
      }

      const finalAzimuth = normalizeAngle(gunAzimut as number);
      const lineLengthMeters = 6000;
      const endPoint = destination(
        point([position.lng, position.lat]),
        lineLengthMeters / 1000,
        finalAzimuth
      ).geometry.coordinates;

      const data: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [position.lng, position.lat],
                [endPoint[0], endPoint[1]],
              ],
            },
            properties: { kind: 'line' },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [endPoint[0], endPoint[1]],
            },
            properties: {
              kind: 'head',
              rot: normalizeAngle(finalAzimuth + GUN_LOS_HEAD_ROTATION_OFFSET_DEG),
            },
          },
        ],
      };

      if (!map.getSource(GUN_LOS_SOURCE_ID)) {
        map.addSource(GUN_LOS_SOURCE_ID, { type: 'geojson', data });
      } else {
        (map.getSource(GUN_LOS_SOURCE_ID) as GeoJSONSource).setData(data as any);
      }

      if (!map.getLayer(GUN_LOS_CASING_LAYER_ID)) {
        map.addLayer({
          id: GUN_LOS_CASING_LAYER_ID,
          type: 'line',
          source: GUN_LOS_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'line'],
          paint: {
            'line-color': '#111827',
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 2.5, 10, 3.2, 14, 4],
            'line-opacity': 0.95,
          },
        });
      }

      if (!map.getLayer(GUN_LOS_LINE_LAYER_ID)) {
        map.addLayer({
          id: GUN_LOS_LINE_LAYER_ID,
          type: 'line',
          source: GUN_LOS_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'line'],
          paint: {
            'line-color': '#38bdf8',
            'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1.2, 10, 1.7, 14, 2.2],
            'line-opacity': 1,
          },
        });
      }

      if (!map.getLayer(GUN_LOS_HEAD_LAYER_ID)) {
        map.addLayer({
          id: GUN_LOS_HEAD_LAYER_ID,
          type: 'symbol',
          source: GUN_LOS_SOURCE_ID,
          filter: ['==', ['get', 'kind'], 'head'],
          layout: {
            'text-field': '>',
            'text-size': ['interpolate', ['linear'], ['zoom'], 5, 14, 10, 18, 14, 22],
            'text-rotate': ['get', 'rot'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#111827',
            'text-halo-width': 1.6,
          },
        });
      }

      if (map.getLayer(GUN_LOS_CASING_LAYER_ID)) map.moveLayer(GUN_LOS_CASING_LAYER_ID);
      if (map.getLayer(GUN_LOS_LINE_LAYER_ID)) map.moveLayer(GUN_LOS_LINE_LAYER_ID);
      if (map.getLayer(GUN_LOS_HEAD_LAYER_ID)) map.moveLayer(GUN_LOS_HEAD_LAYER_ID);
    };

    const onLoad = () => renderGunLosLine();
    const onStyleData = () => renderGunLosLine();
    const onIdle = () => renderGunLosLine();
    map.on('load', onLoad);
    map.on('styledata', onStyleData);
    map.on('idle', onIdle);
    renderGunLosLine();

    return () => {
      disposed = true;
      map.off('load', onLoad);
      map.off('styledata', onStyleData);
      map.off('idle', onIdle);
      clearGunLosLine();
    };
  }, [map, position.lat, position.lng, gunAzimut]);

  return null;
}
