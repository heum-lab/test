'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
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
  sort?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (item: PlaceItem) => void;
  onDelete: (id: number) => void;
};

function SortableHead({
  label,
  sortKey,
  sort,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: string;
  sort?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  className?: string;
}) {
  // 정렬 핸들러가 없으면(예: 카카오맵) 일반 헤더로 표시
  if (!onSort) {
    return <TableHead className={className}>{label}</TableHead>;
  }
  const active = sort === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]"
        aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ChevronsUpDown className="size-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function PlaceTable({
  items,
  isLoading,
  selectedIds,
  sort,
  sortDir,
  onSort,
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
          <SortableHead label="번호" sortKey="id" sort={sort} sortDir={sortDir} onSort={onSort} className="w-14" />
          <SortableHead label="총판" sortKey="agency" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="대행사" sortKey="seller" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="상점명" sortKey="store_name" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="메인키워드" sortKey="main_keyword" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="검색키워드" sortKey="search_keyword" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="로직" sortKey="logic" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="주문일" sortKey="order_date" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="시작일" sortKey="start_date" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="종료일" sortKey="end_date" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="잔여일" sortKey="running_days" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="유입수" sortKey="traffic_count" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="입금일" sortKey="payment_date" sort={sort} sortDir={sortDir} onSort={onSort} />
          <SortableHead label="상태" sortKey="status" sort={sort} sortDir={sortDir} onSort={onSort} />
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => {
          // 잔여일: 시작 전이면 전체 기간(종료일−시작일+1), 시작 후면 오늘 미포함 남은 일수(종료일−오늘)
          const remainingDays = item.end_date
            ? item.start_date && differenceInCalendarDays(parseISO(item.start_date), new Date()) > 0
              ? Math.max(0, differenceInCalendarDays(parseISO(item.end_date), parseISO(item.start_date)) + 1)
              : Math.max(0, differenceInCalendarDays(parseISO(item.end_date), new Date()))
            : null;
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
              <TableCell className={remainingDays !== null && remainingDays <= 2 ? 'text-red-500 font-medium' : undefined}>{remainingDays ?? '-'}</TableCell>
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
