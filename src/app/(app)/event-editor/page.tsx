'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Move, PlayCircle, Gift, Import } from "lucide-react";

// Define types for clarity
type Action = {
  icon: React.ElementType;
  title: string;
  description: string;
};

type Event = {
  id: string;
  name: string;
  actions: Action[];
};

type SubEvent = {
  id: string;
  name: string;
  description: string;
  actions: {
      icon: string; // From JSON it will be a string
      title: string;
      description: string;
  }[];
};

// Icon mapping
const iconComponents: { [key: string]: React.ElementType } = {
  MessageSquare,
  Move,
  PlayCircle,
  Gift,
};

const initialEvents: Event[] = [
  { id: "evt_start", name: "ゲーム開始", actions: [] },
  { id: "evt_talk_npc1", name: "老人と話す", actions: [
      { icon: MessageSquare, title: "ダイアログを表示", description: "「ようこそ、旅人よ！この先の旅は危険に満ちているぞ。」" },
      { icon: Move, title: "キャラクターを移動", description: "プレイヤーが座標(12, 34)に移動します。" },
      { icon: PlayCircle, title: "カットシーンを再生", description: "cutscene_intro.mp4" },
  ]},
  { id: "evt_enter_castle", name: "影の城に入る", actions: [] },
];

export default function EventEditorPage() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [activeEventId, setActiveEventId] = useState<string>('evt_talk_npc1');
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  
  useEffect(() => {
    // Fetch sub-events from the new JSON file
    fetch('/events/sub-events.json')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setSubEvents(data.subEvents))
      .catch(err => console.error("Failed to load sub-events:", err));
  }, []);

  const activeEvent = events.find(e => e.id === activeEventId);

  const handleImportSubEvent = (subEventId: string) => {
    const subEvent = subEvents.find(se => se.id === subEventId);
    if (!subEvent || !activeEventId) return;

    // Convert icon strings from JSON to actual components
    const newActions = subEvent.actions.map(action => ({
      ...action,
      icon: iconComponents[action.icon] || MessageSquare, // Fallback icon
    }));

    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === activeEventId) {
          return { ...event, actions: [...event.actions, ...newActions] };
        }
        return event;
      })
    );
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">イベントエディター</h1>
        <p className="text-muted-foreground">あなたの世界の物語とインタラクションを作り上げましょう。</p>
      </header>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
        
        {/* Left Column */}
        <div className="xl:col-span-1 flex flex-col gap-8">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>イベント</CardTitle>
              <CardDescription>アクションを編集するイベントを選択してください。</CardDescription>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent className="p-2">
                <div className="flex flex-col gap-2">
                  {events.map((event) => (
                    <Button
                      key={event.id}
                      variant={event.id === activeEventId ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveEventId(event.id)}
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
          
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>サブイベントライブラリ</CardTitle>
              <CardDescription>再利用可能なイベントの部品です。</CardDescription>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent className="p-2 space-y-2">
                {subEvents.length > 0 ? subEvents.map((subEvent) => (
                  <div key={subEvent.id} className="flex items-center gap-2">
                    <div className="flex-grow text-sm p-2 rounded-md bg-muted/50">
                      <p className="font-semibold">{subEvent.name}</p>
                      <p className="text-xs text-muted-foreground">{subEvent.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImportSubEvent(subEvent.id)}
                      disabled={!activeEventId}
                    >
                      <Import className="mr-2 h-4 w-4" />
                      インポート
                    </Button>
                  </div>
                )) : <p className="text-sm text-center text-muted-foreground p-4">サブイベントが見つかりません。</p>}
              </CardContent>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Column */}
        <Card className="xl:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle>アクション：{activeEvent?.name || '未選択'}</CardTitle>
            <CardDescription>これらのアクションはイベントがトリガーされたときに実行されます。</CardDescription>
          </CardHeader>
          <ScrollArea className="flex-grow">
            <CardContent className="space-y-4">
              {activeEvent?.actions.map((action, index) => (
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
              {(!activeEvent || activeEvent.actions.length === 0) && (
                <div className="text-center text-muted-foreground py-10">
                  <p>{activeEventId ? 'アクションがありません。' : 'イベントを選択してください。'}</p>
                </div>
              )}
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
