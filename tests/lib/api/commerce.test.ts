import {
  convertISBN13ToISBN10,
  formatASIN,
  generateAmazonDirectURL,
  generateAmazonURL,
  generateAmazonURLFromASIN,
  generateRakutenSearchURL,
  generateRakutenURL,
  validateISBN,
  validateIdentifier,
} from '@/lib/api/commerce';

describe('ISBNバリデーション関数', () => {
  test('有効なISBN-10を検証できる', () => {
    expect(validateISBN('4873113369')).toBe(true);
    expect(validateISBN('0-306-40615-2')).toBe(true);
  });

  test('有効なISBN-13を検証できる', () => {
    expect(validateISBN('9784873113364')).toBe(true);
    expect(validateISBN('978-4-87311-336-4')).toBe(true);
  });

  test('無効なISBNを拒否する', () => {
    expect(validateISBN('1234567890')).toBe(false);
    expect(validateISBN('9781234567890')).toBe(false);
    expect(validateISBN('')).toBe(false);
    expect(validateISBN('abc')).toBe(false);
  });
});

describe('ISBN-13からISBN-10への変換関数', () => {
  test('有効なISBN-13をISBN-10に変換できる', () => {
    expect(convertISBN13ToISBN10('9784873113364')).toBe('4873113362');
    expect(convertISBN13ToISBN10('9780306406157')).toBe('0306406152');
  });

  test('978で始まらないISBN-13は変換せずそのまま返す', () => {
    expect(convertISBN13ToISBN10('9794873113364')).toBe('9794873113364');
  });

  test('ISBN-13でない場合は元の値を返す', () => {
    expect(convertISBN13ToISBN10('4873113369')).toBe('4873113369');
    expect(convertISBN13ToISBN10('invalid')).toBe('invalid');
  });
});

describe('Amazon URL生成関数', () => {
  test('有効なISBNからAmazon URLを生成できる', () => {
    const url = generateAmazonURL('9784873113364');
    expect(url).toBe('https://www.amazon.co.jp/exec/obidos/ASIN/4873113362');
  });

  test('ISBN-10はそのまま使用する', () => {
    const url = generateAmazonURL('4873113369');
    expect(url).toBe('https://www.amazon.co.jp/exec/obidos/ASIN/4873113369');
  });

  test('アフィリエイトIDを指定してURLを生成できる', () => {
    const url = generateAmazonURL('9784873113364', { affiliateId: 'devlibro-22' });
    expect(url).toBe('https://www.amazon.co.jp/exec/obidos/ASIN/4873113362/devlibro-22');
  });

  test('無効なISBNの場合はnullを返す', () => {
    const url = generateAmazonURL('invalid-isbn');
    expect(url).toBeNull();
  });
});

describe('楽天Books URL生成関数', () => {
  test('有効なISBNから楽天Books URLを生成できる', () => {
    const url = generateRakutenURL('9784873113364');
    expect(url).toBe('https://books.rakuten.co.jp/search?sitem=9784873113364');
  });

  test('アフィリエイトIDを指定してURLを生成できる', () => {
    const url = generateRakutenURL('9784873113364', { affiliateId: '12345678.abcdefgh' });
    expect(url).toBe(
      'https://books.rakuten.co.jp/search?sitem=9784873113364&afid=12345678.abcdefgh'
    );
  });

  test('無効なISBNの場合はnullを返す', () => {
    const url = generateRakutenURL('invalid-isbn');
    expect(url).toBeNull();
  });
});

describe('ASINフォーマット関数', () => {
  test('有効なASINはそのまま返す', () => {
    expect(formatASIN('B07DQDMGDK')).toBe('B07DQDMGDK');
  });

  test('無効なパターンのASINはエラーフラグを返す', () => {
    expect(formatASIN('B101900209')).toBe('INVALID_ASIN_USE_TITLE_SEARCH');
    expect(formatASIN('B00000000B')).toBe('INVALID_ASIN_USE_TITLE_SEARCH');
  });

  test('空文字列の場合は空文字を返す', () => {
    expect(formatASIN('')).toBe('');
  });
});

