# マップデータ JSON仕様書

このドキュメントは、マップエディターで管理されるワールドマップのデータ構造（JSON形式）について詳述します。

## 1. ディレクトリ構造

全てのマップ関連データは `public/maps/` ディレクトリに格納されます。

```
public/
└── maps/
    ├── worlds.json         # (必須) 利用可能なワールドマップのインデックス
    ├── world1.json         # ワールドマップ「world1」のデータ
    ├── world2.json         # ワールドマップ「world2」のデータ
    └── backgrounds/
        ├── map_0_0.png     # 背景画像
        └── ...
```

## 2. インデックスファイル (`worlds.json`)

このファイルは、マップエディターのドロップダウンに表示されるワールドマップの一覧を定義します。

*   **ファイルパス:** `public/maps/worlds.json`
*   **構造:**

```json
{
  "worlds": [
    {
      "id": "world1",
      "name": "最初の世界"
    },
    {
      "id": "world2",
      "name": "砂漠の世界"
    }
  ]
}
```

*   **フィールド:**
    *   `worlds`: `WorldMapOption`オブジェクトの配列。
        *   `id` (string): ワールドマップの一意のID。このIDが、対応するJSONファイル名（例: `world1.json`）になります。
        *   `name` (string): エディターのUIに表示されるワールドマップの名前。

## 3. ワールドマップファイル (例: `world1.json`)

個々のワールドマップのグリッド構造と、各セルに含まれるデータを定義します。

*   **ファイルパス:** `public/maps/{id}.json` (例: `public/maps/world1.json`)
*   **構造:**

```json
{
  "rows": 2,
  "cols": 2,
  "maps": [
    // (MapCellオブジェクトがここに続く)
  ]
}
```

*   **フィールド:**
    *   `rows` (number): ワールドマップのグリッドの行数。
    *   `cols` (number): ワールドマップのグリッドの列数。
    *   `maps` (array): `MapCell`オブジェクトの1次元配列。配列は左上から右下に向かって格納されます (`index = row * cols + col`)。

### 3.1. マップセル (`MapCell`) オブジェクト

ワールドマップの各グリッドセルを構成するオブジェクトです。

*   **構造:**

```json
{
  "id": "map_0_0",
  "name": "始まりの草原",
  "imageUrl": "/maps/backgrounds/map_0_0.png",
  "objects": [
    // (PlacedObjectオブジェクトがここに続く)
  ]
}
```

*   **フィールド:**
    *   `id` (string): マップセルの一意のID。
    *   `name` (string): マップセルの名前。
    *   `imageUrl` (string): このマップセルで使用される背景画像のパス。
    *   `objects` (array): このマップセルに配置されている `PlacedObject` の配列。

### 3.2. 配置オブジェクト (`PlacedObject`)

マップセル内に配置されるキャラクター、ドア、アイテムなどのオブジェクトです。

*   **構造:**

```json
{
  "id": "167...",
  "objectId": "villager_elder",
  "x": 850,
  "y": 620,
  "width": 128,
  "height": 128,
  "conversation": "やあ、旅の人。",
  "audioPath": "/audio/vo_elder_hello.wav",
  "eventId": "evt_opening_dialogue",
  "movement": {
    "type": "patrol-h",
    "range": 150
  },
  "transition": {
    "targetMapId": "room_elder_house",
    "targetX": 300,
    "targetY": 800
  }
}
```

*   **フィールド:**
    *   `id` (string): 配置されたオブジェクトのインスタンスとしての一意のID。
    *   `objectId` (string): `public/objects.json` で定義されているオブジェクトのIDへの参照。
    *   `x`, `y` (number): マップセル内でのオブジェクトの左上隅の座標 (基準解像度 2752x1536)。
    *   `width`, `height` (number): オブジェクトの表示サイズ。
    *   `conversation` (string, optional): イベントが設定されていない場合の、フォールバック用の会話テキスト。
    *   `audioPath` (string, optional): フォールバック会話時に再生される音声ファイルのパス。
    *   `eventId` (string, optional): このオブジェクトとのインタラクションでトリガーされるイベントのID。`story:` プレフィックスを付けることで、ストーリーシーケンスをトリガーすることもできます (例: `story:opening_scene`)。
    *   `movement` (object, optional): NPCの移動パターンを定義します。
        *   `type` (string): `"stationary"` (静止) または `"patrol-h"` (水平巡回)。
        *   `range` (number, optional): `patrol-h` の場合の移動範囲 (px)。
    *   `transition` (object, optional): ドアオブジェクトなどで使用されるマップ遷移を定義します。
        *   `targetMapId` (string): 遷移先のマップID (ワールドマップのIDまたはルームID)。
        *   `targetX`, `targetY` (number): 遷移先マップでのプレイヤーの出現座標。
