/**
 * Validation utility functions
 */

/**
 * Validate if a string is a valid entity name
 */
export function isValidEntityName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 100;
}

/**
 * Validate if coordinates are within valid ranges
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function isValidLatLng(coords: { lat: number; lng: number }): boolean {
  if (!coords) return false;
  return isValidCoordinates(Number(coords.lat), Number(coords.lng));
}

/**
 * Validate if a color is a valid hex color
 */
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate if a number is within a range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate if an object has required properties
 */
export function hasRequiredProperties<T extends Record<string, any>>(
  obj: T, 
  requiredProps: (keyof T)[]
): boolean {
  return requiredProps.every(prop => obj.hasOwnProperty(prop) && obj[prop] !== undefined);
} 