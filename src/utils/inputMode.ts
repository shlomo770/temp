import React from 'react';
import { UIConfigManager, InputMode } from '../config/uiConfig';

// Input mode detection utilities
export class InputModeDetector {
  // Check if device supports touch
  static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  // Check if device is a tablet
  static isTablet(): boolean {
    return this.isTouchDevice() && window.innerWidth >= 768;
  }

  // Check if device is a phone
  static isPhone(): boolean {
    return this.isTouchDevice() && window.innerWidth < 768;
  }

  // Check if device is desktop
  static isDesktop(): boolean {
    return !this.isTouchDevice();
  }

  // Get current input mode based on configuration and device detection
  static getCurrentInputMode(): 'touch' | 'mouse' {
    const configMode = UIConfigManager.get('inputMode');
    
    switch (configMode) {
      case 'touch':
        return 'touch';
      case 'mouse':
        return 'mouse';
      case 'auto':
      default:
        return this.isTouchDevice() ? 'touch' : 'mouse';
    }
  }

  // Check if current mode is touch
  static isTouchMode(): boolean {
    return this.getCurrentInputMode() === 'touch';
  }

  // Check if current mode is mouse
  static isMouseMode(): boolean {
    return this.getCurrentInputMode() === 'mouse';
  }

  // Get optimal touch target size based on device and configuration
  static getTouchTargetSize(): number {
    const configSize = UIConfigManager.get('touchTargetSize');
    const isTablet = this.isTablet();
    
    switch (configSize) {
      case 'small':
        return isTablet ? 40 : 36;
      case 'large':
        return isTablet ? 56 : 52;
      case 'medium':
      default:
        return isTablet ? 48 : 44;
    }
  }

  // Get optimal spacing for touch targets
  static getTouchSpacing(): number {
    return this.isTablet() ? 16 : 12;
  }

  // Get optimal font size for touch
  static getTouchFontSize(): number {
    return this.isTablet() ? 16 : 14;
  }

  // Check if haptic feedback should be enabled
  static shouldUseHapticFeedback(): boolean {
    return UIConfigManager.get('hapticFeedback') && this.isTouchMode();
  }

  // Check if hover effects should be enabled
  static shouldUseHover(): boolean {
    return UIConfigManager.get('enableHover') && this.isMouseMode();
  }

  // Check if gestures should be enabled
  static shouldUseGestures(): boolean {
    return UIConfigManager.get('enableGestures') && this.isTouchMode();
  }

  // Check if snap to grid should be enabled
  static shouldSnapToGrid(): boolean {
    return UIConfigManager.get('snapToGrid') && this.isTouchMode();
  }

  // Check if snap to entities should be enabled
  static shouldSnapToEntities(): boolean {
    return UIConfigManager.get('snapToEntities') && this.isTouchMode();
  }

  // Get configuration-based delays
  static getLongPressDelay(): number {
    return UIConfigManager.get('longPressDelay');
  }

  static getDoubleTapDelay(): number {
    return UIConfigManager.get('doubleTapDelay');
  }

  static getSwipeThreshold(): number {
    return UIConfigManager.get('swipeThreshold');
  }

  static getPinchThreshold(): number {
    return UIConfigManager.get('pinchThreshold');
  }
}

// React hook for input mode detection
export const useInputMode = () => {
  const [inputMode, setInputMode] = React.useState<'touch' | 'mouse'>(
    InputModeDetector.getCurrentInputMode()
  );

  React.useEffect(() => {
    const unsubscribe = UIConfigManager.subscribe(() => {
      setInputMode(InputModeDetector.getCurrentInputMode());
    });

    return unsubscribe;
  }, []);

  return {
    inputMode,
    isTouch: inputMode === 'touch',
    isMouse: inputMode === 'mouse',
    isTablet: InputModeDetector.isTablet(),
    isPhone: InputModeDetector.isPhone(),
    isDesktop: InputModeDetector.isDesktop(),
    touchTargetSize: InputModeDetector.getTouchTargetSize(),
    touchSpacing: InputModeDetector.getTouchSpacing(),
    touchFontSize: InputModeDetector.getTouchFontSize(),
    shouldUseHaptic: InputModeDetector.shouldUseHapticFeedback(),
    shouldUseHover: InputModeDetector.shouldUseHover(),
    shouldUseGestures: InputModeDetector.shouldUseGestures(),
    shouldSnapToGrid: InputModeDetector.shouldSnapToGrid(),
    shouldSnapToEntities: InputModeDetector.shouldSnapToEntities(),
    longPressDelay: InputModeDetector.getLongPressDelay(),
    doubleTapDelay: InputModeDetector.getDoubleTapDelay(),
    swipeThreshold: InputModeDetector.getSwipeThreshold(),
    pinchThreshold: InputModeDetector.getPinchThreshold()
  };
};

// Utility function for conditional CSS classes
export const getInputModeClasses = (touchClasses: string, mouseClasses: string): string => {
  return InputModeDetector.isTouchMode() ? touchClasses : mouseClasses;
};

// Utility function for conditional props
export const getInputModeProps = (touchProps: any, mouseProps: any): any => {
  return InputModeDetector.isTouchMode() ? touchProps : mouseProps;
};

// Export the detector as default
export default InputModeDetector; 