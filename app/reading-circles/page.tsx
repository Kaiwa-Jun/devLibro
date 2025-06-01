import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '輪読会 | DevLibro',
  description: '技術書の輪読会を開催・参加できます',
};

export default function ReadingCirclesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">輪読会</h1>

        <div className="text-center text-muted-foreground">
          <p className="text-lg mb-4">技術書の輪読会機能は準備中です</p>
          <p>近日公開予定です。お楽しみに！</p>
        </div>
      </div>
    </div>
  );
}
