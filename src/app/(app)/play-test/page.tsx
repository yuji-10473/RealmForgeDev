import { PlayTestClient } from "@/components/client/play-test-client";

export default function PlayTestPage() {
  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <header className="py-4 flex-shrink-0">
        <h1 className="text-3xl font-bold font-headline">プレイテスト</h1>
        <p className="text-muted-foreground">マップ上をキャラクターを動かしてテストします。</p>
      </header>
      <div className="flex-grow min-h-0">
        <PlayTestClient />
      </div>
    </div>
  );
}
