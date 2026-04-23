'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, Building2, Users, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/constants';

type NavLink = {
  type: 'link';
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
};

type NavGroup = {
  type: 'group';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLink[];
};

type NavItem = NavLink | NavGroup;

const NAV: NavItem[] = [
  { type: 'link', href: '/admin/dashboard', label: '대시보드', icon: LayoutDashboard },
  { type: 'link', href: '/admin/place', label: '플레이스', icon: MapPin },
  {
    type: 'group',
    label: '업체관리',
    icon: Building2,
    children: [
      {
        type: 'link',
        href: '/admin/agency',
        label: '총판 관리',
        icon: Building2,
        roles: ['super_admin'],
      },
      {
        type: 'link',
        href: '/admin/seller',
        label: '대행사 관리',
        icon: Users,
        roles: ['super_admin', 'agency'],
      },
    ],
  },
];

function linkVisible(link: NavLink, role: UserRole) {
  return !link.roles || link.roles.includes(role);
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-card)]">
      <Link
        href="/admin/dashboard"
        className="flex h-[168px] items-center justify-center border-b border-[var(--color-border)] px-4"
      >
        <img src="/logo.png" alt="Profit" className="h-[120px] w-auto object-contain" />
      </Link>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {NAV.map((item) => {
            if (item.type === 'link') {
              if (!linkVisible(item, role)) return null;
              const Icon = item.icon;
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)]',
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            }

            const visibleChildren = item.children.filter((c) => linkVisible(c, role));
            if (visibleChildren.length === 0) return null;

            const hasActiveChild = visibleChildren.some((c) => pathname.startsWith(c.href));
            const isOpen = openGroups[item.label] ?? hasActiveChild;
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((prev) => ({ ...prev, [item.label]: !isOpen }))
                  }
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-accent)]"
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown
                    className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
                  />
                </button>
                {isOpen && (
                  <ul className="mt-1 space-y-1 pl-6">
                    {visibleChildren.map((child) => {
                      const ChildIcon = child.icon;
                      const active = pathname.startsWith(child.href);
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className={cn(
                              'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                              active
                                ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                                : 'text-[var(--color-foreground)] hover:bg-[var(--color-accent)]',
                            )}
                          >
                            <ChildIcon className="size-4" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
