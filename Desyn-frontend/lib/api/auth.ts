import { api } from './client';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  created_at: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  display_name?: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/register', input, false),

  login: (email: string, password: string) =>
    api.post<{ user: User; tokens: AuthTokens }>('/auth/login', { email, password }, false),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/auth/refresh', { refresh_token: refreshToken }, false),

  logout: () => api.post<{ message: string }>('/auth/logout', {}),
};
