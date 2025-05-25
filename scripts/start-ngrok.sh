#!/bin/bash

# OGP検証用のngrok起動スクリプト

echo "🚀 ngrokを起動してOGP検証環境を準備します..."

# 開発サーバーが起動しているかチェック
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ 開発サーバーが起動していません。"
    echo "   以下のコマンドで開発サーバーを起動してください："
    echo "   npm run dev"
    exit 1
fi

echo "✅ 開発サーバーが起動中です"

# ngrokを起動
echo "🌐 ngrokでローカル環境を外部公開します..."
echo "   Ctrl+C で停止できます"
echo ""

ngrok http 3000 
