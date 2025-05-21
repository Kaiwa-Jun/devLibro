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
  '001003', // 絵本・児童書・図鑑
  '001004', // 小説・エッセイ
  '001009', // ホビー・スポーツ・美術
  '001010', // 美容・暮らし・健康・料理
  '001011', // エンタメ・ゲーム
  '001013001', // グラビアアイドル・タレント写真集
  '001013002', // その他写真集
  '001013003', // 動物・自然写真集
  '001017', // ライトノベル
  '001018', // 楽譜
  '001021', // ボーイズラブ（BL）
  '001022', // 付録付き
  '001023', // バーゲン本
  '001025', // セット本
  '001026', // カレンダー・手帳・家計簿
  '001027', // 文具・雑貨
  '001028', // 医学・薬学・看護学・歯科学
  '001029', // ティーンズラブ（TL）
];

// 除外ジャンルIDとカテゴリ名の対応表（デバッグ用）
const EXCLUDED_GENRE_NAMES: Record<string, string> = {
  '001001': '漫画（コミック）',
  '001003': '絵本・児童書・図鑑',
  '001004': '小説・エッセイ',
  '001009': 'ホビー・スポーツ・美術',
  '001010': '美容・暮らし・健康・料理',
  '001011': 'エンタメ・ゲーム',
  '001013001': 'グラビアアイドル・タレント写真集',
  '001013002': 'その他写真集',
  '001013003': '動物・自然写真集',
  '001017': 'ライトノベル',
  '001018': '楽譜',
  '001021': 'ボーイズラブ（BL）',
  '001022': '付録付き',
  '001023': 'バーゲン本',
  '001025': 'セット本',
  '001026': 'カレンダー・手帳・家計簿',
  '001027': '文具・雑貨',
  '001028': '医学・薬学・看護学・歯科学',
  '001029': 'ティーンズラブ（TL）',
};

// 技術書に関連するジャンルIDかどうかを判定する関数
const isRelevantBook = (booksGenreId: string): boolean => {
  if (!booksGenreId) return true; // ジャンルIDがない場合は表示する

  // 複数のジャンルIDがある場合（/区切り）はいずれかが除外カテゴリに含まれるか確認
  const genreIds = booksGenreId.split('/');

  // デバッグ用にすべてのジャンルIDを表示
  if (genreIds.length > 1) {
    console.log(`🔍 [ジャンル確認] 複数ジャンルID検出: ${booksGenreId}`);
  }

  // 階層構造を考慮した排除
  return !genreIds.some(genreId => {
    // 除外カテゴリIDのいずれかと前方一致するか確認
    // 例: '001001023'（漫画の子孫カテゴリ）と'001001'（漫画）の照合
    for (const excludedId of EXCLUDED_GENRE_IDS) {
      // genreIdがexcludedIdから始まる場合はその子孫カテゴリとみなして除外
      if (genreId.startsWith(excludedId)) {
        const categoryName = EXCLUDED_GENRE_NAMES[excludedId] || '不明カテゴリ';
        console.log(
          `📌 [フィルタリング] 除外カテゴリ "${excludedId}(${categoryName})" に該当するジャンル "${genreId}" を除外`
        );
        return true;
      }
    }
    return false;
  });
};

// 追加の詳細なジャンルフィルタリング用の除外カテゴリデータ
// 必要に応じて将来拡張可能な形で定義しておく
const EXCLUDED_DETAILED_GENRE_IDS = {
  // タレント写真集の子カテゴリをさらに詳細に指定
  タレント写真集: [
    '00101401', // アイドル
    '00101402', // グラビアアイドル
    '00101403', // 女優
    '00101404', // 男優
    '00101405', // お笑いタレント
    '00101406', // スポーツ選手
    '00101499', // その他タレント
  ],
  // 必要に応じて追加可能
};

