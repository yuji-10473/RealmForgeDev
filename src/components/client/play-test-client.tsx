'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, Save, Terminal, User as UserIcon} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Label} from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {Button} from '../ui/button';
import { MenuIcon } from '@/components/icons/MenuIcon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MenuSimulatorClient, type DisplayInventoryItem } from './menu-simulator-client';
import type { User } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const MAP_WIDTH = 2752;
const MAP_HEIGHT = 1536;
const CHARACTER_SPEED = 10;
const CHARACTER_WIDTH = 256;
const CHARACTER_HEIGHT = 256;
const INTERACTION_RADIUS = 50;

// v1.1.1 Path Resolution
const resolveMediaUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
};

type Movement = {
  type: 'stationary' | 'patrol-h';
  range?: number;
};

type PlacedObject = {
  id: string;
  objectId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  transition?: {
    targetMapId: string;
    targetX: number;
    targetY: number;
  };
  conversation?: string;
  audioPath?: string;
  eventId?: string;
  movement?: Movement;
};

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width?: number;
  height?: number;
  type?: 'person' | 'door' | 'item';
};

type PlayerCharacter = {
  id: string;
  name: string;
  path: string;
};

type MapCell = {
  id: string;
  name: string;
  imageUrl: string;
  objects: PlacedObject[];
};

type WorldData = {
  id: string;
  name: string;
  rows: number;
  cols: number;
  maps: MapCell[];
};

type CharacterDirection = 'up' | 'down' | 'left' | 'right';

type SavedInventoryItem = {
  itemId: string;
  quantity: number;
};

export type EventNode = {
  id: string;
  type: 'start' | 'story' | 'choice' | 'reward' | 'end';
  content: string;
  nextStepId?: string;
  choices?: { text: string; nextStepId: string }[];
};

export type EventFlow = {
  id: string;
  nodes: EventNode[];
};

type NpcState = {
  x: number;
  y: number;
  originX: number;
  movement: Movement;
  direction: number;
};

function DialogueBox({
  conversation,
  audioPath,
  onComplete,
}: {
  conversation: string;
  audioPath?: string;
  onComplete: () => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioPath && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  }, [audioPath]);

  return (
    <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4 z-50 text-foreground shadow-lg">
      <p className="mb-4 text-lg whitespace-pre-wrap">{conversation}</p>
      <div className="flex justify-end">
        <Button onClick={onComplete}>閉じる</Button>
      </div>
      {audioPath && <audio ref={audioRef} src={resolveMediaUrl(audioPath)} preload="auto" />}
    </div>
  );
}

