import { api } from './client';

export interface Community {
  id: string;
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
  community_type: string;
  tags?: string[];
  is_private: boolean;
  creator_id: string;
  member_count: number;
  is_member: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  organizer_id: string;
  community_id?: string;
  title: string;
  description?: string;
  cover_url?: string;
  category: string;
  location_name?: string;
  location_city?: string;
  is_virtual: boolean;
  starts_at: string;
  ends_at?: string;
  is_free: boolean;
  ticket_price_cents?: number;
  status: string;
  attendee_count: number;
  is_attending: boolean;
}

export const communitiesApi = {
  list: (type?: string, limit = 20, offset = 0) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (type) params.set('type', type);
    return api.get<{ communities: Community[] }>(`/communities?${params}`);
  },

  search: (q: string) =>
    api.get<{ communities: Community[] }>(`/communities/search?q=${encodeURIComponent(q)}`),

  getByID: (id: string) => api.get<Community>(`/communities/${id}`),

  create: (input: Partial<Community>) => api.post<Community>('/communities', input),

  join: (id: string) => api.post<{ message: string }>(`/communities/${id}/join`, {}),

  leave: (id: string) => api.delete<{ message: string }>(`/communities/${id}/leave`),
};

export const eventsApi = {
  list: (category?: string, limit = 20, offset = 0) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (category) params.set('category', category);
    return api.get<{ events: Event[] }>(`/events?${params}`);
  },

  getByID: (id: string) => api.get<Event>(`/events/${id}`),

  create: (input: Partial<Event>) => api.post<Event>('/events', input),

  rsvp: (eventID: string, status: 'going' | 'maybe' | 'not_going') =>
    api.post<{ message: string }>(`/events/${eventID}/rsvp`, { status }),
};
