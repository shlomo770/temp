// Basic types
export interface Coordinates {
  lng: number;
  lat: number;
  alt?: number
}

export type mapTypesSelector = [
  { id: 'vector-global', name: 'Vector', icon: '🌍', type: 'vector' },
  { id: 'satellite-raster', name: 'Satellite', icon: '🛰', type: 'raster' },
  { id: 'osm-raster', name: 'OSM Raster', icon: '🗺', type: 'raster' },
  { id: 'carto-dark', name: 'Carto Dark', icon: '🌑', type: 'vector' },
  { id: 'carto-light', name: 'Carto Light', icon: '🌕', type: 'vector' }
];

export type PanelType =
  | 'radar'
  | 'failures'
  | 'flightControl'
  | 'terrain'
  | 'mode'
  | 'settings'
  | 'logs'
  | 'location'
  | 'xmlSend'
  | 'serverMessages'
  | null;

export type EntityType = 'polygon' | 'line' | 'rectangle' | 'circle' | 'ellipse' | 'sector' | 'marker' | 'target' | 'measure';

export interface EntityStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fillOpacity?: number;
  strokeOpacity?: number;
  radius?: number;
}

// Enhanced entity interface
export interface Entity {
  id: string;
  type: EntityType;
  coordinates: Coordinates[];
  properties?: Record<string, any>;
  style?: EntityStyle;
}

// State interfaces
export interface MapState {
  rotation: number;
  brightness: number;
  center: Coordinates;
  zoom: number;
  selectedMapType: string;
}

export interface EntityState {
  byId: Record<string, Entity>;
  allIds: string[];
  groupedByType: Record<EntityType, string[]>;
  selectedEntityId: string | null;
  drawingMode: EntityType | null;
}

export interface RootState {
  entities: EntityState;
  map: MapState;
  myPosition: MyPositionState;
}

export interface LineOfSight {
  rangeKM: number;
  angleDEG: number;
}

// New advanced LOS types
export interface LOSPoint {
  lat: number;
  lng: number;
  distance: number;
  blockElevation: number;
  status: 'visible' | 'partially_blocked' | 'blocked';
}

export interface LOSRay {
  angle: number;
  points: any[];
  from?: Coordinates;
  to?: Coordinates;
  severity?: string;
  elevation?: number;
}

export interface LOSResult {
  origin: Coordinates;
  heading: number;
  rangeKM: number;
  angleDEG: number;
  rays: LOSRay[];
  sector?: any; // Optional sector data from LOS_SECTOR message
}

export interface MyPosition {
  coordinates: Coordinates;
  heading?: number; // degrees
  gunAzimut?: number; // 0..360 from LOS message
  los?: LineOfSight; // optional line of sight data
}

export interface MyPositionState {
  position: MyPosition | null;
  isActive: boolean;
}

export interface DrawMode {
  type: EntityType;
  isActive: boolean;
}

// Re-export enhanced types
export * from './enhanced'; 