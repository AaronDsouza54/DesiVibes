import { api } from './client';
import { cursorQuery, CursorPage } from './pagination';

export interface PostMedia {
  id: string;
  url: string;
  media_type: string;
  position: number;
}

export interface PostAuthor {
  id: string;
  username: string;
  display_name?: string;
  profile?: { avatar_url?: string };
}

export interface Post {
  id: string;
  user_id: string;
  caption?: string;
  visibility: 'public' | 'followers' | 'family' | 'groups';
  location?: string;
  is_paid: boolean;
  price_cents?: number;
  media: PostMedia[];
  author?: PostAuthor;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  parent_id?: string;
  author?: PostAuthor;
  created_at: string;
}

export interface FeedResponse {
  items: Post[];
  next_cursor: string | null;
}

export interface CreatePostInput {
  caption?: string;
  visibility: 'public' | 'followers' | 'family' | 'groups';
  location?: string;
  is_paid?: boolean;
  price_cents?: number;
  media_urls?: string[];
  community_id?: string | null;
}

export const postsApi = {
  getFeed: (params: { limit?: number; cursor?: string | null } = {}) =>
    api.get<CursorPage<Post>>(`/feed?${cursorQuery(params)}`),

  getPost: (postID: string) => api.get<Post>(`/posts/${postID}`),

  createPost: (input: CreatePostInput) => api.post<Post>('/posts', input),

  deletePost: (postID: string) => api.delete<{ message: string }>(`/posts/${postID}`),

  likePost: (postID: string) => api.post<{ message: string }>(`/posts/${postID}/like`, {}),

  unlikePost: (postID: string) => api.delete<{ message: string }>(`/posts/${postID}/like`),

  getComments: (postID: string, params: { limit?: number; cursor?: string | null } = {}) =>
    api.get<CursorPage<Comment>>(`/posts/${postID}/comments?${cursorQuery(params)}`),

  addComment: (postID: string, body: string, parentID?: string) =>
    api.post<Comment>(`/posts/${postID}/comments`, { body, parent_id: parentID }),

  getUserPosts: (userID: string, params: { limit?: number; cursor?: string | null } = {}) =>
    api.get<CursorPage<Post>>(`/users/${userID}/posts?${cursorQuery(params)}`),
};
