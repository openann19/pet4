/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_API_URL?: string
  readonly VITE_APP_ENV?: string
  readonly PROD: boolean
  readonly DEV: boolean
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Apple ID Global Types
interface AppleIDAuth {
  init(config: any): Promise<void>
  signIn(): Promise<any>
}

interface AppleID {
  auth: AppleIDAuth
}

interface Window {
  AppleID?: AppleID
  spark_analytics?: {
    track(eventName: string, properties?: any): void
    clear?(): void
  }
}