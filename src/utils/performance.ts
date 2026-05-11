import React, { useRef, useEffect } from 'react';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static measurements: Map<string, number[]> = new Map();

  // Start timing an operation
  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  // End timing and log the result
  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    
    // Store measurement for averaging
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);

    // Log if duration is significant (> 16ms = 60fps threshold)
    if (duration > 16) {
      console.warn(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get average time for a label
  static getAverageTime(label: string): number {
    const measurements = this.measurements.get(label);
    if (!measurements || measurements.length === 0) {
      return 0;
    }
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length;
  }

  // Clear all measurements
  static clearMeasurements(): void {
    this.measurements.clear();
    this.timers.clear();
  }
}

// Debounce utility with performance tracking
export const debounceWithPerformance = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  label?: string
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (label) PerformanceMonitor.startTimer(label);
      func(...args);
      if (label) PerformanceMonitor.endTimer(label);
    }, wait);
  };
};

// Throttle utility with performance tracking
export const throttleWithPerformance = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  label?: string
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      if (label) PerformanceMonitor.startTimer(label);
      func(...args);
      if (label) PerformanceMonitor.endTimer(label);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory usage monitoring
export const getMemoryUsage = (): { used: number; total: number; percentage: number } => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    };
  }
  return { used: 0, total: 0, percentage: 0 };
};

// Simple performance tracking for components
export const trackComponentRender = (componentName: string) => {
  const startTime = performance.now();
  
  return () => {
    const renderTime = performance.now() - startTime;
    if (renderTime > 16) {
      console.warn(`Performance: ${componentName} render took ${renderTime.toFixed(2)}ms`);
    }
  };
};

// Hook for measuring hook performance
export const usePerformanceTracking = (hookName: string) => {
  const startTime = useRef(performance.now());
  
  useEffect(() => {
    const duration = performance.now() - startTime.current;
    if (duration > 16) {
      console.warn(`Performance: ${hookName} took ${duration.toFixed(2)}ms`);
    }
  });
};

// Batch operations for better performance
export const batchOperations = <T>(
  operations: (() => T)[],
  batchSize: number = 10
): Promise<T[]> => {
  return new Promise((resolve) => {
    const results: T[] = [];
    let currentIndex = 0;

    const processBatch = () => {
      const batch = operations.slice(currentIndex, currentIndex + batchSize);
      batch.forEach(operation => {
        try {
          results.push(operation());
        } catch (error) {
          console.error('Batch operation failed:', error);
        }
      });

      currentIndex += batchSize;

      if (currentIndex < operations.length) {
        // Use requestAnimationFrame for smooth UI
        requestAnimationFrame(processBatch);
      } else {
        resolve(results);
      }
    };

    processBatch();
  });
};

// Memory leak detection
export const createMemoryLeakDetector = () => {
  const references = new WeakSet();
  let count = 0;
  
  return {
    track: (obj: any) => {
      references.add(obj);
      count++;
    },
    check: () => {
      // This is a simplified check - in real apps you'd use more sophisticated tools
      console.log('Memory leak detector: tracking', count, 'objects');
    }
  };
};

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  FRAME_BUDGET: 16, // 60fps = 16ms per frame
  SLOW_RENDER_THRESHOLD: 50, // 50ms is considered slow
  MEMORY_WARNING_THRESHOLD: 80, // 80% memory usage warning
  BATCH_SIZE: 10, // Default batch size for operations
} as const; 