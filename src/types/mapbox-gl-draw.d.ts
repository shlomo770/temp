declare module '@mapbox/mapbox-gl-draw' {
  import { Map } from 'maplibre-gl';

  interface MapboxDrawOptions {
    displayControlsDefault?: boolean;
    styles?: any[];
    modes?: any;
  }

  interface DrawMode {
    onSetup?: () => any;
    onClick?: (state: any, e: any) => void;
    onTap?: (state: any, e: any) => void;
    newFeature?: (feature: any) => any;
    addFeature?: (feature: any) => void;
    clearSelectedFeatures?: () => void;
    updateUIClasses?: (classes: any) => void;
    activateUIButton?: (button: string) => void;
    setActionableState?: (state: any) => void;
    getCurrent?: () => any;
    changeMode?: (mode: string, options?: any) => void;
  }

  class MapboxDraw {
    constructor(options?: MapboxDrawOptions);
    modes: { [key: string]: DrawMode };
    changeMode(mode: string, options?: any): void;
    delete(id: string): void;
    addControl(map: Map): void;
  }

  export = MapboxDraw;
} 