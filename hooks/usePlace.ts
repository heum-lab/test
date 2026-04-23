'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Database } from '@/types';
import type { PlaceInput } from '@/lib/validations/place';

type Row = Database['public']['Tables']['place_items']['Row'] & {
  agencies?: { name: string } | null;
  sellers?: { name: string; seller_code: number } | null;
};

export type PlaceItem = Row;

export type PlaceListParams = {
  agency_id?: string;
  seller_id?: string;
  status?: string;
  date_type?: string;
  start?: string;
  end?: string;
  search?: string;
  page?: number;
  page_size?: number;
  sort?: string;
  sort_dir?: 'asc' | 'desc';
};

async function fetchList(params: PlaceListParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const res = await fetch(`/api/place?${qs.toString()}`);
  const json = (await res.json()) as ApiResponse<Row[]>;
  if (json.error) throw new Error(json.error);
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export function usePlaceList(params: PlaceListParams) {
  return useQuery({
    queryKey: ['place', params],
    queryFn: () => fetchList(params),
  });
}

export function useCreatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PlaceInput) => {
      const res = await fetch('/api/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiResponse<Row>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place'] }),
  });
}

export function useUpdatePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Row> }) => {
      const res = await fetch(`/api/place/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as ApiResponse<Row>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place'] }),
  });
}

export function useDeletePlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/place/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ id: number }>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place'] }),
  });
}

export function useBulkPlace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body:
        | { ids: number[]; type: 'status'; status: string }
        | { ids: number[]; type: 'extend'; days: number },
    ) => {
      const res = await fetch('/api/place/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['place'] }),
  });
}