// ジャンルIDとカテゴリ名のマッピング（詳細なカテゴリも含む）
const GENRE_MAPPING: Record<string, string> = {
  // レベル1: 根本カテゴリ
  '001': '本',

  // レベル2: 主要ジャンル
  '001001': '漫画（コミック）',
  '001002': '語学・学習参考書',
  '001003': '絵本・児童書・図鑑',
  '001004': '小説・エッセイ',
  '001005': 'パソコン・システム開発',
  '001006': 'ビジネス・経済・就職',
  '001007': '旅行・留学・アウトドア',
  '001008': '人文・思想・社会',
  '001009': 'ホビー・スポーツ・美術',
  '001010': '美容・暮らし・健康・料理',
  '001011': 'エンタメ・ゲーム',
  '001012': '科学・技術',
  '001013': '写真集・タレント',
  '001016': '資格・検定',
  '001017': 'ライトノベル',
  '001018': '楽譜',
  '001019': '文庫',
  '001020': '新書',
  '001021': 'ボーイズラブ（BL）',
  '001022': '付録付き',
  '001023': 'バーゲン本',
  '001025': 'セット本',
  '001026': 'カレンダー・手帳・家計簿',
  '001027': '文具・雑貨',
  '001028': '医学・薬学・看護学・歯科学',
  '001029': 'ティーンズラブ（TL）',

  // レベル3: 写真集・タレント系の詳細カテゴリ
  '001013001': 'グラビアアイドル・タレント写真集',
  '001013002': 'その他写真集',
  '001013003': '動物・自然写真集',

  // レベル3: パソコン・システム開発系の詳細カテゴリ
  '001005001': 'ハードウェア',
  '001005002': 'パソコン入門書',
  '001005003': 'インターネット・WEBデザイン',
  '001005004': 'ネットワーク',
  '001005005': 'プログラミング',
  '001005006': 'アプリケーション',
  '001005007': 'OS',
  '001005008': 'デザイン・グラフィックス',
  '001005009': 'ITパスポート',
  '001005010': 'MOUS・MOT',
  '001005011': 'パソコン検定',
  '001005013': 'IT・eコマース',
  '001005017': 'その他(パソコン・システム開発)',

  // レベル4: プログラミング言語別カテゴリ（レベル3 001005005の下位）
  '001005005001': 'プログラミング入門',
  '001005005002': 'Basic',
  '001005005003': 'Visual Basic',
  '001005005004': 'C・C++・C#',
  '001005005005': 'JSP',
  '001005005006': 'PHP',
  '001005005007': 'ASP',
  '001005005008': 'SQL',
  '001005005009': 'Java',
  '001005005010': 'Perl',
  '001005005011': 'その他プログラミング言語',

  // ビジネス・経済系
  '001006001': '経済・財政',
  '001006002': '経営',
  '001006003': '文庫・新書（ビジネス・経済・就職）',
  '001006004': '産業',
  '001006005': '就職・転職',
  '001006006': '株・投資・マネー',
  '001006007': 'マーケティング・セールス',
  '001006008': '経理',
  '001006009': '自己啓発・マインドコントロール',
  '001006010': '企業・経営者',
  '001006011': 'ビジネス雑誌',
  '001006012': 'その他（ビジネス・経済・就職）',

  // Web開発関連の詳細カテゴリ（レベル3 001005003の下位）
  '001005003001': 'HTML',
  '001005003002': 'CGI・Perl',
  '001005003003': 'JavaScript',
  '001005003004': 'その他Web言語',
  '001005003005': '入門書',
  '001005003006': 'ホームページ作成',
  '001005003007': 'CSS',
  '001005003008': 'Webプログラミング',
  '001005003009': 'XML',
  '001005003010': 'Webコンテンツ',
  '001005003011': 'Flash・ActionScript',
  '001005003012': 'SEO・SEM',
  '001005003013': 'その他（インターネット・WEBデザイン）',
};

