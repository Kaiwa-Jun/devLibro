const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリへのパス
  dir: './',
});

// Jestに渡すカスタム設定
const customJestConfig = {
  // テストファイルのパターンを追加
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  // テスト環境のセットアップ
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // モジュールのモック設定
  moduleNameMapper: {
    // CSSやその他のアセットファイルをモック
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // パスエイリアスの設定（tsconfig.jsonと一致させる）
    '^@/(.*)$': '<rootDir>/$1',
  },
  // テストの対象から除外するディレクトリ
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  // テストカバレッジの設定
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!next.config.js',
  ],
  // テスト環境をjsdomに設定
  testEnvironment: 'jest-environment-jsdom',
};

// createJestConfigを使用することによって、next/jestが提供する設定がデフォルトで設定される
module.exports = createJestConfig(customJestConfig);
