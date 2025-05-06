import { Book, Review, UserBook } from '@/types';

export const mockBooks: Book[] = [
  {
    id: '1',
    isbn: '9784873119045',
    title: 'プログラミング TypeScript',
    author: 'Boris Cherny',
    language: 'TypeScript',
    categories: ['フロントエンド', 'JavaScript'],
    img_url:
      'https://images.pexels.com/photos/3747279/pexels-photo-3747279.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 3,
    description:
      'TypeScriptの基礎から高度な型の扱いまで、実践的なサンプルコードとともに解説。JavaScriptプログラマーが安全で拡張性の高いコードを書くための必読書。',
    programmingLanguages: ['TypeScript', 'JavaScript'],
    frameworks: [],
  },
  {
    id: '2',
    isbn: '9784873119700',
    title: 'JavaScript 第7版',
    author: 'David Flanagan',
    language: 'JavaScript',
    categories: ['フロントエンド', 'JavaScript'],
    img_url:
      'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 2,
    description:
      'JavaScriptの基礎から応用まで幅広くカバーしたリファレンス。Node.js、ブラウザAPI、非同期プログラミングなど幅広いトピックを解説。',
    programmingLanguages: ['JavaScript'],
    frameworks: ['Node.js'],
  },
  {
    id: '3',
    isbn: '9784873119380',
    title: 'React ハンズオン ラーニング',
    author: 'Alex Banks, Eve Porcello',
    language: 'JavaScript',
    categories: ['フロントエンド', 'React'],
    img_url:
      'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 2,
    description:
      'Reactの基本概念からRedux、React Hooksまで、実践的なプロジェクトを通して学ぶ入門書。初心者から中級者まで幅広く対応。',
    programmingLanguages: ['JavaScript'],
    frameworks: ['React'],
  },
  {
    id: '4',
    isbn: '9784873119342',
    title: 'Python データサイエンス ハンドブック',
    author: 'Jake VanderPlas',
    language: '日本語',
    categories: ['データサイエンス', 'Python'],
    img_url:
      'https://images.pexels.com/photos/2004161/pexels-photo-2004161.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 4,
    description:
      'NumPy、pandas、Matplotlib、scikit-learnなどのライブラリを使用したデータ分析と機械学習の実践的なテクニックを学ぶ。',
    programmingLanguages: ['Python'],
    frameworks: [],
  },
  {
    id: '5',
    isbn: '9784873119878',
    title: 'Go言語による並行処理',
    author: 'Katherine Cox-Buday',
    language: '日本語',
    categories: ['バックエンド', 'Go'],
    img_url:
      'https://images.pexels.com/photos/7149165/pexels-photo-7149165.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 4,
    description:
      'Goの並行処理モデルについて詳しく解説。ゴルーチン、チャネル、並行パターン、パフォーマンスの最適化まで幅広くカバー。',
    programmingLanguages: ['Go'],
    frameworks: [],
  },
  {
    id: '6',
    isbn: '9784873119458',
    title: 'Next.js実践ガイド',
    author: 'John Smith',
    language: '日本語',
    categories: ['フロントエンド', 'React'],
    img_url:
      'https://images.pexels.com/photos/270366/pexels-photo-270366.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 3,
    description:
      'Next.jsを使用したReactアプリケーション開発の実践的なガイド。SSR、SSG、ISRなどの最新レンダリング戦略を解説。',
    programmingLanguages: ['JavaScript', 'TypeScript'],
    frameworks: ['React', 'Next.js'],
  },
  {
    id: '7',
    isbn: '9784873119562',
    title: 'Rustプログラミング入門',
    author: 'Carol White',
    language: '日本語',
    categories: ['システムプログラミング', 'Rust'],
    img_url:
      'https://images.pexels.com/photos/4709285/pexels-photo-4709285.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 5,
    description:
      'Rustの所有権モデル、借用チェッカー、安全性保証について初心者にもわかりやすく解説。実践的なプロジェクトでスキルを磨く。',
    programmingLanguages: ['Rust'],
    frameworks: [],
  },
  {
    id: '8',
    isbn: '9784873119654',
    title: 'Ruby on Rails 7実践入門',
    author: 'Mike Johnson',
    language: '日本語',
    categories: ['バックエンド', 'Ruby'],
    img_url:
      'https://images.pexels.com/photos/574069/pexels-photo-574069.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 2,
    description:
      'Rails 7の新機能を使った最新のWebアプリケーション開発手法を解説。Hotwire、Active Record、Action Mailerなどの機能を網羅。',
    programmingLanguages: ['Ruby'],
    frameworks: ['Ruby on Rails'],
  },
  {
    id: '9',
    isbn: '9784873119890',
    title: 'Flutter モバイルアプリ開発',
    author: 'Sarah Williams',
    language: '日本語',
    categories: ['モバイル', 'Flutter'],
    img_url:
      'https://images.pexels.com/photos/193003/pexels-photo-193003.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 3,
    description:
      'FlutterとDartを使用したクロスプラットフォームモバイルアプリケーション開発の完全ガイド。UIコンポーネント、状態管理、APIとの通信を学ぶ。',
    programmingLanguages: ['Dart'],
    frameworks: ['Flutter'],
  },
  {
    id: '10',
    isbn: '9784873119321',
    title: 'Laravel実践開発',
    author: 'Tom Anderson',
    language: '日本語',
    categories: ['バックエンド', 'PHP'],
    img_url:
      'https://images.pexels.com/photos/92904/pexels-photo-92904.jpeg?auto=compress&cs=tinysrgb&w=800',
    avg_difficulty: 3,
    description:
      'LaravelフレームワークによるモダンなPHP開発の実践ガイド。Eloquent ORM、Blade、認証、テスト、デプロイメントのベストプラクティスを解説。',
    programmingLanguages: ['PHP'],
    frameworks: ['Laravel'],
  },
];

