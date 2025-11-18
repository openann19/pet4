/**
 * Native KYC Module TypeScript Interface
 * Only use if RN wrapper (e.g., @onfido/react-native-sdk) is unavailable
 *
 * NOTE: This file is React Native specific and should not be imported in web builds.
 * If you need KYC functionality in web, use a web-compatible alternative.
 */

interface ReactNativeModule {
  NativeModules?: {
    KycModule?: {
      startKycSession: (config: KycConfig) => Promise<KycResult>;
      getKycStatus: (userId: string) => Promise<KycStatus>;
      cancelKycSession: (sessionId: string) => Promise<boolean>;
    };
  };
  NativeEventEmitter?: new (nativeModule: unknown) => {
    addListener: (event: string, callback: (data: unknown) => void) => { remove: () => void };
    removeAllListeners: (event: string) => void;
  };
}

// This file should only be imported in native environments
// Web builds should use a web-compatible KYC solution
// Check if we're in a web environment and fail fast
if (typeof window !== 'undefined') {
  // In web environment, this module should not be used
  // Throw error immediately to prevent usage
  throw new Error(
    'KycModule native module is only available in React Native environments. Use web-compatible KYC solution instead.'
  );
}

// For native environments, load react-native asynchronously
let reactNativeModule: ReactNativeModule | null = null;
let reactNativeLoadPromise: Promise<ReactNativeModule> | null = null;

async function loadReactNative(): Promise<ReactNativeModule> {
  if (reactNativeModule) {
    return reactNativeModule;
  }
  if (reactNativeLoadPromise) {
    return reactNativeLoadPromise;
  }

  reactNativeLoadPromise = import('react-native')
    .then((module) => {
      // Type guard for React Native module
      function isReactNativeModule(m: unknown): m is ReactNativeModule {
        return (
          typeof m === 'object' && m !== null && 'NativeModules' in m && 'NativeEventEmitter' in m
        );
      }

      if (isReactNativeModule(module)) {
        reactNativeModule = module;
      } else {
        throw new Error(
          'KycModule native module dependencies not found. Ensure react-native is properly installed.'
        );
      }

      if (!reactNativeModule?.NativeModules || !reactNativeModule?.NativeEventEmitter) {
        throw new Error(
          'KycModule native module dependencies not found. Ensure react-native is properly installed.'
        );
      }
      return reactNativeModule;
    })
    .catch(() => {
      throw new Error(
        'KycModule native module is only available in React Native environments. Use web-compatible KYC solution instead.'
      );
    });

  return reactNativeLoadPromise;
}

interface KycConfig {
  userId: string;
  token: string;
  locale?: 'en' | 'bg';
}

interface KycResult {
  sessionId: string;
  status: 'started' | 'completed' | 'failed';
  userId: string;
}

interface KycStatus {
  status: 'pending' | 'verified' | 'rejected';
  verificationId?: string;
  lastUpdated?: number;
}

interface KycProgress {
  progress: number; // 0-100
  stage: string;
}

interface EventEmitter {
  addListener: (event: string, callback: (data: unknown) => void) => { remove: () => void };
  removeAllListeners: (event: string) => void;
}

class KycNativeService {
  private emitter: EventEmitter | null = null;
  private kycmModule: ReactNativeModule['NativeModules']['KycModule'] | null = null;
  private initializationPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.kycmModule && this.emitter) {
      return;
    }
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = loadReactNative().then((module) => {
      const { NativeModules, NativeEventEmitter } = module;
      if (!NativeModules || !NativeEventEmitter) {
        throw new Error(
          'KycModule native module dependencies not found. Ensure react-native is properly installed.'
        );
      }

      const KycModule = NativeModules.KycModule;
      if (!KycModule) {
        throw new Error('KycModule native module not found. Ensure it is linked properly.');
      }

      this.kycmModule = KycModule;
      this.emitter = new NativeEventEmitter(KycModule);
    });

    return this.initializationPromise;
  }

  constructor() {
    // Initialize asynchronously (non-blocking)
    this.ensureInitialized().catch(() => {
      // Error will be thrown when methods are called
    });
  }

  /**
   * Start KYC verification session
   */
  async startKycSession(config: KycConfig): Promise<KycResult> {
    await this.ensureInitialized();
    if (!this.kycmModule) {
      throw new Error('KycModule not initialized');
    }
    return this.kycmModule.startKycSession(config);
  }

  /**
   * Get KYC verification status
   */
  async getKycStatus(userId: string): Promise<KycStatus> {
    await this.ensureInitialized();
    if (!this.kycmModule) {
      throw new Error('KycModule not initialized');
    }
    return this.kycmModule.getKycStatus(userId);
  }

  /**
   * Cancel ongoing KYC session
   */
  async cancelKycSession(sessionId: string): Promise<boolean> {
    await this.ensureInitialized();
    if (!this.kycmModule) {
      throw new Error('KycModule not initialized');
    }
    return this.kycmModule.cancelKycSession(sessionId);
  }

  /**
   * Listen to KYC progress events
   */
  onProgress(callback: (progress: KycProgress) => void) {
    if (!this.emitter) {
      // Initialize synchronously if not already initialized
      this.ensureInitialized().catch(() => {
        throw new Error('KycModule not initialized');
      });
      // This will throw if emitter is still null, but that's expected
      if (!this.emitter) {
        throw new Error('KycModule not initialized');
      }
    }
    return this.emitter.addListener('KycProgress', callback);
  }

  /**
   * Listen to KYC result events
   */
  onResult(callback: (result: KycResult) => void) {
    if (!this.emitter) {
      // Initialize synchronously if not already initialized
      this.ensureInitialized().catch(() => {
        throw new Error('KycModule not initialized');
      });
      // This will throw if emitter is still null, but that's expected
      if (!this.emitter) {
        throw new Error('KycModule not initialized');
      }
    }
    return this.emitter.addListener('KycResult', callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (this.emitter) {
      this.emitter.removeAllListeners('KycProgress');
      this.emitter.removeAllListeners('KycResult');
    }
  }
}

export const kycNative = new KycNativeService();

// Usage example:
// import { kycNative } from '@/lib/kyc-native';
//
// Example usage:
// const subscription = kycNative.onProgress((progress) => {
//   // Progress updates handled via callback
// });
//
// try {
//   const result = await kycNative.startKycSession({
//     userId: 'user123',
//     token: 'kyc_token',
//     locale: 'en'
// });
//   // Session started successfully
// } catch (_error) {
//   // Error handling should be implemented
// } finally {
//   subscription.remove();
// }
