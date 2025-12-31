#!/bin/bash

# 移動先のディレクトリを作成します
mkdir -p public/maps/backgrounds

# 1から16までのマップをループ処理します
for i in {1..16}
do
  # 0から始まる行と列のインデックスを計算します
  row=$(( (i - 1) / 4 ))
  col=$(( (i - 1) % 4 ))

  # 移動元のパスと移動先のパスを定義します
  src_path="public/maps/map${i}/map${i}.png"
  dest_path="public/maps/backgrounds/map_${row}_${col}.png"

  # ファイルが存在するか確認してから移動します
  if [ -f "$src_path" ]; then
    echo "移動中: $src_path -> $dest_path"
    mv "$src_path" "$dest_path"
  else
    echo "警告: $src_path が見つかりません。"
  fi
done

echo "ファイルの移動が完了しました。"
# 不要になった古いmapディレクトリを削除することもできます
# echo "古いディレクトリをクリーンアップします..."
# for i in {1..16}
# do
#   rmdir "public/maps/map${i}"
# done