'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
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
import type { NaverShoppingItem } from '@/hooks/useNaverShopping';

type Props = {
  items: NaverShoppingItem[];
  isLoading: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (item: NaverShoppingItem) => void;
  onDelete: (id: number) => void;
};

export function NaverShoppingTable({
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
          <TableHead>광고상품</TableHead>
          <TableHead>키워드</TableHead>
          <TableHead>상품MID</TableHead>
          <TableHead>주문일</TableHead>
          <TableHead>시작일</TableHead>
          <TableHead>종료일</TableHead>
          <TableHead>잔여일</TableHead>
          <TableHead>유입수</TableHead>
          <TableHead>입금일</TableHead>
          <TableHead>순위(최초/현재/어제)</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => {
          // 종료일이 다가올수록 줄어드는 남은 구동일 (오늘 포함, 시작일엔 총 구동기간과 동일)
          const remainingDays = item.end_date
            ? Math.max(0, differenceInCalendarDays(parseISO(item.end_date), new Date()) + 1)
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
              <TableCell>
                <div className="text-xs">
                  {item.ad_type ?? '-'}
                  {item.landing_type ? ` / ${item.landing_type}` : ''}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.keyword}</TableCell>
              <TableCell className="font-mono text-xs">{item.product_mid}</TableCell>
              <TableCell>{item.order_date ?? '-'}</TableCell>
              <TableCell>{item.start_date}</TableCell>
              <TableCell>{item.end_date}</TableCell>
              <TableCell className={remainingDays !== null && remainingDays <= 2 ? 'text-red-500 font-medium' : undefined}>{remainingDays ?? '-'}</TableCell>
              <TableCell>{item.traffic_count ?? '-'}</TableCell>
              <TableCell>{item.payment_date ?? '-'}</TableCell>
              <TableCell className="text-xs">
                {(item.initial_rank ?? '-') + ' / '}
                {(item.current_rank ?? '-') + ' / '}
                {item.yesterday_rank ?? '-'}
              </TableCell>
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
