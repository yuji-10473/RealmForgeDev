import { MapEditorClient } from "@/components/client/map-editor-client";

export default function MapEditorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">マップエディター</h1>
        <p className="text-muted-foreground">2Dゲームの世界をデザインしましょう。タイルを選択してグリッド上をクリックして描画します。</p>
      </header>
      <MapEditorClient />
    </div>
  );
}
