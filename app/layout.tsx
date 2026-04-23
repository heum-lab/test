import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: '프로핏',
  description: '플레이 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" translate="no">
      <body>
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
