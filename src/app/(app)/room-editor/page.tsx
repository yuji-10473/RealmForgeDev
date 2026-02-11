'use client';

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const RoomEditorClient = dynamic(
  () => import('@/components/client/room-editor-client').then((mod) => mod.RoomEditorClient),
  { 
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
);

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
