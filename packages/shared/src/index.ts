export interface AppEnvironment {
  env: string;
  timestamp?: number;
}

export function getAppEnvironment(env?: string): AppEnvironment {
  return {
    env: env ?? process.env['NODE_ENV'] ?? 'development',
    timestamp: Date.now()
  };
}

export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
