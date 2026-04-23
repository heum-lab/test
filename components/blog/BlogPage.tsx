'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { BulkActionBar, type BulkPatch } from '@/components/common/BulkActionBar';
import { Pagination } from '@/components/common/Pagination';
import { ExcelActions } from '@/components/common/ExcelActions';
import { BlogFilter, type BlogFilterState } from './BlogFilter';
import { BlogTable } from './BlogTable';
import { BlogModal } from './BlogModal';
import {
  useBlogList,
  useDeleteBlog,
  useBulkBlog,
  type BlogItem,
} from '@/hooks/useBlog';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

const defaultFilter: BlogFilterState = {
  agency_id: 'all',
  seller_id: 'all',
  status: 'all',
  date_type: 'start_date',
  start: '',
  end: '',
  search: '',
  page_size: DEFAULT_PAGE_SIZE,
};

export function BlogPage() {
  const [filter, setFilter] = useState<BlogFilterState>(defaultFilter);
  const [applied, setApplied] = useState<BlogFilterState>(defaultFilter);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BlogItem | null>(null);

  const queryParams = useMemo(
    () => ({
      agency_id: applied.agency_id,
      seller_id: applied.seller_id,
      status: applied.status === 'all' ? undefined : applied.status,
      date_type: applied.date_type,
      start: applied.start,
      end: applied.end,
      search: applied.search,
      page,
      page_size: applied.page_size,
    }),
    [applied, page],
  );

  const { data, isLoading } = useBlogList(queryParams);
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const del = useDeleteBlog();
  const bulk = useBulkBlog();
  const qc = useQueryClient();

  const handleApply = () => {
    setApplied(filter);
    setPage(1);
    setSelectedIds([]);
  };
  const handleReset = () => {
    setFilter(defaultFilter);
    setApplied(defaultFilter);
    setPage(1);
    setSelectedIds([]);
  };

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    const allIds = items.map((i) => i.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(
      allSelected
        ? selectedIds.filter((id) => !allIds.includes(id))
        : Array.from(new Set([...selectedIds, ...allIds])),
    );
  };

  const handleBulk = (patch: BulkPatch) => {
    const body =
      patch.type === 'status'
        ? { ids: selectedIds, type: 'status' as const, status: patch.status }
        : { ids: selectedIds, type: 'extend' as const, days: patch.days };
    bulk.mutate(body, {
      onSuccess: () => {
        toast.success('일괄 처리 완료');
        setSelectedIds([]);
      },
      onError: (e) => toast.error(e.message),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    del.mutate(id, {
      onSuccess: () => toast.success('삭제되었습니다.'),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div>
      <PageHeader
        title="블로그"
        description="블로그 홍보글 발행 관리"
        actions={
          <>
            <ExcelActions
              moduleKey="blog"
              exportItems={items as unknown as Array<Record<string, unknown>>}
              onUploaded={() => qc.invalidateQueries({ queryKey: ['blog'] })}
            />
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="mr-1 size-4" />
              등록
            </Button>
          </>
        }
      />

      <BlogFilter value={filter} onChange={setFilter} onApply={handleApply} onReset={handleReset} />

      <Card className="p-3">
        <BulkActionBar
          selectedCount={selectedIds.length}
          onApply={handleBulk}
          onClear={() => setSelectedIds([])}
          statusActions={[
            { status: '작업중', label: '작업중' },
            { status: '작업완료', label: '작업완료' },
          ]}
        />

        <BlogTable
          items={items}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={(item) => {
            setEditing(item);
            setModalOpen(true);
          }}
          onDelete={handleDelete}
        />

        <Pagination
          page={page}
          pageSize={applied.page_size}
          total={total}
          onChange={(p) => {
            setPage(p);
            setSelectedIds([]);
          }}
        />
      </Card>

      <BlogModal open={modalOpen} onOpenChange={setModalOpen} item={editing} />
    </div>
  );
}
