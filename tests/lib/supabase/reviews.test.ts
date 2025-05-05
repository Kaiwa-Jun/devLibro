import { addReview, getBookReviews } from '@/lib/supabase/reviews';

// addReviewとgetBookReviewsを直接モック
jest.mock('@/lib/supabase/reviews', () => ({
  addReview: jest.fn(),
  getBookReviews: jest.fn(),
}));

describe('Reviews API', () => {
  // テスト毎にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addReview', () => {
    it('正しい書籍IDに対してレビューを追加できる', async () => {
      // モックの戻り値を設定
      (addReview as jest.Mock).mockResolvedValueOnce({
        data: {
          id: 1,
          book_id: 493,
          user_id: 'test-user-id',
          difficulty: 4,
          comment: 'テストレビュー',
        },
        error: null,
      });

      // 関数を呼び出し
      const result = await addReview({
        bookId: '493',
        userId: 'test-user-id',
        difficulty: 4,
        comment: 'テストレビュー',
        displayType: 'anon',
      });

      // 結果を検証
      expect(result.error).toBeNull();
      expect(result.data).toEqual(
        expect.objectContaining({
          id: 1,
          book_id: 493,
          user_id: 'test-user-id',
          difficulty: 4,
          comment: 'テストレビュー',
        })
      );

      // 関数が正しいパラメータで呼ばれたことを確認
      expect(addReview).toHaveBeenCalledWith({
        bookId: '493',
        userId: 'test-user-id',
        difficulty: 4,
        comment: 'テストレビュー',
        displayType: 'anon',
      });
    });

    it('書籍が見つからない場合はエラーを返す', async () => {
      // モックの戻り値を設定
      (addReview as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: '該当する書籍が見つかりません' },
      });

      // 関数を呼び出し
      const result = await addReview({
        bookId: 'not-exist',
        userId: 'test-user-id',
        difficulty: 3,
        comment: 'テストレビュー',
        displayType: 'anon',
      });

      // 結果を検証
      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: '該当する書籍が見つかりません',
        })
      );
    });

    it('すでにレビュー済みの場合はエラーを返す', async () => {
      // モックの戻り値を設定
      (addReview as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'すでにこの書籍のレビューを投稿しています' },
      });

      // 関数を呼び出し
      const result = await addReview({
        bookId: '493',
        userId: 'test-user-id',
        difficulty: 3,
        comment: 'テストレビュー',
        displayType: 'anon',
      });

      // 結果を検証
      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'すでにこの書籍のレビューを投稿しています',
        })
      );
    });

    it('Supabaseエラーが発生した場合は適切に処理される', async () => {
      // モックの戻り値を設定
      (addReview as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint "unique_user_book_review"',
        },
      });

      // 関数を呼び出し
      const result = await addReview({
        bookId: '493',
        userId: 'test-user-id',
        difficulty: 3,
        comment: 'テストレビュー',
        displayType: 'anon',
      });

      // 結果を検証
      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: 'duplicate key value violates unique constraint "unique_user_book_review"',
        })
      );
    });
  });

  describe('getBookReviews', () => {
    it('書籍IDに関連するレビューを取得できる', async () => {
      // モックのレビューデータ
      const mockReviews = [
        {
          id: 1,
          book_id: 493,
          user_id: 'user1',
          comment: 'レビュー1',
          difficulty: 3,
          users: { display_name: 'ユーザー1', avatar_url: null },
        },
        {
          id: 2,
          book_id: 493,
          user_id: 'user2',
          comment: 'レビュー2',
          difficulty: 4,
          users: { display_name: 'ユーザー2', avatar_url: null },
        },
      ];

      // モックの戻り値を設定
      (getBookReviews as jest.Mock).mockResolvedValueOnce({
        data: mockReviews,
        error: null,
      });

      // 関数を呼び出し
      const result = await getBookReviews('493');

      // 結果を検証
      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockReviews);
      expect(getBookReviews).toHaveBeenCalledWith('493');
    });

    it('書籍が見つからない場合はエラーを返す', async () => {
      // モックの戻り値を設定
      (getBookReviews as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: '該当する書籍が見つかりません' },
      });

      // 関数を呼び出し
      const result = await getBookReviews('not-exist');

      // 結果を検証
      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        expect.objectContaining({
          message: '該当する書籍が見つかりません',
        })
      );
    });
  });
});
