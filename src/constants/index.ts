// Map Constants
export const MAP_CONSTANTS = {
  DEFAULT_CENTER: [-74.006, 40.7128] as [number, number],
  DEFAULT_ZOOM: 10,
  MAX_ZOOM: 22,
  MIN_ZOOM: 0,
  TILE_SIZE: 256,
  OSM_TILES_URL: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
} as const;

// Drawing Constants
export const DRAWING_CONSTANTS = {
  CIRCLE_POINTS: 64,
  PREVIEW_OPACITY: 0.2,
  ACTIVE_OPACITY: 0.5,
  STROKE_WIDTH: 2,
  ACTIVE_STROKE_WIDTH: 3
} as const;

// UI Constants
export const UI_CONSTANTS = {
  TOOLBAR_BUTTON_SIZE: 36, // w-9 h-9
  STATUS_BAR_HEIGHT: 40,
  MIN_TOOLTIP_WIDTH: 80,
  ANIMATION_DURATION: 800
} as const;

// Colors
export const COLORS = {
  PRIMARY: '#3b82f6',
  PRIMARY_DARK: '#1e40af',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
} as const;

// Entity Types
export const ENTITY_TYPES = {
  POLYGON: 'polygon',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  MARKER: 'marker'
} as const;

// Status Colors
export const STATUS_COLORS = {
  CONNECTED: 'text-green-400',
  DISCONNECTED: 'text-red-400',
  STANDBY: 'text-yellow-400',
  OPER: 'text-blue-400',
  ARMED: 'text-orange-400',
  IDLE: 'text-gray-400',
  DEFAULT: 'text-gray-300'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  MAP_INITIALIZATION: 'Failed to initialize map',
  ENTITY_CREATION: 'Failed to create entity',
  ENTITY_UPDATE: 'Failed to update entity',
  ENTITY_DELETION: 'Failed to delete entity',
  NETWORK_ERROR: 'Network error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ENTITY_CREATED: 'Entity created successfully',
  ENTITY_UPDATED: 'Entity updated successfully',
  ENTITY_DELETED: 'Entity deleted successfully',
  MAP_RESET: 'Map reset successfully'
} as const; 