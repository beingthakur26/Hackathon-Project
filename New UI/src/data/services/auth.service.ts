import { apiClient } from '../api/client';
import type { LoginCredentials, RegisterData, AuthResponse, MeResponse } from '../models/auth.model';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Backend expects JSON with email and password
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return res.data;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async getMe(): Promise<MeResponse> {
    const res = await apiClient.get<MeResponse>('/auth/me');
    return res.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    localStorage.removeItem('toxinai_token');
  },
};
