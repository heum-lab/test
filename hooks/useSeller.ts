'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, Database } from '@/types';

type Seller = Database['public']['Tables']['sellers']['Row'] & {
  agencies?: { name: string } | null;
};

async function getSellers(params: {
  search?: string;
  approved?: string;
  agency_id?: string;
}): Promise<Seller[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.approved) qs.set('approved', params.approved);
  if (params.agency_id) qs.set('agency_id', params.agency_id);

  const res = await fetch(`/api/sellers?${qs.toString()}`);
  const json = (await res.json()) as ApiResponse<Seller[]>;
  if (json.error) throw new Error(json.error);
  return json.data ?? [];
}

export function useSellers(
  params: { search?: string; approved?: string; agency_id?: string } = {},
) {
  return useQuery({
    queryKey: ['sellers', params],
    queryFn: () => getSellers(params),
  });
}

export function useCreateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const res = await fetch('/api/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiResponse<Seller>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sellers'] }),
  });
}

export function useUpdateSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<Seller> }) => {
      const res = await fetch(`/api/sellers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as ApiResponse<Seller>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sellers'] }),
  });
}

export function useDeleteSeller() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sellers/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as ApiResponse<{ id: number }>;
      if (json.error) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sellers'] }),
  });
}
