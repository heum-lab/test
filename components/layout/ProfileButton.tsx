'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ApiResponse } from '@/types';

type Profile = {
  role: 'super_admin' | 'agency' | 'seller';
  email: string;
  name: string;
  username: string;
  phone: string | null;
  memo: string | null;
};

const ROLE_LABEL: Record<Profile['role'], string> = {
  super_admin: '슈퍼관리자',
  agency: '총판',
  seller: '대행사',
};

export function ProfileButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    memo: '',
    password: '',
  });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch('/api/profile')
      .then((r) => r.json() as Promise<ApiResponse<Profile>>)
      .then((json) => {
        if (json.error || !json.data) throw new Error(json.error ?? '프로필을 불러오지 못했습니다.');
        setProfile(json.data);
        setForm({
          name: json.data.name ?? '',
          phone: json.data.phone ?? '',
          email: json.data.email ?? '',
          memo: json.data.memo ?? '',
          password: '',
        });
      })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [open]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          memo: form.memo,
          password: form.password || undefined,
        }),
      });
      const json = (await res.json()) as ApiResponse<{ ok: true }>;
      if (json.error) throw new Error(json.error);
      toast.success('저장되었습니다.');
      setOpen(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="text-sm text-[var(--color-muted-foreground)] hover:underline"
        onClick={() => setOpen(true)}
      >
        {email}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>내 정보</DialogTitle>
            <DialogDescription>
              프로필 정보를 수정할 수 있습니다. 비밀번호는 변경할 때만 입력하세요.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
              불러오는 중...
            </div>
          ) : profile ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="역할">
                  <Input value={ROLE_LABEL[profile.role]} readOnly tabIndex={-1} />
                </Field>
                <Field label="아이디">
                  <Input value={profile.username || '-'} readOnly tabIndex={-1} />
                </Field>

                <Field label={profile.role === 'agency' ? '총판명' : profile.role === 'seller' ? '대행사명' : '이름'}>
                  <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
                </Field>
                <Field label="연락처">
                  <Input
                    placeholder="010-0000-0000"
                    value={form.phone}
                    onChange={(e) => set({ phone: e.target.value })}
                  />
                </Field>

                <Field label="이메일">
                  <Input
                    type="email"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => set({ email: e.target.value })}
                  />
                </Field>
                <Field label="비밀번호 변경">
                  <Input
                    type="password"
                    autoComplete="new-password"
                    placeholder="미입력 시 유지"
                    value={form.password}
                    onChange={(e) => set({ password: e.target.value })}
                  />
                </Field>
              </div>

              <Field label="메모">
                <Textarea
                  rows={2}
                  value={form.memo}
                  onChange={(e) => set({ memo: e.target.value })}
                />
              </Field>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              취소
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
