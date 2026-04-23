import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { AgencyFilter } from '@/components/agency/AgencyFilter';
import { AgencyTable } from '@/components/agency/AgencyTable';
import { AgencyRegisterDialog } from '@/components/agency/AgencyRegisterDialog';

export default async function AgencyPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; approved?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div>
      <PageHeader
        title="총판 관리"
        description="총판 계정 등록·승인·조회·삭제"
        actions={<AgencyRegisterDialog />}
      />
      <Card className="p-4">
        <AgencyFilter />
        <AgencyTable search={sp.search} approved={sp.approved} />
      </Card>
    </div>
  );
}
