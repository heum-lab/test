'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Database } from '@/types';

type Agency = Database['public']['Tables']['agencies']['Row'];

async function getAgencies(params: { search?: string; approved?: string }): Promise<Agency[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.approved) qs.set('approved', params.approved);

  const res = await fetch(`/api/agencies?${qs.toString()}`);
  const json = (await res.json()) as ApiResponse<Agency[]>;
  if (json.error) throw new Error(json.error);
  return json.data ?? [];
}

export function useAgencies(params: { search?: string; approved?: string } = {}) {
  return useQuery({
    queryKey: ['agencies', params],
    queryFn: () => getAgencies(params),
  });
}

export function useCreateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await fetch('/api/agencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiResponse<Agency>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });
}

export function useUpdateAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Agency> }) => {
      const res = await fetch(`/api/agencies/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as ApiResponse<Agency>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });
}

export function useDeleteAgency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/agencies/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ id: number }>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agencies'] }),
  });
}
