import React, { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../../../../hooks/useAppSelector';
import { safeConsoleError } from '../../../../utils/mapLibreErrorFilter';

interface LineOfSightLayerProps {
  map: any;
}

console.error = safeConsoleError;
const LineOfSightLayer: React.FC<LineOfSightLayerProps> = ({ map }) => {
  const losState = useAppSelector(state => state.los);
  const isLosActive = losState.isActive;
  const settings = useAppSelector(state => state.settings);
  const initializedRef = useRef(false);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safe layer/source removal
  const safeRemoveLayer = useCallback((layerId: string) => {
    try {
      if (map && map.getLayer && map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    } catch (error) {
      // Ignore errors during removal
    }
  }, [map]);

  const safeRemoveSource = useCallback((sourceId: string) => {
    try {
      if (map && map.getSource && map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    } catch (error) {
      // Ignore errors during removal
    }
  }, [map]);

  // Initialize line of sight layer
  useEffect(() => {
    if (!map) return;
    // Prevent multiple initializations
    if (initializedRef.current) return;
    const init = () => {
      try {
        // Safely remove existing layers and sources
        safeRemoveLayer('line-of-sight-outline');
        safeRemoveLayer('line-of-sight-layer');
        safeRemoveSource('line-of-sight');

        // Wait a bit for removal to complete
        setTimeout(() => {
          try {
            // Only add if not already present
            if (!map.getSource('line-of-sight')) {
              map.addSource('line-of-sight', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: [] }
              });
            }

            if (!map.getLayer('line-of-sight-layer')) {
              map.addLayer({
                id: 'line-of-sight-layer',
                type: 'fill',
                source: 'line-of-sight',
                paint: {
                  'fill-color': settings.losSectorColor,
                  'fill-opacity': 0.15 // More visible fill
                }
              });

              // Add outline layer separately
              map.addLayer({
                id: 'line-of-sight-outline',
                type: 'line',
                source: 'line-of-sight',
                paint: {
                  'line-color': settings.losSectorColor,
                  'line-width': 3 // Bolder outline
                }
              });
            } else {
              // Update existing layers with new color
              map.setPaintProperty('line-of-sight-layer', 'fill-color', settings.losSectorColor);
              map.setPaintProperty('line-of-sight-outline', 'line-color', settings.losSectorColor);
            }

            initializedRef.current = true;

          } catch (error) {
            console.warn('Error in LineOfSightLayer initialization:', error);
            // Reset initialization flag on error
            initializedRef.current = false;
          }
        }, 50);
      } catch (error) {
        console.warn('Error initializing LineOfSightLayer:', error);
        // Reset initialization flag on error
        initializedRef.current = false;
      }
    };

    // Initialize immediately if style is loaded
    if (map.isStyleLoaded()) {
      init();
    } else {
      // Wait for style to load
      const handleStyleData = () => {
        if (!initializedRef.current) {
          init();
        }
      };
      map.on('styledata', handleStyleData);

      return () => {
        map.off('styledata', handleStyleData);
      };
    }

    return () => {
      // Cleanup on unmount
      safeRemoveLayer('line-of-sight-outline');
      safeRemoveLayer('line-of-sight-layer');
      safeRemoveSource('line-of-sight');
      initializedRef.current = false;
    };
  }, [map, safeRemoveLayer, safeRemoveSource, settings.losSectorColor]);

  // Update colors when settings change
  useEffect(() => {
    if (!map || !initializedRef.current) return;

    try {
      // Only update colors if LOS is active and sector is visible
      if (isLosActive && losState.result?.sector) {
        if (map.getLayer('line-of-sight-layer')) {
          map.setPaintProperty('line-of-sight-layer', 'fill-color', settings.losSectorColor);
        }
        if (map.getLayer('line-of-sight-outline')) {
          map.setPaintProperty('line-of-sight-outline', 'line-color', settings.losSectorColor);
        }
      } else {
        console.log('🎯 LineOfSightLayer: Sector not visible, skipping color update');
      }
    } catch (error) {
      console.warn('Error updating LOS colors:', error);
    }
  }, [map, settings.losSectorColor, isLosActive, losState.result]);

  // Update line of sight data
  useEffect(() => {
    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    if (!map) {
      return;
    }

    // Delay update to prevent race conditions
    updateTimeoutRef.current = setTimeout(() => {
      try {
        const source = map.getSource('line-of-sight');
        if (!source) {
          return;
        }

        // Get LOS data from Redux
        const losResult = losState.result;

        // Only show sector if we have sector data from LOS_SECTOR message
        if (!isLosActive || !losResult?.sector) {
          console.log('🎯 LineOfSightLayer: Hiding sector - no sector data from LOS_SECTOR');
          source.setData({ type: 'FeatureCollection', features: [] });
          return;
        }

        // Use the sector data directly from the server
        const geojson = {
          type: 'FeatureCollection',
          features: [losResult.sector]
        };

        source.setData(geojson);

        // Update layer colors to match settings
        if (map.getLayer('line-of-sight-layer')) {
          map.setPaintProperty('line-of-sight-layer', 'fill-color', settings.losSectorColor);
        }
        if (map.getLayer('line-of-sight-outline')) {
          map.setPaintProperty('line-of-sight-outline', 'line-color', settings.losSectorColor);
        }

      } catch (error) {
        console.warn('Error updating LineOfSightLayer:', error);
      }
    }, 100);

    return () => {
      // Cleanup timeout on unmount
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [map, isLosActive, losState]);
  
  return null; // This component doesn't render anything visible
};

export default LineOfSightLayer; 