'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Database } from '@/types';
import type { KakaoMapInput } from '@/lib/validations/kakao-map';

type Row = Database['public']['Tables']['kakao_map_items']['Row'] & {
  agencies?: { name: string } | null;
  sellers?: { name: string; seller_code: number } | null;
};

export type KakaoMapItem = Row;

export type KakaoMapListParams = {
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

async function fetchList(params: KakaoMapListParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const res = await fetch(`/api/kakao-map?${qs.toString()}`);
  const json = (await res.json()) as ApiResponse<Row[]>;
  if (json.error) throw new Error(json.error);
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export function useKakaoMapList(params: KakaoMapListParams) {
  return useQuery({ queryKey: ['kakao-map', params], queryFn: () => fetchList(params) });
}

export function useCreateKakaoMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: KakaoMapInput) => {
      const res = await fetch('/api/kakao-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiResponse<Row>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kakao-map'] }),
  });
}

export function useUpdateKakaoMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Row> }) => {
      const res = await fetch(`/api/kakao-map/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as ApiResponse<Row>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kakao-map'] }),
  });
}

export function useDeleteKakaoMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/kakao-map/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ id: number }>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kakao-map'] }),
  });
}

export function useBulkKakaoMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body:
        | { ids: number[]; type: 'status'; status: string }
        | { ids: number[]; type: 'extend'; days: number },
    ) => {
      const res = await fetch('/api/kakao-map/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kakao-map'] }),
  });
}
