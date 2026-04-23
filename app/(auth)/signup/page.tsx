import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createAdminClient } from '@/lib/supabase/server';
import { SignupForm } from './SignupForm';

async function getApprovedAgencies() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('agencies')
      .select('id, name, parent_name')
      .eq('is_approved', true)
      .order('name');
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function SignupPage() {
  const agencies = await getApprovedAgencies();

  return (
    <Card className="my-8">
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>총판 또는 대행사 계정을 신청합니다. 승인 후 로그인 가능</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm agencies={agencies} />
      </CardContent>
    </Card>
  );
}
