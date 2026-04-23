import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { ItemStatus } from '@/lib/constants';

const STATUS_VARIANTS: Record<ItemStatus, BadgeProps['variant']> = {
  대기: 'secondary',
  작업중: 'default',
  중지: 'outline',
  환불요청: 'warning',
  환불완료: 'destructive',
  연장처리: 'warning',
  작업완료: 'success',
  삭제요청: 'destructive',
};

export function StatusBadge({ status }: { status: ItemStatus | string }) {
  const variant = STATUS_VARIANTS[status as ItemStatus] ?? 'outline';
  return <Badge variant={variant}>{status}</Badge>;
}
