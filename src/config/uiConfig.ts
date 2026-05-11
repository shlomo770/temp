// UI Configuration for dynamic input mode switching
export type InputMode = 'auto' | 'touch' | 'mouse';

// UI Configuration interface
export interface UIConfig {
  inputMode: InputMode;
  hapticFeedback: boolean;
  touchTargetSize: 'small' | 'medium' | 'large';
  enableHover: boolean;
  enableGestures: boolean;
  snapToGrid: boolean;
  snapToEntities: boolean;
  longPressDelay: number;
  doubleTapDelay: number;
  swipeThreshold: number;
  pinchThreshold: number;
}

// Default configuration
export const defaultUIConfig: UIConfig = {
  inputMode: 'auto',
  hapticFeedback: true,
  touchTargetSize: 'medium',
  enableHover: true,
  enableGestures: true,
  snapToGrid: true,
  snapToEntities: true,
  longPressDelay: 500,
  doubleTapDelay: 300,
  swipeThreshold: 50,
  pinchThreshold: 0.1
};

// Global UI configuration instance
let uiConfig: UIConfig = { ...defaultUIConfig };

// Configuration management class
export class UIConfigManager {
  private static listeners: Array<() => void> = [];

  // Get current configuration
  static getConfig(): UIConfig {
    return { ...uiConfig };
  }

  // Update configuration
  static updateConfig(updates: Partial<UIConfig>): void {
    uiConfig = { ...uiConfig, ...updates };
    // Trigger any necessary UI updates
    this.notifyConfigChange();
  }

  // Set input mode
  static setInputMode(mode: InputMode): void {
    uiConfig.inputMode = mode;
    this.notifyConfigChange();
  }

  // Reset to defaults
  static resetToDefaults(): void {
    uiConfig = { ...defaultUIConfig };
    this.notifyConfigChange();
  }

  // Get specific config value
  static get<K extends keyof UIConfig>(key: K): UIConfig[K] {
    return uiConfig[key];
  }

  // Set specific config value
  static set<K extends keyof UIConfig>(key: K, value: UIConfig[K]): void {
    uiConfig[key] = value;
    this.notifyConfigChange();
  }

  // Subscribe to configuration changes
  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners of configuration change
  private static notifyConfigChange(): void {
    this.listeners.forEach(listener => listener());
  }
}

// Export the manager as default
export default UIConfigManager; 