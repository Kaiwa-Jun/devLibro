# 開発環境でのOGP検証ガイド

## 概要
開発環境（localhost）では、X（Twitter）のCard ValidatorがローカルURLにアクセスできないため、OGP検証を行うことができません。
開発環境でOGP検証を行いたい場合は、ngrokを使用してローカル環境を外部公開する必要があります。

## ngrokを使用した外部公開手順

### 1. ngrokのインストール
```bash
# Homebrewを使用してインストール
brew install ngrok/ngrok/ngrok

# または公式サイトからダウンロード
# https://ngrok.com/download
```

### 2. ngrokでローカル環境を公開
```bash
# 開発サーバーが3000番ポートで動作している場合
ngrok http 3000
```

### 3. 公開URLの確認
ngrok起動後、以下のような出力が表示されます：
```
Forwarding  https://xxxx-xxx-xxx-xxx.ngrok-free.app -> http://localhost:3000
```

### 4. 環境変数の設定
公開URLを環境変数に設定します：
```bash
# .env.localファイルに追加
NEXT_PUBLIC_APP_URL=https://xxxx-xxx-xxx-xxx.ngrok-free.app
```

### 5. 開発サーバーの再起動
環境変数を反映するために開発サーバーを再起動します：
```bash
npm run dev
```

### 6. OGP検証の実行
- 読了おめでとうモーダルの「OGP検証ツールで確認」ボタンをクリック
- X Card Validatorで書籍詳細ページのOGPが正しく表示されることを確認

## 注意事項

### ngrokの制限
- 無料版のngrokは8時間でセッションが切れます
- URLは毎回変わるため、環境変数の更新が必要です
- 有料版では固定URLを使用できます

### セキュリティ
- ngrokで公開したURLは一時的に外部からアクセス可能になります
- 機密情報を含むページは公開しないよう注意してください
- 検証完了後はngrokを停止することを推奨します

### 本番環境
本番環境では、実際のドメインを使用するため、この手順は不要です。

## トラブルシューティング

### ngrokが起動しない場合
```bash
# ngrokのバージョン確認
ngrok version

# ngrokの認証（初回のみ）
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### OGP画像が表示されない場合
1. 書籍詳細ページが正しく表示されるか確認
2. 画像URLが有効か確認
3. メタタグが正しく設定されているか確認

```html
<!-- 確認すべきメタタグ -->
<meta property="og:title" content="書籍タイトル" />
<meta property="og:description" content="書籍の説明" />
<meta property="og:image" content="書影画像のURL" />
<meta property="og:url" content="書籍詳細ページのURL" />
```

## 参考リンク
- [ngrok公式サイト](https://ngrok.com/)
- [X Card Validator](https://cards-dev.twitter.com/validator)
- [Open Graph Protocol](https://ogp.me/) 
