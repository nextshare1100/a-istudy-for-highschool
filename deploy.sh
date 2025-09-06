#!/bin/bash

# プロジェクト名とコミットメッセージを設定
PROJECT_NAME="ai-study-platform"
COMMIT_MESSAGE="feat: AI問題生成システムに詳細カスタマイズ機能を追加"

# 1. 現在の変更をステージング
echo "📝 変更をステージング中..."
git add .

# 2. コミット
echo "💾 変更をコミット中..."
git commit -m "$COMMIT_MESSAGE"

# 3. リモートにプッシュ
echo "🚀 リモートリポジトリにプッシュ中..."
git push origin main

# 4. Vercelへのデプロイ（自動的に行われる場合）
echo "⚡ Vercelが自動的にデプロイを開始します..."
echo "📊 デプロイの進行状況は https://vercel.com/dashboard でご確認ください"

# 5. ビルドエラーチェック用のローカルビルド（オプション）
echo ""
echo "🔨 ローカルでビルドテストを実行しますか？ (y/n)"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🏗️ ローカルビルドを実行中..."
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ ビルドが正常に完了しました"
    else
        echo "❌ ビルドエラーが発生しました。修正が必要です。"
        exit 1
    fi
fi

echo ""
echo "✨ デプロイプロセスが開始されました！"
echo "📝 実装された機能:"
echo "  - 教育目標設定（主要目標、測定能力、副次目標）"
echo "  - 内容詳細設定（必須概念、数値制約）"
echo "  - 評価基準設定（理由説明、誤答パターン、部分点）"
echo "  - 文脈設定（実社会応用、文体スタイル）"
echo "  - 言語設定（語彙レベル、文章複雑さ）"
