import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ROLE_LABELS } from '@/lib/constants';
import { requireSession, type Session } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/server';

type PlaceRow = {
  id: number;
  store_name: string;
  main_keyword: string;
  status: string;
  start_date: string;
  end_date: string;
  traffic_count: number | null;
  agencies: { name: string } | null;
  sellers: { name: string; seller_code: number } | null;
};

type StatsRow = { status: string };

async function loadDashboard(session: Session) {
  const admin = createAdminClient();

  const statsQuery = admin.from('place_items').select('status');
  const recentQuery = admin
    .from('place_items')
    .select(
      'id, store_name, main_keyword, status, start_date, end_date, traffic_count, agencies(name), sellers(name, seller_code)',
    )
    .order('created_at', { ascending: false })
    .limit(10);

  if (session.role === 'agency' && session.agencyId) {
    statsQuery.eq('agency_id', session.agencyId);
    recentQuery.eq('agency_id', session.agencyId);
  } else if (session.role === 'seller' && session.sellerId) {
    statsQuery.eq('seller_id', session.sellerId);
    recentQuery.eq('seller_id', session.sellerId);
  }

  const [{ data: stats = [] }, { data: recent = [] }] = await Promise.all([
    statsQuery.returns<StatsRow[]>(),
    recentQuery.returns<PlaceRow[]>(),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of stats ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }
  const total = stats?.length ?? 0;

  let agencyCount = 0;
  let sellerCount = 0;

  if (session.role === 'super_admin') {
    const [{ count: ac }, { count: sc }] = await Promise.all([
      admin.from('agencies').select('id', { count: 'exact', head: true }).eq('is_approved', true),
      admin.from('sellers').select('id', { count: 'exact', head: true }).eq('is_approved', true),
    ]);
    agencyCount = ac ?? 0;
    sellerCount = sc ?? 0;
  } else if (session.role === 'agency' && session.agencyId) {
    const { count: sc } = await admin
      .from('sellers')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', session.agencyId)
      .eq('is_approved', true);
    sellerCount = sc ?? 0;
  }

  return { total, statusCounts, recent: recent ?? [], agencyCount, sellerCount };
}

const FEATURED_STATUSES = ['대기', '작업중', '작업완료'] as const;

export default async function DashboardPage() {
  const session = await requireSession();
  const { total, statusCounts, recent, agencyCount, sellerCount } = await loadDashboard(session);

  const scopeLabel =
    session.role === 'super_admin'
      ? '전체'
      : session.role === 'agency'
        ? `${session.name ?? '본인 총판'} 소속`
        : `${session.name ?? '본인'} 작업`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`${ROLE_LABELS[session.role]}로 로그인되어 있습니다. (${scopeLabel})`}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="총 작업" value={total} href="/admin/place" />
        {FEATURED_STATUSES.map((s) => (
          <StatCard key={s} label={s} value={statusCounts[s] ?? 0} href="/admin/place" />
        ))}
      </div>

      {session.role !== 'seller' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {session.role === 'super_admin' && (
            <StatCard label="승인된 총판" value={agencyCount} href="/admin/agency" muted />
          )}
          <StatCard label="승인된 대행사" value={sellerCount} href="/admin/seller" muted />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>최근 등록 작업</CardTitle>
          <CardDescription>최근 등록/수정된 플레이스 작업 {recent.length}건</CardDescription>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              작업이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-[var(--color-muted-foreground)]">
                  <tr>
                    <th className="py-2 pr-3">상점명</th>
                    <th className="py-2 pr-3">메인키워드</th>
                    {session.role !== 'seller' && <th className="py-2 pr-3">대행사</th>}
                    {session.role === 'super_admin' && <th className="py-2 pr-3">총판</th>}
                    <th className="py-2 pr-3">시작일</th>
                    <th className="py-2 pr-3">종료일</th>
                    <th className="py-2 pr-3">일유입</th>
                    <th className="py-2 pr-3">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--color-border)]">
                      <td className="py-2 pr-3 font-medium">{r.store_name}</td>
                      <td className="py-2 pr-3">{r.main_keyword}</td>
                      {session.role !== 'seller' && (
                        <td className="py-2 pr-3">
                          {r.sellers ? `${r.sellers.name}(${r.sellers.seller_code})` : '-'}
                        </td>
                      )}
                      {session.role === 'super_admin' && (
                        <td className="py-2 pr-3">{r.agencies?.name ?? '-'}</td>
                      )}
                      <td className="py-2 pr-3">{r.start_date}</td>
                      <td className="py-2 pr-3">{r.end_date}</td>
                      <td className="py-2 pr-3">{r.traffic_count?.toLocaleString() ?? '-'}</td>
                      <td className="py-2 pr-3">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  muted,
}: {
  label: string;
  value: number;
  href?: string;
  muted?: boolean;
}) {
  const body = (
    <Card className={muted ? 'opacity-90' : undefined}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold">{value.toLocaleString()}</CardTitle>
      </CardHeader>
    </Card>
  );
  return href ? (
    <Link href={href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
