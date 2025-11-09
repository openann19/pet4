/**
 * Type definitions for performance monitoring in E2E tests
 */

interface Window {
  __frameTimes?: number[];
  __lastFrameTime?: number;
  __frameCount?: number;
  __droppedFrames?: number;
}

interface Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}
