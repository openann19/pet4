import { haptics } from './haptics';

export interface SwipeConfig {
  engageThreshold: number;
  intentThreshold: number;
  commitThreshold: number;
  velocityEscape: number;
  springConfig: {
    stiffness: number;
    damping: number;
    mass: number;
  };
  overscrollClamp: number;
}

export const DEFAULT_SWIPE_CONFIG: SwipeConfig = {
  engageThreshold: 15,
  intentThreshold: 80,
  commitThreshold: 150,
  velocityEscape: 500,
  springConfig: {
    stiffness: 350,
    damping: 30,
    mass: 1,
  },
  overscrollClamp: 1.5,
};

export type SwipeState = 'idle' | 'engaged' | 'intent' | 'committing' | 'committed';
export type SwipeDirection = 'left' | 'right' | null;

export interface SwipeMetrics {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  deltaX: number;
  deltaY: number;
  angle: number;
  distance: number;
  timestamp: number;
}

export interface SwipeResult {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
  duration: number;
}

export class SwipeEngine {
  private config: SwipeConfig;
  private state: SwipeState = 'idle';
  private startX = 0;
  private startY = 0;
  private currentX = 0;
  private currentY = 0;
  private velocityX = 0;
  private velocityY = 0;
  private startTime = 0;
  private lastTime = 0;
  private lastX = 0;
  private lastY = 0;
  private frameId: number | null = null;

  private onStateChange?: (state: SwipeState, metrics: SwipeMetrics) => void;
  private onCommit?: (result: SwipeResult) => void;

  constructor(config: Partial<SwipeConfig> = {}) {
    this.config = { ...DEFAULT_SWIPE_CONFIG, ...config };
  }

  public setCallbacks(callbacks: {
    onStateChange?: (state: SwipeState, metrics: SwipeMetrics) => void;
    onCommit?: (result: SwipeResult) => void;
  }) {
    if (callbacks.onStateChange !== undefined) {
      this.onStateChange = callbacks.onStateChange;
    }
    if (callbacks.onCommit !== undefined) {
      this.onCommit = callbacks.onCommit;
    }
  }

  public start(x: number, y: number) {
    this.state = 'idle';
    this.startX = x;
    this.startY = y;
    this.currentX = x;
    this.currentY = y;
    this.lastX = x;
    this.lastY = y;
    this.velocityX = 0;
    this.velocityY = 0;
    this.startTime = performance.now();
    this.lastTime = this.startTime;

    this.startVelocityTracking();
  }

  public move(x: number, y: number) {
    const now = performance.now();
    const dt = now - this.lastTime;

    if (dt > 0) {
      this.velocityX = ((x - this.lastX) / dt) * 1000;
      this.velocityY = ((y - this.lastY) / dt) * 1000;
    }

    this.lastX = x;
    this.lastY = y;
    this.lastTime = now;
    this.currentX = x;
    this.currentY = y;

    const metrics = this.getMetrics();
    const distance = metrics.distance;
    const absVelocityX = Math.abs(this.velocityX);

    if (absVelocityX > this.config.velocityEscape && distance > this.config.engageThreshold) {
      this.state = 'committing';
      haptics.impact('heavy');
    } else if (distance >= this.config.commitThreshold) {
      if (this.state !== 'committing') {
        this.state = 'committing';
        haptics.impact('heavy');
      }
    } else if (distance >= this.config.intentThreshold) {
      if (this.state !== 'intent' && this.state !== 'committing') {
        this.state = 'intent';
        haptics.impact('light');
      }
    } else if (distance >= this.config.engageThreshold) {
      if (this.state === 'idle') {
        this.state = 'engaged';
        haptics.selection();
      }
    }

    this.onStateChange?.(this.state, metrics);
  }

  public end(): SwipeResult | null {
    this.stopVelocityTracking();

    const metrics = this.getMetrics();
    const distance = metrics.distance;
    const absVelocityX = Math.abs(this.velocityX);

    const shouldCommit =
      distance >= this.config.commitThreshold ||
      (absVelocityX > this.config.velocityEscape && distance > this.config.engageThreshold);

    if (shouldCommit) {
      const direction: SwipeDirection = metrics.deltaX > 0 ? 'right' : 'left';
      const result: SwipeResult = {
        direction,
        distance,
        velocity: absVelocityX,
        duration: performance.now() - this.startTime,
      };

      this.state = 'committed';
      haptics.impact('medium');
      this.onCommit?.(result);

      return result;
    }

    this.state = 'idle';
    return null;
  }

  public cancel() {
    this.stopVelocityTracking();
    this.state = 'idle';
    this.velocityX = 0;
    this.velocityY = 0;
  }

  public getMetrics(): SwipeMetrics {
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    return {
      x: this.currentX,
      y: this.currentY,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      deltaX,
      deltaY,
      angle,
      distance,
      timestamp: performance.now(),
    };
  }

  public getState(): SwipeState {
    return this.state;
  }

  public getDirection(): SwipeDirection {
    const deltaX = this.currentX - this.startX;
    if (Math.abs(deltaX) < this.config.engageThreshold) return null;
    return deltaX > 0 ? 'right' : 'left';
  }

  public getProgress(): number {
    const distance = Math.abs(this.currentX - this.startX);
    return Math.min(distance / this.config.commitThreshold, 1);
  }

  public getClampedOffset(): { x: number; y: number; rotation: number; scale: number } {
    const deltaX = this.currentX - this.startX;
    const deltaY = this.currentY - this.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const maxDistance = this.config.commitThreshold * this.config.overscrollClamp;
    const clampedDistance = Math.min(distance, maxDistance);
    const clampRatio = distance > 0 ? clampedDistance / distance : 1;

    const x = deltaX * clampRatio;
    const y = deltaY * clampRatio * 0.3;
    const rotation = (x / this.config.commitThreshold) * 15;
    const scale = 1 - Math.min(Math.abs(x) / this.config.commitThreshold, 0.1);

    return { x, y, rotation, scale };
  }

  public getSpringConfig() {
    return this.config.springConfig;
  }

  private startVelocityTracking() {
    const track = () => {
      if (this.state !== 'idle') {
        this.frameId = requestAnimationFrame(track);
      }
    };
    this.frameId = requestAnimationFrame(track);
  }

  private stopVelocityTracking() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }
}

export function createSwipeEngine(config?: Partial<SwipeConfig>): SwipeEngine {
  return new SwipeEngine(config);
}
