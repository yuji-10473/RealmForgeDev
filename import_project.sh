#!/bin/bash

# =================================================================
# RealmForge プロジェクトインポートスクリプト
# =================================================================
# tmp/kamakura-project-full-YYYYMMDD.zip を解凍し、
# 内容を public/data と public/media に配置します。

ZIP_DIR="tmp"
DEST_DATA="public/data"
DEST_MEDIA="public/media"
EXTRACT_TMP="tmp/extraction_temp"

echo "--- インポート処理開始 ---"

# 1. 最新のZIPファイルを探す
LATEST_ZIP=$(ls -t $ZIP_DIR/kamakura-project-full-*.zip 2>/dev/null | head -n 1)

if [ -z "$LATEST_ZIP" ]; then
  echo "エラー: $ZIP_DIR 内に kamakura-project-full-*.zip が見つかりません。"
  exit 1
fi

echo "最新のアーカイブを確認しました: $LATEST_ZIP"

# 2. 展開用の一時ディレクトリを作成
mkdir -p "$EXTRACT_TMP"
mkdir -p "$DEST_DATA"
mkdir -p "$DEST_MEDIA"

# 3. 解凍
echo "解凍中..."
unzip -o -q "$LATEST_ZIP" -d "$EXTRACT_TMP"

if [ $? -ne 0 ]; then
  echo "エラー: 解凍に失敗しました。"
  rm -rf "$EXTRACT_TMP"
  exit 1
fi

# 4. データの配置
# アーカイブ内の構造が data/ や media/ で始まっていることを想定しています
if [ -d "$EXTRACT_TMP/data" ]; then
  echo "データを配置中: $DEST_DATA"
  cp -r "$EXTRACT_TMP/data/"* "$DEST_DATA/"
fi

if [ -d "$EXTRACT_TMP/media" ]; then
  echo "メディアファイルを配置中: $DEST_MEDIA"
  cp -r "$EXTRACT_TMP/media/"* "$DEST_MEDIA/"
fi

# 5. 後片付け
echo "一時ファイルを削除中..."
rm -rf "$EXTRACT_TMP"

echo "--- インポート完了 ---"
echo "public/data と public/media が更新されました。"
