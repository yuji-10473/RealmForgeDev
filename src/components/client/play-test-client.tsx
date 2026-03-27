'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, Save, Terminal, User as UserIcon, Map as MapIcon, Volume2, VolumeX, Play, Music, ShoppingCart, Sparkles, Heart, Utensils, BookOpen, MessageCircle} from 'lucide-react';
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
import {Slider} from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { MenuIcon } from '@/components/icons/MenuIcon';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { MenuSimulatorClient, type DisplayInventoryItem, type DisplaySequence, type DisplayAffection } from './menu-simulator-client';
import type { User } from 'firebase/auth';
import { useUser, useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const MAP_WIDTH = 2752;
const MAP_HEIGHT = 1536;
const CHARACTER_SPEED = 12;
const CHARACTER_WIDTH = 256;
const CHARACTER_HEIGHT = 256;
const INTERACTION_RADIUS = 150;
const HP_COLLECTION_COST = 10;
const HUNGER_COLLECTION_COST = 5;

// v1.1.1 Path Resolution
const resolveMediaUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
};

// --- Shop Types ---
type ShopData = {
  id: string;
  name: string;
  itemIds?: string[];
  dishIds?: string[];
};

type CollectionPointData = {
  id: string;
  name: string;
  itemIds: string[];
};

type MeetingPlaceData = {
  id: string;
  name: string;
  eventIds: string[];
};

// --- Cutscene Types ---
type Waypoint = {
  x: number;
  y: number;
  eventId?: string;
};

type SequenceChar = {
  id: string; // instance id
  objectId: string;
  speed: number;
  path: Waypoint[];
};

type StoryData = {
  id: string;
  name: string;
  mapId: string;
  worldId?: string;
  bgmUrl?: string;
  characters: SequenceChar[];
};

type CutsceneStep = {
  type: "story" | "video";
  storyId?: string;
  videoTitle?: string;
  videoUrl?: string;
};

type NarrativeSequence = {
  id: string;
  title: string;
  description: string;
  steps: CutsceneStep[];
};

type AnimationFrame = {
  id: string;
  image: string;
};

type AnimationClip = {
  id: string;
  name: string;
  frames: AnimationFrame[];
  fps: number;
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
    targetWorldId?: string;
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
  type?: 'person' | 'door' | 'item' | 'building' | 'monster' | 'shop';
  itemIds?: string[];
  description?: string;
  recoveryAmount?: number;
  isDish?: boolean;
  rarity?: number;
  itemType?: string; // Captured from items.json "type"
  ingredients?: { name: string; id: string }[];
  // Villager fields
  personality?: string;
  age?: number;
  gender?: string;
  introduction?: string;
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
  bgmUrl?: string;
  audioUrl?: string;
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
  audioUrl?: string;
  choices?: { text: string; nextStepId: string; audioUrl?: string }[];
  reward?: {
    itemId?: string;
    itemName?: string;
    amount?: number;
  };
};

export type EventFlow = {
  id: string;
  title: string;
  villagerId?: string;
  villagerName?: string;
  tags?: string[];
  nodes: EventNode[];
};

type NpcState = {
  x: number;
  y: number;
  originX: number;
  movement: Movement;
  direction: number;
};

