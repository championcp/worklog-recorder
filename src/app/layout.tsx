import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nobody Logger - 工作日志记录系统',
  description: '个人工作日志记录和时间管理系统，支持WBS多层级计划管理',
  keywords: ['工作日志', '时间管理', 'WBS', '项目管理', '效率工具'],
  authors: [{ name: 'Nobody Logger Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        <div id="root">{children}</div>
        <div id="portal-root" />
      </body>
    </html>
  );
}