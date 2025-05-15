import { render, screen } from '@testing-library/react';

import PurchaseLinks from '@/components/book/PurchaseLinks';
import * as commerce from '@/lib/api/commerce';

// モック関数を作成
jest.mock('@/lib/api/commerce', () => ({
  generateAmazonURL: jest.fn(),
  generateRakutenURL: jest.fn(),
  generateAmazonURLFromASIN: jest.fn(),
  generateAmazonDirectURL: jest.fn(),
  generateRakutenSearchURL: jest.fn(),
  formatASIN: jest.fn(),
  validateISBN: jest.fn(),
}));

describe('PurchaseLinks コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック戻り値を設定
    (commerce.validateISBN as jest.Mock).mockImplementation(isbn => {
      return isbn === '9784873113364';
    });
  });

  test('AmazonとRakutenのリンクが表示される', () => {
    // モック関数の戻り値を設定
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/dp/9784873113364'
    );
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/search?sitem=9784873113364'
    );

    render(<PurchaseLinks isbn="9784873113364" />);

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

  test('無効なISBNの場合でもタイトルがあれば検索リンクが表示される', () => {
    // ISBNからの生成は失敗
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(null);
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(null);
    // タイトル検索URLは成功
    (commerce.generateAmazonDirectURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/s?k=test+book'
    );
    (commerce.generateRakutenSearchURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/search?sitem=test+book'
    );
    // 無効なISBN
    (commerce.validateISBN as jest.Mock).mockReturnValue(false);

    render(<PurchaseLinks isbn="invalid-isbn" title="Test Book" author="Test Author" />);

    // Amazonリンクの確認（「検索」の文字なし）
    const amazonLink = screen.getByText('Amazon').closest('a');
    expect(amazonLink).toHaveAttribute('href', 'https://www.amazon.co.jp/s?k=test+book');

    // 楽天Booksリンクの確認（「検索」の文字なし）
    const rakutenLink = screen.getByText('楽天Books').closest('a');
    expect(rakutenLink).toHaveAttribute(
      'href',
      'https://books.rakuten.co.jp/search?sitem=test+book'
    );
  });

  test('ASINの場合、AmazonのASINリンクが表示される', () => {
    // ISBNベースのリンク生成は失敗
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(null);
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(null);
    // ASINのフォーマット
    (commerce.formatASIN as jest.Mock).mockReturnValue('B07DQDMGDK');
    // ASINからのリンク生成は成功
    (commerce.generateAmazonURLFromASIN as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/exec/obidos/ASIN/B07DQDMGDK'
    );
    // 無効なISBN
    (commerce.validateISBN as jest.Mock).mockReturnValue(false);

    render(<PurchaseLinks isbn="B07DQDMGDK" />);

    // Amazonリンクの確認
    const amazonLink = screen.getByText('Amazon').closest('a');
    expect(amazonLink).toHaveAttribute(
      'href',
      'https://www.amazon.co.jp/exec/obidos/ASIN/B07DQDMGDK'
    );
  });

  test('無効なISBNかつタイトルなしの場合は何も表示されない', () => {
    // すべてのURL生成が失敗
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(null);
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(null);
    (commerce.generateAmazonURLFromASIN as jest.Mock).mockReturnValue(null);
    // 無効なISBN
    (commerce.validateISBN as jest.Mock).mockReturnValue(false);
    // 無効なASIN
    (commerce.formatASIN as jest.Mock).mockReturnValue('INVALID_ASIN_USE_TITLE_SEARCH');

    const { container } = render(<PurchaseLinks isbn="invalid-isbn" />);

    // コンポーネントが何も表示しないことを確認
    expect(container.firstChild).toBeNull();
  });

  test('Amazonのリンクだけが利用可能な場合は楽天リンクは表示されない', () => {
    // Amazonだけが有効URL、楽天はnull
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(
      'https://www.amazon.co.jp/dp/9784873113364'
    );
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(null);

    render(<PurchaseLinks isbn="9784873113364" />);

    // Amazonリンクは表示されている
    expect(screen.getByText('Amazon')).toBeInTheDocument();

    // 楽天リンクは表示されていない
    expect(screen.queryByText('楽天Books')).not.toBeInTheDocument();
  });

  test('楽天のリンクだけが利用可能な場合はAmazonリンクは表示されない', () => {
    // 楽天だけが有効URL、Amazonはnull
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(null);
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(
      'https://books.rakuten.co.jp/search?sitem=9784873113364'
    );

    render(<PurchaseLinks isbn="9784873113364" />);

    // 楽天リンクは表示されている
    expect(screen.getByText('楽天Books')).toBeInTheDocument();

    // Amazonリンクは表示されていない
    expect(screen.queryByText('Amazon')).not.toBeInTheDocument();
  });
});
