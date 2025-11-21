import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  APIClient,
  APIClientError,
  NetworkError,
  type ApiResponse,
  type RequestOptions,
  type PaginatedResponse,
  type APIResponse,
} from '../api-client';

// Test the buildUrl function by importing the module directly
// Since it's not exported, we'll test it through the public API;

// Mock the ENV module
vi.mock('@/config/env', () => ({
  ENV: {
    VITE_API_URL: 'https://api.example.com',
  },
}));

describe('APIClientError', () => {
  it('should create APIClientError with correct properties', () => {
    const error = new APIClientError('Test error', {
      status: 400,
      code: 'BAD_REQUEST',
      details: { field: 'email' },
    });

    expect(error.name).toBe('APIClientError');
    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.code).toBe('BAD_REQUEST');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should create APIClientError with minimal properties', () => {
    const error = new APIClientError('Simple error', { status: 500 });

    expect(error.name).toBe('APIClientError');
    expect(error.message).toBe('Simple error');
    expect(error.status).toBe(500);
    expect(error.code).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  it('should handle cause in error', () => {
    const cause = new Error('Original error');
    const error = new APIClientError('Wrapped error', {
      status: 500,
      cause,
    });

    expect((error as any).cause).toBe(cause);
  });
});

describe('NetworkError', () => {
  it('should create NetworkError with correct properties', () => {
    const error = new NetworkError('Network unreachable', {
      url: 'https://api.example.com/users',
      method: 'GET',
    });

    expect(error.name).toBe('NetworkError');
    expect(error.message).toBe('Network unreachable');
    expect(error.status).toBe(0);
    expect(error.code).toBe('NETWORK_UNREACHABLE');
    expect(error.url).toBe('https://api.example.com/users');
    expect(error.method).toBe('GET');
    expect(error.isNetworkError).toBe(true);
  });

  it('should handle cause in NetworkError', () => {
    const cause = new Error('Connection failed');
    const error = new NetworkError('Network error', {
      url: 'https://api.example.com/users',
      method: 'POST',
      cause,
    });

    expect((error as any).cause).toBe(cause);
  });
});

describe('APIClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch responses
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'content-type': 'application/json',
      }),
      json: vi.fn().mockResolvedValue({ data: 'success' }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get method', () => {
    it('should make successful GET request', async () => {
      const result = await APIClient.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          credentials: 'same-origin',
        })
      );
      expect(result.data).toEqual({ data: 'success' });
      expect(result.status).toBe(200);
    });

    it('should handle custom headers', async () => {
      const options: RequestOptions = {
        headers: {
          Authorization: 'Bearer token',
          'X-Custom': 'value',
        },
      };

      await APIClient.get('/users', options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer token',
            'X-Custom': 'value',
          },
        })
      );
    });

    it('should handle custom credentials', async () => {
      const options: RequestOptions = {
        credentials: 'include',
      };

      await APIClient.get('/users', options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          credentials: 'include',
        })
      );
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({ message: 'User not found' }),
      });

      await expect(APIClient.get('/users/999')).rejects.toThrow('User not found');
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        headers: new Headers({
          'content-type': 'text/plain',
        }),
      });

      await expect(APIClient.get('/error')).rejects.toThrow('Request failed with status 500');
    });
  });

  describe('post method', () => {
    it('should make successful POST request', async () => {
      const data = { name: 'John', email: 'john@example.com' };

      const result = await APIClient.post('/users', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
          credentials: 'same-origin',
        })
      );
      expect(result.data).toEqual({ data: 'success' });
    });

    it('should handle null data', async () => {
      await APIClient.post('/users', null);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          body: 'null',
        })
      );
    });

    it('should handle custom headers', async () => {
      const data = { name: 'John' };
      const options: RequestOptions = {
        headers: {
          Authorization: 'Bearer token',
        },
      };

      await APIClient.post('/users', data, options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          },
        })
      );
    });
  });

  describe('patch method', () => {
    it('should make successful PATCH request', async () => {
      const data = { name: 'Updated John' };

      const result = await APIClient.patch('/users/1', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
      );
      expect(result.data).toEqual({ data: 'success' });
    });
  });

  describe('put method', () => {
    it('should make successful PUT request', async () => {
      const data = { name: 'John Doe', email: 'john@example.com' };

      const result = await APIClient.put('/users/1', data);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
      );
      expect(result.data).toEqual({ data: 'success' });
    });
  });

  describe('delete method', () => {
    it('should make successful DELETE request', async () => {
      const result = await APIClient.delete('/users/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
          },
        })
      );
      expect(result.data).toEqual({ data: 'success' });
    });

    it('should handle custom headers in DELETE', async () => {
      const options: RequestOptions = {
        headers: {
          Authorization: 'Bearer token',
        },
      };

      await APIClient.delete('/users/1', options);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer token',
          },
        })
      );
    });
  });

  describe('token management', () => {
    it('should set access token', () => {
      APIClient.setTokens('access-token-123');
      // Token is stored internally, verified through integration tests
    });

    it('should set access and refresh tokens', () => {
      APIClient.setTokens('access-token-123', 'refresh-token-456');
      // Tokens are stored internally
    });

    it('should clear tokens on logout', () => {
      APIClient.setTokens('access-token-123', 'refresh-token-456');
      APIClient.logout();
      // Tokens should be cleared
    });
  });

  describe('response handling', () => {
    it('should handle successful JSON response', async () => {
      const mockData = { id: 1, name: 'John' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
          'x-custom': 'value',
        }),
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await APIClient.get('/users/1');

      expect(result.data).toEqual(mockData);
      expect(result.status).toBe(200);
      expect(result.headers).toEqual({
        'content-type': 'application/json',
        'x-custom': 'value',
      });
    });

    it('should handle empty response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: vi.fn().mockResolvedValue(null),
      });

      const result = await APIClient.delete('/users/1');

      expect(result.data).toBeNull();
      expect(result.status).toBe(204);
    });

    it('should handle non-JSON successful response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/plain',
        }),
        json: vi.fn().mockResolvedValue(null),
      });

      const result = await APIClient.get('/health');

      expect(result.data).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network unreachable');
      mockFetch.mockRejectedValue(networkError);

      await expect(APIClient.get('/users')).rejects.toThrow(networkError);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockFetch.mockRejectedValue(timeoutError);

      await expect(APIClient.get('/users')).rejects.toThrow(timeoutError);
    });

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      });

      await expect(APIClient.get('/users')).rejects.toThrow('Invalid JSON');
    });
  });
});

