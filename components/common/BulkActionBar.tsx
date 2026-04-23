'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export type BulkPatch =
  | { type: 'status'; status: string }
  | { type: 'extend'; days: number };

type Props = {
  selectedCount: number;
  onApply: (patch: BulkPatch) => void;
  onClear: () => void;
  /** 표시할 상태 전환 버튼 — 생략 시 기본 3개 (작업중/환불요청/삭제요청) */
  statusActions?: ReadonlyArray<{ status: string; label: string }>;
  /** 표시할 연장 일수 버튼 — 생략 시 [10, 7] */
  extendDays?: ReadonlyArray<number>;
};

const DEFAULT_STATUS_ACTIONS = [
  { status: '작업중', label: '작업중' },
  { status: '환불요청', label: '환불요청' },
  { status: '삭제요청', label: '삭제요청' },
] as const;

export function BulkActionBar({
  selectedCount,
  onApply,
  onClear,
  statusActions = DEFAULT_STATUS_ACTIONS,
  extendDays = [10, 7],
}: Props) {
  const [pending, setPending] = useState<{ label: string; patch: BulkPatch } | null>(null);

  if (selectedCount === 0) return null;

  const act = (label: string, patch: BulkPatch) => setPending({ label, patch });

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-accent)]/30 p-2">
      <span className="text-sm font-medium">{selectedCount}건 선택됨</span>
      <div className="flex flex-wrap items-center gap-1">
        {extendDays.map((days) => (
          <Button
            key={days}
            size="sm"
            variant="outline"
            onClick={() => act(`${days}일 연장처리`, { type: 'extend', days })}
          >
            {days}일 연장
          </Button>
        ))}
        {statusActions.map((opt) => (
          <Button
            key={opt.status}
            size="sm"
            variant="outline"
            onClick={() => act(`${opt.label}로 변경`, { type: 'status', status: opt.status })}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <Button size="sm" variant="ghost" onClick={onClear}>
        선택 해제
      </Button>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(open) => !open && setPending(null)}
        title={pending?.label ?? ''}
        description={`${selectedCount}건에 적용됩니다.`}
        onConfirm={() => {
          if (pending) onApply(pending.patch);
        }}
      />
    </div>
  );
}
