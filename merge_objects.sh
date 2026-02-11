#!/bin/bash

# このスクリプトは、public/characters/villagers/villagers.json に含まれる村人のデータを
# public/objects.json のオブジェクトリストに統合（同期）します。
# 実行には jq が必要です。

# ファイルの存在を確認
if [ ! -f "public/objects.json" ]; then
    echo "エラー: public/objects.json が見つかりません。"
    exit 1
fi

if [ ! -f "public/characters/villagers/villagers.json" ]; then
    echo "エラー: public/characters/villagers/villagers.json が見つかりません。"
    exit 1
fi

# 念のため、マージ前にバックアップを作成します。
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="public/objects_${TIMESTAMP}.json"
echo "バックアップを作成中: ${BACKUP_FILE}"
cp public/objects.json "${BACKUP_FILE}"
if [ $? -ne 0 ]; then
    echo "エラー: バックアップの作成に失敗しました。"
    exit 1
fi


# jq を使用して2つのJSONファイルを同期します。
# 1. objects.json から "villager_" で始まるIDを持つオブジェクトを全て除去します。
# 2. villagers.json の各村人から、完全なオブジェクトデータを生成します。
# 3. 1で残ったオブジェクトリストと、2で生成した新しい村人リストを結合します。
# これにより、villagers.json が常に正として扱われ、objects.json は常に最新の状態に保たれます。
jq -s '
  # 1. objects.json から村人以外のオブジェクトを抽出
  (.[0].objects | map(select(.id | startswith("villager_") | not))) as $non_villagers |
  # 2. villagers.json から最新の村人データを生成
  (.[1] | map({
      "id": ("villager_" + .name),
      "name": .name,
      "imageUrl": ("/characters/villagers/" + .imagePath),
      "audioPath": ("/characters/villagers/" + .audioPath),
      "type": "person",
      "width": 128,
      "height": 128,
      "conversation": ("こんにちは！私は" + .name + "です。")
  })) as $new_villagers |
  # 3. 両者を結合して最終的なオブジェクトリストを生成
  {objects: ($non_villagers + $new_villagers)}
' \
public/objects.json \
public/characters/villagers/villagers.json > tmp_objects.json && \
mv tmp_objects.json public/objects.json

if [ $? -eq 0 ]; then
    echo "正常に public/objects.json に村人データを同期しました。"
else
    echo "エラー: JSONのマージに失敗しました。jqがインストールされているか確認してください。"
    # 一時ファイルを削除
    rm -f tmp_objects.json
    exit 1
fi
