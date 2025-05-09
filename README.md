# devLibro

## 技術書書評アプリ – 設計サマリ（AI 機能 & 匿名レビュー案 C 反映）

### 1. コンセプト

- **目的**: 読書ログ + 「経験年数 × 難易度」軸で最適な技術書を提示
- **課題解決**: 初学者でも自分に合う本を選びやすい／名著でも難易度が一目で分かる

### 2. 対象ユーザ

- Web エンジニア経験 0〜5 年

### 3. MVP 機能（価値検証）

1. ISBN から書籍登録（Google Books API）
2. 読書ステータス: 未読 / 読書中 / 読了
3. レビュー投稿: 難易度 1‑5・経験年数・コメント
4. 経験年数・言語・カテゴリフィルタ検索
5. **SNS 共有**: 初回は「これまで読んだ本」を一括シェア／2 回目以降は当月・四半期・年間など期間指定でシェア
6. **購入リンク**: 書籍詳細に Amazon / 楽天 Books の通常リンクを表示（ワンクリックで外部サイトへ）
7. **SEO 対策**: 各ページに meta タグ・OGP・構造化データを設定（Next.js `<head>` / `metadata` を活用）

### 4. Post‑MVP 機能（改善）

- **AI‑難易度自動推定**（書籍サンプル章 → LLM 分析）
- **AI‑レビュー要点サマリ**（新規レビュー毎に 3 行要約生成）
- AI パーソナライズ推薦（Embedding + kNN）
- AI 読書プラン生成（章立てタスク化）
- 会話型検索ボタン
- タグ / ランキング
- **購入リンクのアフィリエイト化**（Amazon アソシエイト / 楽天アフィリエイト連携）
- **AI‑難易度自動推定**（書籍サンプル章 → LLM 分析）
- **AI‑レビュー要点サマリ**（新規レビュー毎に 3 行要約生成）
- AI パーソナライズ推薦（Embedding + kNN）
- AI 読書プラン生成（章立てタスク化）
- 会話型検索ボタン
- タグ / ランキング 経験年数・言語・カテゴリフィルタ検索

### 5. 匿名レビュー方式（案 C）

- **ペンネーム自動生成**: 初回登録時に "Blue‑Gopher" などを付与
- レビュー表示: `pen_name` + 経験年数 + コメント
- スパム対策: 通報 / レートリミット / AI スコアリング

### 6. 信頼性強化策

- 役立った 👍 ボタンでレビューをソート
- AI による低質レビュー自動伏せ
- 経験年数別平均難易度を強調表示

### 7. データモデル（抜粋）

| テーブル       | 主キー | 主な列                                                                                                                                     | 用途                                                           |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **books**      | id     | isbn **UNIQUE**, title, author, language, categories, img_url                                                                              | アプリ全体で共有する書籍マスタ (ISBN で一意)                   |
| **users**      | id     | display_name, experience_years                                                                                                             | ユーザー名と経験年数を保持                                     |
| **reviews**    | id     | user_id **FK**, book_id **FK**, difficulty(1‑5), comment, display_type ENUM('anon','user','custom'), custom_pen_name (NULL 可), created_at | 各レビューごとに表示方法(匿名/ユーザー名/任意ペンネーム)を保存 |
| **user_books** | id     | user_id **FK**, book_id **FK**, status ENUM('unread','reading','done'), added_at, finished_at                                              | ユーザごとの蔵書 + 読書進捗を管理                              |

> **設計意図**
>
> - ホーム書籍一覧は `books` のみを取得 → 所有者に依存しない表示。
> - マイページは `user_books` を `JOIN` してログインユーザの蔵書＋進捗を取得。
> - 書籍・レビュー・進捗を正規化し、データ重複と更新競合を防止。

### 8. 技術スタック 技術スタック

- **フロント**: Next.js + TypeScript (shadcn/ui)
- **認証/DB**: Supabase (PostgreSQL)
- **AI**: OpenAI API + LangChain (embedding & LLM 呼び出し)
- **テスト**: Jest + React Testing Library （TDD 方針）
- **CI/CD**: GitHub Actions（lint → test → build → deploy）

### 9. UI フロー

1. ホーム: 検索バー + 経験年数・言語・カテゴリで探す + AI 推薦カルーセル(後)
2. 書籍詳細: 難易度バッジ / レビュー一覧
3. マイページ: 未読・読書中・読了タブ + **SNS 共有ウィザード**
   - 初回ログイン時: 過去読了本を検出 →「これまで読んだ本をシェアしますか？」モーダル
   - 2 回目以降: 期間選択（当月／四半期／年間）→ プレビュー → 共有
