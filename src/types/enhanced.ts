import { Entity, EntityType, Coordinates } from './index';

// Enhanced coordinate types
export interface LngLat {
  lng: number;
  lat: number;
}

export interface Point {
  x: number;
  y: number;
}

// Enhanced entity types with better type safety
export interface EnhancedEntity extends Entity {
  id: string;
  type: EntityType;
  coordinates: Coordinates[];
  properties: EntityProperties;
  style?: EntityStyle;
  metadata?: EntityMetadata;
}

export interface EntityProperties {
  name?: string;
  type?: string;
  description?: string;
  [key: string]: any;
}

export interface EntityStyle {
  fillColor?: string;
  strokeColor?: string;
  fillOpacity?: number;
  strokeOpacity?: number;
  strokeWidth?: number;
  [key: string]: any;
}

export interface EntityMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  tags?: string[];
  [key: string]: any;
}

// Map event types
export interface MapClickEvent {
  lngLat: LngLat;
  point: Point;
  originalEvent: MouseEvent;
}

export interface MapMouseEvent {
  lngLat: LngLat;
  point: Point;
  originalEvent: MouseEvent;
}

export interface MapDragEvent {
  lngLat: LngLat;
  point: Point;
  originalEvent: MouseEvent;
}

// Drawing state types
export interface DrawingState {
  isActive: boolean;
  currentMode: EntityType | null;
  currentPoints: Coordinates[];
  previewEntity?: Omit<EnhancedEntity, 'id'>;
}

// Measurement types
export interface MeasurementState {
  isActive: boolean;
  points: Coordinates[];
  distance?: number;
  area?: number;
}

// Map state types
export interface MapState {
  center: LngLat;
  zoom: number;
  rotation: number;
  brightness: number;
  isLoaded: boolean;
  bounds?: MapBounds;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// UI state types
export interface UIState {
  selectedEntityId: string | null;
  hoveredEntityId: string | null;
  showEntityTree: boolean;
  showToolbar: boolean;
  showStatusBar: boolean;
  modalState: ModalState;
}

export interface ModalState {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete' | null;
  entityId?: string;
  data?: any;
}

// Toolbar action types
export type ToolbarAction =
  | { type: 'DRAWING_MODE'; mode: EntityType | null }
  | { type: 'MEASUREMENT_MODE'; isActive: boolean }
  | { type: 'ROTATION_CHANGE'; value: number }
  | { type: 'BRIGHTNESS_CHANGE'; value: number }
  | { type: 'RESET_MAP' }
  | { type: 'CLEAR_ALL' };

// Entity action types
export type EntityAction =
  | { type: 'CREATE_ENTITY'; entity: Omit<EnhancedEntity, 'id'> }
  | { type: 'UPDATE_ENTITY'; id: string; updates: Partial<EnhancedEntity> }
  | { type: 'DELETE_ENTITY'; id: string }
  | { type: 'SELECT_ENTITY'; id: string | null }
  | { type: 'FOCUS_ENTITY'; entity: EnhancedEntity };

// Service types
export interface MapServiceInterface {
  initialize(
    container: string | HTMLElement,
    onEntityDrawn: (entity: Omit<EnhancedEntity, 'id'>) => void,
    onEntityUpdated: (id: string, coordinates: Coordinates[]) => void,
    onEntityDeleted: (id: string) => void
  ): void;

  setDrawingMode(mode: EntityType | null): void;
  addEntityToMap(entity: EnhancedEntity): void;
  removeEntityFromMap(entityId: string): void;
  focusOnEntity(entity: EnhancedEntity): void;
  setRotation(rotation: number): void;
  setBrightness(brightness: number): void;
  destroy(): void;
}

// Component prop types
export interface MapContainerProps {
  isMeasuring: boolean;
  measurePoints: Coordinates[];
  setIsMeasuring: React.Dispatch<React.SetStateAction<boolean>>;
  setMeasurePoints: React.Dispatch<React.SetStateAction<Coordinates[]>>;
  focusEntityRef?: React.MutableRefObject<((entity: EnhancedEntity) => void) | undefined>;
  mouseCoords: LngLat | null;
  setMouseCoords: React.Dispatch<React.SetStateAction<LngLat | null>>;
}

export interface ToolbarProps {
  isMeasuring: boolean;
  onMeasureClick: () => void;
  drawingMode: EntityType | null;
  onDrawingModeChange: (mode: EntityType | null) => void;
}

export interface EntityTreeProps {
  onCenterEntity: (entity: EnhancedEntity) => void;
  onEditEntity: (entity: EnhancedEntity) => void;
  onDeleteEntity?: (entity: EnhancedEntity) => void;
}

export interface StatusBarProps {
  mouseCoords: LngLat | null;
  mapState?: Partial<MapState>;
}

// Hook return types
export interface UseMapState {
  mapState: MapState;
  drawingState: DrawingState;
  measurementState: MeasurementState;
  uiState: UIState;
}

export interface UseEntityActions {
  createEntity: (entity: Omit<EnhancedEntity, 'id'>) => void;
  updateEntity: (id: string, updates: Partial<EnhancedEntity>) => void;
  deleteEntity: (id: string) => void;
  selectEntity: (id: string | null) => void;
  focusEntity: (entity: EnhancedEntity) => void;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Event handler types
export type MapEventHandler<T = MapClickEvent> = (event: T) => void;

export type EntityEventHandler<T = EnhancedEntity> = (entity: T) => void;

// Validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EntityValidationResult extends ValidationResult {
  entity: EnhancedEntity;
}

// Configuration types
export interface MapConfig {
  center: LngLat;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  style: string | object;
  attribution?: string;
}

export interface DrawingConfig {
  enabled: boolean;
  modes: EntityType[];
  snapToGrid?: boolean;
  gridSize?: number;
}

export interface UIConfig {
  showToolbar: boolean;
  showStatusBar: boolean;
  showEntityTree: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export const mapTypes = [
  { id: 'vector-global', type: 'vector' },
  { id: 'satellite-raster', type: 'raster' },
  { id: 'osm-raster', type: 'raster' },
  { id: 'carto-dark', type: 'vector' },
  { id: 'carto-light', type: 'vector' }
];

export const mapTypesSelected = [
  { id: 'vector-global', name: 'Vector', icon: '🌍', type: 'vector' },
  { id: 'satellite-raster', name: 'Satellite', icon: '🛰', type: 'raster' },
  { id: 'osm-raster', name: 'OSM Raster', icon: '🗺', type: 'raster' },
  { id: 'carto-dark', name: 'Carto Dark', icon: '🌑', type: 'raster' },
  { id: 'carto-light', name: 'Carto Light', icon: '🌕', type: 'raster' }
];