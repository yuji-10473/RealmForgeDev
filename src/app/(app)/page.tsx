import { MapEditorClient } from "@/components/client/map-editor-client";

export default function MapEditorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Map Editor</h1>
        <p className="text-muted-foreground">Design your 2D game world. Select a tile and click on the grid to paint.</p>
      </header>
      <MapEditorClient />
    </div>
  );
}