4. 右下フロート: 会話型検索(後)

### 10. 開発ロードマップ 開発ロードマップ

| 週  | タスク                                                                      |     |                    |
| --- | --------------------------------------------------------------------------- | --- | ------------------ |
| 1‑2 | Figma で画面設計 / DB スキーマ作成 / **テスト環境・CI/CD パイプライン構築** |     |                    |
| 3‑4 | MVP 実装 (機能 1‑7)                                                         |     | → テストユーザ招待 |
| 5   | フィードバック反映・UI 改善                                                 |     |                    |
| 6‑8 | Post‑MVP 機能を順次追加 / コスト最適化                                      |     |                    |

---

最短で価値を検証し、レビュー数と AI コストを見ながら機能を拡張する方針です。

### 11. 画面構成案

| 画面                         | 主なコンポーネント                                                                                                                                              | MVP                            | Post‑MVP                                                                                             |     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------- | --- |
| **ホーム** (`/`)             | タイトル検索（① 自 DB→0 件なら ②Google Books API） / ＋本を追加ボタン / 経験年数・言語・カテゴリフィルタ / 書籍カード一覧 / ヘッダー・フッター / (SP)下部ナビ   | ● 書籍一覧                     | ▲ AI 推薦カルーセル, フロート会話検索                                                                |     |
| **書籍詳細** (`/books/[id]`) | 書影・基本情報 / 平均難易度 / レビュータブ (経験年数別) / 購入リンク(Amazon・楽天) / レビューボタン                                                             | ● 主要部品すべて + 購入リンク  | ▲ AI 難易度バッジ, AI レビュー要約, シェアボタン, 読書プラン開始ボタン, 購入リンクのアフィリエイト化 |     |
| **マイページ** (`/me`)       | ユーザー名/ 経験年数表示・編集 / **蔵書タブ** (未読・読書中・読了) / 進捗バー / **蔵書追加ボタン** / **SNS 共有ボタン**（初回: 総読了本、一括シェアガイド表示） | ● 蔵書管理・SNS 共有           | ▲ AI 読書プラン (📅 タブ)                                                                            |     |
| **レビュー投稿モーダル**     | 書籍詳細からトリガー / 難易度スライダー / コメント欄 / 投稿ボタン                                                                                               | ● 匿名ペンネーム自動表示       | ▲ AI フィードバック(書き方ガイド)                                                                    |     |
| **蔵書追加モーダル**         | タイトル検索（① 自 DB→0 件なら ②Google Books API） / ISBN バーコード読み取り / 書誌プレビュー / 追加ボタン                                                      | ● タイトル or バーコードで登録 | ▲ AI タグ自動付与                                                                                    |     |
| **設定** (`/settings`)       | プロフィール編集 / 通知設定                                                                                                                                     | ● 最低限                       | ▲ 実名公開オプション, API キー連携                                                                   |     |

> **UI/UX ポイント**
>
> - **モバイル優先**: 下部ナビ (ホーム・検索・マイページ) でワンタップ移動。
> - **初学者誘導**: ホームの経験年数・言語・カテゴリフィルタを大きめボタン化。
> - **投稿導線**: 書籍詳細ページ上部にも「レビューを書く」を固定し、ハードルを下げる。
> - **AI 要素の視認性**: 難易度バッジはカラー+アイコンで即判別、AI サマリは折りたたみ → 展開式でスクロール負荷を軽減。

### 12. デスクトップ向け検索 UX 追加案

- **タイトル入力オートサジェスト**：ユーザがタイトル入力中に 300ms デバウンスで Google Books API (`q=intitle:`) を呼び、候補を書影付きドロップダウンで表示。
- 候補選択 → 書誌情報をフォームに自動反映 → 確認モーダルで登録 & レビュー投稿へ遷移。
- ヒット 0 件／API 失敗時は ISBN 直接入力欄と "手動登録" ボタンを同一フォームに併設。
- レートリミット: `fetch` をデバウンス + 1 秒あたり最大 5 リクエスト。
- 実装想定: Next.js `useSWR` + `useDebounce`、Supabase Edge Functions で API キーを隠蔽。

> この追加により、デスクトップ環境でもバーコード無しでスムーズに書籍を登録可能。

