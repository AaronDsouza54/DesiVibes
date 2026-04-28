import { api } from './client';

export interface UserProfile {
  user_id: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  languages?: string[];
  religion?: string;
  region_origin?: string;
  location_city?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
}

export interface UserWithProfile {
  id: string;
  email: string;
  username: string;
  display_name?: string;
  is_verified: boolean;
  created_at: string;
  profile?: UserProfile;
}

export const usersApi = {
  getMe: () => api.get<UserWithProfile>('/me'),

  updateMe: (profile: Partial<UserProfile>) => api.patch<{ message: string }>('/me', profile),

  getUser: (userID: string) =>
    api.get<{ user: UserWithProfile; is_following: boolean }>(`/users/${userID}`),

  search: (q: string, limit = 20) =>
    api.get<{ users: UserWithProfile[] }>(`/users/search?q=${encodeURIComponent(q)}&limit=${limit}`),

  follow: (userID: string) =>
    api.post<{ message: string }>(`/users/${userID}/follow`, {}),

  unfollow: (userID: string) =>
    api.delete<{ message: string }>(`/users/${userID}/follow`),

  block: (userID: string) =>
    api.post<{ message: string }>(`/users/${userID}/block`, {}),
};
