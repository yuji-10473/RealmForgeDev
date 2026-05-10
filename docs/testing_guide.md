# 自動テスト実行ガイド (Playwright)

## 1. 概要
本プロジェクトでは、**Playwright** を使用してブラウザ上のプレイヤー操作をシミュレートする E2E（エンドツーエンド）テストを導入しています。

## 2. セットアップ
初回のみ、以下のコマンドでブラウザのインストールが必要です。
```bash
npx playwright install
```

## 3. テストの実行

### 全てのテストを実行
```bash
npm run test:e2e
```

### UI モードで実行 (デバッグに便利)
ブラウザの動きを視覚的に確認しながらテストできます。
```bash
npx playwright test --ui
```

## 4. テストの作成ルール
新しいテストを追加する場合は、`tests/` ディレクトリ内に `.spec.ts` ファイルを作成します。

### セレクターの指定
要素を特定する際は、コード内の `data-testid` を優先的に使用してください。
- `page.getByTestId('player-character')`: プレイヤー
- `page.getByTestId('stat-hp')`: HPバー
- `page.getByTestId('btn-save')`: 保存ボタン

## 5. 注意事項
- テストは現在 `http://localhost:9002` を前提に設定されています。開発サーバーを起動した状態で実行してください。
- 認証が必要な機能のテストには、`tests/play-test.spec.ts` にあるようにログイン画面の回避ロジックが必要になります。
