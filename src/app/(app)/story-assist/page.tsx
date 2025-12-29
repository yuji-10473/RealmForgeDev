import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryElementsForm } from "./story-elements-form";
import { CharacterBackstoryForm } from "./character-backstory-form";
import { DialogueSnippetsForm } from "./dialogue-snippets-form";

export default function StoryAssistPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">AI搭載ストーリーアシスト</h1>
        <p className="text-muted-foreground">あなたの世界のためのアイデア、バックストーリー、対話を生成します。</p>
      </header>

      <Tabs defaultValue="story-elements" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="story-elements">物語の要素</TabsTrigger>
          <TabsTrigger value="character-backstories">キャラクターのバックストーリー</TabsTrigger>
          <TabsTrigger value="dialogue-snippets">会話の断片</TabsTrigger>
        </TabsList>
        <TabsContent value="story-elements" className="mt-6">
          <StoryElementsForm />
        </TabsContent>
        <TabsContent value="character-backstories" className="mt-6">
          <CharacterBackstoryForm />
        </TabsContent>
        <TabsContent value="dialogue-snippets" className="mt-6">
          <DialogueSnippetsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
