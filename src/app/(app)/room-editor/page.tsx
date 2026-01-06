
import { RoomEditorClient } from "@/components/client/room-editor-client";

export default function RoomEditorPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="py-4">
        <h1 className="text-3xl font-bold font-headline">ルームエディター</h1>
        <p className="text-muted-foreground">家やダンジョンなどのインドアシーンを作成・編集します。</p>
      </header>
      <div className="flex-grow min-h-0">
        <RoomEditorClient />
      </div>
    </div>
  );
}
