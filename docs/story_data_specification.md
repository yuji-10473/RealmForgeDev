# ストーリーデータ JSON仕様書

このドキュメントは、ストーリーエディターで管理されるストーリーシーケンス（カットシーン）のデータ構造（JSON形式）について詳述します。

## 1. ディレクトリ構造

全てのストーリー関連データは `public/stories/` ディレクトリに格納されます。

```
public/
└── stories/
    ├── stories.json         # (必須) 利用可能なストーリーシーケンスのインデックス
    ├── opening_scene.json   # シーケンス「opening_scene」のデータ
    └── ...
```

## 2. インデックスファイル (`stories.json`)

このファイルは、ストーリーエディターのドロップダウンに表示されるシーケンスの一覧を定義します。

*   **ファイルパス:** `public/stories/stories.json`
*   **構造:**

```json
{
  "sequences": [
    {
      "id": "opening_scene",
      "name": "オープニングイベント"
    },
    {
      "id": "boss_battle_intro",
      "name": "ボス戦前の会話"
    }
  ]
}
```

*   **フィールド:**
    *   `sequences`: `SequenceOption`オブジェクトの配列。
        *   `id` (string): ストーリーシーケンスの一意のID。このIDが、対応するJSONファイル名（例: `opening_scene.json`）になります。
        *   `name` (string): エディターのUIに表示されるシーケンスの名前。

## 3. ストーリーシーケンスファイル (例: `opening_scene.json`)

個々のシーケンスの背景マップ、登場キャラクター、およびその動作を定義します。

*   **ファイルパス:** `public/stories/{id}.json` (例: `public/stories/opening_scene.json`)
*   **構造:**

```json
{
  "id": "opening_scene",
  "name": "オープニングイベント",
  "mapId": "map_0_0",
  "characters": [
    // (SequenceCharacterオブジェクトがここに続く)
  ]
}
```

*   **フィールド:**
    *   `id` (string): シーケンスの一意のID。
    *   `name` (string): シーケンスの名前。
    *   `mapId` (string): このシーケンスが再生される背景マップのID (`map_0_0` や `room_castle_throne` など)。
    *   `characters` (array): このシーケンスに登場する `SequenceCharacter` オブジェクトの配列。

### 3.1. シーケンスキャラクター (`SequenceCharacter`) オブジェクト

シーケンス内に登場する各キャラクターとその動作を定義します。

*   **構造:**

```json
{
  "id": "seq_char_167...",
  "objectId": "player_main",
  "speed": 1,
  "path": [
    // (Waypointオブジェクトがここに続く)
  ]
}
```

*   **フィールド:**
    *   `id` (string): シーケンス内でのキャラクターインスタンスとしての一意のID。
    *   `objectId` (string): `public/objects.json` で定義されているオブジェクト（キャラクター）のIDへの参照。
    *   `speed` (number): キャラクターの移動速度の倍率 (1が基準)。
    *   `path` (array): キャラクターの移動経路を示す `Waypoint` オブジェクトの配列。

### 3.2. ウェイポイント (`Waypoint`) オブジェクト

キャラクターの移動経路上の各中継点を定義します。キャラクターは `path` 配列の順番通りに各ウェイポイントへ移動します。

*   **構造:**

```json
{
  "x": 450,
  "y": 620,
  "eventId": "evt_opening_dialogue"
}
```

*   **フィールド:**
    *   `x`, `y` (number): 背景マップ上でのキャラクターの目標座標 (基準解像度 2752x1536)。キャラクターの中心がこの座標に到達します。
    *   `eventId` (string, optional): キャラクターがこのウェイポイントに到達した際にトリガーされるイベントのID。
