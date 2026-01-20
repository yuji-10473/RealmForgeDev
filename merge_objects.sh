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

# jq を使用して2つのJSONファイルをマージします。
# 1. objects.json から既存のIDのリストを作成します。
# 2. villagers.json の各村人に対して以下を実行します。
#    a. nameから新しいIDを生成します (例: villager_村人A)。
#    b. そのIDが既存のIDリストに存在しないことを確認します（重複チェック）。
#    c. imageName を imageUrl に変換し、正しいパスを追加します。
#    d. "type": "person" を追加します。
#    e. 変換後、不要になった imageName を削除します。
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
        . + {
          "id": $new_id,
          "imageUrl": ("/characters/villagers/images/" + .imageName),
          "type": "person"
        } | del(.imageName)
      end
    )
  ) | {objects: .}
' \
public/objects.json \
public/characters/villagers/villagers.json > tmp_objects.json && \
mv tmp_objects.json public/objects.json

if [ $? -eq 0 ]; then
    echo "正常に public/objects.json に村人データを統合しました。重複チェックと画像パスの変換が行われました。"
else
    echo "エラー: JSONのマージに失敗しました。jqがインストールされているか確認してください。"
    # 一時ファイルを削除
    rm -f tmp_objects.json
    exit 1
fi
