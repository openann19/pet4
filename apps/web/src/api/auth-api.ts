import { APIClient } from '../lib/api-client';
import { ENDPOINTS } from '../lib/endpoints';
import type { User } from '../lib/contracts';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  displayName: string;
}

export interface AuthSuccessResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
  success: boolean;
}

export const authApi = {
  async me(): Promise<User> {
    const response = await APIClient.get<User>(ENDPOINTS.AUTH.ME);
    return response.data;
  },

  async login(payload: LoginRequest): Promise<AuthSuccessResponse> {
    const response = await APIClient.post<AuthSuccessResponse>(ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
  },

  async register(payload: RegisterRequest): Promise<AuthSuccessResponse> {
    const response = await APIClient.post<AuthSuccessResponse>(ENDPOINTS.AUTH.REGISTER, payload);
    return response.data;
  },

  async logout(): Promise<void> {
    await APIClient.post(ENDPOINTS.AUTH.LOGOUT, {});
  },

  async refresh(): Promise<RefreshResponse> {
    const response = await APIClient.post<RefreshResponse>(ENDPOINTS.AUTH.REFRESH, {});
    return response.data;
  },

  async updatePassword(payload: UpdatePasswordRequest): Promise<void> {
    await APIClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  },

  async forgotPassword(payload: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await APIClient.post<ForgotPasswordResponse>(
      ENDPOINTS.AUTH.FORGOT_PASSWORD,
      payload
    );
    return response.data;
  },
};

export type { AuthSuccessResponse as AuthApiSuccessResponse };
