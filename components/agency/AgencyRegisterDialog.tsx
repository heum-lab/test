'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
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
import { useCreateAgency } from '@/hooks/useAgency';

const emptyForm = {
  name: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  memo: '',
};

export function AgencyRegisterDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const create = useCreateAgency();

  useEffect(() => {
    if (!open) setForm(emptyForm);
  }, [open]);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleSubmit = () => {
    create.mutate(
      {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        memo: form.memo.trim(),
        is_approved: true,
      },
      {
        onSuccess: () => {
          toast.success('총판이 등록되었습니다.');
          setOpen(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1 size-4" />
        총판 등록
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>총판 등록</DialogTitle>
            <DialogDescription>
              계정 정보를 입력하세요. 등록 즉시 로그인 가능합니다.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <Field label="총판명">
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>

            <Field label="아이디">
              <Input
                autoComplete="off"
                value={form.username}
                onChange={(e) => set({ username: e.target.value })}
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

            <Field label="비밀번호">
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set({ password: e.target.value })}
              />
            </Field>

            <Field label="연락처">
              <Input
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </Field>

            <div />

            <div className="col-span-2">
              <Field label="메모">
                <Textarea
                  rows={2}
                  value={form.memo}
                  onChange={(e) => set({ memo: e.target.value })}
                  placeholder="선택 사항"
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={create.isPending}>
              {create.isPending ? '등록 중...' : '등록'}
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
