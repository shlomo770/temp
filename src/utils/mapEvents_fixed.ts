import maplibregl from 'maplibre-gl';

/**
 * מאזין לאירוע לחיצה על המפה, תומך בעכבר וטאצ'
 * Handles click for mouse and touch
 */
export function attachUnifiedMapClick(
  map: maplibregl.Map,
  handler: (e: any) => void
) {
  // עוטף את ה-handler כדי שנוכל להסיר אותו ב-detach
  const wrapped = (e: any) => {
    // תמיד קורא ל-handler - לא מסנן כלום
    handler(e);
  };
  
  // מאזין גם ל-click וגם ל-touch (רק touchend כדי למנוע כפילות)
  map.on('click', wrapped);
  map.on('touchend', wrapped);
  
  // מחזיר את הפונקציה כדי לאפשר הסרה
  return wrapped;
}

/**
 * מאזין לאירוע mousemove על המפה (עכבר, טאצ', stylus)
 */
export function attachUnifiedMapMove(
  map: maplibregl.Map,
  handler: (e: any) => void
) {
  map.on('mousemove', handler);
  map.on('touchmove', handler);
  return handler;
}

/**
 * מסיר את ה-handler של click
 */
export function detachUnifiedMapClick(
  map: maplibregl.Map,
  wrappedHandler: any
) {
  map.off('click', wrappedHandler);
  map.off('touchend', wrappedHandler);
}

/**
 * מסיר את ה-handler של mousemove
 */
export function detachUnifiedMapMove(
  map: maplibregl.Map,
  handler: any
) {
  map.off('mousemove', handler);
  map.off('touchmove', handler);
}

/**
 * פונקציה עזר ליצירת throttled callback לביצועים טובים יותר
 */
export function createThrottledCallback<T extends any[]>(
  callback: (...args: T) => void,
  delay: number = 16
): (...args: T) => void {
  let timeoutId: number | null = null;
  
  return (...args: T) => {
    if (timeoutId) return;
    
    timeoutId = window.setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
}
