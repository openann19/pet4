/**
 * API Client for Native App
 * Simple fetch-based API client for React Native
 */

import { createLogger } from './logger';

const logger = createLogger('api-client');

// Get API base URL from environment or use default
const getApiBaseUrl = (): string => {
  // Use environment variable if available (Expo/React Native)
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Default to localhost for development
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

interface RequestOptions extends RequestInit {
  timeout?: number;
}

class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { timeout = 30000, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('API request failed', err, { endpoint, url });
      throw err;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new APIClient();

// API endpoints
export const communityApi = {
  async getFeed(options?: { cursor?: string; limit?: number; userId?: string }) {
    const params = new URLSearchParams();
    if (options?.cursor) params.append('cursor', options.cursor);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.userId) params.append('userId', options.userId);

    const query = params.toString();
    return apiClient.get<{
      posts: Array<{
        id: string;
        authorId: string;
        authorName: string;
        authorAvatar?: string;
        content: string;
        images?: string[];
        likes: number;
        comments: number;
        shares: number;
        timestamp: string;
        type: string;
      }>;
      nextCursor?: string;
      total: number;
    }>(`/community/posts${query ? `?${query}` : ''}`);
  },

  async getPostById(id: string) {
    return apiClient.get<{
      id: string;
      authorId: string;
      authorName: string;
      authorAvatar?: string;
      content: string;
      images?: string[];
      likes: number;
      comments: number;
      shares: number;
      timestamp: string;
      type: string;
    }>(`/community/posts/${id}`);
  },
};

export const notificationsApi = {
  async list(options?: { read?: boolean; type?: string }) {
    const params = new URLSearchParams();
    if (options?.read !== undefined) params.append('read', String(options.read));
    if (options?.type) params.append('type', options.type);

    const query = params.toString();
    return apiClient.get<
      Array<{
        id: string;
        type: string;
        title: string;
        message: string;
        timestamp: number;
        read: boolean;
        postId?: string;
        userId?: string;
      }>
    >(`/notifications${query ? `?${query}` : ''}`);
  },

  async markAsRead(notificationId: string) {
    return apiClient.patch<{ success: boolean }>(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead() {
    return apiClient.post<{ success: boolean; count: number }>('/notifications/read-all');
  },
};

export const lostFoundApi = {
  async getAlertsNearby(lat: number, lon: number, radiusKm: number = 10) {
    return apiClient.get<
      Array<{
        id: string;
        petName: string;
        breed: string;
        photo: string;
        description: string;
        lastSeenLocation: string;
        lastSeenDate: string;
        latitude: number;
        longitude: number;
        distance?: number;
        status: string;
      }>
    >(`/lost-found/alerts?lat=${lat}&lon=${lon}&radius=${radiusKm}`);
  },
};

export const adoptionApi = {
  async getListingsNearby(lat: number, lon: number, radiusKm: number = 10) {
    return apiClient.get<
      Array<{
        id: string;
        petName: string;
        breed: string;
        photo: string;
        description: string;
        location: string;
        latitude: number;
        longitude: number;
        distance?: number;
        status: string;
      }>
    >(`/adoption/listings?lat=${lat}&lon=${lon}&radius=${radiusKm}`);
  },
};
