'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginAction, type LoginState } from './actions';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email && (
          <p className="text-xs text-[var(--color-destructive)]">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password && (
          <p className="text-xs text-[var(--color-destructive)]">{state.fieldErrors.password}</p>
        )}
      </div>

      {state.error && (
        <p className="rounded-md border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/10 p-2 text-sm text-[var(--color-destructive)]">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? '로그인 중...' : '로그인'}
      </Button>

    </form>
  );
}
