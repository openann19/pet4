/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STUN_SERVERS?: string
  readonly VITE_TURN_SERVERS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface UserInfo {
  avatarUrl: string
  email: string
  id: string
  isOwner: boolean
  login: string
}

interface SparkKV {
  keys: () => Promise<string[]>
  get: <T>(key: string) => Promise<T | undefined>
  set: <T>(key: string, value: T) => Promise<void>
  delete: (key: string) => Promise<void>
}

interface Spark {
  llmPrompt: {
    (strings: TemplateStringsArray, ...values: unknown[]): string
    (strings: string[], ...values: unknown[]): string
  }
  llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
  user: () => Promise<UserInfo>
  kv: SparkKV
}

declare global {
  interface Window {
    spark: Spark
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope: string
          redirectURI: string
          usePopup: boolean
        }) => Promise<void>
        signIn: () => Promise<{ authorization?: unknown }>
      }
    }
  }
  
  // eslint-disable-next-line no-var
  var spark: Spark
}

export {}