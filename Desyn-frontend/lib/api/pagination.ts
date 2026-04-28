export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
};

export function cursorQuery(params: { limit?: number; cursor?: string | null }) {
  const q = new URLSearchParams();
  q.set('limit', String(params.limit ?? 20));
  if (params.cursor) q.set('cursor', params.cursor);
  return q.toString();
}

