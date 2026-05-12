/**
 * Utility for filtering MapLibre-specific errors
 * Replaces global console.error overrides with targeted filtering
 */

export const isMapLibreError = (error: any): boolean => {
  if (!error) return false;

  const errorMessage = typeof error === 'string'
    ? error
    : error.message || error.toString();

  const mapLibreKeywords = [
    'MapLibre error',
    'Cannot read properties of undefined',
    'fill-outline-width',
    'Could not load image',
    'could not be decoded',
    'The source image could not be decoded',
    'unknown property',
    'already exists',
    'triggerRepaint',
    'tile',
    'image',
    'decoded',
    'source',
    'load',
    'target',
    'type',
    'isSourceLoaded'
  ];

  return mapLibreKeywords.some(keyword =>
    errorMessage.toLowerCase().includes(keyword.toLowerCase())
  );
};

/**
 * Safe console.error that filters out MapLibre errors
 * Use this in MapLibre event handlers instead of global override
 */
const originalError = console.error;

export const safeConsoleError = (...args: any[]) => {
  try {
    const errorMessage = args.join(' ');
    if (!isMapLibreError(errorMessage)) {
      originalError.apply(console, args); // שימוש ב-originalError במקום console.error
    }
  } catch (e) {
    // Fallback: if filtering fails, show the error
    originalError.apply(console, args);
  }
};


let isErrorFilterSetup = false;
export const setupSafeErrorFiltering = () => {
  if (isErrorFilterSetup) return;

  console.error = (...args: any[]) => {
    try {
      // Quick check for WebSocket errors - don't filter these
      const errorStr = args.join(' ');
      if (errorStr.includes('WebSocket') || errorStr.includes('ws://') || errorStr.includes('connection')) {
        originalError.apply(console, args);
        return;
      }

      // Use safe filtering for other errors
      safeConsoleError(...args);
    } catch (e) {
      // Ultimate fallback - show all errors if filtering completely fails
      originalError.apply(console, args);
    }
  };

  isErrorFilterSetup = true;
};

