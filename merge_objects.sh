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
# 1. villagers.json から .villagers 配列を取得し、各要素に "type": "person" を追加します。
# 2. objects.json から .objects 配列を取得します。
# 3. 2つの配列を連結します。
# 4. 最終的な配列を新しい .objects キーの値として設定します。
# 5. 一時ファイルに書き出し、アトミックに上書きします。

jq -s '.[0].objects + (.[1].villagers | map(. + {"type": "person"})) | {objects: .}' \
    public/objects.json \
    public/characters/villagers/villagers.json > tmp_objects.json && \
    mv tmp_objects.json public/objects.json

if [ $? -eq 0 ]; then
    echo "正常に public/objects.json に村人データを統合しました。"
else
    echo "エラー: JSONのマージに失敗しました。jqがインストールされているか確認してください。"
    # 一時ファイルを削除
    rm -f tmp_objects.json
    exit 1
fi
