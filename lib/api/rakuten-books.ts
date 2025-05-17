import { Book } from '@/types';

const RAKUTEN_BOOKS_API_URL = 'https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404';
const API_KEY = process.env.NEXT_PUBLIC_RAKUTEN_APP_ID;

// 楽天ブックスAPIからの応答型
export type RakutenBooksResponse = {
  Items: Array<{
    Item: {
      title: string;
      author: string;
      isbn: string;
      publisherName: string;
      itemCaption: string;
      largeImageUrl: string;
      mediumImageUrl: string;
      smallImageUrl: string;
      affiliateUrl: string;
      itemUrl: string;
      salesDate: string;
      contents: string;
      size: string;
      booksGenreId: string;
    };
  }>;
  count: number;
  page: number;
  pageCount: number;
  hits: number;
  carrier: number;
  GenreInformation: unknown[];
};

// ページネーションパラメータ型
export type SearchRakutenBooksParams = {
  query: string;
  page?: number;
  hits?: number;
};

// 楽天の画像URLをより高解像度に変換する関数
export function getHighResRakutenImageUrl(imageUrl: string): string {
  // nullやundefinedの場合はプレースホルダーを返す
  if (!imageUrl) {
    return '/images/book-placeholder.png';
  }

  // 既存のサイズパラメータを確認（例: ?_ex=200x200）
  const sizeParamRegex = /(\?|&)_ex=\d+x\d+/;

  // URLにクエリパラメータがあるか確認
  const hasQueryParams = imageUrl.includes('?');

  if (sizeParamRegex.test(imageUrl)) {
    // 既存のサイズパラメータを600x600に置き換え
    return imageUrl.replace(sizeParamRegex, '$1_ex=600x600');
  } else if (hasQueryParams) {
    // 他のクエリパラメータがある場合は&で追加
    return `${imageUrl}&_ex=600x600`;
  } else {
    // クエリパラメータがない場合は?で追加
    return `${imageUrl}?_ex=600x600`;
  }
}

// 技術書管理アプリに関連しないジャンルID（これらは検索結果から除外する）
const EXCLUDED_GENRE_IDS = [
  '001001', // 漫画（コミック）
  '001007', // アート・建築・デザイン
  '001008', // 絵本・児童書
  '001014', // タレント写真集
  '001015', // ゲーム攻略本
  '001016', // エンターテイメント
  '001017', // 新書
  '001018', // 文庫
  '001019', // ライトノベル
  '001020', // BL（ボーイズラブ）
  '001028', // 医学・薬学・看護学・歯科学
  '001029', // 健康・家庭医学
  '001031', // 暮らし・健康・子育て
];

// 技術書に関連するジャンルIDかどうかを判定する関数
const isRelevantBook = (booksGenreId: string): boolean => {
  if (!booksGenreId) return true; // ジャンルIDがない場合は表示する

  // 複数のジャンルIDがある場合（/区切り）はいずれかが除外カテゴリに含まれるか確認
  const genreIds = booksGenreId.split('/');

  // いずれかのジャンルIDが除外リストに含まれていればfalse（表示しない）
  return !genreIds.some(genreId =>
    EXCLUDED_GENRE_IDS.some(excludedId => genreId.startsWith(excludedId))
  );
};

