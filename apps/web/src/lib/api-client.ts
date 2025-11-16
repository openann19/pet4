import { createLogger } from '@/lib/logger';

const logger = createLogger('APIClient');

export interface PaginatedResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface APIResponse<T = unknown> {
  data: T;
  message?: string;
  errors?: string[];
  pagination?: PaginatedResponse;
}

export interface APIErrorDetails {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface APIError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

export class APIClientError extends Error implements APIError {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    init: { status: number; code?: string; details?: Record<string, unknown>; cause?: unknown }
  ) {
    super(message, init.cause ? { cause: init.cause } : undefined);
    this.name = 'APIClientError';
    this.status = init.status;
    if (init.code !== undefined) {
      this.code = init.code;
    }
    if (init.details !== undefined) {
      this.details = init.details;
    }
  }
}

export class NetworkError extends Error {
  readonly status = 0;
  readonly code = 'NETWORK_UNREACHABLE';
  readonly url: string;
  readonly method: string;
  readonly isNetworkError = true as const;

  constructor(message: string, options: { url: string; method: string; cause?: unknown }) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'NetworkError';
    this.url = options.url;
    this.method = options.method;
  }
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  exponentialBackoff?: boolean;
}

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retry?: RetryConfig;
  idempotent?: boolean;
}

type _RequestHeaders = Record<string, string>;

interface _StoredTokens {
  accessToken: string;
  refreshToken?: string;
}

const _DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 3,
  delay: 1000,
  exponentialBackoff: true,
};

export interface ApiResponse<T> {
	data: T;
	status: number;
	headers?: Record<string, string>;
}

export interface RequestOptions {
	headers?: Record<string, string>;
	// Optional: allow credentials for same-origin cookies
	credentials?: RequestCredentials;
}

async function handleJsonResponse<T>(response: Response): Promise<ApiResponse<T>> {
	const contentType = response.headers.get('content-type') ?? '';
	let parsed: unknown = null;
	if (contentType.includes('application/json')) {
		parsed = await response.json();
	}
	if (!response.ok) {
		const message = typeof parsed === 'object' && parsed !== null && 'message' in (parsed as Record<string, unknown>)
			? String((parsed as Record<string, unknown>).message)
			: `Request failed with status ${response.status}`;
		throw new Error(message);
	}
	return {
		data: parsed as T,
		status: response.status,
		headers: Object.fromEntries(response.headers.entries()),
	};
}

export class APIClient {
	static async get<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				...options.headers,
			},
			credentials: options.credentials ?? 'same-origin',
		});
		return handleJsonResponse<T>(response);
	}

	static async post<T>(url: string, body: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				...options.headers,
			},
			body: JSON.stringify(body),
			credentials: options.credentials ?? 'same-origin',
		});
		return handleJsonResponse<T>(response);
	}

	static async patch<T>(url: string, body: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const response = await fetch(url, {
			method: 'PATCH',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				...options.headers,
			},
			body: JSON.stringify(body),
			credentials: options.credentials ?? 'same-origin',
		});
		return handleJsonResponse<T>(response);
	}

	static async put<T>(url: string, body: unknown, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const response = await fetch(url, {
			method: 'PUT',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				...options.headers,
			},
			body: JSON.stringify(body),
			credentials: options.credentials ?? 'same-origin',
		});
		return handleJsonResponse<T>(response);
	}

	static async delete<T>(url: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const response = await fetch(url, {
			method: 'DELETE',
			headers: {
				'Accept': 'application/json',
				...options.headers,
			},
			credentials: options.credentials ?? 'same-origin',
		});
		return handleJsonResponse<T>(response);
	}
}
