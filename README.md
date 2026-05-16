
# RealmForge (Ver 0.1.21)

13世紀の日本・鎌倉時代を舞台にした歴史RPG制作プラットフォーム。最新の生成AIを活用し、歴史の「もしも」を形にするクリエイティブな体験を提供します。

## 🚀 主な機能
- **マップ/ルームエディター**: 鎌倉の風景や建物の内部を直感的に構築。
- **イベント/ストーリーエディター**: AIと対話しながら重厚なナラティブを作成。
- **プレイテスト機能**: サバイバル（HP/空腹度）、経済（納品/売上精算）、レベルシステムを統合したゲームプレイ。
- **縦型UIモード**: 全てのユーザーがスマートフォンでの操作に最適化したプレイ環境を利用可能。
- **AIストーリーアシスト**: バックストーリーや対話の自動生成。

## 🛠 テクニカルスタック
- **Framework**: Next.js 15 (App Router)
- **Database/Auth**: Firebase (Firestore, Authentication)
- **AI**: Genkit (Gemini 2.5 Flash)
- **UI**: Shadcn UI + Tailwind CSS
- **Testing**: Playwright (E2E)

## 📝 最新の更新 (Ver 0.1.21)
- **システム安定性の向上**: 内部的なコンポーネント構成の整理と安定化を実施。
- **縦型UIの最適化**: モバイル環境における操作フィードバックを微調整。

## 📂 ドキュメント
詳細は `docs/` ディレクトリ内の各仕様書を参照してください。
- `Admin-User.md`: 権限管理とログインフロー
- `construction_system_specification.md`: 建設（工事中）システム
- `mobile_compatibility_roadmap.md`: モバイル対応計画
- `testing_guide.md`: 自動テストの実行方法
