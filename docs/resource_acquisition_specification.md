# リソース獲得システム 仕様書 (Shop & Collection Points)

## 1. 概要
本システムは、プレイヤーがゲーム内でアイテムを補充・獲得するための主要な仕組み（ショップ、料理屋、収集ポイント）を定義します。これらは `shops.json`、`items.json`、`dishes.json`、および `collectionPoints.json` のデータに基づいて動作します。

## 2. ショップ・料理屋機能 (Shops & Restaurants)
ショップは、プレイヤーがゴールド（K）を支払ってアイテムや料理を購入できる場所です。

### 2.1. データ参照
- **インデックス**: `public/data/shops.json`
- **構造例**:
  ```json
  {
    "shops": [
      {
        "id": "store_01",
        "name": "始まりの道具屋",
        "itemIds": ["potion_01", "herb_01"]
      },
      {
        "id": "restaurant_01",
        "name": "宿場の食堂",
        "dishIds": ["sandwich_01", "soup_01"]
      }
    ]
  }
  ```
- **アイテム詳細**: `public/data/items.json`
- **料理詳細**: `public/data/dishes.json`

### 2.2. 購入ロジック
- **価格設定**: 各アイテムまたは料理の `recoveryAmount` フィールドの値を、購入に必要な価格（ゴールド）として扱います。
- **所持金チェック**: プレイヤーの `gold` が `recoveryAmount` 以上の数値である場合のみ購入可能です。
- **処理内容**: 
    1. プレイヤーの `gold` から `recoveryAmount` を減算。
    2. プレイヤーの `inventory` に対象アイテム/料理を追加。

### 2.3. インタラクション
- マップ上のオブジェクトの `objectId` が `shops.json` に定義されているもの、あるいは `eventId` に `shop:[shopId]` 形式で指定されているものが対象となります。

---

## 3. 収集ポイント機能 (Collection Points)
収集ポイントは、プレイヤーが特定の場所からランダムにアイテムを獲得できる場所です。

### 3.1. データ参照
- **定義**: `public/data/collectionPoints.json`
- **アイテム候補**: `itemIds` 配列に含まれるアイテムID。

### 3.2. 獲得ロジック
- **コスト**: 獲得時にプレイヤーの `hp` を一定量（例: 10）消費します。
- **ランダム抽選**: `itemIds` 配列の中から1つのアイテムIDを等確率で抽選します。
- **処理内容**:
    1. 抽選されたアイテムをプレイヤーの `inventory` に追加。
    2. 「[アイテム名] を手に入れた！」という通知を表示。

---

## 4. プレイテストへの統合
`PlayTestClient.tsx` において以下のデータを統合管理します。
- **データロード**: 初期化時に `items.json` と `dishes.json` を読み込み、`availableObjects` としてマージします。
- **UI表示**: `shops.json` の `itemIds` と `dishIds` を統合してショップ画面にリストアップします。
