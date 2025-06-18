/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Vercelデプロイのために無効化
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // unoptimized: true, // Vercelデプロイのために変更
    domains: [
      'vercel.com',
      'images.pexels.com',
      'books.google.com',
      'covers.openlibrary.org',
      'm.media-amazon.com',
      'images-na.ssl-images-amazon.com',
      'images-fe.ssl-images-amazon.com',
      'thumbnail.image.rakuten.co.jp',
      'localhost',
      'placehold.co',
      'lh3.googleusercontent.com',
      'via.placeholder.com',
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    formats: ['image/webp'],
  },
  // SWCコンパイラを強制的に使用
  swcMinify: true,
  experimental: {
    // SSGベースのエクスポートを使用
    isrMemoryCacheSize: 0,
    // 必要に応じて下記の設定を追加
    // esmExternals: false,
  },
  // メモリキャッシュを使用してファイルシステムの問題を回避
  webpack: (config, { isServer }) => {
    config.cache = {
      type: 'memory',
    };

    // Supabaseモジュールの解決問題を修正
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // 外部モジュールの設定
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }

    return config;
  },
  // Radix UIパッケージとSupabaseをtranspileする
  transpilePackages: [
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-menu',
    '@radix-ui/react-dialog',
    '@radix-ui/react-popover',
    '@radix-ui/react-accordion',
    '@radix-ui/react-tabs',
    '@radix-ui/primitive',
    'lucide-react',
    '@supabase/supabase-js',
    '@supabase/ssr',
    '@supabase/auth-helpers-nextjs',
  ],
  // コンパイル時の環境変数設定
  env: {
    // 開発環境ではテスト用GA測定IDを使用（本番環境では.envファイルから取得）
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NODE_ENV === 'production'
        ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
        : 'G-DEVELOPMENT-ID', // 開発環境用のID
  },
  // ホスト名の設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
