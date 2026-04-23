import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <img src="/logo.png" alt="Profit" className="mb-2 h-72 w-72 object-contain" />
        <CardDescription>계정으로 로그인해 주세요</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
