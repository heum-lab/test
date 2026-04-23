'use client';

import { useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { uploadBlogAttachment } from '@/lib/storage';

type Props = {
  value?: string | null;
  onChange: (path: string | null) => void;
  accept?: string;
  maxSizeMB?: number;
};

export function FileUploader({ value, onChange, accept, maxSizeMB = 10 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`${maxSizeMB}MB 이하 파일만 업로드할 수 있습니다.`);
      return;
    }
    setUploading(true);
    try {
      const path = await uploadBlogAttachment(file);
      onChange(path);
      toast.success('파일이 업로드되었습니다.');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        <Paperclip className="mr-1 size-4" />
        {uploading ? '업로드 중...' : value ? '파일 교체' : '파일 선택'}
      </Button>
      {value && (
        <div className="flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-1 text-xs">
          <span className="max-w-[200px] truncate" title={value}>
            {value.split('/').pop()}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-destructive)]"
            aria-label="첨부 제거"
          >
            <X className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