// booksGenreIdからカテゴリを抽出する関数
const extractCategoriesFromGenreId = (booksGenreId: string): string[] => {
  if (!booksGenreId) return [];

  // 複数のジャンルがスラッシュで区切られている場合は分割
  const genreIds = booksGenreId.split('/');
  const categories: string[] = [];

  // デバッグ用：未定義のジャンルIDを記録
  const unknownGenreIds: string[] = [];

  // すべてのジャンルIDを調査
  genreIds.forEach(genreId => {
    // デバッグ用：現在処理中のジャンルIDをログ出力
    console.log(`🔍 [ジャンル解析中] ジャンルID: ${genreId}`);

    // 楽天ブックスのジャンルIDの階層構造を利用
    // 例: 001004001002 -> 001, 001004, 00100400, 001004001, 001004001002のすべてを確認

    // 現在のジャンルIDを詳細度を変えて確認（階層ごとに切り出して確認）
    let currentId = '';

    // ジャンルIDの文字を1文字ずつ追加して階層を深めていき、
    // 各階層でマッピングにあるかチェックしてカテゴリを取得
    for (let i = 0; i < genreId.length; i++) {
      currentId += genreId[i];

      // 有効な階層の長さの場合（楽天の階層は主に3,6,8桁など）
      if (GENRE_MAPPING[currentId]) {
        const categoryName = GENRE_MAPPING[currentId];
        categories.push(categoryName);
        console.log(`  ✓ [カテゴリ検出] ${currentId} → ${categoryName}`);
      } else if (i >= 2) {
        // 最低3桁以上からデバッグログを出す
        // 未知のジャンルIDはデバッグ用に記録
        if (!unknownGenreIds.includes(currentId)) {
          unknownGenreIds.push(currentId);
        }
      }
    }
  });

  // デバッグ用：未知のジャンルIDをログに出力
  if (unknownGenreIds.length > 0) {
    console.log(`❓ [カテゴリ抽出] 未定義のジャンルID: ${unknownGenreIds.join(', ')}`);
  }

  // 抽出したカテゴリの一覧をログに出力
  if (categories.length > 0) {
    console.log(`📚 [カテゴリ抽出結果] ジャンルID: ${booksGenreId} → カテゴリ一覧:`);
    categories.forEach((category, index) => {
      console.log(`  ${index + 1}. ${category}`);
    });
  } else {
    console.log(`⚠️ [カテゴリ抽出] ジャンルID: ${booksGenreId} からカテゴリを抽出できませんでした`);
  }

  // 重複を除去して返す
  return categories.filter((category, index, self) => self.indexOf(category) === index);
};

