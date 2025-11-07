/**
 * Native KYC Module TypeScript Interface
 * Only use if RN wrapper (e.g., @onfido/react-native-sdk) is unavailable
 * 
 * NOTE: This file is React Native specific and should not be imported in web builds.
 * If you need KYC functionality in web, use a web-compatible alternative.
 */

// Conditional import - only available in React Native environments
// eslint-disable-next-line @typescript-eslint/no-require-imports
const reactNative = typeof require !== 'undefined' ? require('react-native') : null;

if (!reactNative) {
  // Web environment - provide no-op implementation
  throw new Error('KycModule native module is only available in React Native environments. Use web-compatible KYC solution instead.');
}

const { NativeModules, NativeEventEmitter } = reactNative;

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

const { KycModule } = NativeModules;

if (!KycModule) {
  throw new Error('KycModule native module not found. Ensure it is linked properly.');
}

class KycNativeService {
  private emitter: InstanceType<typeof NativeEventEmitter>;

  constructor() {
    this.emitter = new NativeEventEmitter(KycModule);
  }

  /**
   * Start KYC verification session
   */
  async startKycSession(config: KycConfig): Promise<KycResult> {
    return KycModule.startKycSession(config);
  }

  /**
   * Get KYC verification status
   */
  async getKycStatus(userId: string): Promise<KycStatus> {
    return KycModule.getKycStatus(userId);
  }

  /**
   * Cancel ongoing KYC session
   */
  async cancelKycSession(sessionId: string): Promise<boolean> {
    return KycModule.cancelKycSession(sessionId);
  }

  /**
   * Listen to KYC progress events
   */
  onProgress(callback: (progress: KycProgress) => void) {
    return this.emitter.addListener('KycProgress', callback);
  }

  /**
   * Listen to KYC result events
   */
  onResult(callback: (result: KycResult) => void) {
    return this.emitter.addListener('KycResult', callback);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    this.emitter.removeAllListeners('KycProgress');
    this.emitter.removeAllListeners('KycResult');
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
// } catch (error) {
//   // Error handling should be implemented
// } finally {
//   subscription.remove();
// }

