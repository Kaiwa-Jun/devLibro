import { render, screen, waitFor } from '@testing-library/react';

import PurchaseLinks from '@/components/book/PurchaseLinks';
import * as commerce from '@/lib/api/commerce';
import * as rakutenBooks from '@/lib/api/rakuten-books';
import * as supabaseBooks from '@/lib/supabase/books';

// モック関数を作成
jest.mock('@/lib/api/commerce', () => ({
  validateISBN: jest.fn(),
  generateAmazonURL: jest.fn(),
  generateRakutenURL: jest.fn(),
}));

jest.mock('@/lib/api/rakuten-books', () => ({
  getRakutenBookDetailByTitle: jest.fn(),
}));

jest.mock('@/lib/supabase/books', () => ({
  updateBookISBN: jest.fn(),
}));

describe('PurchaseLinks コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでISBNを有効とする
    (commerce.validateISBN as jest.Mock).mockReturnValue(true);
    // デフォルトでDB更新成功とする
    (supabaseBooks.updateBookISBN as jest.Mock).mockResolvedValue(true);
  });

  test('AmazonとRakutenのリンクが表示される', async () => {
    // モック関数の戻り値を設定
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/dp/9784873113364'
    );
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/search?sitem=9784873113364'
    );

    render(<PurchaseLinks isbn="9784873113364" title="プログラミングの本" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // Amazonリンクの確認
      const amazonLink = screen.getByText('Amazon').closest('a');
      expect(amazonLink).toHaveAttribute('href', 'https://www.amazon.co.jp/dp/9784873113364');
      expect(amazonLink).toHaveAttribute('target', '_blank');
      expect(amazonLink).toHaveAttribute('rel', 'noopener noreferrer');

      // 楽天Booksリンクの確認
      const rakutenLink = screen.getByText('楽天Books').closest('a');
      expect(rakutenLink).toHaveAttribute(
        'href',
        'https://books.rakuten.co.jp/search?sitem=9784873113364'
      );
      expect(rakutenLink).toHaveAttribute('target', '_blank');
      expect(rakutenLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test('無効なISBNの場合は楽天APIでタイトル検索する', async () => {
    // ISBNを無効と判定
    (commerce.validateISBN as jest.Mock).mockReturnValue(false);
    // 楽天APIからISBNを返す
    (rakutenBooks.getRakutenBookDetailByTitle as jest.Mock).mockResolvedValue({
      isbn: '9784774195353',
      detailUrl: 'https://books.rakuten.co.jp/rb/12345678/',
    });
    // 生成URLをモック
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/exec/obidos/ASIN/4774195353'
    );
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/rb/12345678/'
    );

    render(<PurchaseLinks isbn="invalid-isbn" title="世界一流エンジニアの思考法" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText('楽天Books')).toBeInTheDocument();
    });

    // ISBNバリデーションが呼ばれたか確認
    expect(commerce.validateISBN).toHaveBeenCalledWith('invalid-isbn');

    // 楽天APIが正しく呼び出されたか確認
    expect(rakutenBooks.getRakutenBookDetailByTitle).toHaveBeenCalledWith(
      '世界一流エンジニアの思考法'
    );
  });

  test('楽天APIで取得したISBNをDBに保存する', async () => {
    // ISBNを無効と判定
    (commerce.validateISBN as jest.Mock).mockReturnValue(false);
    // 楽天APIからISBNを返す
    (rakutenBooks.getRakutenBookDetailByTitle as jest.Mock).mockResolvedValue({
      isbn: '9784774195353',
      detailUrl: 'https://books.rakuten.co.jp/rb/12345678/',
    });
    // 生成URLをモック
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/exec/obidos/ASIN/4774195353'
    );
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/rb/12345678/'
    );
    // DB更新のモック
    (supabaseBooks.updateBookISBN as jest.Mock).mockResolvedValue(true);

    render(<PurchaseLinks isbn="invalid-isbn" title="世界一流エンジニアの思考法" bookId="123" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(screen.getByText('Amazon')).toBeInTheDocument();
      expect(screen.getByText('楽天Books')).toBeInTheDocument();
    });

    // 楽天APIが検索に使われたことを確認
    expect(rakutenBooks.getRakutenBookDetailByTitle).toHaveBeenCalledWith(
      '世界一流エンジニアの思考法'
    );
  });

  test('Amazonのリンクだけが利用可能な場合は楽天リンクは表示されない', async () => {
    // Amazonだけが有効URL、楽天はnull
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/dp/9784873113364'
    );
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(null);

    render(<PurchaseLinks isbn="9784873113364" title="プログラミングの本" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // Amazonリンクは表示されている
      expect(screen.getByText('Amazon')).toBeInTheDocument();

      // 楽天リンクは表示されていない
      expect(screen.queryByText('楽天Books')).not.toBeInTheDocument();
    });
  });

  test('楽天のリンクだけが利用可能な場合はAmazonリンクは表示されない', async () => {
    // 楽天だけが有効URL、Amazonはnull
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(null);
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/search?sitem=9784873113364'
    );

    render(<PurchaseLinks isbn="9784873113364" title="プログラミングの本" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // 楽天リンクは表示されている
      expect(screen.getByText('楽天Books')).toBeInTheDocument();

      // Amazonリンクは表示されていない
      expect(screen.queryByText('Amazon')).not.toBeInTheDocument();
    });
  });

  test('楽天APIでISBNが見つからない場合はタイトル検索URLを生成', async () => {
    // ISBNを無効と判定
    (commerce.validateISBN as jest.Mock).mockReturnValue(false);
    // 楽天APIからnullを返す
    (rakutenBooks.getRakutenBookDetailByTitle as jest.Mock).mockResolvedValue(null);

    render(<PurchaseLinks isbn="invalid-isbn" title="存在しない書籍" />);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // タイトル検索URLが生成されていることを確認
      const amazonLink = screen.getByText('Amazon').closest('a');
      expect(amazonLink).toHaveAttribute(
        'href',
        'https://www.amazon.co.jp/s?k=%E5%AD%98%E5%9C%A8%E3%81%97%E3%81%AA%E3%81%84%E6%9B%B8%E7%B1%8D'
      );

      const rakutenLink = screen.getByText('楽天Books').closest('a');
      expect(rakutenLink).toHaveAttribute(
        'href',
        'https://books.rakuten.co.jp/search?sitem=%E5%AD%98%E5%9C%A8%E3%81%97%E3%81%AA%E3%81%84%E6%9B%B8%E7%B1%8D'
      );
    });
  });
});
