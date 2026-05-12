import { useEffect, useRef } from 'react';
import type { GeoJSONSource, Map } from 'maplibre-gl';
import destination from '@turf/destination';
import { point } from '@turf/helpers';
import type { Coordinates } from '../../../../types';

const GUN_LOS_SOURCE_ID = 'gun-los-source';
const GUN_LOS_CASING_LAYER_ID = 'gun-los-casing-layer';
const GUN_LOS_LINE_LAYER_ID = 'gun-los-line-layer';
const GUN_LOS_HEAD_LAYER_ID = 'gun-los-head-layer';

const GUN_LOS_HEAD_ROTATION_OFFSET_DEG = -90;
const GUN_LOS_LENGTH_METERS = 1500;

const EMPTY_FC: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const normalizeAngle = (angle: number) => ((angle % 360) + 360) % 360;

interface GunLosLayerProps {
  map: Map;
  position: Coordinates;
  gunAzimut?: number;
}

export default function GunLosLayer({ map, position, gunAzimut }: GunLosLayerProps) {
  const pendingDataRef = useRef<GeoJSON.FeatureCollection>(EMPTY_FC);

  const buildData = (): GeoJSON.FeatureCollection => {
    const hasDirection = Number.isFinite(gunAzimut);
    const hasPosition = Number.isFinite(position?.lat) && Number.isFinite(position?.lng);

    if (!hasDirection || !hasPosition) {
      return EMPTY_FC;
    }

    const finalAzimuth = normalizeAngle(Number(gunAzimut));

    const endPoint = destination(
      point([position.lng, position.lat]),
      GUN_LOS_LENGTH_METERS / 1000,
      finalAzimuth,
    ).geometry.coordinates;

    return {
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
  };

  const setDataIfReady = () => {
    if (!map.getStyle() || !map.isStyleLoaded()) return false;

    const source = map.getSource(GUN_LOS_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source || !('setData' in source)) return false;

    source.setData(pendingDataRef.current);
    return true;
  };

  useEffect(() => {
    let disposed = false;

    const ensureLayers = () => {
      if (disposed) return;
      if (!map.getStyle() || !map.isStyleLoaded()) return;

      if (!map.getSource(GUN_LOS_SOURCE_ID)) {
        map.addSource(GUN_LOS_SOURCE_ID, {
          type: 'geojson',
          data: pendingDataRef.current,
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
            "text-font": ["Open Sans Semibold"],
            'text-rotate': ['get', 'rot'],
            'text-rotation-alignment': 'map',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
          },
          paint: {
            'text-color': '#000000',
            'text-halo-width': 2
          },
        });
      };

      setDataIfReady();
    };

    const onReady = () => {
      ensureLayers();
    };

    if (map.isStyleLoaded()) {
      ensureLayers();
    }

    map.on('load', onReady);
    map.on('idle', onReady);
    map.on('style.load', onReady);

    return () => {
      disposed = true;

      map.off('load', onReady);
      map.off('idle', onReady);
      map.off('style.load', onReady);

      if (!map.getStyle()) return;

      if (map.getLayer(GUN_LOS_HEAD_LAYER_ID)) map.removeLayer(GUN_LOS_HEAD_LAYER_ID);
      if (map.getLayer(GUN_LOS_LINE_LAYER_ID)) map.removeLayer(GUN_LOS_LINE_LAYER_ID);
      if (map.getLayer(GUN_LOS_CASING_LAYER_ID)) map.removeLayer(GUN_LOS_CASING_LAYER_ID);
      if (map.getSource(GUN_LOS_SOURCE_ID)) map.removeSource(GUN_LOS_SOURCE_ID);
    };
  }, [map]);

  useEffect(() => {
    pendingDataRef.current = buildData();

    const updated = setDataIfReady();

    if (!updated) {
      const onReadyOnce = () => {
        setDataIfReady();
      };

      map.once('idle', onReadyOnce);

      return () => {
        map.off('idle', onReadyOnce);
      };
    }
  }, [map, position?.lat, position?.lng, gunAzimut]);

  return null;
}