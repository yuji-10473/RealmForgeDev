'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, Plus, Trash2, BookOpen, Flag } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

// Data types based on the new specification
export type Choice = {
  text: string;
  nextStepId: string;
  requiredItemId?: string;
  lockedText?: string;
};

export type Reward = {
  itemId?: string;
  itemName?: string;
  amount?: number;
};

export type EventNode = {
  id: string;
  type: 'start' | 'story' | 'choice' | 'reward' | 'end';
  content: string;
  setFlag?: string;
  nextStepId?: string;
  requiredFlag?: string;
  choices?: Choice[];
  reward?: Reward;
};

export type GameEvent = {
  id: string; // Firestore document ID
  title: string;
  plot?: string;
  villagerId?: string;
  villagerName?: string;
  createdAt?: any; // Firestore Timestamp
  requiredFlag?: string;
  nodes: EventNode[];
};

type PlayerInventoryItem = {
  itemId: string;
  name: string;
  quantity: number;
};

export function EventSimulatorClient() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const eventsCollectionRef = useMemoFirebase(() => collection(firestore, 'eventFlows'), [firestore]);
  const { data: allEvents, isLoading: eventsLoading, error: eventsError } = useCollection<GameEvent>(eventsCollectionRef);

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [currentNode, setCurrentNode] = useState<EventNode | null>(null);
  const [log, setLog] = useState<string[]>([]);
  
  // Simulator state
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([]);
  const [playerFlags, setPlayerFlags] = useState<string[]>([]);
  const [playerGold, setPlayerGold] = useState<number>(100);

  const [newItemId, setNewItemId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newFlag, setNewFlag] = useState('');

  const selectedEvent = useMemo(() => allEvents?.find(e => e.id === selectedEventId), [allEvents, selectedEventId]);

  // Effect to select the first event when data loads
  useEffect(() => {
    if (!selectedEventId && allEvents && allEvents.length > 0) {
      setSelectedEventId(allEvents[0].id);
    }
  }, [allEvents, selectedEventId]);

  // Effect to start/reset the simulation when the selected event changes
  useEffect(() => {
    if (selectedEvent) {
      const startNode = selectedEvent.nodes.find(n => n.type === 'start');
      
      if (!startNode) {
        setLog([`Error: Event "${selectedEvent.title}" has no 'start' node.`]);
        setCurrentNode(null);
        return;
      }

      // Check top-level required flag
      if (selectedEvent.requiredFlag && !playerFlags.includes(selectedEvent.requiredFlag)) {
        toast({
            variant: "destructive",
            title: "イベントを開始できません",
            description: `必要なフラグがありません: ${selectedEvent.requiredFlag}`,
        });
        setLog([`EVENT LOCKED: Missing required flag "${selectedEvent.requiredFlag}".`]);
        setCurrentNode(null);
        return;
      }
      
      // Check start-node-level required flag
      if (startNode.requiredFlag && !playerFlags.includes(startNode.requiredFlag)) {
        toast({
            variant: "destructive",
            title: "イベントを開始できません",
            description: `必要なフラグがありません: ${startNode.requiredFlag}`,
        });
        setLog([`EVENT LOCKED: Missing required flag "${startNode.requiredFlag}" on start node.`]);
        setCurrentNode(null);
        return;
      }

      setCurrentNode(startNode);
      setLog([`イベント「${selectedEvent.title}」を開始。`]);
      // Handle setFlag on start node
      if (startNode.setFlag && !playerFlags.includes(startNode.setFlag)) {
        setPlayerFlags(prev => [...prev, startNode.setFlag!]);
        toast({ title: "フラグ獲得！", description: startNode.setFlag });
      }

    } else {
      setCurrentNode(null);
      setLog([]);
    }
  }, [selectedEvent, playerFlags]); // Rerun if playerFlags change to re-evaluate entry conditions

  const goToNode = (nodeId: string | undefined) => {
    if (!selectedEvent || !nodeId) {
      setCurrentNode(null);
      return;
    }
    const nextNode = selectedEvent.nodes.find(n => n.id === nodeId);
    if(nextNode) {
      setCurrentNode(nextNode);
      setLog(prev => [...prev, ` -> ${nextNode.id} (${nextNode.type})`]);

      // Handle setFlag on arrival
      if (nextNode.setFlag && !playerFlags.includes(nextNode.setFlag)) {
        setPlayerFlags(prev => [...prev, nextNode.setFlag!]);
        toast({ title: "フラグ獲得！", description: nextNode.setFlag });
      }

      if (nextNode.type === 'reward' && nextNode.reward) {
        const { itemId, itemName, amount } = nextNode.reward;
        if (itemId && itemName) {
            setPlayerInventory(prev => {
              const existing = prev.find(i => i.itemId === itemId);
              if (existing) {
                return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
              }
              return [...prev, { itemId, name: itemName, quantity: 1 }];
            });
            toast({ title: "報酬ゲット！", description: `${itemName} を手に入れた。` });
        }
        if (amount) {
            setPlayerGold(prev => prev + amount);
            toast({ title: "報酬ゲット！", description: `${amount} K を手に入れた。` });
        }
      }
    } else {
      setCurrentNode(null);
      setLog(prev => [...prev, ` -> Error: Node "${nodeId}" not found.`]);
    }
  };

  const handleChoice = (choice: Choice) => {
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
  
  const handleAddFlag = () => {
    if (!newFlag) return;
    if (!playerFlags.includes(newFlag)) {
        setPlayerFlags(prev => [...prev, newFlag]);
    }
    setNewFlag('');
  }

  const handleRemoveFlag = (flag: string) => {
    setPlayerFlags(prev => prev.filter(f => f !== flag));
  }


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
            <Button onClick={() => goToNode(currentNode.nextStepId)} className="w-full" disabled={!currentNode.nextStepId}>次へ</Button>
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
          
          {currentNode.type === 'end' && (
             <Button onClick={() => setSelectedEventId('')} variant="outline" className="w-full">イベント選択に戻る</Button>
          )}
        </div>
      </div>
    );
  };

  if (eventsLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" />イベントデータを読み込み中...</div>;
  }
  if (eventsError) {
    return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>読み込みエラー</AlertTitle><AlertDescription>{eventsError.message}</AlertDescription></Alert>;
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
                  {allEvents?.map(event => (
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
            <div>
              <Label htmlFor="player-gold">所持金 (K)</Label>
              <Input id="player-gold" type="number" value={playerGold} onChange={(e) => setPlayerGold(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>テスト用フラグ</Label>
               {playerFlags.length > 0 ? playerFlags.map(flag => (
                <div key={flag} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                   <div className="flex items-center gap-2">
                     <Flag className="h-4 w-4 text-muted-foreground"/>
                     <span className="font-mono text-sm truncate">{flag}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveFlag(flag)}><Trash2 className="h-4 w-4"/></Button>
                </div>
              )) : <p className="text-sm text-center text-muted-foreground py-2">フラグがありません。</p>}
              <div className="flex gap-2 pt-2 border-t">
                <Input value={newFlag} onChange={e => setNewFlag(e.target.value)} placeholder="フラグ名..."/>
                <Button onClick={handleAddFlag}><Plus className="h-4 w-4"/></Button>
              </div>
            </div>
             <div className="space-y-2">
                <Label>テスト用インベントリ</Label>
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
                )) : <p className="text-sm text-center text-muted-foreground py-2">アイテムがありません。</p>}
                 <div className="flex gap-2 pt-2 border-t">
                    <Input value={newItemId} onChange={e => setNewItemId(e.target.value)} placeholder="アイテムID..."/>
                    <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="アイテム名..."/>
                    <Button onClick={handleAddItem}><Plus className="h-4 w-4"/></Button>
                 </div>
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
