'use client';

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const CharacterAnimatorClient = dynamic(
  () => import('@/components/client/character-animator-client').then((mod) => mod.CharacterAnimatorClient),
  { 
    ssr: false,
    loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
);

export default function CharacterEditorPage() {
  return (
    <div className="space-y-8 h-[calc(100vh-4rem)] flex flex-col">
      <header>
        <h1 className="text-3xl font-bold font-headline">キャラクターアニメーター</h1>
        <p className="text-muted-foreground">キャラクターに命を吹き込み、アニメーションを作成・編集します。</p>
      </header>
      <div className="flex-grow min-h-0">
        <CharacterAnimatorClient />
      </div>
    </div>
  );
}