// 楽天ブックスのレスポンスをアプリのBook型に変換する関数
const mapRakutenBookToBook = (rakutenBook: RakutenBooksResponse['Items'][number]['Item']): Book => {
  console.log(`📗 [Book変換] 変換開始 - タイトル: "${rakutenBook.title}"`);
  console.log(`📗 [Book変換] 入力データ:`, rakutenBook);

  // 高解像度の画像URLを生成
  const originalImageUrl = rakutenBook.largeImageUrl || rakutenBook.mediumImageUrl;
  const highResImageUrl = getHighResRakutenImageUrl(originalImageUrl);
  console.log(`📗 [Book変換] 画像URL処理: ${originalImageUrl} → ${highResImageUrl}`);

  // booksGenreIdからカテゴリを抽出
  console.log(`📗 [Book変換] ジャンルID: ${rakutenBook.booksGenreId}`);
  const categories = extractCategoriesFromGenreId(rakutenBook.booksGenreId);
  console.log(`📗 [Book変換] 抽出されたカテゴリ: ${categories.join(', ')}`);

  // プログラミング言語とフレームワークの情報を抽出
  const programmingLanguages: string[] = [];
  const frameworks: string[] = [];

  // プログラミング言語とフレームワークのリスト
  const PROGRAMMING_LANGUAGES = [
    'Java',
    'C・C++・C#',
    'PHP',
    'Perl',
    'SQL',
    'Visual Basic',
    'Basic',
    'JavaScript',
    'Python',
    'Ruby',
    'Go',
    'Swift',
    'Kotlin',
    'TypeScript',
    'Rust',
    'R言語',
    'COBOL',
    'Scala',
    'Haskell',
  ];

  const FRAMEWORKS = [
    'React',
    'Vue.js',
    'Angular',
    'Node.js',
    'Express',
    'Django',
    'Flask',
    'Ruby on Rails',
    'Spring',
    'Laravel',
    'Symfony',
    '.NET',
    'ASP',
    'jQuery',
    'Bootstrap',
    'TensorFlow',
    'PyTorch',
    'WordPress',
  ];

  // カテゴリからプログラミング言語とフレームワークを抽出
  categories.forEach(category => {
    if (PROGRAMMING_LANGUAGES.includes(category)) {
      programmingLanguages.push(category);
    } else if (FRAMEWORKS.includes(category)) {
      frameworks.push(category);
    }
  });

  // タイトルと説明からもプログラミング言語とフレームワークを抽出
  const titleAndDesc = `${rakutenBook.title} ${rakutenBook.itemCaption || ''}`;

  PROGRAMMING_LANGUAGES.forEach(lang => {
    if (titleAndDesc.includes(lang) && !programmingLanguages.includes(lang)) {
      programmingLanguages.push(lang);
      console.log(`🔍 [言語検出] タイトル/説明から ${lang} を検出しました`);
    }
  });

  FRAMEWORKS.forEach(framework => {
    if (titleAndDesc.includes(framework) && !frameworks.includes(framework)) {
      frameworks.push(framework);
      console.log(`🔍 [フレームワーク検出] タイトル/説明から ${framework} を検出しました`);
    }
  });

  // デバッグ：抽出された技術情報を表示
  if (programmingLanguages.length > 0) {
    console.log(`📊 [技術情報] 検出されたプログラミング言語: ${programmingLanguages.join(', ')}`);
  } else {
    console.log(`📊 [技術情報] プログラミング言語は検出されませんでした`);
  }

  if (frameworks.length > 0) {
    console.log(`📊 [技術情報] 検出されたフレームワーク: ${frameworks.join(', ')}`);
  } else {
    console.log(`📊 [技術情報] フレームワークは検出されませんでした`);
  }

  const bookResult = {
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
    programmingLanguages, // 抽出されたプログラミング言語
    frameworks, // 抽出されたフレームワーク
  };

  console.log(`📗 [Book変換] 変換完了:`, bookResult);
  return bookResult;
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

    // フィルタリング前の元のアイテム数
    const originalCount = data.Items.length;
    console.log(`📊 [楽天ブックスAPI] 検索結果総数: ${originalCount}件`);

    // 除外されたジャンルの統計
    const excludedGenres: Record<string, number> = {};

    // 検索結果から技術書に関連しないジャンルの書籍をフィルタリングして除外
    const filteredItems = data.Items.filter(item => {
      const genreId = item.Item.booksGenreId;
      const isRelevant = isRelevantBook(genreId);

      if (!isRelevant) {
        // 除外されたジャンルのカウント
        // 最初の6桁（主要カテゴリ）で集計
        const mainGenre = genreId.substring(0, 6);
        excludedGenres[mainGenre] = (excludedGenres[mainGenre] || 0) + 1;
      }

      return isRelevant;
    });

    const filteredBooks = filteredItems.map(item => mapRakutenBookToBook(item.Item));

    // フィルタリング後の件数を記録
    const filteredCount = filteredBooks.length;
    const excludedCount = originalCount - filteredCount;

    console.log(
      `📊 [楽天ブックスAPI] フィルタリング結果: 合計${originalCount}件中、${filteredCount}件が技術書関連、${excludedCount}件を除外`
    );

    // 除外された主要カテゴリの内訳をログ出力
    if (excludedCount > 0) {
      console.log('📊 [楽天ブックスAPI] 除外されたカテゴリ内訳:');
      Object.entries(excludedGenres).forEach(([genre, count]) => {
        console.log(`   - カテゴリID: ${genre}, 件数: ${count}件`);
      });
    }

    // APIから返される総件数（count）を使用
    const totalItems = data.count;

    // APIから返されるページ情報を使用してページネーションを設定
    // 現在のページ（page）が総ページ数（pageCount）より小さい場合、次のページがある
    const hasMore = page < data.pageCount;

    console.log(
      `📗 [楽天ブックスAPI] 検索結果: ${filteredBooks.length}件取得 (技術書関連のみ、全${totalItems}件中, 次ページ: ${hasMore ? 'あり' : 'なし'})`
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
export const searchRakutenBookByISBN = async (
  isbn: string,
  skipGenreFilter = false
): Promise<Book | null> => {
  try {
    console.log(
      `📘 [ISBN検索開始] ISBN "${isbn}" を楽天ブックスAPIで検索中... (skipGenreFilter: ${skipGenreFilter})`
    );

    // APIキーの確認
    if (!API_KEY) {
      console.error('❌ [ISBN検索エラー] 楽天アプリIDが設定されていません');
      return null;
    }

    const params = new URLSearchParams({
      format: 'json',
      isbn: isbn,
      applicationId: API_KEY || '',
    });

    const requestUrl = `${RAKUTEN_BOOKS_API_URL}?${params.toString()}`;
    console.log(`📘 [ISBN検索] リクエストURL: ${requestUrl}`);

    const response = await fetch(`${RAKUTEN_BOOKS_API_URL}?${params.toString()}`);

    console.log(`📘 [ISBN検索] レスポンスステータス: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(
        `❌ [ISBN検索エラー] APIリクエスト失敗: ${response.status} ${response.statusText}`
      );
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: RakutenBooksResponse = await response.json();
    console.log(`📘 [ISBN検索] APIレスポンス:`, JSON.stringify(data).substring(0, 500) + '...');

    if (!data.Items || data.Items.length === 0) {
      console.log(`ℹ️ [ISBN検索] ISBN "${isbn}" に一致する書籍は見つかりませんでした`);
      console.log(`📘 [ISBN検索] レスポンス全体:`, data);
      return null;
    }

    console.log(`📘 [ISBN検索] 書籍の件数: ${data.Items.length}件`);

    // 技術書に関連するジャンルかどうかをチェック
    const item = data.Items[0].Item;
    console.log(
      `📚 [ISBN検索] ISBN "${isbn}" の書籍が見つかりました: "${item.title}", ジャンルID: ${item.booksGenreId}`
    );

    // ジャンルチェックの判定を詳細ログに出力
    if (!skipGenreFilter) {
      console.log(
        `📚 [ISBN検索] ジャンルフィルタリングを実行します (skipGenreFilter: ${skipGenreFilter})`
      );
      const isRelevant = isRelevantBook(item.booksGenreId);
      console.log(`📚 [ISBN検索] ジャンルの関連性: ${isRelevant ? '関連あり' : '関連なし'}`);
    } else {
      console.log(
        `📚 [ISBN検索] ジャンルフィルタリングをスキップします (skipGenreFilter: ${skipGenreFilter})`
      );
    }

    // skipGenreFilterがtrueの場合、ジャンルフィルタリングをスキップ
    if (!skipGenreFilter && !isRelevantBook(item.booksGenreId)) {
      // 除外されたジャンルの詳細をログ出力
      const genreIds = item.booksGenreId.split('/');
      const excludedDetails = genreIds
        .map((genreId: string) => {
          for (const excludedId of EXCLUDED_GENRE_IDS) {
            if (genreId.startsWith(excludedId)) {
              return `${genreId}(${EXCLUDED_GENRE_NAMES[excludedId] || '不明カテゴリ'})`;
            }
          }
          return null;
        })
        .filter(Boolean)
        .join(', ');

      console.log(
        `ℹ️ [ISBN検索] ISBN "${isbn}" の書籍 "${item.title}" は技術書に関連しないジャンルのため表示しません。除外ジャンル: ${excludedDetails}`
      );
      return null;
    }

    console.log(`📚 [ISBN検索] 書籍データをBook型に変換します`);
    const book = mapRakutenBookToBook(item);
    console.log(`✅ [ISBN検索成功] ISBN "${isbn}" の書籍が見つかりました: "${book.title}"`);
    console.log(`📚 [ISBN検索] 変換後のBookデータ:`, book);
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
    const result = await searchRakutenBooksByTitle({
      query,
      page,
      hits,
    });

    // APIレスポンスに含まれるページネーション情報を使用
    const { books, totalItems } = result;
    // APIのpageCountを使用するために、元の関数から取得した情報に加えてpageCountも返すように変更
    const hasMore = page < Math.ceil(totalItems / hits);

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
    console.log(
      `📚 [楽天ブックスAPI] "${title}" の書籍が見つかりました: "${firstItem.title}", ジャンルID: ${firstItem.booksGenreId}`
    );

    if (!isRelevantBook(firstItem.booksGenreId)) {
      // 除外されたジャンルの詳細をログ出力
      const genreIds = firstItem.booksGenreId.split('/');
      const excludedDetails = genreIds
        .map((genreId: string) => {
          for (const excludedId of EXCLUDED_GENRE_IDS) {
            if (genreId.startsWith(excludedId)) {
              return `${genreId}(${EXCLUDED_GENRE_NAMES[excludedId] || '不明カテゴリ'})`;
            }
          }
          return null;
        })
        .filter(Boolean)
        .join(', ');

      console.log(
        `ℹ️ [楽天ブックスAPI] "${title}" の書籍 "${firstItem.title}" は技術書に関連しないジャンルのため表示しません。除外ジャンル: ${excludedDetails}`
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
