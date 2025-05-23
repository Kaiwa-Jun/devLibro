import { Inter } from 'next/font/google';
import './globals.css';

import CookieConsent from '@/components/analytics/CookieConsent';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import AuthProvider from '@/components/auth/AuthProvider';
import ExperienceCheck from '@/components/auth/ExperienceCheck';
import DebugInfo from '@/components/debug/DebugInfo';
import Header from '@/components/layout/Header';
import TabBar from '@/components/layout/TabBar';
import AnalyticsProvider from '@/components/providers/AnalyticsProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { getDefaultMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = getDefaultMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleAnalytics />
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AnalyticsProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 container mx-auto px-4 pt-16 pb-20">{children}</main>
                <TabBar />
              </div>
              <ExperienceCheck />
              <Toaster />
              <CookieConsent />
              <DebugInfo />
            </AnalyticsProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
