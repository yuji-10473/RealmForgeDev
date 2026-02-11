'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MenuSimulatorClient = dynamic(
  () => import('@/components/client/menu-simulator-client').then((mod) => mod.MenuSimulatorClient),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  }
);

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
