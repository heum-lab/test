'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgencyOptions, useSellerOptions } from '@/hooks/useOptions';
import { downloadRows, downloadTemplate, parseExcelFile } from '@/lib/excel/client';
import type { ModuleKey } from '@/lib/excel/columns';
import type { ApiResponse } from '@/types';
import type { BulkUploadResult } from '@/lib/excel/server';

type Props = {
  moduleKey: ModuleKey;
  /** 결과 내보내기용 현재 화면 항목 */
  exportItems?: Array<Record<string, unknown>>;
  /** 업로드 완료 후 목록 새로고침용 콜백 */
  onUploaded?: () => void;
};

export function ExcelActions({ moduleKey, exportItems, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [agencyId, setAgencyId] = useState<string>('');
  const [sellerId, setSellerId] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: agencies = [] } = useAgencyOptions();
  const { data: sellers = [] } = useSellerOptions(agencyId || undefined);

  const handleTemplate = () => {
    try {
      downloadTemplate(moduleKey);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleExport = () => {
    if (!exportItems || exportItems.length === 0) {
      toast.info('내보낼 항목이 없습니다.');
      return;
    }
    try {
      downloadRows(moduleKey, exportItems);
      toast.success(`${exportItems.length}건을 내보냈습니다.`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleFilePick = (file: File) => {
    setPendingFile(file);
    setUploadOpen(true);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    if (!agencyId || !sellerId) {
      toast.error('총판와 대행사를 선택해 주세요.');
      return;
    }

    setUploading(true);
    try {
      const { rows, skipped } = await parseExcelFile(pendingFile, moduleKey);
      if (rows.length === 0) {
        toast.error('엑셀에서 유효한 행을 찾지 못했습니다.');
        return;
      }

      const res = await fetch(`/api/${moduleKey}/excel-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_id: Number(agencyId),
          seller_id: Number(sellerId),
          rows,
        }),
      });
      const json = (await res.json()) as ApiResponse<BulkUploadResult>;
      if (json.error) {
        toast.error(json.error);
        return;
      }

      const result = json.data!;
      const notes: string[] = [];
      if (result.inserted > 0) notes.push(`성공 ${result.inserted}건`);
      if (result.failed > 0) notes.push(`실패 ${result.failed}건`);
      if (skipped > 0) notes.push(`빈 행 제외 ${skipped}건`);

      if (result.failed === 0) {
        toast.success(notes.join(' · ') || '업로드 완료');
      } else {
        toast.warning(notes.join(' · '), {
          description: result.errors
            .slice(0, 3)
            .map((e) => `${e.index}행: ${e.message}`)
            .join('\n'),
        });
      }

      setUploadOpen(false);
      setPendingFile(null);
      onUploaded?.();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFilePick(file);
          e.target.value = '';
        }}
      />
      <Button variant="outline" size="sm" onClick={handleTemplate}>
        <FileSpreadsheet className="mr-1 size-4" />
        양식
      </Button>
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-1 size-4" />
        엑셀 업로드
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport}>
        <Download className="mr-1 size-4" />
        내보내기
      </Button>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>엑셀 대량 등록</DialogTitle>
            <DialogDescription>
              선택한 총판·대행사의 항목으로 일괄 등록합니다.
              {pendingFile && (
                <>
                  <br />파일: <span className="font-medium">{pendingFile.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>총판</Label>
              <Select
                value={agencyId}
                onValueChange={(v) => {
                  setAgencyId(v);
                  setSellerId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="총판 선택" />
                </SelectTrigger>
                <SelectContent>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>대행사</Label>
              <Select value={sellerId} onValueChange={setSellerId} disabled={!agencyId}>
                <SelectTrigger>
                  <SelectValue placeholder="대행사 선택" />
                </SelectTrigger>
                <SelectContent>
                  {sellers.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} ({s.seller_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadOpen(false);
                setPendingFile(null);
              }}
            >
              취소
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !agencyId || !sellerId}>
              {uploading ? '업로드 중...' : '업로드'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
