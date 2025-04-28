# devLibro テスト環境ガイド

## 概要

devLibro では、TDD（テスト駆動開発）アプローチに基づいた開発を行うため、以下のテスト環境を用意しています：

- **Jest**: JavaScript/TypeScript のテストフレームワーク
- **React Testing Library**: React コンポーネントのテストに特化したライブラリ
- **カバレッジレポート**: コードの網羅率を可視化
- **CI 連携**: GitHub Actions と連携したテスト自動化

## テスト実行コマンド

```bash
# 全テストの実行
npm test

# 変更を監視して自動的にテストを実行（開発中におすすめ）
npm run test:watch

# テストカバレッジレポートの生成
npm run test:coverage

# CI環境用のテスト実行（GitHub Actionsで使用）
npm run test:ci
```

## ディレクトリ構成

```
tests/
├── components/         # コンポーネントテスト
├── hooks/              # カスタムフックテスト
└── utils/              # ユーティリティ関数テスト
```

## テストファイルの命名規則

- コンポーネントテスト: `ComponentName.test.tsx`
- フックテスト: `useHookName.test.ts`
- ユーティリティテスト: `utilityName.test.ts`

## TDD アプローチ

devLibro では以下の TDD サイクルに従って開発を進めることを推奨します：

1. **赤**: 失敗するテストを書く
2. **緑**: テストが通るように最小限の実装を行う
3. **リファクタリング**: コードを改善する（テストは引き続き通過することを確認）

## コンポーネントテストの例

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("renders correctly with default props", () => {
    render(<Button>テストボタン</Button>);

    const button = screen.getByRole("button", { name: "テストボタン" });
    expect(button).toBeInTheDocument();
  });

  it("calls onClick handler when clicked", async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>クリック</Button>);

    const button = screen.getByRole("button", { name: "クリック" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## API モックの例

```tsx
// APIモックの例
beforeEach(() => {
  global.fetch = jest.fn();
});

it("fetches book data", async () => {
  const mockResponse = {
    items: [{ volumeInfo: { title: "テスト書籍" } }],
  };

  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => mockResponse,
  });

  // APIコールのテスト
});
```

## Supabase のモック

```tsx
// Supabaseクライアントのモック例
jest.mock("@/lib/supabase", () => ({
  supabaseClient: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    data: {
      /* モックデータ */
    },
  },
}));
```

## テストカバレッジ

カバレッジレポートは `npm run test:coverage` を実行後、`coverage/` ディレクトリで確認できます。以下の情報が含まれます：

- ステートメントカバレッジ: 実行されたコード行の割合
- ブランチカバレッジ: 条件分岐の網羅率
- 関数カバレッジ: テストされた関数の割合
- 行カバレッジ: テストされたコード行の割合

## ベストプラクティス

1. **実装の詳細ではなく、動作をテスト**: コンポーネントの内部実装よりも、期待する動作や出力に焦点を当てる
2. **アクセシビリティを考慮**: `getByRole` などのアクセシビリティに基づいたセレクタを優先する
3. **モックは最小限に**: 必要な部分だけをモックし、実際の動作をできるだけ再現する
4. **テストの独立性**: 各テストは独立して実行できるようにする
5. **保守性の高いテスト**: テストコードも通常のコードと同様に、保守性を意識する

## CI/CD 連携

GitHub Actions を使用して、PR や push のたびに自動的にテストを実行します。詳細は `.github/workflows/test.yml` を参照してください。

---

このドキュメントは開発チーム向けのガイドラインです。テスト環境について質問や提案がある場合は、Issue を作成してください。
