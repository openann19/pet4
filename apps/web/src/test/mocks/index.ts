/**
 * Centralized mock setup
 */
export { setupBrowserAPIMocks } from './browser-apis';
export { setupFileAPIMocks } from './file-apis';
export { setupCanvasAPIMocks } from './canvas-apis';
export { setupFetchMock } from './fetch';
export { setupHapticsMocks, resetHapticsMockState, hapticsCalls } from './haptics';
export { createMockLogger } from './logger';
export { setupReactNativeMocks } from './react-native';
export { setupTouchEventPolyfills, setupPointerCapturePolyfills } from './touch-events';
export { setupModuleMocks } from './module-mocks';

