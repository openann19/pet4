/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_MAP_STYLE_URL?: string;
  readonly VITE_MAP_TILES_API_KEY?: string;
  readonly VITE_GEOCODING_API_KEY?: string;
  readonly VITE_GEOCODING_ENDPOINT?: string;
  readonly VITE_MAP_PROVIDER?: 'maplibre' | 'mapbox';
  readonly VITE_APPLE_CLIENT_ID?: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  // Apple ID Global Types
  interface AppleIDAuthConfig {
    clientId?: string;
    redirectURI?: string;
    scope?: string;
    state?: string;
    nonce?: string;
    usePopup?: boolean;
  }

  interface AppleIDCredential {
    authorization?: {
      code?: string;
      id_token?: string;
    };
    user?: Record<string, unknown>;
  }

  interface AppleIDAuth {
    init(config: AppleIDAuthConfig): Promise<void>;
    signIn(): Promise<AppleIDCredential>;
  }

  interface AppleID {
    auth: AppleIDAuth;
  }

  interface Window {
    AppleID?: AppleID;
    spark_analytics?: {
      track(eventName: string, properties?: Record<string, unknown>): void;
      clear?(): void;
    };
  }
}

export {};
