/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // メモリキャッシュを使用してファイルシステムの問題を回避
  webpack: config => {
    config.cache = {
      type: 'memory',
    };
    return config;
  },
};

module.exports = nextConfig;