export const mockReviews: Review[] = [
  {
    id: '1',
    user_id: 'user1',
    user_name: 'プログラミング好き',
    book_id: '1',
    difficulty: 4,
    experience_years: 2,
    comment:
      'TypeScriptの型システムの理解が深まりました。特に Union Types や Intersection Types の解説が分かりやすかったです。中級から上級者向けだと思います。',
    created_at: '2023-10-15T08:30:00Z',
  },
  {
    id: '2',
    user_id: 'user2',
    user_name: 'フロントエンジニア',
    book_id: '1',
    difficulty: 3,
    experience_years: 4,
    comment:
      '業務で使うTypeScriptの理解が格段に向上しました。型定義のセクションは特に参考になりました。エラーメッセージの読み方も学べて良かったです。',
    created_at: '2023-09-22T14:45:00Z',
  },
  {
    id: '3',
    user_id: 'user3',
    user_name: 'バックエンド開発者',
    book_id: '1',
    difficulty: 5,
    experience_years: 1,
    comment:
      '初心者にはややハードルが高いかも。TypeScriptの経験が少ない状態で読むと難しく感じました。もう少しJavaScriptの基礎を固めてから読み直そうと思います。',
    created_at: '2023-11-05T10:15:00Z',
  },
  {
    id: '4',
    user_id: 'user4',
    user_name: 'アーキテクト',
    book_id: '1',
    difficulty: 3,
    experience_years: 7,
    comment:
      '高度な型の活用方法が参考になりました。特にジェネリクスやcondition typesの実践的な例が多く、実務での型設計の参考になります。',
    created_at: '2024-01-10T16:20:00Z',
  },
];

export const mockUserBooks: UserBook[] = [
  {
    id: '1',
    user_id: 'currentUser',
    book: mockBooks[0],
    status: 'reading',
    progress: 60,
    added_at: '2024-01-15T10:30:00Z',
    finished_at: null,
  },
  {
    id: '2',
    user_id: 'currentUser',
    book: mockBooks[1],
    status: 'done',
    progress: 100,
    added_at: '2023-12-05T09:15:00Z',
    finished_at: '2023-12-20T18:45:00Z',
  },
  {
    id: '3',
    user_id: 'currentUser',
    book: mockBooks[2],
    status: 'unread',
    progress: 0,
    added_at: '2024-02-01T14:10:00Z',
    finished_at: null,
  },
  {
    id: '4',
    user_id: 'currentUser',
    book: mockBooks[3],
    status: 'reading',
    progress: 25,
    added_at: '2024-01-28T11:20:00Z',
    finished_at: null,
  },
];