// booksGenreIdからカテゴリを抽出する関数
const extractCategoriesFromGenreId = (booksGenreId: string): string[] => {
  if (!booksGenreId) return [];

  // 複数のジャンルがスラッシュで区切られている場合は分割
  const genreIds = booksGenreId.split('/');
  const categories: string[] = [];

  // 技術書管理アプリに関連するカテゴリのみを抽出する
  // 除外するカテゴリ: 漫画、アート・建築・デザイン、絵本・児童書、タレント写真集、ゲーム攻略本、
  // エンターテイメント、新書、文庫、BL、医学系、健康系、暮らし系

  genreIds.forEach(genreId => {
    // 楽天ブックスジャンルIDの詳細マッピング
    if (genreId.startsWith('001')) {
      // 001: 本
      // 本は一般的すぎるので追加しない

      // 詳細カテゴリ: レベル2（主要ジャンル） - 技術書管理に関連するもののみ
      // 除外: 001001(漫画), 001007(アート), 001008(絵本), 001014(タレント), 001015(ゲーム),
      // 001016(エンタメ), 001017(新書), 001018(文庫), 001019(ライトノベル), 001020(BL), 001028(医学), 001029(健康), 001031(暮らし)
      if (genreId.startsWith('001002')) categories.push('語学・学習参考書');
      else if (genreId.startsWith('001003')) categories.push('人文・思想');
      else if (genreId.startsWith('001004')) categories.push('コンピュータ・IT');
      else if (genreId.startsWith('001005')) categories.push('科学・医学・技術');
      else if (genreId.startsWith('001006')) categories.push('文学・評論');
      else if (genreId.startsWith('001009')) categories.push('資格・検定・就職');
      else if (genreId.startsWith('001010')) categories.push('趣味・実用');
      else if (genreId.startsWith('001011')) categories.push('ビジネス・経済・就職');
      else if (genreId.startsWith('001012')) categories.push('旅行・留学・アウトドア');
      else if (genreId.startsWith('001013')) categories.push('人生論・自己啓発');
      else if (genreId.startsWith('001021')) categories.push('多言語');

      // 詳細カテゴリ: レベル3以上（より具体的なサブジャンル）
      // コンピュータ・IT系の詳細カテゴリ
      if (genreId.startsWith('00100401')) categories.push('プログラミング');
      else if (genreId.startsWith('00100402')) categories.push('アプリケーション');
      else if (genreId.startsWith('00100403')) categories.push('OS');
      else if (genreId.startsWith('00100404')) categories.push('ネットワーク');
      else if (genreId.startsWith('00100405')) categories.push('データベース');
      else if (genreId.startsWith('00100406')) categories.push('ハードウェア');
      else if (genreId.startsWith('00100407')) categories.push('セキュリティ');
      else if (genreId.startsWith('00100408')) categories.push('情報処理');
      else if (genreId.startsWith('00100409')) categories.push('Web作成・開発');
      else if (genreId.startsWith('00100410')) categories.push('グラフィックス・DTP・音楽');
      else if (genreId.startsWith('00100499')) categories.push('その他');

      // 漫画のサブカテゴリは除外

      // ビジネス・経済系
      if (genreId.startsWith('00101101')) categories.push('経営');
      else if (genreId.startsWith('00101102')) categories.push('経済');
      else if (genreId.startsWith('00101103')) categories.push('マーケティング・セールス');
      else if (genreId.startsWith('00101104')) categories.push('投資・金融・会社経営');
      else if (genreId.startsWith('00101105')) categories.push('MBA・人材管理');

      // 語学・学習参考書
      if (genreId.startsWith('00100201')) categories.push('英語');
      else if (genreId.startsWith('00100299')) categories.push('その他言語');
    }
  });

  // 重複を除去
  return categories.filter((category, index, self) => self.indexOf(category) === index);
};

// 楽天ブックスのレスポンスをアプリのBook型に変換する関数
const mapRakutenBookToBook = (rakutenBook: RakutenBooksResponse['Items'][number]['Item']): Book => {
  // 高解像度の画像URLを生成
  const originalImageUrl = rakutenBook.largeImageUrl || rakutenBook.mediumImageUrl;
  const highResImageUrl = getHighResRakutenImageUrl(originalImageUrl);

  // booksGenreIdからカテゴリを抽出
  const categories = extractCategoriesFromGenreId(rakutenBook.booksGenreId);

  // カテゴリが空の場合も空配列のままにする（「本」は追加しない）

  return {
    id: rakutenBook.isbn, // ISBNをIDとして使用
    isbn: rakutenBook.isbn,
    title: rakutenBook.title,
    author: rakutenBook.author || '不明',
    language: '日本語', // 楽天ブックスAPIは日本語の書籍のみを提供
    categories, // 詳細カテゴリ
    img_url: highResImageUrl || '/images/book-placeholder.png',
    avg_difficulty: 0, // デフォルト値
    description: rakutenBook.itemCaption || '',
    publisherName: rakutenBook.publisherName,
    itemUrl: rakutenBook.itemUrl,
  };
};

