import { Coordinates, Entity, EnhancedEntity, LngLat } from '../types';
import { isCoordinates, isEntity } from './typeGuards';

// Coordinate formatting
export const formatCoordinate = (coord: number, precision: number = 6): string => {
  return coord.toFixed(precision);
};

export const formatCoordinates = (coords: Coordinates, precision: number = 6): string => {
  return `${formatCoordinate(coords.lat, precision)}, ${formatCoordinate(coords.lng, precision)}`;
};

// Distance calculation
export const calculateDistance = (p1: Coordinates, p2: Coordinates): number => {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
            Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Distance formatting
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
};

// Entity validation using type guards
export const validateEntity = (entity: Entity): boolean => {
  return isEntity(entity) && entity.coordinates.length > 0;
};

// Entity name generation
export const generateEntityName = (type: string, index: number): string => {
  const typeNames: Record<string, string> = {
    polygon: 'Polygon',
    line: 'Line',
    rectangle: 'Rectangle',
    circle: 'Circle',
    marker: 'Marker'
  };
  
  const typeName = typeNames[type] || type;
  return `${typeName} ${index + 1}`;
};

// Color utilities
export const getEntityColor = (type: string): string => {
  const colors: Record<string, string> = {
    polygon: '#3b82f6',
    line: '#10b981',
    rectangle: '#8b5cf6',
    circle: '#f59e0b',
    marker: '#ef4444'
  };
  
  return colors[type] || '#6b7280';
};

// Array utilities
export const removeFromArray = <T>(array: T[], item: T): T[] => {
  return array.filter(i => i !== item);
};

export const addToArray = <T>(array: T[], item: T): T[] => {
  return [...array, item];
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// UUID generation (simple)
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// Date formatting
export const formatTime = (date: Date = new Date()): string => {
  const h = date.getHours().toString().padStart(2, '0');
  const m = date.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const formatDate = (date: Date = new Date()): string => {
  const d = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  return `${d} ${month}`;
};

// Map utilities
export const getMapBounds = (coordinates: Coordinates[]): {
  north: number;
  south: number;
  east: number;
  west: number;
} => {
  if (coordinates.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }
  
  let north = coordinates[0].lat;
  let south = coordinates[0].lat;
  let east = coordinates[0].lng;
  let west = coordinates[0].lng;
  
  coordinates.forEach(coord => {
    north = Math.max(north, coord.lat);
    south = Math.min(south, coord.lat);
    east = Math.max(east, coord.lng);
    west = Math.min(west, coord.lng);
  });
  
  return { north, south, east, west };
}; 