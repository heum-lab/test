'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchFilter, type FilterState } from '@/components/common/SearchFilter';
import { BulkActionBar, type BulkPatch } from '@/components/common/BulkActionBar';
import { Pagination } from '@/components/common/Pagination';
import { ExcelActions } from '@/components/common/ExcelActions';
import { NaverShoppingTable } from '@/components/naver-shopping/NaverShoppingTable';
import { NaverShoppingForm } from '@/components/naver-shopping/NaverShoppingForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useOhouseList,
  useCreateOhouse,
  useUpdateOhouse,
  useDeleteOhouse,
  useBulkOhouse,
  type OhouseItem,
} from '@/hooks/useOhouse';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { NaverShoppingInput } from '@/lib/validations/naver-shopping';

const defaultFilter: FilterState = {
  agency_id: 'all',
  seller_id: 'all',
  status: 'all',
  date_type: 'start_date',
  start: '',
  end: '',
  search: '',
  page_size: DEFAULT_PAGE_SIZE,
};

export function OhousePage() {
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [applied, setApplied] = useState<FilterState>(defaultFilter);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<OhouseItem | null>(null);

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

  const { data, isLoading } = useOhouseList(queryParams);
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const create = useCreateOhouse();
  const update = useUpdateOhouse();
  const del = useDeleteOhouse();
  const bulk = useBulkOhouse();
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

  const handleSubmit = (input: NaverShoppingInput) => {
    if (editing) {
      update.mutate(
        { id: editing.id, patch: input },
        {
          onSuccess: () => {
            toast.success('수정되었습니다.');
            setModalOpen(false);
          },
          onError: (e) => toast.error(e.message),
        },
      );
    } else {
      create.mutate(input, {
        onSuccess: () => {
          toast.success('등록되었습니다.');
          setModalOpen(false);
        },
        onError: (e) => toast.error(e.message),
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="오늘의집"
        description="오늘의집 상품 순위 관리"
        actions={
          <>
            <ExcelActions
              moduleKey="ohouse"
              exportItems={items as unknown as Array<Record<string, unknown>>}
              onUploaded={() => qc.invalidateQueries({ queryKey: ['ohouse'] })}
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

      <SearchFilter
        value={filter}
        onChange={setFilter}
        onApply={handleApply}
        onReset={handleReset}
      />

      <Card className="p-3">
        <BulkActionBar
          selectedCount={selectedIds.length}
          onApply={handleBulk}
          onClear={() => setSelectedIds([])}
        />

        <NaverShoppingTable
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>오늘의집 {editing ? '수정' : '등록'}</DialogTitle>
            <DialogDescription>
              네이버쇼핑과 동일한 구조로 입력합니다.
            </DialogDescription>
          </DialogHeader>
          <NaverShoppingForm
            defaultValues={
              editing
                ? {
                    ...editing,
                    agency_id: editing.agency_id ?? undefined,
                    seller_id: editing.seller_id ?? undefined,
                    sub_keyword1: editing.sub_keyword1 ?? undefined,
                    sub_keyword2: editing.sub_keyword2 ?? undefined,
                    product_url: editing.product_url ?? undefined,
                    price_compare_mid: editing.price_compare_mid ?? undefined,
                    price_compare_url: editing.price_compare_url ?? undefined,
                    ad_type: (editing.ad_type as NaverShoppingInput['ad_type']) ?? undefined,
                    landing_type:
                      (editing.landing_type as NaverShoppingInput['landing_type']) ?? undefined,
                    traffic_count: editing.traffic_count ?? undefined,
                    order_date: editing.order_date ?? undefined,
                    payment_date: editing.payment_date ?? undefined,
                    memo: editing.memo ?? undefined,
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            onCancel={() => setModalOpen(false)}
            submitting={create.isPending || update.isPending}
            submitLabel={editing ? '수정' : '등록'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
