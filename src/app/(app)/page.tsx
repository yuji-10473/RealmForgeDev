import { MapEditorClient } from "@/components/client/map-editor-client";

export default function MapEditorPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="py-4">
        <h1 className="text-3xl font-bold font-headline">マップエディター</h1>
        <p className="text-muted-foreground">あなたの壮大なゲームの世界を構築しましょう。</p>
      </header>
      <div className="flex-grow min-h-0">
        <MapEditorClient />
      </div>
    </div>
  );
}
