'use client';

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const CombatSimulatorClient = dynamic(
  () => import('@/components/client/combat-simulator-client').then((mod) => mod.CombatSimulatorClient),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
);

export default function CombatSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">戦闘シミュレーター</h1>
        <p className="text-muted-foreground">キャラクターをテストし、戦闘メカニクスのバランスを調整します。</p>
      </header>
      <CombatSimulatorClient />
    </div>
  );
}
