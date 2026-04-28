import { api } from './client';

export interface Event {
  id: string;
  organizer_id: string;
  community_id?: string;
  title: string;
  description?: string;
  cover_url?: string;
  category: string;
  location_name?: string;
  location_address?: string;
  location_city?: string;
  is_virtual: boolean;
  virtual_url?: string;
  starts_at: string;
  ends_at?: string;
  is_free: boolean;
  ticket_price_cents?: number;
  attendee_count: number;
  is_attending: boolean;
  created_at: string;
}

export const eventsApi = {
  list: (limit = 20, offset = 0) =>
    api.get<{ events: Event[]; limit: number; offset: number }>(`/events?limit=${limit}&offset=${offset}`),

  getByID: (id: string) =>
    api.get<Event>(`/events/${id}`),

  search: (query: string, limit = 20) =>
    api.get<{ events: Event[] }>(`/events/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  create: (title: string, startsAt: string, options?: any) =>
    api.post<Event>('/events', { title, starts_at: startsAt, ...options }),

  attend: (id: string) =>
    api.post<{ message: string }>(`/events/${id}/attend`, {}),

  unattend: (id: string) =>
    api.delete<{ message: string }>(`/events/${id}/attend`),

  getByCategory: (category: string, limit = 20, offset = 0) =>
    api.get<{ events: Event[] }>(`/events/category/${category}?limit=${limit}&offset=${offset}`),
};