type CharacterAnimationState = {
  animationName: string;
  frameIndex: number;
  lastFrameUpdateTime: number;
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

function MiniMap({ world, activeIndex }: { world: WorldData | undefined, activeIndex: number }) {
  if (!world || !world.rows || !world.cols) return null;

  return (
    <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md border border-border p-2 rounded-lg z-40 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <MapIcon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{world.name}</span>
      </div>
      <div 
        className="grid gap-1" 
        style={{ 
          gridTemplateColumns: `repeat(${world.cols}, 1fr)`,
          width: '80px'
        }}
      >
        {Array.from({ length: world.rows * world.cols }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "aspect-square border rounded-[1px]",
              i === activeIndex ? "bg-primary border-primary shadow-[0_0_5px_rgba(var(--primary),0.5)]" : "bg-muted/40 border-border/50"
            )}
          />
        ))}
      </div>
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
  const [masterSequences, setMasterSequences] = useState<NarrativeSequence[]>([]);
  const [masterStories, setMasterStories] = useState<StoryData[]>([]);
  const [masterShops, setMasterShops] = useState<ShopData[]>([]);
  const [masterCollectionPoints, setMasterCollectionPoints] = useState<CollectionPointData[]>([]);
  const [masterMeetingPlaces, setMasterMeetingPlaces] = useState<MeetingPlaceData[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [selectedWorldId, setSelectedWorldId] = useState<string>(initialData?.mapId || '');
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [characterPosition, setCharacterPosition] = useState({x: initialData?.positionX || MAP_WIDTH / 2, y: initialData?.positionY || MAP_HEIGHT / 2});
  const [targetPosition, setTargetPosition] = useState<{x: number, y: number} | null>(null);
  const [inventory, setInventory] = useState<SavedInventoryItem[]>(initialData?.inventory || []);
  const [gold, setGold] = useState(initialData?.gold || 0);
  const [affection, setAffection] = useState<Record<string, number>>(initialData?.affection || {});
  const [hp, setHp] = useState(initialData?.hp ?? 1000);
  const [maxHp, setMaxHp] = useState(initialData?.maxHp ?? 1000);
  const [hunger, setHunger] = useState(initialData?.hunger ?? 100);
  const [maxHunger, setMaxHunger] = useState(initialData?.maxHunger ?? 100);
  const [characterDirection, setCharacterDirection] = useState<CharacterDirection>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState<{ conversation: string; audioPath?: string } | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventFlow | null>(null);
  const [currentNode, setCurrentEventNode] = useState<EventNode | null>(null);
  const [npcStates, setNpcStates] = useState<Record<string, NpcState>>({});
  const [activeShop, setActiveShop] = useState<ShopData | null>(null);
  const [activeMeetingPlace, setActiveMeetingPlace] = useState<MeetingPlaceData | null>(null);

  // Cutscene State
  const [activeCutscene, setActiveCutscene] = useState<NarrativeSequence | null>(null);
  const [currentCutsceneStepIndex, setCurrentCutsceneStepIndex] = useState(-1);
  const [cutsceneChars, setCutsceneChars] = useState<Record<string, { x: number; y: number; data: AvailableObject; targetIdx: number; path: Waypoint[]; speed: number }>>({});
  const [originalPlayerState, setOriginalPlayerState] = useState<{ worldId: string, cellIndex: number, pos: {x: number, y: number} } | null>(null);

  // Audio State
  const [isMuted, setIsMuted] = useState(initialData?.isMuted ?? false);
  const [bgmVolume, setBgmVolume] = useState(initialData?.bgmVolume ?? initialData?.volume ?? 0.5);
  const [voiceVolume, setVoiceVolume] = useState(initialData?.voiceVolume ?? initialData?.volume ?? 0.5);
  
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio();
      bgmRef.current.loop = true;
    }
    bgmRef.current.muted = isMuted;
    bgmRef.current.volume = bgmVolume;

    if (!voiceRef.current) {
      voiceRef.current = new Audio();
    }
    voiceRef.current.muted = isMuted;
    voiceRef.current.volume = voiceVolume;
  }, [isMuted, bgmVolume, voiceVolume]);

  // Migration logic: If maxHp is using the old default (100 or undefined), bump it to 1000
  useEffect(() => {
    if (maxHp <= 100) {
      setMaxHp(1000);
      setHp(prev => prev <= 100 ? prev * 10 : prev); // Scale up current HP if it was also low
    }
  }, [maxHp]);


  // Animation State
  const [playerClips, setPlayerClips] = useState<AnimationClip[]>([]);
  const [animState, setAnimState] = useState<CharacterAnimationState>({
    animationName: 'idle_down',
    frameIndex: 0,
    lastFrameUpdateTime: 0,
  });

  const gameLoopRef = useRef<number>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const activePlayerChar = useMemo(() => {
    if (playerCharacters.length === 0) return null;
    return playerCharacters.find(c => c.id === activePlayerId) || playerCharacters[0];
  }, [playerCharacters, activePlayerId]);

  const currentWorld = useMemo(() => masterWorlds.find(w => w.id === selectedWorldId), [masterWorlds, selectedWorldId]);
  const activeMapData = currentWorld?.maps[activeCellIndex];
  const isGamePaused = activeInteraction !== null || isMenuOpen || activeEvent !== null || activeCutscene !== null || activeShop !== null || activeMeetingPlace !== null;

  useEffect(() => {
    if (!currentWorld || activeCutscene) return;
    const targetBgm = currentWorld.bgmUrl || currentWorld.audioUrl;
    if (targetBgm && bgmRef.current) {
      const resolved = resolveMediaUrl(targetBgm);
      if (bgmRef.current.getAttribute('src') !== resolved) {
        bgmRef.current.setAttribute('src', resolved);
        const p = bgmRef.current.play();
        if (p !== undefined) p.catch(() => console.warn('Autoplay prevented. Please interact with the screen.'));
      } else if (bgmRef.current.paused) {
        const p = bgmRef.current.play();
        if (p !== undefined) p.catch(() => {});
      }
    } else if (!targetBgm && bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.removeAttribute('src');
    }
  }, [currentWorld, activeCutscene]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const fetchData = async (file: string) => {
          const res = await fetch(`/data/${file}.json`);
          if (!res.ok) return [];
          const data = await res.json();
          // worlds.json, events.json etc might be wrapped in { worlds: [...] }
          return Array.isArray(data) ? data : (data.worlds || data.events || data.sequences || data.stories || data.shops || data.collectionPoints || data.rooms || data.meetingPlaces || data.villagers || data.items || data.buildings || data.monsters || data.dishes || []);
        };

        const [worldIndex, roomsRes, rawVillagers, rawItems, buildings, events, collectionPoints, meetingPlaces, monsters, rawDishes, shops, playerListRes, sequences, stories] = await Promise.all([
          fetchData('worlds'),
          fetchData('rooms'),
          fetchData('villagers'),
          fetchData('items'),
          fetchData('buildings'),
          fetchData('eventFlows'),
          fetchData('collectionPoints'),
          fetchData('meetingPlaces'),
          fetchData('monsters'),
          fetchData('dishes'),
          fetchData('shops'),
          fetch('/characters/characters.json').then(res => res.ok ? res.json() : { characters: [] }),
          fetchData('narrativeSequences'),
          fetchData('stories')
        ]);

        const fullWorlds = await Promise.all(worldIndex.map(async (w: any) => {
          try {
            const detailRes = await fetch(`/data/${w.id}.json`);
            if (detailRes.ok) {
              const detail = await detailRes.json();
              return { ...w, ...detail };
            }
          } catch (e) {}
          return w;
        }));

        // Convert rooms to pseudo-worlds for the player
        const roomWorlds = roomsRes.map((r: any) => ({
          id: r.id,
          name: r.name,
          rows: 1,
          cols: 1,
          maps: [r]
        }));

        const mergedWorlds = [...fullWorlds, ...roomWorlds];

        // Process data with internal type identification
        const villagers = rawVillagers.map((v: any) => ({ 
          ...v, 
          type: 'person',
          description: v.introduction || v.description // Prefer introduction for bio
        }));
        const items = rawItems.map((i: any) => ({ 
          ...i, 
          type: 'item',
          itemType: i.type // Store user's specific type (e.g. "山の幸")
        }));
        const dishes = rawDishes.map((d: any) => ({ 
          ...d, 
          type: 'item', 
          isDish: true 
        }));

        setMasterWorlds(mergedWorlds);
        setAvailableObjects([...villagers, ...items, ...buildings, ...collectionPoints, ...meetingPlaces, ...monsters, ...dishes, ...shops]);
        setMasterEvents(events);
        setPlayerCharacters(playerListRes.characters || []);
        setMasterSequences(sequences);
        setMasterStories(stories);
        setMasterShops(shops);
        setMasterCollectionPoints(collectionPoints);
        setMasterMeetingPlaces(meetingPlaces);

        if (playerListRes.characters?.length > 0 && !activePlayerId) {
          setActivePlayerId(playerListRes.characters[0].id);
        }

        if (mergedWorlds.length > 0 && !selectedWorldId) {
          setSelectedWorldId(mergedWorlds[0].id);
        }
      } catch (e: any) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!activePlayerChar) return;
    const fetchAnims = async () => {
      try {
        const res = await fetch(`${activePlayerChar.path}/animations.json`);
        if (res.ok) {
          const data = await res.json();
          const clips = data.clips || [];
          setPlayerClips(clips);

          clips.forEach((clip: AnimationClip) => {
            clip.frames.forEach((frame) => {
              const img = new (window as any).Image();
              img.src = resolveMediaUrl(`${activePlayerChar.path}/frames/${frame.image}`);
            });
          });
        } else {
          setPlayerClips([]);
        }
      } catch (e) {
        setPlayerClips([]);
      }
    };
    fetchAnims();
  }, [activePlayerChar]);

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
      hp,
      maxHp,
      hunger,
      maxHunger,
      inventory,
      gold,
      affection,
      bgmVolume,
      voiceVolume,
      isMuted,
      updatedAt: serverTimestamp(),
    };
    setDocumentNonBlocking(saveDocRef.current, saveData, { merge: true });
    toast({ title: "セーブ完了", description: "進行状況を保存しました。" });
  };

  const playNodeVoice = useCallback((node: EventNode) => {
    if (!voiceRef.current) voiceRef.current = new Audio();
    if (node.audioUrl) {
      voiceRef.current.src = resolveMediaUrl(node.audioUrl);
      voiceRef.current.muted = isMuted;
      voiceRef.current.volume = voiceVolume;
      voiceRef.current.play().catch(() => {});
    }
  }, [isMuted, voiceVolume]);

  const transitionToNode = useCallback((node: EventNode | null | undefined) => {
    if (!node) {
      setActiveEvent(null);
      setCurrentEventNode(null);
      return;
    }

    setCurrentEventNode(node);
    playNodeVoice(node);

    // Process Rewards
    if (node.type === 'reward' && node.reward) {
      const { itemId, itemName, amount } = node.reward;
      
      // Labor Logic: consume HP and Hunger if event has "労働力" tag
      const isLaborEvent = activeEvent?.tags?.includes('労働力');
      if (isLaborEvent && amount) {
        const hpCost = Math.floor(amount / 10);
        const hungerCost = Math.floor(amount / 20); // 1/20 of amount, rounded down
        
        setHp(prev => Math.max(0, prev - hpCost));
        setHunger(prev => Math.max(0, prev - hungerCost));
        
        toast({ 
          variant: "destructive", 
          title: "労働による消耗", 
          description: `労働により HP が ${hpCost}、空腹度が ${hungerCost} 減少しました。` 
        });
      }

      if (amount) {
        setGold(prev => prev + amount);
        toast({ title: "報酬獲得！", description: `${amount} K を手に入れた。` });

        // Affection Logic: increment affection if villagerId is present
        if (activeEvent?.villagerId) {
          setAffection(prev => ({
            ...prev,
            [activeEvent.villagerId!]: (prev[activeEvent.villagerId!] || 0) + amount
          }));
          toast({ 
            title: "好感度アップ！", 
            description: `${activeEvent.villagerName || '村人'}との絆が深まった。` 
          });
        }
      }

      if (itemId && itemName) {
        setInventory(prev => {
          const existing = prev.find(i => i.itemId === itemId);
          if (existing) {
            return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
          }
          return [...prev, { itemId, quantity: 1 }];
        });
        toast({ title: "アイテム獲得！", description: `「${itemName}」を手に入れた。` });
      }
    }
  }, [playNodeVoice, toast, activeEvent]);

  // --- Cutscene Methods ---

  const endCutscene = useCallback(() => {
    if (originalPlayerState) {
      setSelectedWorldId(originalPlayerState.worldId);
      setActiveCellIndex(originalPlayerState.cellIndex);
      setCharacterPosition(originalPlayerState.pos);
    }
    setActiveCutscene(null);
    setCurrentCutsceneStepIndex(-1);
    setCutsceneChars({});
    setOriginalPlayerState(null);
    toast({ title: "物語終了", description: "ゲームに戻ります。" });
  }, [originalPlayerState, toast]);

  const startCutsceneStep = useCallback(async (sequence: NarrativeSequence, index: number) => {
    if (index >= sequence.steps.length) {
      endCutscene();
      return;
    }

    const step = sequence.steps[index];
    setCurrentCutsceneStepIndex(index);

    if (step.type === 'story') {
      const story = masterStories.find(s => s.id === step.storyId);
      if (story) {
        const world = masterWorlds.find(w => w.id === (story.worldId || story.mapId));
        const mapIdx = world?.maps?.findIndex(m => m.id === story.mapId);
        
        if (world && mapIdx !== undefined && mapIdx !== -1) {
          setSelectedWorldId(world.id);
          setActiveCellIndex(mapIdx);
        }

        const targetBgm = story.bgmUrl || world?.bgmUrl || world?.audioUrl;
        if (targetBgm && bgmRef.current) {
          const resolved = resolveMediaUrl(targetBgm);
          if (bgmRef.current.getAttribute('src') !== resolved) {
            bgmRef.current.src = resolved;
            bgmRef.current.play().catch(() => {});
          }
        }

        const newCutChars: Record<string, any> = {};
        story.characters.forEach(sc => {
          const vData = availableObjects.find(v => v.id === sc.objectId);
          if (vData && sc.path.length > 0) {
            newCutChars[sc.id || `cut_${sc.objectId}`] = {
              x: sc.path[0].x,
              y: sc.path[0].y,
              data: vData,
              targetIdx: 0,
              path: sc.path,
              speed: sc.speed || 1
            };
          }
        });
        setCutsceneChars(newCutChars);
      }
    } else if (step.type === 'video') {
      setCutsceneChars({});
      if (bgmRef.current) bgmRef.current.pause();
    }
  }, [masterStories, masterWorlds, availableObjects, endCutscene]);

  const handlePlaySequence = (sequenceId: string) => {
    const seq = masterSequences.find(s => s.id === sequenceId);
    if (!seq) return;

    setIsMenuOpen(false);
    
    setOriginalPlayerState({
      worldId: selectedWorldId,
      cellIndex: activeCellIndex,
      pos: { ...characterPosition }
    });

    setActiveCutscene(seq);
    startCutsceneStep(seq, 0);
  };

  // --- End Cutscene Methods ---

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (bgmRef.current && bgmRef.current.paused && bgmRef.current.getAttribute('src')) {
      bgmRef.current.play().catch(() => {});
    }

    if (isGamePaused || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH - CHARACTER_WIDTH / 2;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT - CHARACTER_HEIGHT / 2;
    setTargetPosition({ x, y });
  };

  const handleBuyItem = (item: AvailableObject) => {
    const price = item.recoveryAmount || 0;
    if (gold < price) {
      toast({ variant: "destructive", title: "所持金不足", description: "ゴールドが足りません。" });
      return;
    }
    setGold(prev => prev - price);
    setInventory(prev => {
      const existing = prev.find(i => i.itemId === item.id);
      if (existing) return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { itemId: item.id, quantity: 1 }];
    });
    toast({ title: "購入完了", description: `${item.name} を購入しました。` });
  };

  const handleUseItem = (itemId: string) => {
    const itemDetails = availableObjects.find(a => a.id === itemId);
    if (!itemDetails) return;

    const recovery = itemDetails.recoveryAmount || 0;
    if (recovery <= 0) {
      toast({ title: "使用できません", description: "このアイテムは使用できません。" });
      return;
    }

    // Dish special rule: hunger recovery is 1/10 of recoveryAmount
    const hungerRecovery = itemDetails.isDish ? Math.floor(recovery / 10) : recovery;

    if (hunger + hungerRecovery > maxHunger) {
      toast({ 
        variant: "destructive",
        title: "お腹がいっぱいです", 
        description: `これを使用すると満腹度制限(${maxHunger})を超えてしまいます。` 
      });
      return;
    }

    setHp(prev => Math.min(maxHp, prev + recovery));
    setHunger(prev => Math.min(maxHunger, prev + hungerRecovery));
    
    setInventory(prev => {
      const existing = prev.find(i => i.itemId === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.itemId !== itemId);
    });

    toast({ 
      title: "アイテムを使用", 
      description: `${itemDetails.name} を使用して HP が ${recovery}、空腹度が ${hungerRecovery} 回復した！` 
    });
  };

  const checkForInteraction = useCallback(() => {
    if (isGamePaused || !activeMapData) return;
    const charCX = characterPosition.x + CHARACTER_WIDTH / 2;
    const charCY = characterPosition.y + CHARACTER_HEIGHT / 2;

    for (const obj of activeMapData.objects) {
      const currentX = npcStates[obj.id]?.x ?? obj.x;
      const dist = Math.sqrt(Math.pow(charCX - (currentX + obj.width / 2), 2) + Math.pow(charCY - (obj.y + obj.height / 2), 2));

      if (dist < INTERACTION_RADIUS) {
        const asset = availableObjects.find(a => a.id === obj.objectId);

        // 0. Check for "布団" (Sleep)
        if (asset?.name === '布団') {
          setHp(maxHp);
          setHunger(50);
          toast({ title: "休息", description: "ぐっすり眠って、体力が回復した！（空腹度は50になりました）" });
          return;
        }

        // 0.5. Check for "仏壇" (Pray)
        if (asset?.name === '仏壇') {
          setHp(prev => Math.min(maxHp, prev + 20));
          setHunger(10);
          toast({ title: "お祈り", description: "静かに祈りを捧げた。体力が少し回復したが、お腹が空いた...（HP+20、空腹度は10になりました）" });
          return;
        }

        // 1. Check for Collection Points (Random items)
        const cp = masterCollectionPoints.find(c => c.id === obj.objectId);
        if (cp && cp.itemIds.length > 0) {
          if (hp < HP_COLLECTION_COST) {
            toast({ variant: "destructive", title: "体力が足りません", description: "休憩して体力を回復しましょう。" });
            return;
          }

          const randomItemId = cp.itemIds[Math.floor(Math.random() * cp.itemIds.length)];
          const gatheredItem = availableObjects.find(a => a.id === randomItemId);
          if (gatheredItem) {
            setHp(prev => Math.max(0, prev - HP_COLLECTION_COST));
            setHunger(prev => Math.max(0, prev - HUNGER_COLLECTION_COST));
            setInventory(prev => {
              const existing = prev.find(i => i.itemId === randomItemId);
              if (existing) return prev.map(i => i.itemId === randomItemId ? { ...i, quantity: i.quantity + 1 } : i);
              return [...prev, { itemId: randomItemId, quantity: 1 }];
            });
            toast({ title: "発見！", description: `${cp.name} から「${gatheredItem.name}」を手に入れた！ (HP-${HP_COLLECTION_COST}, 空腹度-${HUNGER_COLLECTION_COST})` });
          }
          return;
        }

        // 2. Check for Shops
        const shopId = obj.eventId?.startsWith('shop:') ? obj.eventId.split(':')[1] : obj.objectId;
        const shop = masterShops.find(s => s.id === shopId);
        if (shop) {
          setActiveShop(shop);
          return;
        }

        // 3. Check for Transitions
        if (obj.transition) {
          const { targetWorldId, targetMapId, targetX, targetY } = obj.transition;
          
          let targetWorld = null;
          let targetCellIdx = 0;

          // Priority 1: targetWorldId
          if (targetWorldId) {
            targetWorld = masterWorlds.find(w => w.id === targetWorldId);
            if (targetWorld) {
              targetCellIdx = targetWorld.maps?.findIndex(m => m.id === targetMapId) ?? 0;
              if (targetCellIdx === -1) targetCellIdx = 0;
            }
          }

          // Priority 2: mapId lookup fallback
          if (!targetWorld) {
            targetWorld = masterWorlds.find(w => w.id === targetMapId || w.maps?.some(m => m.id === targetMapId));
            if (targetWorld) {
              targetCellIdx = targetWorld.maps.findIndex(m => m.id === targetMapId);
              if (targetCellIdx === -1) targetCellIdx = 0;
            }
          }
          
          if (targetWorld) {
            setSelectedWorldId(targetWorld.id);
            setActiveCellIndex(targetCellIdx);
          } else {
            // Ultimate fallback
            setSelectedWorldId(targetMapId);
            setActiveCellIndex(0);
          }
          
          setCharacterPosition({ x: targetX, y: targetY });
          setTargetPosition(null);
          toast({ title: "エリア移動", description: "新しい場所へ移動しました。" });
          return;
        }

        // 4. Check for Meeting Places
        const meetingPlace = masterMeetingPlaces.find(m => m.id === obj.objectId);
        if (meetingPlace) {
          setActiveMeetingPlace(meetingPlace);
          return;
        }

        // 5. Check for Event Flows
        if (obj.eventId) {
          const flow = masterEvents.find(e => e.id === obj.eventId);
          if (flow) {
            setActiveEvent(flow);
            const startNode = flow.nodes.find(n => n.type === 'start');
            transitionToNode(startNode || null);
            return;
          }
        }

        // 6. Fallback Conversation
        if (obj.conversation) {
          setActiveInteraction({ conversation: obj.conversation, audioPath: obj.audioPath });
          return;
        }
      }
    }
  }, [activeMapData, characterPosition, npcStates, masterEvents, isGamePaused, masterWorlds, currentWorld, toast, availableObjects, masterShops, masterCollectionPoints, masterMeetingPlaces, hp, hunger, transitionToNode, maxHp]);

  useEffect(() => {
    let nextStepTimeout: NodeJS.Timeout | null = null;

    const loop = (currentTime: number) => {
      if (activeCutscene && currentCutsceneStepIndex >= 0) {
        const step = activeCutscene.steps[currentCutsceneStepIndex];
        if (step.type === 'story' && !activeEvent) {
          setCutsceneChars(prev => {
            const next = { ...prev };
            let anyMoving = false;
            let eventTriggered = false;

            for (const id in next) {
              const c = next[id];
              if (c.targetIdx >= c.path.length) continue;

              anyMoving = true;
              const target = c.path[c.targetIdx];
              const dx = target.x - c.x;
              const dy = target.y - c.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const moveSpeed = (c.speed || 1) * 5;

              if (dist < moveSpeed) {
                next[id] = { ...c, x: target.x, y: target.y, targetIdx: c.targetIdx + 1 };
                if (target.eventId) {
                  const event = masterEvents.find(e => e.id === target.eventId);
                  if (event) {
                    const startNode = event.nodes.find(n => n.type === 'start');
                    if (startNode) {
                      setActiveEvent(event);
                      transitionToNode(startNode);
                      eventTriggered = true;
                      break;
                    }
                  }
                }
              } else {
                next[id] = { ...c, x: c.x + (dx / dist) * moveSpeed, y: c.y + (dy / dist) * moveSpeed };
              }
            }

            if (!anyMoving && Object.keys(next).length > 0 && !eventTriggered && !nextStepTimeout) {
              nextStepTimeout = setTimeout(() => {
                startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1);
                nextStepTimeout = null;
              }, 500);
            }
            return next;
          });
        }
      }

      if (!isGamePaused) {
        let moveX = 0, moveY = 0;
        const isKeyPressed = pressedKeys.has('ArrowUp') || pressedKeys.has('w') || pressedKeys.has('ArrowDown') || pressedKeys.has('s') || pressedKeys.has('ArrowLeft') || pressedKeys.has('a') || pressedKeys.has('ArrowRight') || pressedKeys.has('d');

        if (isKeyPressed) {
          setTargetPosition(null);
          if (pressedKeys.has('ArrowUp') || pressedKeys.has('w')) moveY -= 1;
          if (pressedKeys.has('ArrowDown') || pressedKeys.has('s')) moveY += 1;
          if (pressedKeys.has('ArrowLeft') || pressedKeys.has('a')) moveX -= 1;
          if (pressedKeys.has('ArrowRight') || pressedKeys.has('d')) moveX += 1;
        } else if (targetPosition) {
          const dx = targetPosition.x - characterPosition.x;
          const dy = targetPosition.y - characterPosition.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CHARACTER_SPEED) {
            moveX = dx / dist;
            moveY = dy / dist;
          } else {
            setTargetPosition(null);
          }
        }

        const moving = moveX !== 0 || moveY !== 0;
        setIsMoving(moving);

        if (moving) {
          let newDir: CharacterDirection = characterDirection;
          if (Math.abs(moveX) > Math.abs(moveY)) newDir = moveX > 0 ? 'right' : 'left';
          else if (moveY !== 0) newDir = moveY > 0 ? 'down' : 'up';

          if (newDir !== characterDirection) {
            setCharacterDirection(newDir);
            setAnimState(prev => ({ ...prev, frameIndex: 0 }));
          }
          
          const nextX = characterPosition.x + moveX * CHARACTER_SPEED;
          const nextY = characterPosition.y + moveY * CHARACTER_SPEED;

          if (currentWorld && currentWorld.rows && currentWorld.cols) {
            const currentRow = Math.floor(activeCellIndex / currentWorld.cols);
            const currentCol = activeCellIndex % currentWorld.cols;
            let nextCellIdx = activeCellIndex;
            let finalX = nextX;
            let finalY = nextY;
            let hasTransitioned = false;

            const EDGE_THRESHOLD = 50;

            if (nextX < -EDGE_THRESHOLD && currentCol > 0) {
              nextCellIdx = activeCellIndex - 1;
              finalX = MAP_WIDTH - CHARACTER_WIDTH + EDGE_THRESHOLD;
              hasTransitioned = true;
            } else if (nextX > MAP_WIDTH - CHARACTER_WIDTH + EDGE_THRESHOLD && currentCol + 1 < currentWorld.cols) {
              nextCellIdx = activeCellIndex + 1;
              finalX = -EDGE_THRESHOLD;
              hasTransitioned = true;
            } else if (nextY < -EDGE_THRESHOLD && currentRow > 0) {
              nextCellIdx = activeCellIndex - currentWorld.cols;
              finalY = MAP_HEIGHT - CHARACTER_HEIGHT + EDGE_THRESHOLD;
              hasTransitioned = true;
            } else if (nextY > MAP_HEIGHT - CHARACTER_HEIGHT + EDGE_THRESHOLD && currentRow + 1 < currentWorld.rows) {
              nextCellIdx = activeCellIndex + currentWorld.cols;
              finalY = -EDGE_THRESHOLD;
              hasTransitioned = true;
            }

            if (hasTransitioned) {
              setActiveCellIndex(nextCellIdx);
              setCharacterPosition({ x: finalX, y: finalY });
              setTargetPosition(null);
            } else {
              setCharacterPosition({
                x: Math.max(-CHARACTER_WIDTH / 2, Math.min(MAP_WIDTH - CHARACTER_WIDTH / 2, nextX)),
                y: Math.max(-CHARACTER_HEIGHT / 2, Math.min(MAP_HEIGHT - CHARACTER_HEIGHT / 2, nextY))
              });
            }
          } else {
            setCharacterPosition({
              x: Math.max(0, Math.min(MAP_WIDTH - CHARACTER_WIDTH, nextX)),
              y: Math.max(0, Math.min(MAP_HEIGHT - CHARACTER_HEIGHT, nextY))
            });
          }
        }

        const clipName = moving ? `walk_${characterDirection}` : `idle_${characterDirection}`;
        const clip = playerClips.find(c => c.name === clipName) || playerClips.find(c => c.name === `idle_${characterDirection}`);
        
        if (clip && clip.frames.length > 0) {
          const frameDuration = 1000 / (clip.fps || 8);
          if (currentTime - animState.lastFrameUpdateTime > frameDuration) {
            setAnimState(prev => ({
              animationName: clipName,
              frameIndex: (prev.frameIndex + 1) % clip.frames.length,
              lastFrameUpdateTime: currentTime
            }));
          }
        }
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (nextStepTimeout) clearTimeout(nextStepTimeout);
    };
  }, [pressedKeys, targetPosition, isGamePaused, playerClips, characterDirection, characterPosition, animState, activeCellIndex, currentWorld, activeCutscene, currentCutsceneStepIndex, activeEvent, masterEvents, startCutsceneStep, transitionToNode]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (bgmRef.current && bgmRef.current.paused && bgmRef.current.getAttribute('src')) {
        bgmRef.current.play().catch(() => {});
      }

      if ([' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
        checkForInteraction();
      }
      else if (!isGamePaused) {
        setPressedKeys(prev => new Set(prev).add(e.key));
      }
    };
    const handleUp = (e: KeyboardEvent) => setPressedKeys(prev => { const n = new Set(prev); n.delete(e.key); return n; });
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
  }, [checkForInteraction, isGamePaused]);

  const displayInventory: DisplayInventoryItem[] = inventory.map(i => {
    const details = availableObjects.find(a => a.id === i.itemId);
    return { 
      id: i.itemId, 
      name: details?.name || 'Unknown', 
      imageUrl: resolveMediaUrl(details?.imageUrl), 
      quantity: i.quantity,
      canUse: (details?.recoveryAmount || 0) > 0,
      description: details?.description,
      rarity: details?.rarity,
      itemType: details?.itemType,
      recoveryAmount: details?.recoveryAmount,
      ingredients: details?.ingredients
    };
  });

  const displaySequences: DisplaySequence[] = masterSequences.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description
  }));

  const displayAffection: DisplayAffection[] = useMemo(() => {
    return availableObjects
      .filter(obj => obj.type === 'person')
      .map(v => ({
        id: v.id,
        name: v.name || 'Unknown',
        imageUrl: resolveMediaUrl(v.imageUrl),
        points: affection[v.id] || 0,
        description: v.description,
        personality: v.personality,
        age: v.age,
        gender: v.gender,
        introduction: v.introduction
      }))
      .filter(char => char.points > 0)
      .sort((a, b) => b.points - a.points);
  }, [availableObjects, affection]);

  const playerImageUrl = useMemo(() => {
    if (!activePlayerChar) return '';
    const clip = playerClips.find(c => c.name === animState.animationName) || playerClips.find(c => c.name === `idle_${characterDirection}`);
    if (clip && clip.frames.length > 0) {
      const frame = clip.frames[animState.frameIndex % clip.frames.length];
      return resolveMediaUrl(`${activePlayerChar.path}/frames/${frame.image}`);
    }
    return resolveMediaUrl(`${activePlayerChar.path}/frames/idle_${characterDirection}_1.png`);
  }, [activePlayerChar, playerClips, animState, characterDirection]);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin mr-2" /> ロード中...</div>;

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <div className="flex flex-col h-full gap-4 relative">
        <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border gap-4 z-10">
          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <Label className="whitespace-nowrap text-xs">マップ</Label>
            <Select value={selectedWorldId} onValueChange={(val) => { setSelectedWorldId(val); setActiveCellIndex(0); }} disabled={activeCutscene !== null}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{masterWorlds.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 flex-grow max-sm:hidden">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={activePlayerId} onValueChange={setActivePlayerId} disabled={activeCutscene !== null}>
              <SelectTrigger><SelectValue placeholder="プレイヤー選択" /></SelectTrigger>
              <SelectContent>
                {playerCharacters.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 shrink-0 items-center">
            {/* HP Gauge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border rounded-lg h-10 w-28 md:w-32">
              <Heart className={cn("h-4 w-4 shrink-0", hp < (maxHp * 0.2) ? "text-destructive animate-pulse" : "text-red-500")} />
              <div className="flex flex-col flex-grow min-w-0">
                <Progress value={(hp / maxHp) * 100} className="h-2" />
                <span className="text-[10px] font-mono leading-none mt-1 truncate">{Math.ceil(hp)}/{maxHp}</span>
              </div>
            </div>

            {/* Hunger Gauge */}
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border rounded-lg h-10 w-28 md:w-32">
              <Utensils className={cn("h-4 w-4 shrink-0", hunger < (maxHunger * 0.2) ? "text-destructive animate-pulse" : "text-orange-500")} />
              <div className="flex flex-col flex-grow min-w-0">
                <Progress value={(hunger / maxHunger) * 100} className="h-2" />
                <span className="text-[10px] font-mono leading-none mt-1 truncate">{Math.ceil(hunger)}/{maxHunger}</span>
              </div>
            </div>

            <div className="flex items-center bg-background/50 border rounded-lg overflow-hidden h-10">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-full w-10 rounded-none border-r hover:bg-accent/20"
                onClick={() => checkForInteraction()}
                disabled={activeCutscene !== null || isGamePaused}
                title="アクション (Space/Enter)"
              >
                <Sparkles className="h-4 w-4 text-accent" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-full w-10 rounded-none">
                    {isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4 shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold">全体消音</Label>
                      <Switch checked={isMuted} onCheckedChange={setIsMuted} />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Music className="h-3 w-3 text-muted-foreground" />
                          <Label className="text-[10px] uppercase font-bold tracking-wider">BGM 音量</Label>
                          <span className="text-[10px] font-mono ml-auto">{Math.round(bgmVolume * 100)}%</span>
                        </div>
                        <Slider 
                          value={[bgmVolume * 100]} 
                          max={100} 
                          step={1} 
                          onValueChange={(vals) => {
                            setBgmVolume(vals[0] / 100);
                            if (vals[0] > 0 && isMuted) setIsMuted(false);
                          }} 
                          disabled={isMuted}
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Volume2 className="h-3 w-3 text-muted-foreground" />
                          <Label className="text-[10px] uppercase font-bold tracking-wider">ボイス 音量</Label>
                          <span className="text-[10px] font-mono ml-auto">{Math.round(voiceVolume * 100)}%</span>
                        </div>
                        <Slider 
                          value={[voiceVolume * 100]} 
                          max={100} 
                          step={1} 
                          onValueChange={(vals) => {
                            setVoiceVolume(vals[0] / 100);
                            if (vals[0] > 0 && isMuted) setIsMuted(false);
                          }} 
                          disabled={isMuted}
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="bg-primary/10 px-4 py-2 rounded-full font-bold text-primary flex items-center shrink-0">{gold} K</div>
            <Button size="icon" variant="outline" onClick={handleSave} disabled={activeCutscene !== null} title="保存"><Save className="h-4 w-4"/></Button>
            <SheetTrigger asChild><Button size="icon" variant="outline" disabled={activeCutscene !== null} title="メニュー"><MenuIcon className="h-4 w-4"/></Button></SheetTrigger>
          </div>
        </div>

        <div 
          ref={mapContainerRef}
          onClick={handleMapClick}
          className={cn(
            "relative flex-grow bg-muted border-2 rounded-lg overflow-hidden aspect-[16/9]",
            isGamePaused ? "cursor-default" : "cursor-crosshair"
          )}
        >
          {activeMapData ? (
            <>
              <Image src={resolveMediaUrl(activeMapData.imageUrl)} alt="" fill className="object-cover" unoptimized priority />
              
              {activeMapData.objects.map(obj => {
                const asset = availableObjects.find(a => a.id === obj.objectId);
                if (!asset || !asset.imageUrl) return null;
                const curX = npcStates[obj.id]?.x ?? obj.x;
                const imgUrl = resolveMediaUrl(asset.imageUrl);
                if (!imgUrl) return null;

                return (
                  <div key={obj.id} style={{ left: `${(curX / MAP_WIDTH) * 100}%`, top: `${(obj.y / MAP_HEIGHT) * 100}%`, width: `${(obj.width / MAP_WIDTH) * 100}%`, position: 'absolute' }}>
                    <Image src={imgUrl} alt={asset.name || 'Object'} layout="responsive" width={asset.width || 256} height={asset.height || 256} unoptimized />
                  </div>
                );
              })}
              
              {Object.entries(cutsceneChars).map(([id, char]) => (
                <div 
                  key={id} 
                  className="absolute -translate-x-1/2 -translate-y-full" 
                  style={{ 
                    left: `${(char.x / MAP_WIDTH) * 100}%`, 
                    top: `${(char.y / MAP_HEIGHT) * 100}%`, 
                    width: `${(CHARACTER_WIDTH / MAP_WIDTH) * 100}%`, 
                    aspectRatio: '1/1',
                    zIndex: 15
                  }}
                >
                  <Image 
                    src={resolveMediaUrl(char.data.imageUrl)} 
                    alt={char.data.name || 'Character'} 
                    fill 
                    className="object-contain" 
                    unoptimized 
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap">{char.data.name}</div>
                </div>
              ))}
              
              <MiniMap world={currentWorld} activeIndex={activeCellIndex} />

              {!isGamePaused && targetPosition && (
                <div 
                  className="absolute w-4 h-4 bg-primary/50 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(targetPosition.x + CHARACTER_WIDTH/2) / MAP_WIDTH * 100}%`, top: `${(targetPosition.y + CHARACTER_HEIGHT/2) / MAP_HEIGHT * 100}%` }}
                />
              )}

              {activePlayerChar && (
                <div style={{ 
                  left: `${(characterPosition.x / MAP_WIDTH) * 100}%`, 
                  top: `${(characterPosition.y / MAP_HEIGHT) * 100}%`, 
                  width: `${(CHARACTER_WIDTH / MAP_WIDTH) * 100}%`, 
                  position: 'absolute', 
                  zIndex: 10,
                  opacity: activeCutscene ? 0.5 : 1
                }}>
                  <Image 
                    src={playerImageUrl} 
                    alt="Player" 
                    width={256} 
                    height={256} 
                    className="w-full h-auto"
                    unoptimized 
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">マップデータを構築中...</p>
            </div>
          )}

          {activeCutscene && currentCutsceneStepIndex >= 0 && activeCutscene.steps[currentCutsceneStepIndex].type === 'video' && (
            <div className="absolute inset-0 bg-black z-[60] flex items-center justify-center">
              <video 
                key={activeCutscene.steps[currentCutsceneStepIndex].videoUrl}
                src={resolveMediaUrl(activeCutscene.steps[currentCutsceneStepIndex].videoUrl)} 
                className="w-full h-full" 
                autoPlay 
                playsInline 
                controls 
                onEnded={() => startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1)} 
              />
              <Button 
                variant="ghost" 
                className="absolute top-4 right-4 text-white hover:bg-white/20"
                onClick={() => startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1)}
              >
                Skip
              </Button>
            </div>
          )}

          {activeInteraction && <DialogueBox conversation={activeInteraction.conversation} audioPath={activeInteraction.audioPath} onComplete={() => setActiveInteraction(null)} />}
          
          {activeEvent && currentNode && (
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-8 z-50">
              <Card className="w-full max-w-2xl bg-background/95 backdrop-blur animate-in slide-in-from-bottom-4 shadow-2xl">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-xl font-medium whitespace-pre-wrap">{currentNode.content}</p>
                  <div className="flex flex-col gap-2">
                    {currentNode.type === 'choice' ? (
                      currentNode.choices?.map((choice, i) => (
                        <Button key={i} size="lg" className="w-full justify-start h-auto py-3" onClick={() => {
                          const next = activeEvent.nodes.find(n => n.id === choice.nextStepId);
                          transitionToNode(next);
                        }}>{choice.text}</Button>
                      ))
                    ) : (
                      <Button size="lg" className="w-full" onClick={() => {
                        const next = activeEvent.nodes.find(n => n.id === currentNode.nextStepId);
                        transitionToNode(next);
                      }}>{currentNode.type === 'end' ? '物語を続ける' : '次へ'}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <Dialog open={activeShop !== null} onOpenChange={(open) => !open && setActiveShop(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <DialogTitle>{activeShop?.name}</DialogTitle>
            </div>
            <DialogDescription>
              必要なアイテムをゴールドで購入してください。
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {[...(activeShop?.itemIds || []), ...(activeShop?.dishIds || [])].map((shopItemId) => {
              const itemDetails = availableObjects.find(a => a.id === shopItemId);
              if (!itemDetails) return null;
              const price = itemDetails.recoveryAmount || 0;
              return (
                <Card key={shopItemId} className="flex flex-col">
                  <CardHeader className="p-3 pb-0">
                    <div className="aspect-square relative bg-muted rounded-md mb-2">
                      <Image src={resolveMediaUrl(itemDetails.imageUrl)} alt={itemDetails.name || 'Item'} fill className="object-contain p-2" unoptimized />
                    </div>
                    <CardTitle className="text-sm truncate">{itemDetails.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 flex-grow">
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{itemDetails.description}</p>
                  </CardContent>
                  <CardFooter className="p-3 pt-0">
                    <Button 
                      className="w-full h-8 text-xs" 
                      variant={gold >= price ? "default" : "secondary"}
                      disabled={gold < price}
                      onClick={() => handleBuyItem(itemDetails)}
                    >
                      {price} K
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <DialogFooter className="flex items-center justify-between border-t pt-4">
            <div className="text-sm font-bold">
              所持金: <span className="text-primary">{gold} K</span>
            </div>
            <Button variant="outline" onClick={() => setActiveShop(null)}>店を出る</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeMeetingPlace !== null} onOpenChange={(open) => !open && setActiveMeetingPlace(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <DialogTitle>{activeMeetingPlace?.name}</DialogTitle>
            </div>
            <DialogDescription>
              参加するイベントを選択してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {activeMeetingPlace?.eventIds.map((eventId) => {
              const eventFlow = masterEvents.find(e => e.id === eventId);
              return (
                <Button 
                  key={eventId}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 px-6 text-left group hover:border-primary"
                  onClick={() => {
                    if (eventFlow) {
                      setActiveEvent(eventFlow);
                      const startNode = eventFlow.nodes.find(n => n.type === 'start');
                      transitionToNode(startNode || null);
                      setActiveMeetingPlace(null);
                    } else {
                      toast({ variant: "destructive", title: "イベントが見つかりません", description: `ID: ${eventId}` });
                    }
                  }}
                >
                  <div className="flex items-center gap-4 w-full">
                    <BookOpen className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0" />
                    <span className="font-semibold text-lg">{eventFlow?.title || eventId}</span>
                  </div>
                </Button>
              );
            })}
            {activeMeetingPlace?.eventIds.length === 0 && (
              <p className="text-center text-muted-foreground py-8">現在参加できるイベントはありません。</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveMeetingPlace(null)}>閉じる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>ゲームメニュー</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <MenuSimulatorClient 
            inventoryItems={displayInventory} 
            sequences={displaySequences}
            characterAffection={displayAffection}
            onPlaySequence={handlePlaySequence}
            onUseItem={handleUseItem}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
