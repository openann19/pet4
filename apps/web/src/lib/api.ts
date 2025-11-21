import { config } from './config';
import { generateCorrelationId } from './utils';
import type { APIError } from './contracts';

class APIRequestError extends Error {
  code: string;
  correlationId: string;
  timestamp: string;
  details?: unknown;

  constructor({ code, message, correlationId, timestamp, details }: APIError) {
    super(message);
    this.name = 'APIRequestError';
    this.code = code;
    this.correlationId = correlationId;
    this.timestamp = timestamp;
    this.details = details;
  }
}

export class APIClient {
  private baseURL: string;
  private accessToken: string | null = null;

  constructor() {
    this.baseURL = config.current.API_BASE_URL;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const correlationId = generateCorrelationId();
    const url = `${this.baseURL}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: APIError = await response.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          correlationId,
          timestamp: new Date().toISOString(),
        }));
        throw new APIRequestError(error);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      const data = (await response.json()) as unknown as T;
      return data;
    } catch (error) {
      if (error instanceof APIRequestError) {
        throw error;
      }

      const fallback: APIError = {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: error,
        correlationId,
        timestamp: new Date().toISOString(),
      };
      throw new APIRequestError(fallback);
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new APIClient();
