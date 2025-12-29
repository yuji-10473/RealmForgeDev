import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Move, PlayCircle } from "lucide-react";

export default function EventEditorPage() {
  const events = [
    { id: "evt_start", name: "ゲーム開始" },
    { id: "evt_talk_npc1", name: "老人と話す" },
    { id: "evt_enter_castle", name: "影の城に入る" },
  ];

  const actions = [
    { icon: MessageSquare, title: "ダイアログを表示", description: "「ようこそ、旅人よ！この先の旅は危険に満ちているぞ。」" },
    { icon: Move, title: "キャラクターを移動", description: "プレイヤーが座標(12, 34)に移動します。" },
    { icon: PlayCircle, title: "カットシーンを再生", description: "cutscene_intro.mp4" },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">イベントエディター</h1>
        <p className="text-muted-foreground">あなたの世界の物語とインタラクションを作り上げましょう。</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 h-[calc(100vh-12rem)]">
        <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle>イベント</CardTitle>
            <CardDescription>アクションを編集するイベントを選択してください。</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="p-2">
              <div className="flex flex-col gap-2">
                {events.map((event, index) => (
                  <Button
                    key={event.id}
                    variant={index === 1 ? "secondary" : "ghost"}
                    className="w-full justify-start"
                  >
                    {event.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-2 border-t">
             <Button variant="outline" className="w-full">新規イベント</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>アクション：老人と話す</CardTitle>
            <CardDescription>これらのアクションはイベントがトリガーされたときに実行されます。</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-4">
              {actions.map((action, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                    <action.icon className="w-6 h-6 text-accent" />
                    <div className="flex-grow">
                      <CardTitle className="text-base">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm">編集</Button>
                  </CardHeader>
                </Card>
              ))}
            </CardContent>
          </ScrollArea>
           <CardFooter className="p-2 border-t">
             <Button variant="outline" className="w-full">アクションを追加</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
