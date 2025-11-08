import { z } from 'zod';
import { validatedAPI } from './validated-api-client';
import {
  petSchema,
  matchSchema,
  messageSchema,
  userSchema,
  authTokensSchema,
  notificationSchema,
  adoptionProfileSchema,
  communityPostSchema,
  commentSchema,
  discoverResponseSchema,
  swipeResponseSchema,
  photoRecordSchema,
  kycSessionSchema,
  paginatedResponseSchema,
} from './api-schemas';

export const petAPI = {
  async getById(id: string) {
    return validatedAPI.get(`/api/v1/pets/${id}`, petSchema);
  },

  async create(data: unknown) {
    return validatedAPI.post('/api/v1/pets', petSchema, data);
  },

  async update(id: string, data: unknown) {
    return validatedAPI.patch(`/api/v1/pets/${id}`, petSchema, data);
  },

  async delete(id: string) {
    return validatedAPI.delete(`/api/v1/pets/${id}`, z.object({ success: z.boolean() }));
  },

  async list(params?: { ownerId?: string; status?: string }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return validatedAPI.get(`/api/v1/pets?${query}`, paginatedResponseSchema(petSchema));
  },
};

export const matchingAPI = {
  async discover(petId: string, filters?: Record<string, unknown>) {
    return validatedAPI.post('/api/v1/matching/discover', discoverResponseSchema, {
      petId,
      filters,
    });
  },

  async swipe(data: { petId: string; targetPetId: string; action: 'like' | 'pass' | 'superlike' }) {
    return validatedAPI.post('/api/v1/matching/swipe', swipeResponseSchema, data);
  },

  async getMatches(petId: string) {
    return validatedAPI.get(`/api/v1/matching/matches?petId=${petId}`, z.array(matchSchema));
  },

  async reportPet(data: { reporterPetId: string; reportedPetId: string; reason: string }) {
    return validatedAPI.post(
      '/api/v1/matching/report',
      z.object({ success: z.boolean(), reportId: z.string() }),
      data
    );
  },
};

export const chatAPI = {
  async getMessages(chatRoomId: string, cursor?: string) {
    const query = cursor ? `?cursor=${cursor}` : '';
    return validatedAPI.get(
      `/api/v1/chat/${chatRoomId}/messages${query}`,
      paginatedResponseSchema(messageSchema)
    );
  },

  async sendMessage(chatRoomId: string, content: string) {
    return validatedAPI.post(`/api/v1/chat/${chatRoomId}/messages`, messageSchema, {
      content,
      type: 'text',
    });
  },

  async markAsRead(chatRoomId: string, messageId: string) {
    return validatedAPI.patch(
      `/api/v1/chat/${chatRoomId}/messages/${messageId}/read`,
      z.object({ success: z.boolean() }),
      {}
    );
  },
};

export const authAPI = {
  async login(email: string, password: string) {
    return validatedAPI.post(
      '/api/v1/auth/login',
      z.object({ user: userSchema, tokens: authTokensSchema }),
      { email, password }
    );
  },

  async signup(data: { email: string; password: string; displayName: string }) {
    return validatedAPI.post(
      '/api/v1/auth/signup',
      z.object({ user: userSchema, tokens: authTokensSchema }),
      data
    );
  },

  async refreshToken(refreshToken: string) {
    return validatedAPI.post('/api/v1/auth/refresh', authTokensSchema, { refreshToken });
  },

  async logout() {
    return validatedAPI.post('/api/v1/auth/logout', z.object({ success: z.boolean() }), {});
  },

  async getCurrentUser() {
    return validatedAPI.get('/api/v1/auth/me', userSchema);
  },
};

export const notificationAPI = {
  async list(params?: { read?: boolean; type?: string }) {
    const query = new URLSearchParams(params as Record<string, string>);
    return validatedAPI.get(
      `/api/v1/notifications?${query}`,
      paginatedResponseSchema(notificationSchema)
    );
  },

  async markAsRead(notificationId: string) {
    return validatedAPI.patch(
      `/api/v1/notifications/${notificationId}/read`,
      z.object({ success: z.boolean() }),
      {}
    );
  },

  async markAllAsRead() {
    return validatedAPI.post(
      '/api/v1/notifications/read-all',
      z.object({ success: z.boolean(), count: z.number() }),
      {}
    );
  },
};

