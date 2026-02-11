'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ShopSimulatorClient = dynamic(
  () => import('@/components/client/shop-simulator-client').then((mod) => mod.ShopSimulatorClient),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  }
);

export default function ShopSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">ショップシミュレーター</h1>
        <p className="text-muted-foreground">ショップのUIと売買ロジックをテストします。</p>
      </header>
      <ShopSimulatorClient />
    </div>
  );
}
