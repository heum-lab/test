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

export function AgencyFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const [approved, setApproved] = useState(params.get('approved') ?? 'all');

  const apply = () => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (approved !== 'all') qs.set('approved', approved);
    router.push(`/admin/agency?${qs.toString()}`);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Input
        className="max-w-xs"
        placeholder="총판명 / 아이디 검색"
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