export const adoptionAPI = {
  async listProfiles(filters?: Record<string, unknown>) {
    const query = new URLSearchParams(filters as Record<string, string>);
    return validatedAPI.get(
      `/api/v1/adoption?${query}`,
      paginatedResponseSchema(adoptionProfileSchema)
    );
  },

  async getProfile(id: string) {
    return validatedAPI.get(`/api/v1/adoption/${id}`, adoptionProfileSchema);
  },

  async submitApplication(data: unknown) {
    return validatedAPI.post(
      '/api/v1/adoption/applications',
      z.object({
        success: z.boolean(),
        applicationId: z.string(),
      }),
      data
    );
  },
};

export const communityAPI = {
  async getFeed(options?: { mode?: string; lat?: number; lng?: number }) {
    const query = new URLSearchParams(options as Record<string, string>);
    return validatedAPI.get(
      `/api/v1/community/feed?${query}`,
      paginatedResponseSchema(communityPostSchema)
    );
  },

  async getPost(id: string) {
    return validatedAPI.get(`/api/v1/community/posts/${id}`, communityPostSchema);
  },

  async createPost(data: unknown) {
    return validatedAPI.post('/api/v1/community/posts', communityPostSchema, data);
  },

  async deletePost(id: string) {
    return validatedAPI.delete(`/api/v1/community/posts/${id}`, z.object({ success: z.boolean() }));
  },

  async getComments(postId: string) {
    return validatedAPI.get(`/api/v1/community/posts/${postId}/comments`, z.array(commentSchema));
  },

  async addComment(postId: string, content: string) {
    return validatedAPI.post(`/api/v1/community/posts/${postId}/comments`, commentSchema, {
      content,
    });
  },

  async reactToPost(postId: string, emoji: string) {
    return validatedAPI.post(
      `/api/v1/community/posts/${postId}/reactions`,
      z.object({ success: z.boolean() }),
      { emoji }
    );
  },
};

export const mediaAPI = {
  async uploadPhoto(petId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('petId', petId);

    return validatedAPI.post('/api/v1/media/upload', photoRecordSchema, formData as unknown);
  },

  async getPhotoStatus(photoId: string) {
    return validatedAPI.get(`/api/v1/media/photos/${photoId}`, photoRecordSchema);
  },

  async deletePhoto(photoId: string) {
    return validatedAPI.delete(
      `/api/v1/media/photos/${photoId}`,
      z.object({ success: z.boolean() })
    );
  },
};

export const kycAPI = {
  async createSession() {
    return validatedAPI.post('/api/v1/kyc/sessions', kycSessionSchema, {});
  },

  async getSession(sessionId: string) {
    return validatedAPI.get(`/api/v1/kyc/sessions/${sessionId}`, kycSessionSchema);
  },

  async uploadDocument(sessionId: string, type: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return validatedAPI.post(
      `/api/v1/kyc/sessions/${sessionId}/documents`,
      z.object({
        success: z.boolean(),
        documentId: z.string(),
      }),
      formData as unknown
    );
  },

  async submitSession(sessionId: string) {
    return validatedAPI.post(`/api/v1/kyc/sessions/${sessionId}/submit`, kycSessionSchema, {});
  },
};

export const adminAPI = {
  async getModerationQueue() {
    return validatedAPI.get(
      '/api/v1/admin/moderation/queue',
      z.object({
        pending: z.array(photoRecordSchema),
        inProgress: z.array(photoRecordSchema),
        totalCount: z.number(),
      })
    );
  },

  async moderatePhoto(photoId: string, action: string, reason?: string) {
    return validatedAPI.post(
      `/api/v1/admin/moderation/photos/${photoId}`,
      z.object({ success: z.boolean() }),
      { action, reason }
    );
  },

  async getKYCQueue() {
    return validatedAPI.get(
      '/api/v1/admin/kyc/queue',
      z.object({
        pending: z.array(kycSessionSchema),
        totalCount: z.number(),
      })
    );
  },

  async reviewKYC(sessionId: string, action: 'approve' | 'reject', reason?: string) {
    return validatedAPI.post(`/api/v1/admin/kyc/sessions/${sessionId}/review`, kycSessionSchema, {
      action,
      reason,
    });
  },

  async getAnalytics(timeRange: string) {
    return validatedAPI.get(
      `/api/v1/admin/analytics?range=${timeRange}`,
      z.object({
        users: z.number(),
        pets: z.number(),
        matches: z.number(),
        messages: z.number(),
        adoptions: z.number(),
      })
    );
  },
};