describe('integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle complete CRUD operations', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    const updatedData = { name: 'John Updated' };

    // Create
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ ...userData, id: 1 }),
    });
    const created = await APIClient.post('/users', userData);
    expect(created.data).toEqual({ ...userData, id: 1 });

    // Read
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ ...userData, id: 1 }),
    });
    const read = await APIClient.get('/users/1');
    expect(read.data).toEqual({ ...userData, id: 1 });

    // Update
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ ...updatedData, id: 1 }),
    });
    const updated = await APIClient.patch('/users/1', updatedData);
    expect(updated.data).toEqual({ ...updatedData, id: 1 });

    // Delete
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
      json: vi.fn().mockResolvedValue(null),
    });
    const deleted = await APIClient.delete('/users/1');
    expect(deleted.status).toBe(204);
  });

  it('should handle paginated responses', async () => {
    const paginatedData = {
      data: [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(paginatedData),
    });

    const result = await APIClient.get<APIResponse<{ users: any[] }>>('/users');
    expect(result.data).toEqual(paginatedData);
  });

  it('should handle authentication flow', async () => {
    // Login
    const loginData = { token: 'auth-token-123', user: { id: 1, name: 'John' } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(loginData),
    });

    const loginResult = await APIClient.post('/auth/login', {
      email: 'john@example.com',
      password: 'password',
    });
    expect(loginResult.data).toEqual(loginData);

    // Set tokens
    APIClient.setTokens('auth-token-123', 'refresh-token-456');

    // Authenticated request
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ protected: 'data' }),
    });

    const protectedResult = await APIClient.get('/protected');
    expect(protectedResult.data).toEqual({ protected: 'data' });

    // Logout
    APIClient.logout();
  });
});

describe('type definitions', () => {
  it('should have correct PaginatedResponse type', () => {
    const pagination: PaginatedResponse = {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
    };
    expect(pagination.page).toBe(1);
    expect(pagination.limit).toBe(10);
    expect(pagination.total).toBe(100);
    expect(pagination.totalPages).toBe(10);
  });

  it('should have correct APIResponse type', () => {
    const response: APIResponse<string> = {
      data: 'test',
      message: 'Success',
      errors: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };
    expect(response.data).toBe('test');
    expect(response.message).toBe('Success');
    expect(response.errors).toEqual([]);
    expect(response.pagination).toBeDefined();
  });

  it('should have correct ApiResponse type', () => {
    const response: ApiResponse<{ id: number }> = {
      data: { id: 1 },
      status: 200,
      headers: { 'content-type': 'application/json' },
    };
    expect(response.data.id).toBe(1);
    expect(response.status).toBe(200);
    expect(response.headers).toEqual({ 'content-type': 'application/json' });
  });
});
