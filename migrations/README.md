# データベースマイグレーション

このディレクトリには devLibro アプリケーションのデータベーススキーママイグレーションファイルが含まれています。

## マイグレーションファイル

- `001_initial_schema.sql` - 初期スキーマ定義（books/users/reviews/user_books）

## マイグレーションの適用方法

### 方法 1: Supabase ダッシュボード経由

1. Supabase のダッシュボードにログイン
2. 左側メニューから「SQL Editor」を選択
3. 新しいクエリを作成（「+」ボタン）
4. マイグレーション SQL ファイルの内容をコピー＆ペースト
5. 「RUN」ボタンをクリックして実行

### 方法 2: Supabase CLI 経由

1. Supabase CLI がインストールされていることを確認

   ```bash
   npm install -g supabase
   ```

2. プロジェクトにログイン

   ```bash
   supabase login
   ```

3. マイグレーションを適用
   ```bash
   supabase db push -f ./migrations/001_initial_schema.sql
   ```

## ロールバック方法

以下の SQL を実行してスキーマをロールバックできます：

```sql
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS user_books CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS book_status_enum CASCADE;
DROP TYPE IF EXISTS display_type_enum CASCADE;
```

## データベース設計について

このマイグレーションは以下のテーブルを作成します：

1. **books** - 書籍マスタテーブル

   - ISBN, タイトル, 著者, 言語, カテゴリなど

2. **users** - ユーザーテーブル（Supabase Auth 連携）

   - 表示名, 経験年数など

3. **reviews** - レビューテーブル

   - 難易度, コメント, 表示タイプなど
   - ユーザー 1 人につき書籍 1 冊あたり 1 レビューの制約

4. **user_books** - ユーザーの蔵書管理テーブル
   - 読書ステータス（未読/読書中/読了）

詳細なデータモデルについてはプロジェクトの README.md を参照してください。
