'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Database } from '@/types';
import type { NaverShoppingInput } from '@/lib/validations/naver-shopping';

type Row = Database['public']['Tables']['naver_shopping_items']['Row'] & {
  agencies?: { name: string } | null;
  sellers?: { name: string; seller_code: number } | null;
};

export type NaverShoppingItem = Row;

export type NaverShoppingListParams = {
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

async function fetchList(params: NaverShoppingListParams) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const res = await fetch(`/api/naver-shopping?${qs.toString()}`);
  const json = (await res.json()) as ApiResponse<Row[]>;
  if (json.error) throw new Error(json.error);
  return { data: json.data ?? [], total: json.total ?? 0 };
}

export function useNaverShoppingList(params: NaverShoppingListParams) {
  return useQuery({
    queryKey: ['naver-shopping', params],
    queryFn: () => fetchList(params),
  });
}

export function useCreateNaverShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NaverShoppingInput) => {
      const res = await fetch('/api/naver-shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiResponse<Row>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['naver-shopping'] }),
  });
}

export function useUpdateNaverShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Row> }) => {
      const res = await fetch(`/api/naver-shopping/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as ApiResponse<Row>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['naver-shopping'] }),
  });
}

export function useDeleteNaverShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/naver-shopping/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ id: number }>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['naver-shopping'] }),
  });
}

export function useBulkNaverShopping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      body:
        | { ids: number[]; type: 'status'; status: string }
        | { ids: number[]; type: 'extend'; days: number },
    ) => {
      const res = await fetch('/api/naver-shopping/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as ApiResponse<unknown>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['naver-shopping'] }),
  });
}