### 13. 言語・カテゴリ検索対応

#### API で取得できるか？

- **Google Books API**
  - `volumeInfo.language` : ISO 639-1 の 2 文字コードが常に返却される。
  - `volumeInfo.categories` : ジャンル文字列配列。技術書では約 6〜7 割の書籍で付与。
- したがって **言語は確実に、カテゴリはある程度取得可能**。

#### 不足データを補完する方法

1. **ユーザタグ付け**: 書籍詳細でタグを追加。既存タグ候補をサジェストし、重複を防止。
2. **AI 自動タグ推定 (Post‑MVP)**: 書誌要約を LLM でキーワード抽出 → 未入力時の初期タグとして提示。

#### データモデルの追記

| テーブル | 列の追加        | 説明                                           |
| -------- | --------------- | ---------------------------------------------- |
| Book     | `language`      | ISO 639‑1 コード (例: "ja", "en")              |
|          | `categories`    | TEXT[] (例: ["Web Development", "JavaScript"]) |
| Tag      | `name`          | カスタムタグ用                                 |
| BookTag  | book_id, tag_id | 多対多リレーション                             |

#### UI 変更点

- **ホーム検索バーの下**に「言語」「カテゴリ」ドロップダウンを追加。
- SP ではフィルタをスライドインモーダルにまとめ、画面スペースを確保。

#### クエリ例 (PostgreSQL)

```sql
SELECT * FROM books
WHERE language = 'ja'
  AND 'Web Development' = ANY(categories);
```

> まとめ: **言語は API データを直接使用、カテゴリは API + タグ機能のハイブリッド**で柔軟に対応し、ユーザ体験を向上させる。

### 14. 難易度スコア計算ロジック（段階的切り替え）

| フェーズ                | 算出方法                                                                                              | 切り替え基準 (目安)                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **α 期** (リリース直後) | 単純平均 `AVG(difficulty)`                                                                            | 総レビュー数 **< 30** または 1 冊あたり平均レビュー **< 3** |
| **β 期** (レビュー増加) | 経験年数重み付きベイズ ` (Σd·w + m·μ)/(Σw + m)``w = 1/(1+experience_years) `, `m = 5`, `μ` = 全体平均 | 総レビュー数 **≥ 30** かつ 1 冊あたり平均レビュー **≥ 3**   |

> - 数値は“数十件”を想定し、小規模でも早期にベイズ補正へ移行できるように設定。
> - 切り替え判定は日次バッチまたは管理ダッシュボードで確認。
> - 算出ロジックはサービス層にカプセル化し、`difficultyStrategy` を DI で差し替え可能にしておくとメンテ容易。

### 15. ディレクトリ構成