export function PlayTestClient({ user, initialData }: { user: User, initialData: any | null }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const saveDocRef = useRef(doc(firestore, 'playtestSaves', user.uid));

  // Assets
  const [masterWorlds, setMasterWorlds] = useState<WorldData[]>([]);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  const [masterEvents, setMasterEvents] = useState<EventFlow[]>([]);
  const [playerCharacters, setPlayerCharacters] = useState<PlayerCharacter[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [selectedWorldId, setSelectedWorldId] = useState<string>(initialData?.mapId || '');
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [characterPosition, setCharacterPosition] = useState({x: initialData?.positionX || MAP_WIDTH / 2, y: initialData?.positionY || MAP_HEIGHT / 2});
  const [inventory, setInventory] = useState<SavedInventoryItem[]>(initialData?.inventory || []);
  const [gold, setGold] = useState(initialData?.gold || 0);
  const [characterDirection, setCharacterDirection] = useState<CharacterDirection>('down');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState<{ conversation: string; audioPath?: string } | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventFlow | null>(null);
  const [currentNode, setCurrentNode] = useState<EventNode | null>(null);
  const [npcStates, setNpcStates] = useState<Record<string, NpcState>>({});

  const gameLoopRef = useRef<number>();
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const currentWorld = useMemo(() => masterWorlds.find(w => w.id === selectedWorldId), [masterWorlds, selectedWorldId]);
  const activeMapData = currentWorld?.maps[activeCellIndex];
  const isGamePaused = activeInteraction !== null || isMenuOpen || activeEvent !== null;
  const activePlayerChar = useMemo(() => playerCharacters.find(c => c.id === activePlayerId) || playerCharacters[0], [playerCharacters, activePlayerId]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const fetchData = async (file: string) => {
          const res = await fetch(`/data/${file}.json`);
          return res.ok ? await res.json() : [];
        };

        const [worlds, villagers, items, buildings, events, playerListRes] = await Promise.all([
          fetchData('worlds'),
          fetchData('villagers'),
          fetchData('items'),
          fetchData('buildings'),
          fetchData('eventFlows'),
          fetch('/characters/characters.json').then(res => res.ok ? res.json() : { characters: [] })
        ]);

        setMasterWorlds(worlds);
        setAvailableObjects([...villagers, ...items, ...buildings]);
        setMasterEvents(events);
        setPlayerCharacters(playerListRes.characters || []);

        if (playerListRes.characters?.length > 0) {
          setActivePlayerId(playerListRes.characters[0].id);
        }

        if (worlds.length > 0 && !selectedWorldId) {
          setSelectedWorldId(worlds[0].id);
        }
      } catch (e: any) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [selectedWorldId]);

  useEffect(() => {
    if (!activeMapData) return;
    const newNpcStates: Record<string, NpcState> = {};
    activeMapData.objects.forEach(obj => {
      if (obj.movement?.type === 'patrol-h') {
        newNpcStates[obj.id] = { x: obj.x, y: obj.y, originX: obj.x, movement: obj.movement, direction: 1 };
      }
    });
    setNpcStates(newNpcStates);
  }, [activeMapData]);

  const handleSave = () => {
    const saveData = {
      userId: user.uid,
      mapId: selectedWorldId,
      positionX: characterPosition.x,
      positionY: characterPosition.y,
      inventory,
      gold,
      updatedAt: serverTimestamp(),
    };
    setDocumentNonBlocking(saveDocRef.current, saveData, { merge: true });
    toast({ title: "セーブ完了", description: "進行状況を保存しました。" });
  };

  const checkForInteraction = useCallback(() => {
    if (isGamePaused || !activeMapData) return;
    const charCX = characterPosition.x + CHARACTER_WIDTH / 2;
    const charCY = characterPosition.y + CHARACTER_HEIGHT / 2;

    for (const obj of activeMapData.objects) {
      const currentX = npcStates[obj.id]?.x ?? obj.x;
      const dist = Math.sqrt(Math.pow(charCX - (currentX + obj.width / 2), 2) + Math.pow(charCY - (obj.y + obj.height / 2), 2));

      if (dist < INTERACTION_RADIUS + 100) {
        if (obj.eventId) {
          const flow = masterEvents.find(e => e.id === obj.eventId);
          if (flow) {
            setActiveEvent(flow);
            setCurrentNode(flow.nodes.find(n => n.type === 'start') || null);
            return;
          }
        }
        if (obj.conversation) {
          setActiveInteraction({ conversation: obj.conversation, audioPath: obj.audioPath });
          return;
        }
      }
    }
  }, [activeMapData, characterPosition, npcStates, masterEvents, isGamePaused]);

  useEffect(() => {
    const loop = () => {
      if (isGamePaused) {
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      let moveX = 0, moveY = 0;
      if (pressedKeys.has('ArrowUp') || pressedKeys.has('w')) moveY -= 1;
      if (pressedKeys.has('ArrowDown') || pressedKeys.has('s')) moveY += 1;
      if (pressedKeys.has('ArrowLeft') || pressedKeys.has('a')) moveX -= 1;
      if (pressedKeys.has('ArrowRight') || pressedKeys.has('d')) moveX += 1;

      if (moveX !== 0 || moveY !== 0) {
        setCharacterDirection(moveX > 0 ? 'right' : moveX < 0 ? 'left' : moveY > 0 ? 'down' : 'up');
        setCharacterPosition(prev => ({
          x: Math.max(0, Math.min(MAP_WIDTH - CHARACTER_WIDTH, prev.x + moveX * CHARACTER_SPEED)),
          y: Math.max(0, Math.min(MAP_HEIGHT - CHARACTER_HEIGHT, prev.y + moveY * CHARACTER_SPEED))
        }));
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(gameLoopRef.current!);
  }, [pressedKeys, isGamePaused]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if ([' ', 'Enter'].includes(e.key)) checkForInteraction();
      else setPressedKeys(prev => new Set(prev).add(e.key));
    };
    const handleUp = (e: KeyboardEvent) => setPressedKeys(prev => { const n = new Set(prev); n.delete(e.key); return n; });
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
  }, [checkForInteraction]);

  const displayInventory: DisplayInventoryItem[] = inventory.map(i => {
    const details = availableObjects.find(a => a.id === i.itemId);
    return { id: i.itemId, name: details?.name || 'Unknown', imageUrl: resolveMediaUrl(details?.imageUrl), quantity: i.quantity };
  });

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin mr-2" /> ロード中...</div>;

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <div className="flex flex-col h-full gap-4">
        <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border gap-4">
          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <Label className="whitespace-nowrap text-xs">マップ</Label>
            <Select value={selectedWorldId} onValueChange={setSelectedWorldId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{masterWorlds.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={activePlayerId} onValueChange={setActivePlayerId}>
              <SelectTrigger><SelectValue placeholder="プレイヤー選択" /></SelectTrigger>
              <SelectContent>
                {playerCharacters.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 shrink-0">
            <div className="bg-primary/10 px-4 py-2 rounded-full font-bold text-primary">{gold} K</div>
            <Button size="icon" variant="outline" onClick={handleSave}><Save className="h-4 w-4"/></Button>
            <SheetTrigger asChild><Button size="icon" variant="outline"><MenuIcon className="h-4 w-4"/></Button></SheetTrigger>
          </div>
        </div>

        <div className="relative flex-grow bg-muted border-2 rounded-lg overflow-hidden aspect-[16/9]">
          {activeMapData && (
            <>
              <Image src={resolveMediaUrl(activeMapData.imageUrl)} alt="" fill className="object-cover" unoptimized priority />
              {activeMapData.objects.map(obj => {
                const asset = availableObjects.find(a => a.id === obj.objectId);
                if (!asset) return null;
                const curX = npcStates[obj.id]?.x ?? obj.x;
                return (
                  <div key={obj.id} style={{ left: `${(curX / MAP_WIDTH) * 100}%`, top: `${(obj.y / MAP_HEIGHT) * 100}%`, width: `${(obj.width / MAP_WIDTH) * 100}%`, position: 'absolute' }}>
                    <Image src={resolveMediaUrl(asset.imageUrl)} alt="" layout="responsive" width={asset.width || 256} height={asset.height || 256} unoptimized />
                  </div>
                );
              })}
              {/* Player - Character Editor's frame structure: path/frames/idle_direction_1.png */}
              <div style={{ left: `${(characterPosition.x / MAP_WIDTH) * 100}%`, top: `${(characterPosition.y / MAP_HEIGHT) * 100}%`, width: `${(CHARACTER_WIDTH / MAP_WIDTH) * 100}%`, position: 'absolute', zIndex: 10 }}>
                {activePlayerChar && (
                  <Image 
                    src={`${activePlayerChar.path}/frames/idle_${characterDirection}_1.png`} 
                    alt="Player" 
                    layout="responsive" 
                    width={256} 
                    height={256} 
                    unoptimized 
                  />
                )}
              </div>
            </>
          )}

          {activeInteraction && <DialogueBox conversation={activeInteraction.conversation} audioPath={activeInteraction.audioPath} onComplete={() => setActiveInteraction(null)} />}
        </div>
      </div>
      <SheetContent><MenuSimulatorClient inventoryItems={displayInventory} /></SheetContent>
    </Sheet>
  );
}
