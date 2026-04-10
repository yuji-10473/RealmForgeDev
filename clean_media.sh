#!/bin/bash

# =================================================================
# RealmForge メディアクリーンアップスクリプト
# =================================================================
# public/data 内の全JSONファイルをスキャンし、そこに記述がない
# public/media 内のファイルを tmp/unused_media_... へ移動します。

MEDIA_ROOT="public/media"
DATA_DIR="public/data"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="tmp/unused_media_$TIMESTAMP"

echo "--- メディアクリーンアップ処理開始 ---"

# ディレクトリの存在確認
if [ ! -d "$DATA_DIR" ]; then
  echo "エラー: $DATA_DIR が見つかりません。処理を中断します。"
  exit 1
fi

if [ ! -d "$MEDIA_ROOT" ]; then
  echo "エラー: $MEDIA_ROOT が見つかりません。処理を中断します。"
  exit 1
fi

# 1. JSONから参照されているメディアファイルのパスを抽出
# 正規表現で拡張子(.png, .jpg, .wav等)を含む文字列を検索し、パスを正規化
echo "JSONデータから参照パスを抽出中..."
REFERENCED=$(grep -rPo '(?<=")[^"]+\.(png|jpg|jpeg|wav|mp3|mp4|webm)(?=")' "$DATA_DIR" | sed 's/.*://' | sed 's|^/||' | sort | uniq)

if [ -z "$REFERENCED" ]; then
  echo "警告: 参照されているファイルが見つかりませんでした。パスの形式を確認してください。"
  # 誤削除防止のため、ここで終了はせず続行しますが、ユーザーに通知
fi

# 2. 未使用ファイルを検索して移動
mkdir -p "$BACKUP_DIR"
echo "整理を実行中..."

MOVE_COUNT=0
# mediaディレクトリ内の全ファイルを再帰的にチェック
while IFS= read -r file; do
    # public/ からの相対パスを取得 (例: media/images/item.png)
    relative_path=$(echo "$file" | sed "s|^public/||")
    
    # 参照リストに含まれているかチェック
    if ! echo "$REFERENCED" | grep -qF "$relative_path"; then
        echo "退避: $relative_path"
        dest="$BACKUP_DIR/$relative_path"
        mkdir -p "$(dirname "$dest")"
        mv "$file" "$dest"
        MOVE_COUNT=$((MOVE_COUNT + 1))
    fi
done < <(find "$MEDIA_ROOT" -type f)

echo "--- 整理完了 ---"
if [ $MOVE_COUNT -gt 0 ]; then
  echo "$MOVE_COUNT 個のファイルを $BACKUP_DIR に退避しました。"
  echo "問題がなければこのディレクトリを削除してください。"
else
  echo "退避が必要なファイルはありませんでした。すべてのファイルが参照されています。"
  rmdir "$BACKUP_DIR" 2>/dev/null
fi
