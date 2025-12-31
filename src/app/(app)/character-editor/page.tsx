import { CharacterAnimatorClient } from "@/components/client/character-animator-client";

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
