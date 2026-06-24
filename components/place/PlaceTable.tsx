'use client';

import { differenceInDays, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { PlaceItem } from '@/hooks/usePlace';

type Props = {
  items: PlaceItem[];
  isLoading: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (item: PlaceItem) => void;
  onDelete: (id: number) => void;
};

export function PlaceTable({
  items,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}: Props) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">불러오는 중...</div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
        조회된 항목이 없습니다.
      </div>
    );
  }

  const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} />
          </TableHead>
          <TableHead className="w-14">번호</TableHead>
          <TableHead>총판</TableHead>
          <TableHead>대행사</TableHead>
          <TableHead>상점명</TableHead>
          <TableHead>메인키워드</TableHead>
          <TableHead>검색키워드</TableHead>
          <TableHead>로직</TableHead>
          <TableHead>주문일</TableHead>
          <TableHead>시작일</TableHead>
          <TableHead>종료일</TableHead>
          <TableHead>구동일</TableHead>
          <TableHead>유입수</TableHead>
          <TableHead>입금일</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => {
          const runningDays =
            item.start_date && item.end_date
              ? differenceInDays(parseISO(item.end_date), parseISO(item.start_date)) + 1
              : '-';
          return (
            <TableRow key={item.id} data-state={selectedIds.includes(item.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={() => onToggleSelect(item.id)}
                />
              </TableCell>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{item.agencies?.name ?? '-'}</TableCell>
              <TableCell>{item.sellers ? `${item.sellers.name}(${item.sellers.seller_code})` : '-'}</TableCell>
              <TableCell className="font-medium">{item.store_name}</TableCell>
              <TableCell>{item.main_keyword}</TableCell>
              <TableCell>{item.search_keyword}</TableCell>
              <TableCell>{item.logic ?? '-'}</TableCell>
              <TableCell>{item.order_date ?? '-'}</TableCell>
              <TableCell>{item.start_date}</TableCell>
              <TableCell>{item.end_date}</TableCell>
              <TableCell>{runningDays}</TableCell>
              <TableCell>{item.traffic_count ?? '-'}</TableCell>
              <TableCell>{item.payment_date ?? '-'}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell className="space-x-1 text-right">
                <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                  수정
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>
                  삭제
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
