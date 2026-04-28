import { supabase } from '@/lib/supabase/client';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_BASE = `${BASE_URL}/api/v1`;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (requireAuth) {
    const token = await getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      errorMsg = body.error ?? body.message ?? errorMsg;
      throw new ApiError(errorMsg, response.status, body.code);
    } catch { /* ignore */ }
    throw new ApiError(errorMsg, response.status);
  }

  return response.json() as Promise<T>;
}

// Convenience methods
export const api = {
  get: <T>(path: string, requireAuth = true) =>
    request<T>(path, { method: 'GET' }, requireAuth),

  post: <T>(path: string, body: unknown, requireAuth = true) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, requireAuth),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};
