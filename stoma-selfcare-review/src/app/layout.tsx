import './globals.css';
import type { Metadata, Viewport } from 'next';
import { BASE_PATH, APP_NAME, CLIENT_NAME } from '@/lib/path';

export const metadata: Metadata = {
  title: `${APP_NAME} · ${CLIENT_NAME}`,
  description: '面向肠造口患者的居家自护记录与造口专科护士 AI 复核助手。',
  icons: { icon: `${BASE_PATH}/logo.png` },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
