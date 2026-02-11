#!/bin/bash

# このスクリプトは、public/characters/villagers/villagers.json に含まれる村人のデータと
# public/characters/characters.json に含まれるプレイヤーキャラクターのデータを
# public/objects.json のオブジェクトリストに統合（同期）します。
# 実行には jq が必要です。

echo "--- キャラクターデータ同期スクリリプト開始 ---"

# ファイルパスの定義
OBJECTS_FILE="public/objects.json"
VILLAGERS_FILE="public/characters/villagers/villagers.json"
CHARACTERS_FILE="public/characters/characters.json"

# ファイルの存在を確認
if [ ! -f "$OBJECTS_FILE" ]; then
    echo "エラー: $OBJECTS_FILE が見つかりません。"
    exit 1
fi

if [ ! -f "$VILLAGERS_FILE" ]; then
    echo "エラー: $VILLAGERS_FILE が見つかりません。"
    exit 1
fi

if [ ! -f "$CHARACTERS_FILE" ]; then
    echo "警告: $CHARACTERS_FILE が見つかりません。プレイヤーキャラクターの同期はスキップされます。"
    # プレイヤーキャラクターファイルがなくても、村人の同期は続行する
fi

echo "入力ファイルを確認しました: $OBJECTS_FILE, $VILLAGERS_FILE"
[ -f "$CHARACTERS_FILE" ] && echo "入力ファイルを確認しました: $CHARACTERS_FILE"


# 念のため、マージ前にバックアップを作成します。
TIMESTAMP=$(date +%Y%m%d%H%M%S)
BACKUP_FILE="public/objects_${TIMESTAMP}.json"
echo "バックアップを作成中: ${BACKUP_FILE}"
cp "$OBJECTS_FILE" "${BACKUP_FILE}"
if [ $? -ne 0 ]; then
    echo "エラー: バックアップの作成に失敗しました。"
    exit 1
fi

echo "--- jqマージ処理を開始 ---"

# jq を使用してJSONファイルを同期します。
# 1. objects.json から "villager_" または "player_" で始まるIDを持つオブジェクトを全て除去します。
# 2. villagers.json から村人データを抽出します。
# 3. characters.json からプレイヤーキャラクターデータを抽出します。
# 4. それぞれのデータを元に、新しいオブジェクトのリストを生成します。
# 5. 1で残ったオブジェクトリストと、4で生成した新しいキャラクターリストを結合します。
jq -s '
  # 既存のキャラクターオブジェクトを削除
  (
    if .[0] | type == "array" then .[0]
    elif .[0] | type == "object" and (.[0].objects | type == "array") then .[0].objects
    else [] end
    | map(select(.id | (startswith("villager_") or startswith("player_")) | not))
  ) as $non_character_objects |

  # 村人データを処理
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

  # プレイヤーキャラクターデータを処理 (ファイルが存在する場合のみ)
  (
    if (.[2] | type) == "object" and (.[2].characters | type == "array") then .[2].characters
    else [] end
  ) as $players_array |
  ($players_array | map(
    if type == "object" and .id and .name and .path then
      {
        "id": ("player_" + .id),
        "name": .name,
        "imageUrl": (.path + "/frames/idle_down_1.png"),
        "type": "person",
        "width": 256,
        "height": 256,
        "conversation": ("こんにちは！私は" + .name + "です。")
      }
    else
      empty
    end
  )) as $new_players |

  # 全てのデータを統合
  {objects: ($non_character_objects + $new_villagers + $new_players)}
' \
"$OBJECTS_FILE" \
"$VILLAGERS_FILE" \
"$CHARACTERS_FILE" > tmp_objects.json


JQ_EXIT_CODE=$?

if [ $JQ_EXIT_CODE -eq 0 ]; then
    echo "jqマージ処理が正常に完了しました。"
    mv tmp_objects.json "$OBJECTS_FILE"
    echo "正常に $OBJECTS_FILE にキャラクターデータを同期しました。"
else
    echo "エラー: jqマージ処理でエラーが発生しました (終了コード: $JQ_EXIT_CODE)。"
    rm -f tmp_objects.json
    exit 1
fi

echo "--- キャラクターデータ同期スクリプト終了 ---"
