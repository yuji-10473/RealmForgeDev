'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const EventSimulatorClient = dynamic(
  () => import('@/components/client/event-simulator-client').then((mod) => mod.EventSimulatorClient),
  {
    ssr: false,
    loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>,
  }
);


export default function EventSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">イベントシミュレーター</h1>
        <p className="text-muted-foreground">イベントのフローと分岐をテストします。</p>
      </header>
      <EventSimulatorClient />
    </div>
  );
}
