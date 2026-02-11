#!/bin/bash

# このスクリプトは、public/characters/villagers/villagers.json に含まれる村人のデータを
# public/objects.json のオブジェクトリストに統合します。
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


# jq を使用して2つのJSONファイルをマージします。
# 1. objects.json から既存のIDのリストを作成します。
# 2. villagers.json の各村人に対して以下を実行します。
#    a. nameから新しいIDを生成します (例: villager_村人A)。
#    b. そのIDが既存のIDリストに存在しないことを確認します（重複チェック）。
#    c. "image" フィールドから "imageUrl" を生成します (例: /characters/villagers/image/xxxx.png)。
#    d. "audio" フィールドから "audioPath" を生成します (例: /characters/villagers/audio/xxxx.wav)。
#    e. "type": "person" を追加します。
#    f. デフォルトの width と height を追加します。
#    g. デフォルトの会話文を追加します。
# 3. 既存のオブジェクトリストと、重複しない新しい村人リストを結合します。
# 4. 一時ファイルに書き出し、アトミックに上書きします。

jq -s '
  (.[0].objects | map(.id)) as $existing_ids |
  (.[0].objects) + (
    .[1] | map(
      ("villager_" + .name) as $new_id |
      if ($existing_ids | index($new_id)) then
        empty
      else
        {
          "id": $new_id,
          "name": .name,
          "imageUrl": ("/characters/villagers/" + .image),
          "audioPath": ("/characters/villagers/" + .audio),
          "type": "person",
          "width": 128,
          "height": 128,
          "conversation": ("こんにちは！私は" + .name + "です。")
        }
      end
    )
  ) | {objects: .}
' \
public/objects.json \
public/characters/villagers/villagers.json > tmp_objects.json && \
mv tmp_objects.json public/objects.json

if [ $? -eq 0 ]; then
    echo "正常に public/objects.json に村人データを統合しました。パスのプレフィックスを考慮して修正されました。"
else
    echo "エラー: JSONのマージに失敗しました。jqがインストールされているか確認してください。"
    # 一時ファイルを削除
    rm -f tmp_objects.json
    exit 1
fi
