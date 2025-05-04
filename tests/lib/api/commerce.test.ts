import {
  convertISBN13ToISBN10,
  generateAmazonURL,
  generateRakutenURL,
  validateISBN,
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