// タイトルによる書籍検索（ページネーション対応）
export const searchRakutenBooksByTitle = async ({
  query,
  page = 1,
  hits = 20,
}: SearchRakutenBooksParams): Promise<{
  books: Book[];
  totalItems: number;
  hasMore: boolean;
}> => {
  try {
    console.log(`📚 [楽天ブックスAPI] "${query}" を検索中... (ページ: ${page}, 表示件数: ${hits})`);

    const params = new URLSearchParams({
      format: 'json',
      title: query,
      page: page.toString(),
      hits: hits.toString(),
      applicationId: API_KEY || '',
      // APIに渡す際のパラメータに技術書に関連するカテゴリ指定を追加してもよいが、
      // 一旦は結果をフィルタリングする方式を採用
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: RakutenBooksResponse = await response.json();

    // 検索結果から技術書に関連しないジャンルの書籍をフィルタリングして除外
    const filteredItems = data.Items.filter(item => isRelevantBook(item.Item.booksGenreId));
    const filteredBooks = filteredItems.map(item => mapRakutenBookToBook(item.Item));

    // フィルタリング後の件数を記録
    const originalCount = data.Items.length;
    const filteredCount = filteredBooks.length;
    console.log(
      `📊 [楽天ブックスAPI] フィルタリング: ${originalCount}件中${filteredCount}件が技術書関連`
    );

    const totalItems = filteredCount;
    // ページネーションを調整（単純化のため、フィルタリング後の数を使用）
    const hasMore = page < Math.ceil(totalItems / hits);

    console.log(
      `📗 [楽天ブックスAPI] 検索結果: ${filteredBooks.length}件取得 (技術書関連のみ、次ページ: ${hasMore ? 'あり' : 'なし'})`
    );

    return {
      books: filteredBooks,
      totalItems,
      hasMore,
    };
  } catch (error) {
    console.error('❌ [楽天ブックスAPIエラー] 書籍検索中にエラーが発生:', error);
    return {
      books: [],
      totalItems: 0,
      hasMore: false,
    };
  }
};

// ISBNによる書籍検索
export const searchRakutenBookByISBN = async (isbn: string): Promise<Book | null> => {
  try {
    console.log(`📘 [ISBN検索開始] ISBN "${isbn}" を楽天ブックスAPIで検索中...`);

    const params = new URLSearchParams({
      format: 'json',
      isbn: isbn,
      applicationId: API_KEY || '',
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: RakutenBooksResponse = await response.json();

    if (!data.Items || data.Items.length === 0) {
      console.log(`ℹ️ [ISBN検索] ISBN "${isbn}" に一致する書籍は見つかりませんでした`);
      return null;
    }

    // 技術書に関連するジャンルかどうかをチェック
    const item = data.Items[0].Item;
    if (!isRelevantBook(item.booksGenreId)) {
      console.log(
        `ℹ️ [ISBN検索] ISBN "${isbn}" の書籍は技術書に関連しないジャンルのため表示しません`
      );
      return null;
    }

    const book = mapRakutenBookToBook(item);
    console.log(`✅ [ISBN検索成功] ISBN "${isbn}" の日本語書籍が見つかりました: "${book.title}"`);
    return book;
  } catch (error) {
    console.error(`❌ [ISBN検索エラー] ISBN "${isbn}" の検索中にエラーが発生:`, error);
    return null;
  }
};

// 検索用の総合関数（ページネーション対応）
export const searchRakutenBooksWithPagination = async (
  query: string,
  page = 1,
  hits = 20
): Promise<{
  books: Book[];
  hasMore: boolean;
  totalItems: number;
}> => {
  if (!query || query.length < 2) {
    return { books: [], hasMore: false, totalItems: 0 };
  }

  try {
    // API検索を実行
    console.log(`🔍 [API検索開始] "${query}" を楽天ブックスAPIで検索します... (ページ: ${page})`);
    const { books, totalItems, hasMore } = await searchRakutenBooksByTitle({
      query,
      page,
      hits,
    });

    if (books.length > 0) {
      console.log(
        `✅ [API検索成功] "${query}" の検索結果: ${books.length}件の書籍をAPIから取得しました`
      );

      return {
        books,
        hasMore,
        totalItems,
      };
    } else {
      console.log(`ℹ️ [API検索] "${query}" に一致する書籍はAPIに見つかりませんでした`);
      return {
        books: [],
        hasMore: false,
        totalItems: 0,
      };
    }
  } catch (error) {
    console.error('❌ [検索エラー] searchRakutenBooksWithPaginationでエラーが発生:', error);
    return { books: [], hasMore: false, totalItems: 0 };
  }
};

/**
 * 楽天ブックスAPIから書籍のISBNを抽出する関数（複数の構造パターンに対応）
 */
function extractIsbnFromRakutenResponse(data: Record<string, unknown>): string | null {
  try {
    // データがない場合
    if (!data) return null;

    // レスポンスをログに出力（最初の部分だけ）
    console.log(
      `📝 [楽天ブックスAPI] ISBN抽出用データ:`,
      JSON.stringify(data).substring(0, 300) + '...'
    );

    // パターン1: Items[0].Item.isbn
    if (data.Items && Array.isArray(data.Items) && data.Items.length > 0) {
      const firstItem = data.Items[0] as Record<string, unknown>;

      // パターン1-1: Items[0].Item.isbn
      if (firstItem.Item && typeof firstItem.Item === 'object' && firstItem.Item !== null) {
        const item = firstItem.Item as Record<string, unknown>;
        if (item.isbn && typeof item.isbn === 'string') {
          console.log(`✓ [楽天ブックスAPI] パターン1-1で見つかりました: ${item.isbn}`);
          return item.isbn;
        }
      }

      // パターン1-2: Items[0].isbn (直接プロパティ)
      if (firstItem.isbn && typeof firstItem.isbn === 'string') {
        console.log(`✓ [楽天ブックスAPI] パターン1-2で見つかりました: ${firstItem.isbn}`);
        return firstItem.isbn;
      }

      // データ構造を詳細に調査してログ出力
      console.log(`🔍 [楽天ブックスAPI] 最初のアイテムの構造:`, firstItem);

      // パターン1-3: 他のプロパティを探索
      for (const key in firstItem) {
        const value = firstItem[key];

        // オブジェクトであれば内部を探索
        if (value && typeof value === 'object' && value !== null) {
          const objValue = value as Record<string, unknown>;
          // isbn直接プロパティ
          if (objValue.isbn && typeof objValue.isbn === 'string') {
            console.log(`✓ [楽天ブックスAPI] パターン1-3で見つかりました: ${objValue.isbn}`);
            return objValue.isbn;
          }

          // ISBNという名前のプロパティ（大文字小文字問わず）
          for (const subKey in objValue) {
            if (
              subKey.toLowerCase() === 'isbn' &&
              objValue[subKey] &&
              typeof objValue[subKey] === 'string'
            ) {
              console.log(`✓ [楽天ブックスAPI] パターン1-4で見つかりました: ${objValue[subKey]}`);
              return objValue[subKey] as string;
            }
          }
        }
      }
    }

    // パターン2: データ全体を探索
    const searchForIsbn = (obj: Record<string, unknown>, depth = 0): string | null => {
      if (depth > 5) return null; // 再帰の深さ制限

      if (!obj || typeof obj !== 'object') return null;

      // isbnプロパティを直接検索
      if (obj.isbn && typeof obj.isbn === 'string') {
        console.log(`✓ [楽天ブックスAPI] 再帰検索で見つかりました: ${obj.isbn}`);
        return obj.isbn;
      }

      // ISBNという名前のプロパティ（大文字小文字問わず）を検索
      for (const key in obj) {
        if (key.toLowerCase() === 'isbn' && obj[key] && typeof obj[key] === 'string') {
          console.log(`✓ [楽天ブックスAPI] キー検索で見つかりました: ${obj[key]}`);
          return obj[key] as string;
        }

        // 再帰的に探索
        if (obj[key] && typeof obj[key] === 'object' && obj[key] !== null) {
          const result = searchForIsbn(obj[key] as Record<string, unknown>, depth + 1);
          if (result) return result;
        }
      }

      return null;
    };

    const recursiveResult = searchForIsbn(data);
    if (recursiveResult) return recursiveResult;

    // どの方法でも見つからなかった場合
    console.log(`❓ [楽天ブックスAPI] ISBNが見つかりませんでした`);
    return null;
  } catch (error) {
    console.error(`❌ [楽天ブックスAPI] ISBN抽出中にエラー:`, error);
    return null;
  }
}

/**
 * Google Books IDを使って楽天ブックスAPIを検索し、ISBNを取得する
 * Google Books APIでISBNが取得できない場合のフォールバックとして使用
 */
export const searchRakutenBookByTitle = async (title: string): Promise<string | null> => {
  try {
    if (!API_KEY) {
      console.warn('楽天アプリIDが設定されていません');
      return null;
    }

    if (!title) return null;

    console.log(`📘 [楽天ブックスAPI] "${title}" のISBNを検索中...`);

    const params = new URLSearchParams({
      applicationId: API_KEY,
      title: title,
      hits: '1', // 最初の1件だけで十分
      booksGenreId: '001', // 本
      sort: 'sales', // 売れている順
      formatVersion: '2',
    });

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`楽天ブックスAPI エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // レスポンスの構造を確認
    console.log(
      `📊 [楽天ブックスAPI] レスポンス確認:`,
      JSON.stringify(data).substring(0, 300) + '...'
    );

    // データがない場合
    if (!data || !data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
      console.log(`ℹ️ [楽天ブックスAPI] "${title}" に一致する書籍が見つかりませんでした`);
      return null;
    }

    // 最初のアイテムのジャンルをチェック
    const firstItem = data.Items[0].Item || data.Items[0];
    if (!isRelevantBook(firstItem.booksGenreId)) {
      console.log(
        `ℹ️ [楽天ブックスAPI] "${title}" の書籍は技術書に関連しないジャンルのため表示しません`
      );
      return null;
    }

    // ISBN抽出処理
    const isbn = extractIsbnFromRakutenResponse(data);

    if (isbn) {
      console.log(`✅ [楽天ブックスAPI] "${title}" のISBN: ${isbn}`);
      return isbn;
    }

    console.log(`ℹ️ [楽天ブックスAPI] "${title}" に一致する書籍のISBNが見つかりませんでした`);
    return null;
  } catch (error) {
    console.error(`❌ [楽天ブックスAPIエラー] "${title}" のISBN検索中にエラーが発生:`, error);
    return null;
  }
};

/**
 * 楽天ブックスAPIから特定タイトルの書籍の詳細情報を取得
 * 詳細ページURLも取得できるようにするため
 */
export const getRakutenBookDetailByTitle = async (
  title: string
): Promise<{ isbn: string | null; detailUrl: string | null }> => {
  try {
    if (!API_KEY) {
      console.warn('楽天アプリIDが設定されていません');
      return { isbn: null, detailUrl: null };
    }

    if (!title) return { isbn: null, detailUrl: null };

    console.log(`📘 [楽天ブックスAPI] "${title}" の詳細情報を検索中...`);

    const params = new URLSearchParams({
      applicationId: API_KEY,
      title: title,
      hits: '1', // 最初の1件だけで十分
      booksGenreId: '001', // 本
      sort: 'sales', // 売れている順
      formatVersion: '2',
    });

    console.log(`📘 [楽天ブックスAPI] 完全なURLパラメータ: ${params.toString()}`);
    const requestUrl = `${RAKUTEN_BOOKS_API_URL}?${params.toString()}`;
    console.log(`📘 [楽天ブックスAPI] リクエストURL: ${requestUrl}`);

    const response = await fetch(requestUrl);

    if (!response.ok) {
      console.error(`📘 [楽天ブックスAPI] HTTPエラー: ${response.status} ${response.statusText}`);
      throw new Error(`楽天ブックスAPI エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // レスポンスの構造を確認
    console.log(
      `📊 [楽天ブックスAPI] レスポンス確認:`,
      JSON.stringify(data).substring(0, 500) + '...'
    );

    if (!data || !data.Items || !Array.isArray(data.Items) || data.Items.length === 0) {
      console.log(`ℹ️ [楽天ブックスAPI] "${title}" に一致する書籍が見つかりませんでした`);
      return { isbn: null, detailUrl: null };
    }

    // 最初の結果から情報を抽出
    const itemContainer = data.Items[0];
    console.log(`📘 [楽天ブックスAPI] 最初のアイテム:`, itemContainer);

    // 項目がItemプロパティ内にあるパターンと直接プロパティとしてあるパターンの両方に対応
    const bookItem = itemContainer.Item || itemContainer;
    console.log(`📘 [楽天ブックスAPI] 書籍データ:`, bookItem);

    // 技術書に関連するジャンルかチェック
    if (!isRelevantBook(bookItem.booksGenreId)) {
      console.log(
        `ℹ️ [楽天ブックスAPI] "${title}" の書籍は技術書に関連しないジャンルのため表示しません`
      );
      return { isbn: null, detailUrl: null };
    }

    const isbn = bookItem.isbn || null;
    const detailUrl = bookItem.itemUrl || null;

    console.log(`📘 [楽天ブックスAPI] 抽出された情報 - ISBN: ${isbn}, 詳細URL: ${detailUrl}`);

    if (isbn || detailUrl) {
      console.log(`✅ [楽天ブックスAPI] "${title}" の詳細情報: ISBN=${isbn}, URL=${detailUrl}`);
    } else {
      console.log(`⚠️ [楽天ブックスAPI] "${title}" の詳細情報が取得できませんでした`);
    }

    return { isbn, detailUrl };
  } catch (error) {
    console.error(`❌ [楽天ブックスAPIエラー] "${title}" の詳細情報検索中にエラーが発生:`, error);
    return { isbn: null, detailUrl: null };
  }
};
