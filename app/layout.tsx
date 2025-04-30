import { Inter } from 'next/font/google';
import './globals.css';

import AuthProvider from '@/components/auth/AuthProvider';
import Header from '@/components/layout/Header';
import TabBar from '@/components/layout/TabBar';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';

import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DevLibro - 技術書書評アプリ',
  description: '開発者のための技術書レビュー・管理プラットフォーム',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'DevLibro - 技術書書評アプリ',
    description: '開発者のための技術書レビュー・管理プラットフォーム',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 container mx-auto px-4 pt-16 pb-20">{children}</main>
              <TabBar />
            </div>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
