'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatPhone } from '@/lib/utils';
import { signupAction, type SignupState } from './actions';

type AgencyOption = { id: number; name: string };

const initialState: SignupState = {};

export function SignupForm({ agencies }: { agencies: AgencyOption[] }) {
  const [role, setRole] = useState<'agency' | 'seller'>('agency');
  const [phone, setPhone] = useState('');
  const [agencyId, setAgencyId] = useState<string>('');
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  const field = (name: string) => state.fieldErrors?.[name];

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-semibold">회원가입 신청 완료</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          관리자 승인 후 로그인이 가능합니다. 이메일 확인이 필요할 수 있습니다.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">로그인 페이지로</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="role" value={role} />

      <div className="space-y-2">
        <Label>역할 선택</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={role === 'agency' ? 'default' : 'outline'}
            onClick={() => setRole('agency')}
          >
            총판
          </Button>
          <Button
            type="button"
            variant={role === 'seller' ? 'default' : 'outline'}
            onClick={() => setRole('seller')}
          >
            대행사
          </Button>
        </div>
      </div>

      <FieldRow>
        <Field label="이메일" error={field('email')} htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="아이디" error={field('username')} htmlFor="username">
          <Input id="username" name="username" required />
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="비밀번호" error={field('password')} htmlFor="password">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="비밀번호 확인" error={field('passwordConfirm')} htmlFor="passwordConfirm">
          <Input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="이름" error={field('name')} htmlFor="name">
          <Input id="name" name="name" required />
        </Field>
        <Field label="전화번호" error={field('phone')} htmlFor="phone">
          <Input
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="010-0000-0000"
            required
          />
        </Field>
      </FieldRow>

      {role === 'agency' ? (
        <Field label="총판명" error={field('agency_name')} htmlFor="agency_name">
          <Input id="agency_name" name="agency_name" placeholder="예: 앤올마케팅" required />
        </Field>
      ) : (
        <Field label="소속 총판" error={field('agency_id')} htmlFor="agency_id">
          <input type="hidden" name="agency_id" value={agencyId} />
          <Select value={agencyId} onValueChange={setAgencyId}>
            <SelectTrigger id="agency_id">
              <SelectValue placeholder="총판 선택" />
            </SelectTrigger>
            <SelectContent>
              {agencies.length === 0 ? (
                <div className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                  승인된 총판가 없습니다.
                </div>
              ) : (
                agencies.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </Field>
      )}

      <Field label="메모" htmlFor="memo">
        <Textarea id="memo" name="memo" rows={2} placeholder="선택 사항" />
      </Field>

      {state.error && (
        <p className="rounded-md border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 p-2 text-sm text-[var(--color-destructive)]">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '가입 중...' : '가입 신청'}
      </Button>

      <p className="text-center text-sm text-[var(--color-muted-foreground)]">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="font-medium text-[var(--color-primary)] hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-[var(--color-destructive)]">{error}</p>}
    </div>
  );
}
