import { Entity, EntityType, Coordinates, EnhancedEntity, MyPosition } from '../types';

// Coordinate type guards
export const isCoordinates = (obj: any): obj is Coordinates => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.lng === 'number' &&
    typeof obj.lat === 'number' &&
    isFinite(obj.lng) &&
    isFinite(obj.lat)
  );
};

export const isCoordinatesArray = (obj: any): obj is Coordinates[] => {
  return Array.isArray(obj) && obj.every(isCoordinates);
};

// Entity type guards
export const isEntityType = (type: any): type is EntityType => {
  const validTypes: EntityType[] = ['polygon', 'line', 'rectangle', 'circle', 'marker'];
  return validTypes.includes(type);
};

export const isEntity = (obj: any): obj is Entity => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    isEntityType(obj.type) &&
    isCoordinatesArray(obj.coordinates) &&
    typeof obj.properties === 'object' &&
    obj.properties !== null
  );
};

export const isEnhancedEntity = (obj: any): obj is EnhancedEntity => {
  return (
    isEntity(obj) &&
    obj.properties &&
    (obj.style === undefined || typeof obj.style === 'object') &&
    ('metadata' in obj ? typeof obj.metadata === 'object' : true)
  );
};

// Entity validation
export const validateEntity = (entity: any): entity is Entity => {
  if (!isEntity(entity)) {
    return false;
  }

  // Check that coordinates array is not empty
  if (entity.coordinates.length === 0) {
    return false;
  }

  // Check that all coordinates are valid
  if (!entity.coordinates.every(isCoordinates)) {
    return false;
  }

  // Check that entity has required properties
  if (!entity.properties || typeof entity.properties !== 'object') {
    return false;
  }

  return true;
};

// Map event type guards
export const isMapClickEvent = (obj: any): obj is { lngLat: Coordinates; point: { x: number; y: number } } => {
  return (
    obj &&
    typeof obj === 'object' &&
    isCoordinates(obj.lngLat) &&
    typeof obj.point === 'object' &&
    typeof obj.point.x === 'number' &&
    typeof obj.point.y === 'number'
  );
};

// Style validation
export const isValidEntityStyle = (style: any): boolean => {
  if (!style || typeof style !== 'object') {
    return true; // Optional field
  }

  const validColorKeys = ['fillColor', 'strokeColor'];
  const validNumberKeys = ['strokeWidth', 'fillOpacity', 'strokeOpacity'];

  // Check color properties
  for (const key of validColorKeys) {
    if (key in style && typeof style[key] !== 'string') {
      return false;
    }
  }

  // Check number properties
  for (const key of validNumberKeys) {
    if (key in style && (typeof style[key] !== 'number' || !isFinite(style[key]))) {
      return false;
    }
  }

  return true;
};

// Array type guards
export const isStringArray = (obj: any): obj is string[] => {
  return Array.isArray(obj) && obj.every(item => typeof item === 'string');
};

export const isNumberArray = (obj: any): obj is number[] => {
  return Array.isArray(obj) && obj.every(item => typeof item === 'number' && isFinite(item));
};

// Configuration validation
export const isValidMapConfig = (config: any): boolean => {
  if (!config || typeof config !== 'object') {
    return false;
  }

  return (
    isCoordinates(config.center) &&
    typeof config.zoom === 'number' &&
    isFinite(config.zoom) &&
    typeof config.minZoom === 'number' &&
    isFinite(config.minZoom) &&
    typeof config.maxZoom === 'number' &&
    isFinite(config.maxZoom)
  );
};

// Utility type guards
export const isNonNullable = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};

export const isRecord = (obj: any): obj is Record<string, any> => {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
};

// Function type guards
export const isFunction = (obj: any): obj is Function => {
  return typeof obj === 'function';
};

export const isEventHandler = (obj: any): obj is (event: any) => void => {
  return isFunction(obj);
};

// Promise type guards
export const isPromise = <T>(obj: any): obj is Promise<T> => {
  return obj && typeof obj === 'object' && typeof obj.then === 'function';
};

// Error type guards
export const isError = (obj: any): obj is Error => {
  return obj instanceof Error;
};

// Date type guards
export const isDate = (obj: any): obj is Date => {
  return obj instanceof Date;
};

// Validation result type guards
export const isValidationResult = (obj: any): obj is { isValid: boolean; errors: string[]; warnings: string[] } => {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.isValid === 'boolean' &&
    Array.isArray(obj.errors) &&
    Array.isArray(obj.warnings) &&
    obj.errors.every((error: any) => typeof error === 'string') &&
    obj.warnings.every((warning: any) => typeof warning === 'string')
  );
};

// MyPosition type guards
export const isMyPosition = (obj: any): obj is MyPosition => {
  return (
    obj &&
    typeof obj === 'object' &&
    isCoordinates(obj.coordinates) &&
    typeof obj.heading === 'number' &&
    isFinite(obj.heading) &&
    (obj.los === undefined || (
      typeof obj.los === 'object' &&
      obj.los !== null &&
      typeof obj.los.rangeKM === 'number' &&
      isFinite(obj.los.rangeKM) &&
      typeof obj.los.angleDEG === 'number' &&
      isFinite(obj.los.angleDEG)
    ))
  );
};

export const isMyPositionData = (obj: any): obj is { coordinates: Coordinates; heading: number } => {
  return isMyPosition(obj);
}; 