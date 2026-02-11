#!/bin/bash

# このスクリプトは、public/characters/villagers/villagers.json に含まれる村人のデータを
# public/objects.json のオブジェクトリストに統合（同期）します。
# 実行には jq が必要です。

echo "--- 村人データ同期スクリプト開始 ---"

# ファイルパスの定義
OBJECTS_FILE="public/objects.json"
VILLAGERS_FILE="public/characters/villagers/villagers.json"

# ファイルの存在を確認
if [ ! -f "$OBJECTS_FILE" ]; then
    echo "エラー: $OBJECTS_FILE が見つかりません。"
    exit 1
fi

if [ ! -f "$VILLAGERS_FILE" ]; then
    echo "エラー: $VILLAGERS_FILE が見つかりません。"
    exit 1
fi

echo "入力ファイルを確認しました: $OBJECTS_FILE, $VILLAGERS_FILE"

# 念のため、マージ前にバックアップを作成します。
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="public/objects_${TIMESTAMP}.json"
echo "バックアップを作成中: ${BACKUP_FILE}"
cp "$OBJECTS_FILE" "${BACKUP_FILE}"
if [ $? -ne 0 ]; then
    echo "エラー: バックアップの作成に失敗しました。"
    exit 1
fi

echo "--- 入力ファイルの内容をデバッグ表示 ---"
echo "[$VILLAGERS_FILE] のデータタイプ:"
jq 'type' "$VILLAGERS_FILE"
echo "[$VILLAGERS_FILE] のトップレベルキー (もしオブジェクトなら):"
jq 'if type == "object" then keys else "Not an object" end' "$VILLAGERS_FILE"

echo "--- jqマージ処理を開始 ---"

# jq を使用して2つのJSONファイルを同期します。
# 1. objects.json から "villager_" で始まるIDを持つオブジェクトを全て除去します。
# 2. villagers.json の各村人から、完全なオブジェクトデータを生成します。
# 3. 1で残ったオブジェクトリストと、2で生成した新しい村人リストを結合します。
# これにより、villagers.json が常に正として扱われ、objects.json は常に最新の状態に保たれます。
jq -s '
  # 1. objects.json から村人以外のオブジェクトを抽出
  (.[0].objects | map(select(.id | startswith("villager_") | not))) as $non_villagers |
  # 2. villagers.json から最新の村人データを生成（より安全なチェックを追加）
  (
    if (.[1] | type) == "array" then .[1]
    elif (.[1] | type) == "object" and (.[1] | has("villagers")) and (.[1].villagers | type == "array") then .[1].villagers
    else [] end
    | map({
      "id": ("villager_" + .name),
      "name": .name,
      "imageUrl": ("/characters/villagers/" + .imagePath),
      "audioPath": ("/characters/villagers/" + .audioPath),
      "type": "person",
      "width": 256,
      "height": 256,
      "conversation": ("こんにちは！私は" + .name + "です。")
  })) as $new_villagers |
  # 3. 両者を結合して最終的なオブジェクトリストを生成
  {objects: ($non_villagers + $new_villagers)}
' \
"$OBJECTS_FILE" \
"$VILLAGERS_FILE" > tmp_objects.json

# $? は直前のコマンドの終了ステータス
JQ_EXIT_CODE=$?

if [ $JQ_EXIT_CODE -eq 0 ]; then
    echo "jqマージ処理が正常に完了しました。"
    mv tmp_objects.json "$OBJECTS_FILE"
    echo "正常に $OBJECTS_FILE に村人データを同期しました。"
else
    echo "エラー: jqマージ処理でエラーが発生しました (終了コード: $JQ_EXIT_CODE)。"
    echo "jqがインストールされているか、JSONファイルの内容が正しいか確認してください。"
    # 一時ファイルを削除
    rm -f tmp_objects.json
    exit 1
fi

echo "--- 村人データ同期スクリプト終了 ---"
