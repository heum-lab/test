import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { requireSession } from '@/lib/auth/session';
import { SessionProvider } from '@/lib/auth/session-context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen">
        <Sidebar role={session.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header email={session.email} role={session.role} name={session.name} />
          <main className="flex-1 overflow-y-auto bg-[var(--color-muted)]/40 p-6">{children}</main>
        </div>
      </div>
    </SessionProvider>
  );
}
