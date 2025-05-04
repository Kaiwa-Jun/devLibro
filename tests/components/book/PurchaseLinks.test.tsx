import { render, screen } from '@testing-library/react';

import PurchaseLinks from '@/components/book/PurchaseLinks';
import * as commerce from '@/lib/api/commerce';

// モック関数を作成
jest.mock('@/lib/api/commerce', () => ({
  generateAmazonURL: jest.fn(),
  generateRakutenURL: jest.fn(),
}));

describe('PurchaseLinks コンポーネント', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  test('無効なISBNの場合は何も表示されない', () => {
    // モック関数がnullを返すように設定
    (commerce.generateAmazonURL as jest.Mock).mockReturnValue(null);
    (commerce.generateRakutenURL as jest.Mock).mockReturnValue(null);

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
