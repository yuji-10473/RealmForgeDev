'use client';

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const StoryEditorClient = dynamic(
  () => import('@/components/client/story-editor-client').then((mod) => mod.StoryEditorClient),
  { 
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
);

export default function StoryEditorPage() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <header className="py-4">
        <h1 className="text-3xl font-bold font-headline">ストーリーエディター</h1>
        <p className="text-muted-foreground">キャラクターの動きとイベントを組み合わせて、物語のシーケンスを作成します。</p>
      </header>
      <div className="flex-grow min-h-0">
        <StoryEditorClient />
      </div>
    </div>
  );
}
