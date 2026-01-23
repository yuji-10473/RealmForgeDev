import { MenuSimulatorClient } from "@/components/client/menu-simulator-client";

export default function MenuSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">メニューシミュレーター</h1>
        <p className="text-muted-foreground">所持アイテムやイベント、図鑑などのゲームメニューを確認します。</p>
      </header>
      <MenuSimulatorClient />
    </div>
  );
}
