import { Coordinates, Entity } from '../types';

// Touch gesture types
export type TouchGesture = 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'pan';

// Touch event data
export interface TouchEventData {
  type: TouchGesture;
  position: { x: number; y: number };
  coordinates?: Coordinates;
  entityId?: string;
  delta?: { x: number; y: number };
  scale?: number;
  duration?: number;
}

// Touch configuration
export interface TouchConfig {
  longPressDelay: number;
  doubleTapDelay: number;
  swipeThreshold: number;
  pinchThreshold: number;
  hapticFeedback: boolean;
  preventZoom: boolean;
  preventPan: boolean;
}

// Default touch configuration for tablets
export const DEFAULT_TOUCH_CONFIG: TouchConfig = {
  longPressDelay: 500, // 500ms for long press
  doubleTapDelay: 300, // 300ms for double tap
  swipeThreshold: 50, // 50px minimum for swipe
  pinchThreshold: 0.1, // 10% change for pinch
  hapticFeedback: true,
  preventZoom: true,
  preventPan: false
};

// Haptic feedback utility
export class HapticFeedback {
  static async trigger(style: 'light' | 'medium' | 'heavy' = 'light') {
    if ('vibrate' in navigator && DEFAULT_TOUCH_CONFIG.hapticFeedback) {
      try {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30]
        };
        await navigator.vibrate(patterns[style]);
      } catch (error) {
        console.warn('Haptic feedback not supported');
      }
    }
  }

  static success() {
    this.trigger('light');
  }

  static error() {
    this.trigger('medium');
  }

  static warning() {
    this.trigger('heavy');
  }
}

// Advanced touch gesture recognizer
export class TouchGestureRecognizer {
  private config: TouchConfig;
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private touchStartDistance: number = 0;
  private lastTapTime: number = 0;
  private longPressTimer: number | null = null;
  private isLongPress: boolean = false;

  constructor(config: Partial<TouchConfig> = {}) {
    this.config = { ...DEFAULT_TOUCH_CONFIG, ...config };
  }

  // Start touch tracking
  onTouchStart = (e: TouchEvent, mapCoordinates?: Coordinates) => {
    e.preventDefault();
    
    this.touchStartTime = Date.now();
    this.touchStartPosition = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true;
      this.onLongPress(e, mapCoordinates);
    }, this.config.longPressDelay);

    // Calculate initial distance for pinch
    if (e.touches.length === 2) {
      this.touchStartDistance = this.getDistance(e.touches[0], e.touches[1]);
    }
  };

  // Handle touch move
  onTouchMove = (e: TouchEvent, mapCoordinates?: Coordinates) => {
    if (this.isLongPress) return;

    const currentPosition = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    const delta = {
      x: currentPosition.x - this.touchStartPosition.x,
      y: currentPosition.y - this.touchStartPosition.y
    };

    // Detect swipe
    if (Math.abs(delta.x) > this.config.swipeThreshold || 
        Math.abs(delta.y) > this.config.swipeThreshold) {
      this.onSwipe(e, delta, mapCoordinates);
    }

    // Detect pinch
    if (e.touches.length === 2) {
      const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / this.touchStartDistance;
      
      if (Math.abs(scale - 1) > this.config.pinchThreshold) {
        this.onPinch(e, scale, mapCoordinates);
      }
    }
  };

  // Handle touch end
  onTouchEnd = (e: TouchEvent, mapCoordinates?: Coordinates) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    const touchDuration = Date.now() - this.touchStartTime;
    const currentTime = Date.now();

    // Detect tap vs double tap
    if (touchDuration < 200 && !this.isLongPress) {
      if (currentTime - this.lastTapTime < this.config.doubleTapDelay) {
        this.onDoubleTap(e, mapCoordinates);
        this.lastTapTime = 0; // Reset to prevent triple tap
      } else {
        this.onTap(e, mapCoordinates);
        this.lastTapTime = currentTime;
      }
    }

    this.isLongPress = false;
  };

  // Gesture handlers (to be overridden)
  onTap = (e: TouchEvent, mapCoordinates?: Coordinates) => {
    HapticFeedback.success();
  };

  onDoubleTap = (e: TouchEvent, mapCoordinates?: Coordinates) => {
    HapticFeedback.trigger('medium');
  };

  onLongPress = (e: TouchEvent, mapCoordinates?: Coordinates) => {
    HapticFeedback.trigger('heavy');
  };

  onSwipe = (e: TouchEvent, delta: { x: number; y: number }, mapCoordinates?: Coordinates) => {
    // Override in specific components
  };

  onPinch = (e: TouchEvent, scale: number, mapCoordinates?: Coordinates) => {
    // Override in specific components
  };

  private getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

