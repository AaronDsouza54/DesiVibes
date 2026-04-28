import { api } from './client';

export interface Creator {
  user_id: string;
  tagline?: string;
  subscription_price_cents?: number;
  is_verified_creator: boolean;
  total_earnings_cents: number;
  is_subscribed: boolean;
  user?: {
    id: string;
    username: string;
    display_name?: string;
    profile?: { avatar_url?: string; bio?: string; follower_count: number; post_count: number };
  };
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  status: string;
  price_cents: number;
  current_period_end: string;
}

export interface Tip {
  id: string;
  tipper_id: string;
  creator_id: string;
  amount_cents: number;
  message?: string;
  created_at: string;
}

export const creatorsApi = {
  getProfile: (creatorID: string) => api.get<Creator>(`/creators/${creatorID}`),

  setupProfile: (tagline?: string, subscriptionPriceCents?: number) =>
    api.post<Creator>('/creators/profile', { tagline, subscription_price_cents: subscriptionPriceCents }),

  subscribe: (creatorID: string) => api.post<Subscription>(`/creators/${creatorID}/subscribe`, {}),

  unsubscribe: (creatorID: string) => api.delete<{ message: string }>(`/creators/${creatorID}/subscribe`),

  tip: (creatorID: string, amountCents: number, message?: string, postID?: string) =>
    api.post<Tip>(`/creators/${creatorID}/tip`, { amount_cents: amountCents, message, post_id: postID }),
};
