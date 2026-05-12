import type { CaliModeE } from "../enums/general.enum";
import type { LatLng } from "../utils";

// Basic types
export interface Coordinates {
  lng: number;
  lat: number;
  alt?: number
}

export const mapTypes = [
  { id: 'vector-global', name: 'Vector', icon: '🌍', type: 'vector' },
  { id: 'satellite-raster', name: 'Satellite', icon: '🛰', type: 'raster' },
  { id: 'osm-raster', name: 'OSM Raster', icon: '🗺', type: 'raster' },
  { id: 'carto-dark', name: 'Carto Dark', icon: '🌑', type: 'vector' },
  { id: 'carto-light', name: 'Carto Light', icon: '🌕', type: 'vector' }
] as const;

export const mapTypesSelected = mapTypes;
export type mapTypesSelector = typeof mapTypes;

export type PanelType = 'radar' | 'failures' | 'mode' | 'settings' | 'location' | 'serverMessages' | null;

export type EntityType = 'polygon' | 'line' | 'rectangle' | 'circle' | 'ellipse' | 'sector' | 'marker' | 'target' | 'measure' | 'measure-area';

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
  name: any;
  category: any;
  geometry: any;
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
  heading: number;
  gps_pos: LatLng;
  tmaps_pos: LatLng;
  manual_pos: { lat: number; lng: number, alt: number, heading: number };
  use_gps: boolean;
  use_manual: boolean;
  zone: number;
  fig_of_merit: number;
  pitch: number;
  roll: number;
  distance_travelled: number;
  odo_cali_finished?: CaliModeE;
  clickCord?: { lat: number, lng: number };
  gunAzimut?: number;
}

export interface MyPositionState {
  position: MyPosition | null;
  isActive: boolean;
}

export interface DrawMode {
  type: EntityType;
  isActive: boolean;
}

// Re-export enhanced types (removed - unused)