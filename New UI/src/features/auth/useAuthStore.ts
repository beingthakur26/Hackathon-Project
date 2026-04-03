import { create } from 'zustand';
import { authService } from '../../data/services/auth.service';
import type { User } from '../../data/models/auth.model';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('toxinai_token'),
  loading: false,
  error: null,

  init: async () => {
    const token = localStorage.getItem('toxinai_token');
    if (!token) return;
    try {
      const response = await authService.getMe();
      set({ user: response.user, token });
    } catch {
      localStorage.removeItem('toxinai_token');
      set({ user: null, token: null });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('toxinai_token', response.access_token);
      set({ token: response.access_token, user: response.user, loading: false });
      return true;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.register({ name, email, password });
      // Auto-login after successful registration
      localStorage.setItem('toxinai_token', response.access_token);
      set({ token: response.access_token, user: response.user, loading: false });
      return true;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return false;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, token: null });
  },
}));
