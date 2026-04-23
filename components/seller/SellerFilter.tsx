'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgencyOptions } from '@/hooks/useOptions';
import type { UserRole } from '@/lib/constants';

type Props = {
  role: UserRole;
  agencyId: number | null;
};

export function SellerFilter({ role, agencyId }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [approved, setApproved] = useState(params.get('approved') ?? 'all');
  const [agency, setAgency] = useState(
    role === 'agency' && agencyId ? String(agencyId) : (params.get('agency_id') ?? 'all'),
  );

  const { data: agencies = [] } = useAgencyOptions();
  const canSelectAgency = role === 'super_admin';

  const apply = () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (approved !== 'all') qs.set('approved', approved);
    if (agency !== 'all') qs.set('agency_id', agency);
    router.push(`/admin/seller?${qs.toString()}`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Select value={agency} onValueChange={setAgency} disabled={!canSelectAgency}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="총판" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 총판</SelectItem>
          {agencies.map((a) => (
            <SelectItem key={a.id} value={String(a.id)}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="max-w-xs"
        placeholder="대행사명 / 아이디 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
      />
      <Select value={approved} onValueChange={setApproved}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체</SelectItem>
          <SelectItem value="true">승인</SelectItem>
          <SelectItem value="false">대기</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={apply}>검색</Button>
    </div>
  );
}
