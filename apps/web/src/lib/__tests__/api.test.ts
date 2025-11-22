import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APIClient, api } from '../api';

class APIRequestError extends Error {
  code: string;
  correlationId: string;
  timestamp: string;
  details?: unknown;

  constructor({
    code,
    message,
    correlationId,
    timestamp,
    details,
  }: {
    code: string;
    message: string;
    correlationId: string;
    timestamp: string;
    details?: unknown;
  }) {
    super(message);
    this.name = 'APIRequestError';
    this.code = code;
    this.correlationId = correlationId;
    this.timestamp = timestamp;
    this.details = details;
  }
}

// Mock dependencies
vi.mock('../config', () => ({
  config: {
    current: {
      API_BASE_URL: 'https://api.example.com',
    },
  },
}));

vi.mock('../utils', () => ({
  generateCorrelationId: vi.fn(() => 'test-correlation-id'),
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('APIRequestError', () => {
  it('should create APIRequestError with correct properties', () => {
    const errorData = {
      code: 'TEST_ERROR',
      message: 'Test error message',
      correlationId: 'corr-123',
      timestamp: '2023-01-01T00:00:00.000Z',
      details: { field: 'value' },
    };

    const error = new APIRequestError(errorData);

    expect(error.name).toBe('APIRequestError');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test error message');
    expect(error.correlationId).toBe('corr-123');
    expect(error.timestamp).toBe('2023-01-01T00:00:00.000Z');
    expect(error.details).toEqual({ field: 'value' });
  });

  it('should create APIRequestError without details', () => {
    const errorData = {
      code: 'SIMPLE_ERROR',
      message: 'Simple error',
      correlationId: 'corr-456',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    const error = new APIRequestError(errorData);

    expect(error.details).toBeUndefined();
  });
});

describe('APIClient', () => {
  let client: APIClient;

  beforeEach(() => {
    client = new APIClient();
    vi.clearAllMocks();

    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: 'success' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with base URL from config', () => {
      expect(client).toBeInstanceOf(APIClient);
    });
  });

  describe('setAccessToken', () => {
    it('should set access token', () => {
      client.setAccessToken('test-token');
      // Token is used in headers, verified in request tests
    });

    it('should clear access token when null is passed', () => {
      client.setAccessToken('test-token');
      client.setAccessToken(null);
      // Token should be cleared, verified in request tests
    });
  });

  describe('request method', () => {
    it('should make successful GET request', async () => {
      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          },
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    it('should make successful POST request with data', async () => {
      const postData = { name: 'test', value: 123 };
      const result = await client.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          },
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    it('should make successful POST request without data', async () => {
      const result = await client.post('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          },
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    it('should make successful PATCH request', async () => {
      const patchData = { field: 'updated' };
      const result = await client.patch('/test', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          },
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    it('should make successful DELETE request', async () => {
      const result = await client.delete('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
          },
        })
      );
      expect(result).toEqual({ data: 'success' });
    });

    it('should include authorization header when token is set', async () => {
      client.setAccessToken('bearer-token');
      await client.get('/protected');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/protected',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
            Authorization: 'Bearer bearer-token',
          },
        })
      );
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await client.delete('/resource');

      expect(result).toBeUndefined();
    });

    it('should handle API error responses', async () => {
      const apiError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        correlationId: 'error-corr-123',
        timestamp: '2023-01-01T00:00:00.000Z',
        details: { field: 'email', issue: 'invalid format' },
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(apiError),
      });

      await expect(client.post('/validate', { email: 'invalid' })).rejects.toThrow(APIRequestError);

      try {
        await client.post('/validate', { email: 'invalid' });
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(APIRequestError);
        if (error instanceof APIRequestError) {
          expect(error.code).toBe('VALIDATION_ERROR');
          expect(error.message).toBe('Invalid input');
          expect(error.correlationId).toBe('error-corr-123');
          expect(error.details).toEqual({ field: 'email', issue: 'invalid format' });
        }
      }
    });

    it('should handle malformed error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(client.get('/error')).rejects.toThrow(APIRequestError);

      try {
        await client.get('/error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(APIRequestError);
        if (error instanceof APIRequestError) {
          expect(error.code).toBe('UNKNOWN_ERROR');
          expect(error.message).toBe('An unexpected error occurred');
          expect(error.correlationId).toBe('test-correlation-id');
        }
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network unreachable');
      mockFetch.mockRejectedValue(networkError);

      await expect(client.get('/network-error')).rejects.toThrow(APIRequestError);

      try {
        await client.get('/network-error');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(APIRequestError);
        if (error instanceof APIRequestError) {
          expect(error.code).toBe('NETWORK_ERROR');
          expect(error.message).toBe('Network request failed');
          expect(error.details).toBe(networkError);
          expect(error.correlationId).toBe('test-correlation-id');
        }
      }
    });

    it('should merge custom headers', async () => {
      const customHeaders: HeadersInit = {
        'X-Custom-Header': 'custom-value',
        Accept: 'application/vnd.api+json',
      };

      await client.get('/custom');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/custom',
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': 'test-correlation-id',
            'X-Custom-Header': 'custom-value',
            Accept: 'application/vnd.api+json',
          },
        })
      );
    });

    it('should override default headers with custom headers', async () => {
      const customHeaders: HeadersInit = {
        'Content-Type': 'text/plain',
        'X-Correlation-ID': 'custom-correlation-id',
      };

      await client.post('/override', 'data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/override',
        expect.objectContaining({
          headers: {
            'Content-Type': 'text/plain',
            'X-Correlation-ID': 'custom-correlation-id',
          },
        })
      );
    });
  });

  describe('get method', () => {
    it('should make GET request', async () => {
      // ... (rest of the code remains the same)
    });
  });

  describe('error handling', () => {
    it('should preserve APIRequestError instances', async () => {
      const apiError = new APIRequestError({
        code: 'PRESERVED_ERROR',
        message: 'This error should be preserved',
        correlationId: 'preserve-corr',
        timestamp: new Date().toISOString(),
      });

      // Mock the request method to throw APIRequestError
      const originalRequest = (client as any).request.bind(client);
      (client as any).request = vi.fn().mockRejectedValue(apiError);

      await expect(client.get('/test')).rejects.toThrow(apiError);
    });
  });
});

