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
import { PlaceTable } from '@/components/place/PlaceTable';
import { PlaceForm } from '@/components/place/PlaceForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useKakaoMapList,
  useCreateKakaoMap,
  useUpdateKakaoMap,
  useDeleteKakaoMap,
  useBulkKakaoMap,
  type KakaoMapItem,
} from '@/hooks/useKakaoMap';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { PlaceInput } from '@/lib/validations/place';

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

export function KakaoMapPage() {
  const [filter, setFilter] = useState<FilterState>(defaultFilter);
  const [applied, setApplied] = useState<FilterState>(defaultFilter);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<KakaoMapItem | null>(null);

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

  const { data, isLoading } = useKakaoMapList(queryParams);
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const create = useCreateKakaoMap();
  const update = useUpdateKakaoMap();
  const del = useDeleteKakaoMap();
  const bulk = useBulkKakaoMap();
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

  const handleSubmit = (input: PlaceInput) => {
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
        title="카카오맵"
        description="카카오맵 업체 순위 관리"
        actions={
          <>
            <ExcelActions
              moduleKey="kakao-map"
              exportItems={items as unknown as Array<Record<string, unknown>>}
              onUploaded={() => qc.invalidateQueries({ queryKey: ['kakao-map'] })}
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
        searchPlaceholder="상점명 / 메인·검색 키워드"
      />

      <Card className="p-3">
        <BulkActionBar
          selectedCount={selectedIds.length}
          onApply={handleBulk}
          onClear={() => setSelectedIds([])}
        />

        <PlaceTable
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
            <DialogTitle>카카오맵 {editing ? '수정' : '등록'}</DialogTitle>
            <DialogDescription>플레이스와 동일한 구조로 입력합니다.</DialogDescription>
          </DialogHeader>
          <PlaceForm
            defaultValues={
              editing
                ? {
                    ...editing,
                    agency_id: editing.agency_id ?? undefined,
                    seller_id: editing.seller_id ?? undefined,
                    category: (editing.category as PlaceInput['category']) ?? undefined,
                    logic: (editing.logic as PlaceInput['logic']) ?? undefined,
                    ad_type: editing.ad_type as PlaceInput['ad_type'],
                    traffic_count: editing.traffic_count ?? undefined,
                    payment_amount: editing.payment_amount ?? undefined,
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
