import nextConfig from '@/next.config';

describe('Next.js設定', () => {
  test('楽天画像ドメインが許可リストに含まれていることを確認', () => {
    // next.config.jsが存在することを確認
    expect(nextConfig).toBeDefined();

    // Images設定が存在することを確認
    expect(nextConfig.images).toBeDefined();

    // domainsリストが存在することを確認
    expect(nextConfig.images.domains).toBeDefined();
    expect(Array.isArray(nextConfig.images.domains)).toBe(true);

    // 楽天の画像ドメインが含まれていることを確認
    expect(nextConfig.images.domains).toContain('thumbnail.image.rakuten.co.jp');
  });
});
