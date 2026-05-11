export function attachUnifiedMapClick(
  map: maplibregl.Map,
  handler: (e: any) => void
) {
  const wrapped = (e: any) => {
    handler(e);
  };

  map.on('click', wrapped);
  map.on('touchend', wrapped);
  return wrapped;
}

export function attachUnifiedMapMove(
  map: maplibregl.Map,
  handler: (e: any) => void
) {
  map.on('mousemove', handler);
  map.on('touchmove', handler);
  return handler;
}

export function detachUnifiedMapClick(
  map: maplibregl.Map,
  wrappedHandler: any
) {
  map.off('click', wrappedHandler);
  map.off('touchend', wrappedHandler);
}

export function detachUnifiedMapMove(
  map: maplibregl.Map,
  handler: any
) {
  map.off('mousemove', handler);
  map.off('touchmove', handler);
}

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