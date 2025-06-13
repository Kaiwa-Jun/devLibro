import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '輪読会 | DevLibro',
  description: 'みんなで本を読んで学びを深めよう',
};

export default function ReadingCirclesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
