/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/*', '/auth/*', '/login'],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/server-sitemap.xml`,
    ],
  },
  // 特定のページを除外
  exclude: ['/api/*', '/auth/*', '/login'],
  // サーバーサイドで生成されたページに高い優先度を設定
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  // ページのタイプに基づいて優先度を設定するカスタム関数
  transform: async (config, path) => {
    // トップページに最高の優先度を与える
    if (path === '/') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // 書籍一覧ページに高い優先度を与える
    if (path.startsWith('/book') && !path.includes('/book/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString(),
      };
    }

    // 書籍詳細ページに中程度の優先度を与える
    if (path.startsWith('/book/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    // その他のページにデフォルトの優先度を与える
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: new Date().toISOString(),
    };
  },
};