describe('ASINからのAmazon URL生成関数', () => {
  test('有効なASINからAmazon URLを生成できる', () => {
    const url = generateAmazonURLFromASIN('B07DQDMGDK');
    expect(url).toBe('https://www.amazon.co.jp/exec/obidos/ASIN/B07DQDMGDK');
  });

  test('アフィリエイトIDを指定してURLを生成できる', () => {
    const url = generateAmazonURLFromASIN('B07DQDMGDK', { affiliateId: 'devlibro-22' });
    expect(url).toBe('https://www.amazon.co.jp/exec/obidos/ASIN/B07DQDMGDK/devlibro-22');
  });

  test('空のASINの場合はnullを返す', () => {
    const url = generateAmazonURLFromASIN('');
    expect(url).toBeNull();
  });

  test('無効なASINパターンの場合はnullを返す', () => {
    // formatASINがINVALID_ASIN_USE_TITLE_SEARCHを返すケース
    const url = generateAmazonURLFromASIN('B101900209');
    expect(url).toBeNull();
  });
});

describe('タイトルからのAmazon検索URL生成関数', () => {
  test('タイトルのみからAmazon検索URLを生成できる', () => {
    const url = generateAmazonDirectURL('テスト書籍');
    expect(url).toContain('https://www.amazon.co.jp/s?k=');
    expect(url).toContain('%22%E3%83%86%E3%82%B9%E3%83%88%E6%9B%B8%E7%B1%8D%22');
  });

  test('タイトルと著者からAmazon検索URLを生成できる', () => {
    const url = generateAmazonDirectURL('テスト書籍', 'テスト著者');
    expect(url).toContain('https://www.amazon.co.jp/s?k=');
    expect(url).toContain('%22%E3%83%86%E3%82%B9%E3%83%88%E6%9B%B8%E7%B1%8D%22');
    expect(url).toContain('%E3%83%86%E3%82%B9%E3%83%88%E8%91%97%E8%80%85');
  });

  test('空のタイトルの場合は空文字を返す', () => {
    const url = generateAmazonDirectURL('');
    expect(url).toBe('');
  });
});

describe('タイトルからの楽天検索URL生成関数', () => {
  test('タイトルのみから楽天検索URLを生成できる', () => {
    const url = generateRakutenSearchURL('テスト書籍');
    expect(url).toContain('https://books.rakuten.co.jp/search?sitem=');
    expect(url).toContain('%E3%83%86%E3%82%B9%E3%83%88%E6%9B%B8%E7%B1%8D');
  });

  test('タイトルと著者から楽天検索URLを生成できる', () => {
    const url = generateRakutenSearchURL('テスト書籍', 'テスト著者');
    expect(url).toContain('https://books.rakuten.co.jp/search?sitem=');
    expect(url).toContain('%E3%83%86%E3%82%B9%E3%83%88%E6%9B%B8%E7%B1%8D');
    expect(url).toContain('%E3%83%86%E3%82%B9%E3%83%88%E8%91%97%E8%80%85');
  });

  test('空のタイトルの場合は空文字を返す', () => {
    const url = generateRakutenSearchURL('');
    expect(url).toBe('');
  });
});

describe('識別子検証関数', () => {
  test('有効なISBNを検証できる', () => {
    expect(validateIdentifier('9784873113364')).toBe(true);
    expect(validateIdentifier('4873113369')).toBe(true);
  });

  test('有効なASINを検証できる', () => {
    expect(validateIdentifier('B07DQDMGDK')).toBe(true);
  });

  test('自動生成された識別子を検証できる', () => {
    expect(validateIdentifier('N-TestBook-TestA-123456')).toBe(true);
    expect(validateIdentifier('GB-ABCD1234')).toBe(true);
  });

  test('無効な識別子を拒否する', () => {
    expect(validateIdentifier('1234567890')).toBe(false);
    expect(validateIdentifier('')).toBe(false);
    expect(validateIdentifier('B00000000B')).toBe(false);
  });
});