// Smart touch coordinates with snap-to-grid
export class TouchCoordinates {
  private gridSize: number = 10; // meters
  private snapRadius: number = 20; // pixels

  // Convert screen coordinates to map coordinates with snap
  static screenToMap(
    screenX: number, 
    screenY: number, 
    map: any,
    entities: Entity[] = []
  ): Coordinates {
    const point = map.unproject([screenX, screenY]);
    
    // Snap to nearest entity if within radius
    const snapped = this.snapToNearestEntity(point, entities);
    if (snapped) return snapped;

    // Snap to grid
    return this.snapToGrid(point);
  }

  // Snap to nearest entity
  private static snapToNearestEntity(
    point: Coordinates, 
    entities: Entity[]
  ): Coordinates | null {
    let nearest: Entity | null = null;
    let minDistance = Infinity;

    for (const entity of entities) {
      for (const coord of entity.coordinates) {
        const distance = this.getDistance(point, coord);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = entity;
        }
      }
    }

    if (nearest && minDistance < 0.001) { // ~100 meters
      return nearest.coordinates[0]; // Return first coordinate of nearest entity
    }

    return null;
  }

  // Snap to grid
  private static snapToGrid(point: Coordinates): Coordinates {
    const gridSize = 0.001; // ~100 meters
    return {
      lng: Math.round(point.lng / gridSize) * gridSize,
      lat: Math.round(point.lat / gridSize) * gridSize
    };
  }

  // Calculate distance between two coordinates
  private static getDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Touch-friendly UI utilities
export class TouchUI {
  // Check if device supports touch
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Check if device is a tablet
  static isTablet(): boolean {
    return this.isTouchDevice() && window.innerWidth >= 768;
  }

  // Get optimal touch target size
  static getTouchTargetSize(): number {
    return this.isTablet() ? 48 : 44; // 48px for tablets, 44px for phones
  }

  // Get optimal spacing for touch targets
  static getTouchSpacing(): number {
    return this.isTablet() ? 16 : 12; // 16px for tablets, 12px for phones
  }

  // Get optimal font size for touch
  static getTouchFontSize(): number {
    return this.isTablet() ? 16 : 14; // 16px for tablets, 14px for phones
  }
}

// Touch event wrapper for React components
export const useTouchEvents = (config?: Partial<TouchConfig>) => {
  const recognizer = new TouchGestureRecognizer(config);

  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent) => {
      recognizer.onTouchStart(e.nativeEvent);
    },
    onTouchMove: (e: React.TouchEvent) => {
      recognizer.onTouchMove(e.nativeEvent);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      recognizer.onTouchEnd(e.nativeEvent);
    }
  };

  return {
    touchHandlers,
    recognizer,
    isTouchDevice: TouchUI.isTouchDevice(),
    isTablet: TouchUI.isTablet()
  };
};

// Touch-friendly CSS classes
export const TOUCH_CSS_CLASSES = {
  touchTarget: 'min-h-[44px] min-w-[44px] touch-manipulation',
  tabletTarget: 'min-h-[48px] min-w-[48px] touch-manipulation',
  touchSpacing: 'space-y-3',
  tabletSpacing: 'space-y-4',
  touchText: 'text-sm',
  tabletText: 'text-base',
  touchButton: 'active:scale-95 transition-transform duration-100',
  touchFeedback: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
}; 