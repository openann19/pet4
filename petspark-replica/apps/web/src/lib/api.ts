import { API_CONFIG } from '@config/api';

type ApiResponse<T = unknown> = {
  data: T;
  message?: string;
  success: boolean;
};

class _ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_CONFIG.baseUrl;
    this.defaultHeaders = {
      ...API_CONFIG.defaultHeaders,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...options.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(API_CONFIG.timeout),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new _ApiError(
          data.message || `HTTP error! status: ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof _ApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new _ApiError('Request timeout', 408);
        }
        throw new _ApiError(error.message, 500);
      }
      
      throw new _ApiError('Unknown error occurred', 500);
    }
  }

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = params ? `${endpoint}?${new URLSearchParams(params as Record<string, string>)}` : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        ...headers,
        // Don't set Content-Type for FormData - browser will set it with boundary
      },
    });
  }
}

export const apiClient = new ApiClient();
export class ApiError extends Error {
  constructor(message: string, public status: number, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: API_CONFIG.endpoints.auth.login,
    register: API_CONFIG.endpoints.auth.register,
    logout: API_CONFIG.endpoints.auth.logout,
    refreshToken: API_CONFIG.endpoints.auth.refreshToken,
    me: API_CONFIG.endpoints.auth.me,
  },
  // Users
  users: {
    profile: API_CONFIG.endpoints.users.profile,
    updateProfile: API_CONFIG.endpoints.users.updateProfile,
    uploadAvatar: API_CONFIG.endpoints.users.uploadAvatar,
  },
  // Pets
  pets: {
    list: API_CONFIG.endpoints.pets.list,
    create: API_CONFIG.endpoints.pets.create,
    update: API_CONFIG.endpoints.pets.update,
    delete: API_CONFIG.endpoints.pets.delete,
    uploadImage: API_CONFIG.endpoints.pets.uploadImage,
  },
  // Posts
  posts: {
    feed: API_CONFIG.endpoints.posts.feed,
    create: API_CONFIG.endpoints.posts.create,
    update: API_CONFIG.endpoints.posts.update,
    delete: API_CONFIG.endpoints.posts.delete,
    like: API_CONFIG.endpoints.posts.like,
    unlike: API_CONFIG.endpoints.posts.unlike,
  },
  // Chat
  chat: {
    rooms: API_CONFIG.endpoints.chat.rooms,
    messages: API_CONFIG.endpoints.chat.messages,
    sendMessage: API_CONFIG.endpoints.chat.sendMessage,
  },
  // Discovery
  discovery: {
    users: API_CONFIG.endpoints.discovery.users,
    pets: API_CONFIG.endpoints.discovery.pets,
  },
  // Notifications
  notifications: {
    list: API_CONFIG.endpoints.notifications.list,
    markAsRead: API_CONFIG.endpoints.notifications.markAsRead,
  },
} as const;
