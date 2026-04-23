'use client';

import { toast } from 'sonner';
import { Paperclip } from 'lucide-react';
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
import { getBlogAttachmentUrl } from '@/lib/storage';
import type { BlogItem } from '@/hooks/useBlog';

type Props = {
  items: BlogItem[];
  isLoading: boolean;
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (item: BlogItem) => void;
  onDelete: (id: number) => void;
};

async function openAttachment(path: string) {
  try {
    const url = await getBlogAttachmentUrl(path);
    window.open(url, '_blank');
  } catch (e) {
    toast.error((e as Error).message);
  }
}

export function BlogTable({
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
          <TableHead>광고타입</TableHead>
          <TableHead>플레이스명</TableHead>
          <TableHead>메인키워드</TableHead>
          <TableHead>검색키워드</TableHead>
          <TableHead>URL</TableHead>
          <TableHead>주문일</TableHead>
          <TableHead>시작일</TableHead>
          <TableHead>종료일</TableHead>
          <TableHead>일/총 발행</TableHead>
          <TableHead>입금일</TableHead>
          <TableHead>순위</TableHead>
          <TableHead>첨부</TableHead>
          <TableHead>상태</TableHead>
          <TableHead className="text-right">관리</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, idx) => (
          <TableRow
            key={item.id}
            data-state={selectedIds.includes(item.id) ? 'selected' : undefined}
          >
            <TableCell>
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => onToggleSelect(item.id)}
              />
            </TableCell>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{item.agencies?.name ?? '-'}</TableCell>
            <TableCell>
              {item.sellers ? `${item.sellers.name}(${item.sellers.seller_code})` : '-'}
            </TableCell>
            <TableCell className="text-xs">{item.ad_type}</TableCell>
            <TableCell className="font-medium">{item.place_name}</TableCell>
            <TableCell>{item.main_keyword}</TableCell>
            <TableCell>{item.search_keyword ?? '-'}</TableCell>
            <TableCell>
              {item.content_url ? (
                <a
                  href={item.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[var(--color-primary)] underline"
                >
                  열기
                </a>
              ) : (
                '-'
              )}
            </TableCell>
            <TableCell>{item.order_date ?? '-'}</TableCell>
            <TableCell>{item.start_date}</TableCell>
            <TableCell>{item.end_date}</TableCell>
            <TableCell>
              {item.daily_publish_count} / {item.total_publish_count}
            </TableCell>
            <TableCell>{item.payment_date ?? '-'}</TableCell>
            <TableCell className="text-xs">
              {(item.initial_rank ?? '-') + ' / '}
              {(item.current_rank ?? '-') + ' / '}
              {item.yesterday_rank ?? '-'}
            </TableCell>
            <TableCell>
              {item.attachment_path ? (
                <button
                  type="button"
                  onClick={() => openAttachment(item.attachment_path!)}
                  className="text-[var(--color-primary)] hover:opacity-80"
                  aria-label="첨부파일 열기"
                >
                  <Paperclip className="size-4" />
                </button>
              ) : (
                '-'
              )}
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
        ))}
      </TableBody>
    </Table>
  );
}
