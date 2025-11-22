/// <reference types="vite/client" />
declare const _GITHUB_RUNTIME_PERMANENT_NAME: string;
declare const _BASE_KV_SERVICE_URL: string;

interface UserInfo {
  avatarUrl: string;
  email: string;
  id: string;
  isOwner: boolean;
  login: string;
}

interface SparkKV {
  keys: () => Promise<string[]>;
  get: <T>(key: string) => Promise<T | undefined>;
  set: <T>(key: string, value: T) => Promise<void>;
  delete: (key: string) => Promise<void>;
}

interface Spark {
  llmPrompt: {
    (strings: TemplateStringsArray, ...values: unknown[]): string;
    (strings: readonly string[], ...values: unknown[]): string;
  };
  llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>;
  user: () => Promise<UserInfo>;
  kv: SparkKV;
}

declare global {
  interface Window {
    spark: Spark;
  }

  const spark: Spark;
}
