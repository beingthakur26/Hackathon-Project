// Auth Models

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  user: User;
}

export interface MeResponse {
  success: boolean;
  user: User;
}
