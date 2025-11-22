/**
 * Window Extension Types
 *
 * Type definitions for extended window and navigator interfaces
 */

interface BatteryManager extends EventTarget {
  readonly charging: boolean;
  readonly chargingTime: number;
  readonly dischargingTime: number;
  readonly level: number;
  onchargingchange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onchargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  ondischargingtimechange: ((this: BatteryManager, ev: Event) => unknown) | null;
  onlevelchange: ((this: BatteryManager, ev: Event) => unknown) | null;
}

interface WindowWithNavigator extends Window {
  navigator: Navigator & {
    standalone?: boolean;
    getBattery?: () => Promise<BatteryManager>;
  };
}

declare global {
  interface Window {
    navigator: Navigator & {
      standalone?: boolean;
      getBattery?: () => Promise<BatteryManager>;
    };
  }
}

export type { WindowWithNavigator, BatteryManager };
