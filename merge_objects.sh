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
jq 'if type == "object" then keys_unsorted else "Not an object" end' "$VILLAGERS_FILE"

echo "--- jqマージ処理を開始 ---"
echo "これから、以下の処理を実行します:"
echo "1. $OBJECTS_FILE から既存の村人データを削除します。"
echo "2. $VILLAGERS_FILE から最新の村人データを読み込みます。"
echo "   - データが配列でも、オブジェクト内の配列でも対応します。"
echo "   - 'name'や'imagePath'がnullの場合でも、デフォルト値を使用してエラーを防ぎます。"
echo "3. ２つのデータを統合して、 $OBJECTS_FILE を更新します。"

# jq を使用して2つのJSONファイルを同期します。
# 1. objects.json から "villager_" で始まるIDを持つオブジェクトを全て除去します。
# 2. villagers.json から村人データの配列を安全に抽出します。
# 3. 抽出した配列を元に、新しい村人データオブジェクトのリストを生成します。
#    - この時、nameやimagePathがnullでもエラーにならないように `//` を使ってデフォルト値を設定します。
#    - 配列内の要素がオブジェクトでない場合はスキップします。
# 4. 1で残ったオブジェクトリストと、3で生成した新しい村人リストを結合します。
jq -s '
  (.[0].objects | map(select(.id | startswith("villager_") | not))) as $non_villagers |
  (
    if (.[1] | type) == "array" then .[1]
    elif (.[1] | type) == "object" and (.[1].villagers | type == "array") then .[1].villagers
    else [] end
  ) as $villagers_array |
  ($villagers_array | map(
    if type == "object" then
      {
        "id": ("villager_" + (.name // "unknown")),
        "name": (.name // "名無し"),
        "imageUrl": ("/characters/villagers/" + (.imagePath // "default.png")),
        "audioPath": ("/characters/villagers/" + (.audioPath // "default.wav")),
        "type": "person",
        "width": 256,
        "height": 256,
        "conversation": ("こんにちは！私は" + (.name // "名無し") + "です。")
      }
    else
      empty
    end
  )) as $new_villagers |
  {objects: ($non_villagers + $new_villagers)}
' \
"$OBJECTS_FILE" \
"$VILLAGERS_FILE" > tmp_objects.json


JQ_EXIT_CODE=$?

if [ $JQ_EXIT_CODE -eq 0 ]; then
    echo "jqマージ処理が正常に完了しました。"
    mv tmp_objects.json "$OBJECTS_FILE"
    echo "正常に $OBJECTS_FILE に村人データを同期しました。"
else
    echo "エラー: jqマージ処理でエラーが発生しました (終了コード: $JQ_EXIT_CODE)。"
    echo "上記のデバッグログを確認し、[$VILLAGERS_FILE]の内容が正しいJSON形式になっているか、特にエラーメッセージが指し示している行番号（今回の場合は145行目あたり）に問題がないか確認してください。"
    echo "よくある原因は、配列の最後の要素の後にカンマが残っている、データが途中で途切れている、などです。"
    rm -f tmp_objects.json
    exit 1
fi

echo "--- 村人データ同期スクリプト終了 ---"
