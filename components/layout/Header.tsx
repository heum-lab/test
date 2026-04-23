import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type UserRole } from '@/lib/constants';
import { logoutAction } from '@/app/(auth)/login/actions';
import { ProfileButton } from './ProfileButton';

export function Header({
  email,
  role,
  name,
}: {
  email: string;
  role: UserRole;
  name?: string | null;
}) {
  const roleLabel = ROLE_LABELS[role];
  const badgeText = name ? `${roleLabel} ${name}` : roleLabel;
  return (
    <header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-card)] px-6">
      <div className="text-sm font-medium">관리자 페이지</div>
      <div className="flex items-center gap-3">
        <Badge variant="outline">{badgeText}</Badge>
        <ProfileButton email={email} />
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="mr-1 size-4" />
            로그아웃
          </Button>
        </form>
      </div>
    </header>
  );
}
