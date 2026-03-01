'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const SequencePlayerClient = dynamic(
  () => import('@/components/client/sequence-player-client').then((mod) => mod.SequencePlayerClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

export default function SequencePlayerPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
      <header>
        <h1 className="text-3xl font-bold font-headline">シーケンスプレイヤー</h1>
        <p className="text-muted-foreground">グランドナラティブ形式の物語をインポートして再生します。</p>
      </header>
      <div className="flex-grow min-h-0">
        <SequencePlayerClient />
      </div>
    </div>
  );
}
