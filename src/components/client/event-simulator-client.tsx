'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, Plus, Trash2, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

// Types from the spec
type EventChoice = {
  text: string;
  nextStepId: string;
  requiredItemId?: string;
  lockedText?: string;
};

type EventReward = {
  itemId: string;
  itemName: string;
};

type EventNode = {
  id: string;
  type: 'start' | 'story' | 'choice' | 'reward' | 'end';
  content: string;
  nextStepId?: string;
  choices?: EventChoice[];
  reward?: EventReward;
};

type GameEvent = {
  id: string;
  title: string;
  villagerName?: string;
  plot?: string;
  createdAt: string;
  nodes: EventNode[];
};

type PlayerInventoryItem = {
  itemId: string;
  name: string;
  quantity: number;
};

export function EventSimulatorClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<GameEvent[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [currentNode, setCurrentNode] = useState<EventNode | null>(null);
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([]);
  const [log, setLog] = useState<string[]>([]);
  
  const [newItemId, setNewItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');

  const selectedEvent = useMemo(() => allEvents.find(e => e.id === selectedEventId), [allEvents, selectedEventId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/events/sub-events.json');
        if (!response.ok) throw new Error('イベントデータ(sub-events.json)の読み込みに失敗しました。');
        
        const data: GameEvent[] = await response.json();
        setAllEvents(data);

        if (data.length > 0) {
          setSelectedEventId(data[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const startNode = selectedEvent.nodes.find(n => n.type === 'start');
      setCurrentNode(startNode || null);
      setLog([`イベント「${selectedEvent.title}」を開始。`]);
    } else {
      setCurrentNode(null);
      setLog([]);
    }
  }, [selectedEvent]);

  const goToNode = (nodeId: string | undefined) => {
    if (!selectedEvent || !nodeId) {
      setCurrentNode(null);
      return;
    }
    const nextNode = selectedEvent.nodes.find(n => n.id === nodeId);
    if(nextNode) {
      setCurrentNode(nextNode);
      setLog(prev => [...prev, ` -> ${nextNode.id} (${nextNode.type})`]);

      if (nextNode.type === 'reward' && nextNode.reward) {
        const { itemId, itemName } = nextNode.reward;
        setPlayerInventory(prev => {
          const existing = prev.find(i => i.itemId === itemId);
          if (existing) {
            return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { itemId, name: itemName, quantity: 1 }];
        });
        toast({
          title: "報酬ゲット！",
          description: `${itemName} を手に入れた。`,
        });
      }
    } else {
      setCurrentNode(null);
      setLog(prev => [...prev, ` -> Error: Node "${nodeId}" not found.`]);
    }
  };

  const handleChoice = (choice: EventChoice) => {
    if (choice.requiredItemId) {
      const hasItem = playerInventory.some(item => item.itemId === choice.requiredItemId);
      if (!hasItem) {
        toast({
          variant: "destructive",
          title: "アイテムがありません",
          description: choice.lockedText || "この選択肢を実行できません。",
        });
        return;
      }
    }
    goToNode(choice.nextStepId);
  };
  
  const handleAddItem = () => {
    if (!newItemId || !newItemName) {
      toast({ variant: "destructive", title: "アイテムIDと名前を入力してください。"});
      return;
    }
    setPlayerInventory(prev => {
      const existing = prev.find(i => i.itemId === newItemId);
      if (existing) {
        return prev.map(i => i.itemId === newItemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: newItemId, name: newItemName, quantity: 1 }];
    });
    setNewItemId('');
    setNewItemName('');
  };

  const handleRemoveItem = (itemId: string) => {
     setPlayerInventory(prev => prev.filter(i => i.itemId !== itemId));
  };


  const renderNodeContent = () => {
    if (!currentNode) return <p className="text-muted-foreground">イベントが終了したか、ノードが見つかりません。</p>;

    return (
      <div className="space-y-6">
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle className="text-lg">{currentNode.type.toUpperCase()} NODE: {currentNode.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg min-h-[4rem]">{currentNode.content}</p>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {currentNode.type === 'story' || currentNode.type === 'reward' || currentNode.type === 'start' ? (
            <Button onClick={() => goToNode(currentNode.nextStepId)} className="w-full">次へ</Button>
          ) : null}

          {currentNode.type === 'choice' && currentNode.choices?.map(choice => {
            const hasItem = choice.requiredItemId ? playerInventory.some(i => i.itemId === choice.requiredItemId) : true;
            const isDisabled = !!choice.requiredItemId && !hasItem;
            return (
              <Button 
                key={choice.nextStepId}
                onClick={() => handleChoice(choice)}
                variant={isDisabled ? "secondary" : "default"}
                disabled={isDisabled}
                className="w-full justify-between"
              >
                <span>{choice.text}</span>
                {choice.requiredItemId && <span className="text-xs font-mono p-1 bg-primary-foreground/20 rounded">要:{choice.requiredItemId}</span>}
              </Button>
            )
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" />データを読み込み中...</div>;
  }
  if (error) {
    return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>読み込みエラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
              <Label htmlFor="event-select">テストするイベント</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger id="event-select" className="w-full mt-2">
                  <SelectValue placeholder="イベントを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {allEvents.map(event => (
                    <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
          </CardHeader>
          {selectedEvent && (
            <CardContent className="space-y-2">
                <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/30">
                    <BookOpen className="h-6 w-6 mt-1 text-accent flex-shrink-0" />
                    <div>
                        <h3 className="font-semibold">{selectedEvent.villagerName}の依頼</h3>
                        <p className="text-sm text-muted-foreground">{selectedEvent.plot}</p>
                    </div>
                </div>
            </CardContent>
          )}
        </Card>
        
        {selectedEvent ? renderNodeContent() : <p>イベントを選択してください。</p>}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>シミュレーター設定</CardTitle>
            <CardDescription>プレイヤーのテストデータを変更します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Label>テスト用インベントリ</Label>
            <div className="space-y-2">
              {playerInventory.length > 0 ? playerInventory.map(item => (
                <div key={item.itemId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                     <span className="font-semibold truncate">{item.name}</span>
                     <span className="text-xs text-muted-foreground">({item.itemId})</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className="font-mono text-sm">x{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveItem(item.itemId)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </div>
              )) : <p className="text-sm text-center text-muted-foreground py-4">アイテムがありません。</p>}
            </div>
             <div className="flex gap-2 pt-4 border-t">
                <Input value={newItemId} onChange={e => setNewItemId(e.target.value)} placeholder="アイテムID..."/>
                <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="アイテム名..."/>
                <Button onClick={handleAddItem}><Plus className="h-4 w-4"/></Button>
             </div>
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>進行ログ</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48 w-full rounded-md border p-2 font-mono text-xs">
                    {log.map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
