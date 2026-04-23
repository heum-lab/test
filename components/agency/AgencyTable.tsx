'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAgencies, useUpdateAgency, useDeleteAgency } from '@/hooks/useAgency';

export function AgencyTable({ search, approved }: { search?: string; approved?: string }) {
  const { data: agencies = [], isLoading } = useAgencies({ search, approved });
  const update = useUpdateAgency();
  const del = useDeleteAgency();

  const handleApprove = (id: number, value: boolean) => {
    update.mutate(
      { id, patch: { is_approved: value } },
      {
        onSuccess: () => toast.success(value ? '승인되었습니다.' : '승인이 취소되었습니다.'),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    del.mutate(id, {
      onSuccess: () => toast.success('삭제되었습니다.'),
      onError: (e) => toast.error(e.message),
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">불러오는 중...</div>
    );
  }

  if (agencies.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        등록된 총판가 없습니다.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>총판명</TableHead>
          <TableHead>아이디</TableHead>
          <TableHead>연락처</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>승인</TableHead>
          <TableHead>등록일</TableHead>
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {agencies.map((a) => (
          <TableRow key={a.id}>
            <TableCell className="font-medium">{a.name}</TableCell>
            <TableCell>{a.username}</TableCell>
            <TableCell>{a.phone ?? '-'}</TableCell>
            <TableCell>{a.email ?? '-'}</TableCell>
            <TableCell>
              {a.is_approved ? (
                <Badge variant="success">승인</Badge>
              ) : (
                <Badge variant="warning">대기</Badge>
              )}
            </TableCell>
            <TableCell>{new Date(a.created_at).toLocaleDateString('ko-KR')}</TableCell>
            <TableCell className="space-x-1 text-right">
              {a.is_approved ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApprove(a.id, false)}
                  disabled={update.isPending}
                >
                  승인취소
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleApprove(a.id, true)}
                  disabled={update.isPending}
                >
                  승인
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(a.id)}
                disabled={del.isPending}
              >
                삭제
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
