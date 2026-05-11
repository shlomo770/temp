import { store } from '../../store/store';
import { removeTarget } from '../../store/slices/targetsSlice';

export class TargetStatusService {
  private static instance: TargetStatusService;
  private intervalRef: number | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): TargetStatusService {
    if (!TargetStatusService.instance) {
      TargetStatusService.instance = new TargetStatusService();
    }
    return TargetStatusService.instance;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalRef = window.setInterval(() => {
      this.checkTargetStatus();
    }, 1000); // Check every second for better responsiveness
  }

  stop(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.isRunning = false;
  }

  private checkTargetStatus(): void {
    const state = store.getState();
    const targets = state.targets;
    const now = Date.now();

    // Check for targets to remove (from settings)
    const settings = store.getState().settings;
    const removeTimeoutMs = settings.disconnectedTargetTimeoutSec * 1000;
    const targetsToRemove = targets.allIds.filter(id => {
      const target = targets.byId[id];
      // return target && (now - target.lastUpdate) > removeTimeoutMs;
    });

    // Remove expired targets
    targetsToRemove.forEach(id => {
      store.dispatch(removeTarget(id));
    });
  }

  // Helper method to check if a target is inactive (from settings)
  static isTargetInactive(target: any): boolean {
    const now = Date.now();
    const settings = store.getState().settings;
    const timeoutMs = settings.inactiveTargetTimeoutSec * 1000;
    return target && (now - target.lastUpdate) > timeoutMs;
  }

  // Helper method to check if a target should be removed (from settings)
  static shouldRemoveTarget(target: any): boolean {
    const now = Date.now();
    const settings = store.getState().settings;
    const timeoutMs = settings.disconnectedTargetTimeoutSec * 1000;
    return target && (now - target.lastUpdate) > timeoutMs;
  }
} 