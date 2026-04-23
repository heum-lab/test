export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  total?: number;
};

export type { Database } from './supabase';
