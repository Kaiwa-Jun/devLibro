// Jest拡張とグローバル設定を追加
import '@testing-library/jest-dom';

// テスト実行前のグローバルモックセットアップ
// 例: fetch APIのモック
global.fetch = jest.fn();

// window.matchMediaのモック
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false, // デフォルトではfalseを返す
    media: query,
    onchange: null,
    addListener: jest.fn(), // 廃止予定のメソッド
    removeListener: jest.fn(), // 廃止予定のメソッド
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 警告を無視する設定
// コンソール出力をクリーンに保つために役立つ
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    /Warning: ReactDOM.render is no longer supported in React 18./.test(args[0]) ||
    /Warning: The current testing environment is not configured to support act/.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
};

// ESLint警告を防ぐためのglobal jestの定義
global.jest = jest;
