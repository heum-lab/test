import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { SellerFilter } from '@/components/seller/SellerFilter';
import { SellerTable } from '@/components/seller/SellerTable';
import { SellerRegisterDialog } from '@/components/seller/SellerRegisterDialog';
import { requireSession } from '@/lib/auth/session';

export default async function SellerPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; approved?: string; agency_id?: string }>;
}) {
  const [sp, session] = await Promise.all([searchParams, requireSession()]);

  const effectiveAgencyId =
    session.role === 'agency' && session.agencyId ? String(session.agencyId) : sp.agency_id;

  return (
    <div>
      <PageHeader
        title="대행사 관리"
        description="대행사 계정 등록·승인·조회·삭제"
        actions={<SellerRegisterDialog role={session.role} agencyId={session.agencyId} />}
      />
      <Card className="p-4">
        <SellerFilter role={session.role} agencyId={session.agencyId} />
        <SellerTable search={sp.search} approved={sp.approved} agencyId={effectiveAgencyId} />
      </Card>
    </div>
  );
}
