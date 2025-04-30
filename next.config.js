/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Vercelデプロイのために無効化
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // unoptimized: true, // Vercelデプロイのために変更
    domains: ['vercel.com', 'images.pexels.com'],
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
    return config;
  },
  // Radix UIパッケージをtranspileする
  transpilePackages: [
    '@radix-ui/react-dropdown-menu',
    '@radix-ui/react-menu',
    '@radix-ui/react-dialog',
    '@radix-ui/react-popover',
    '@radix-ui/react-accordion',
    '@radix-ui/react-tabs',
    '@radix-ui/primitive',
    'lucide-react',
  ],
};

module.exports = nextConfig;
