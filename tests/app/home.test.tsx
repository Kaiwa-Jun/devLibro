import Home from '@/app/page';
import '@testing-library/jest-dom';
import { redirect } from 'next/navigation';

// next/navigationのリダイレクト関数をモック化
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('ホームページ', () => {
  beforeEach(() => {
    // テスト実行前にモックをリセット
    jest.clearAllMocks();
  });

  test('ホーム画面が/rakutenにリダイレクトされることを確認', () => {
    try {
      // Homeコンポーネントをインスタンス化
      // redirectがトップレベルで呼び出されるため、実際にレンダリングはされません
      Home();
    } catch (error) {
      // redirectがエラーをスローする可能性がある（通常の動作）
      console.error('Expected error occurred:', error);
    }

    // redirectが'/rakuten'へのリダイレクトで呼び出されたか確認
    expect(redirect).toHaveBeenCalledWith('/rakuten');
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});
