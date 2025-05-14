import { MetadataRoute } from 'next';

// 動的書籍IDの例（実際の実装では、データベースからIDを取得する）
async function getBookIds(): Promise<string[]> {
  // ここで実際のデータベースからIDを取得するロジックを実装
  // 例として静的なIDを返す
  return ['1', '2', '3', '4', '5'];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // 静的ページの定義
  const staticPages = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
  ];

  // 動的書籍ページの取得
  const bookIds = await getBookIds();
  const bookPages = bookIds.map(id => ({
    url: `${baseUrl}/book/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...bookPages];
}