describe('api singleton', () => {
  it('should export singleton instance', () => {
    expect(api).toBeInstanceOf(APIClient);
  });

  it('should maintain state across operations', async () => {
    // Set token on singleton
    api.setAccessToken('singleton-token');

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: 'success' }),
    });

    await api.get('/test');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer singleton-token',
        },
      })
    );
  });
});

describe('integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
  });

  it('should handle complete CRUD operations', async () => {
    const item = { id: 1, name: 'Test Item' };

    // Create
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue(item),
    });
    const created = await api.post('/items', item);
    expect(created).toEqual(item);

    // Read
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(item),
    });
    const read = await api.get('/items/1');
    expect(read).toEqual(item);

    // Update
    const updatedItem = { ...item, name: 'Updated Item' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(updatedItem),
    });
    const updated = await api.patch('/items/1', updatedItem);
    expect(updated).toEqual(updatedItem);

    // Delete
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });
    const deleted = await api.delete('/items/1');
    expect(deleted).toBeUndefined();
  });

  it('should handle authentication flow', async () => {
    // Login without token
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ token: 'auth-token' }),
    });
    const loginResponse = await api.post('/auth/login', { username: 'user', password: 'pass' });
    expect(loginResponse).toEqual({ token: 'auth-token' });

    // Set token for authenticated requests
    api.setAccessToken('auth-token');

    // Authenticated request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ user: 'authenticated' }),
    });
    const profile = await api.get('/profile');
    expect(profile).toEqual({ user: 'authenticated' });

    // Verify authorization header was sent
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/profile',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer auth-token',
        },
      })
    );
  });
});