```
devLibro/
├── .github/                      # GitHub関連設定
│   ├── workflows/                # CI/CD ワークフロー
│   ├── ISSUE_TEMPLATE/           # Issue テンプレート
│   └── PULL_REQUEST_TEMPLATE.md  # PR テンプレート
├── public/                       # 静的ファイル
│   ├── images/                   # 画像リソース
│   └── fonts/                    # フォントファイル
├── src/                          # ソースコード
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API ルート
│   │   │   ├── auth/             # 認証関連API
│   │   │   ├── books/            # 書籍関連API
│   │   │   ├── reviews/          # レビュー関連API
│   │   │   └── ai/               # AI関連機能API
│   │   ├── (marketing)/          # ログイン不要の公開ページ (SEO対策・MVP機能7)
│   │   │   ├── page.tsx          # トップページ（検索エンジン最適化済み）
│   │   │   ├── about/            # サービス紹介・使い方ガイド
│   │   │   ├── books/            # 公開書籍カタログ（検索可能）
│   │   │   └── layout.tsx        # 未ログインユーザー向け共通レイアウト
│   │   ├── (app)/                # ルートグループ (アプリページ)
│   │   │   ├── books/            # 書籍一覧・詳細
│   │   │   │   └── [id]/         # 書籍詳細 (動的ルート)
│   │   │   ├── me/               # マイページ
│   │   │   │   ├── profile/      # プロフィール設定
│   │   │   │   └── settings/     # ユーザー設定
│   │   │   ├── search/           # 検索ページ
│   │   │   └── layout.tsx        # アプリレイアウト (認証必須)
│   │   └── layout.tsx            # ルートレイアウト
│   ├── components/               # 共通コンポーネント
│   │   ├── ui/                   # 基本UI (shadcn/ui)
│   │   ├── books/                # 書籍関連コンポーネント
│   │   │   ├── BookCard.tsx      # 書籍カード
│   │   │   ├── DifficultyBadge.tsx # 難易度バッジ
│   │   │   └── ReviewList.tsx    # レビューリスト
│   │   ├── reviews/              # レビュー関連コンポーネント
│   │   ├── layout/               # レイアウトコンポーネント
│   │   │   ├── Header.tsx        # ヘッダー
│   │   │   ├── Footer.tsx        # フッター
│   │   │   └── Sidebar.tsx       # サイドバー
│   │   ├── search/               # 検索関連コンポーネント
│   │   └── auth/                 # 認証関連コンポーネント
│   ├── lib/                      # ユーティリティ・ライブラリ
│   │   ├── supabase/             # Supabase クライアント
│   │   ├── api/                  # API関連ユーティリティ
│   │   │   ├── books.ts          # Google Books API ラッパー
│   │   │   └── commerce.ts       # Amazon/楽天リンク生成
│   │   ├── ai/                   # AI関連ユーティリティ
│   │   │   ├── embeddings.ts     # ベクトル検索機能
│   │   │   ├── difficulty.ts     # 難易度推定ロジック
│   │   │   └── summary.ts        # レビュー要約機能
│   │   └── utils/                # 汎用ユーティリティ
│   │       ├── datetime.ts       # 日付関連
│   │       └── validation.ts     # バリデーション
│   ├── hooks/                    # カスタムフック
│   │   ├── useBooks.ts           # 書籍データ管理
│   │   ├── useReviews.ts         # レビュー関連
│   │   └── useSearch.ts          # 検索機能
│   ├── styles/                   # グローバルスタイル
│   ├── types/                    # 型定義
│   │   ├── api.ts                # API関連型
│   │   ├── book.ts               # 書籍関連型
│   │   ├── user.ts               # ユーザー関連型
│   │   └── supabase.ts           # Supabase関連型
│   └── config/                   # 設定ファイル
├── prisma/                       # Prisma ORM (オプション)
│   └── schema.prisma             # データベーススキーマ
├── migrations/                   # データベースマイグレーション
│   └── 001_initial_schema.sql    # 初期スキーマ
├── tests/                        # テスト
│   ├── unit/                     # ユニットテスト
│   ├── integration/              # 統合テスト
│   ├── e2e/                      # E2Eテスト
│   └── fixtures/                 # テスト用データ
├── scripts/                      # ユーティリティスクリプト
│   └── seed.ts                   # シードデータ
├── docs/                         # ドキュメント
├── .env.example                  # 環境変数テンプレート
├── .eslintrc.js                  # ESLint設定
├── .prettierrc                   # Prettier設定
├── jest.config.js                # Jestテスト設定
├── next.config.js                # Next.js設定
├── tsconfig.json                 # TypeScript設定
├── package.json                  # パッケージ設定
└── README.md                     # プロジェクト概要
```

このディレクトリ構成は、Next.js App Router を採用し、機能ごとにモジュールを分離したクリーンアーキテクチャの考え方を取り入れています。各ディレクトリの役割と特徴：

1. **ルートグループによる分離**:

   - `(marketing)`: 未ログインでも閲覧可能なページ
   - `(app)`: 認証が必要なアプリケーション本体

2. **コンポーネント設計**:

   - 機能ごとにディレクトリを分割し、再利用性を高める
   - shadcn/ui を基本 UI として活用

3. **API 設計**:

   - リソースごとのエンドポイント分離
   - Supabase 連携と Edge Functions を活用

4. **AI モジュール**:

   - レビュー要約、難易度推定など機能ごとに分離
   - LangChain を使用した埋め込みと検索機能

5. **テスト構造**:
   - TDD 方針に基づき、十分なテストカバレッジを確保
   - ユニット、統合、E2E テストの明確な分離

この構成により、機能追加やメンテナンスが容易になり、チーム開発でも各メンバーが担当領域を明確に理解できます。また、AI や SEO 対策など後から追加される機能も柔軟に組み込める拡張性を確保しています。

1. **ルートグループによる機能分離**:
   - `(marketing)`: SEO 対策を施した未ログインユーザー向けページ群（MVP 機能 7）
   - `(app)`: ログイン必須の主要機能（書籍管理・レビュー・共有機能など）
