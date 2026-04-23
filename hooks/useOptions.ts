'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@/types';
import type { AgencyOption } from '@/app/api/options/agencies/route';
import type { SellerOption } from '@/app/api/options/sellers/route';

export function useAgencyOptions() {
  return useQuery({
    queryKey: ['options', 'agencies'],
    queryFn: async (): Promise<AgencyOption[]> => {
      const res = await fetch('/api/options/agencies');
      const json = (await res.json()) as ApiResponse<AgencyOption[]>;
      if (json.error) throw new Error(json.error);
      return json.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSellerOptions(agencyId?: number | string) {
  return useQuery({
    queryKey: ['options', 'sellers', agencyId ?? 'all'],
    queryFn: async (): Promise<SellerOption[]> => {
      const qs = agencyId ? `?agency_id=${agencyId}` : '';
      const res = await fetch(`/api/options/sellers${qs}`);
      const json = (await res.json()) as ApiResponse<SellerOption[]>;
      if (json.error) throw new Error(json.error);
      return json.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}
