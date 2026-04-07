'use client';

import {useState, useEffect, useCallback, useRef, useMemo, memo} from 'react';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, Save, Terminal, User as UserIcon, Map as MapIcon, Volume2, VolumeX, Play, Music, ShoppingCart, Sparkles, Heart, Utensils, BookOpen, MessageCircle, Star, Users, CalendarDays} from 'lucide-react';
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
const BASE_SPEED = 12;
const CHARACTER_WIDTH = 256;
const CHARACTER_HEIGHT = 256;
const INTERACTION_RADIUS = 150;
const HP_COLLECTION_COST_BASE = 10;
const HUNGER_COLLECTION_COST_BASE = 5;

// Level System Coefficients
const LEVEL_COEFF_A = 10;
const LEVEL_COEFF_B = 50;
const LEVEL_COEFF_C = 1000;
const BONUS_PER_LEVEL = 0.05;

// v1.1.1 Path Resolution
const resolveMediaUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
};

// --- Optimized Sub-components ---

/** 背景マップレイヤー (メモ化) */
const MapLayer = memo(({ imageUrl }: { imageUrl: string }) => (
  <Image 
    src={resolveMediaUrl(imageUrl)} 
    alt="" 
    fill 
    className="object-cover" 
    unoptimized 
    priority 
  />
));
MapLayer.displayName = 'MapLayer';

/** オブジェクトレイヤー (メモ化) */
const ObjectsLayer = memo(({ objects, npcStates, availableObjects }: { 
  objects: PlacedObject[], 
  npcStates: Record<string, NpcState>, 
  availableObjects: AvailableObject[] 
}) => (
  <>
    {objects.map(obj => {
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
  </>
));
ObjectsLayer.displayName = 'ObjectsLayer';

/** プレイヤーレイヤー (メモ化) */
const PlayerLayer = memo(({ 
  activePlayerChar, 
  clips,
  direction,
  isMoving,
  activeCutscene,
  x,
  y
}: { 
  activePlayerChar: PlayerCharacter | null, 
  clips: AnimationClip[],
  direction: CharacterDirection,
  isMoving: boolean,
  activeCutscene: boolean,
  x: number,
  y: number
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (!isMoving) {
      setFrameIndex(0);
      return;
    }
    const clipName = `walk_${direction}`;
    const clip = clips.find(c => c.name === clipName) || clips.find(c => c.name === `idle_${direction}`);
    if (!clip || clip.frames.length === 0) return;

    const interval = setInterval(() => {
      setFrameIndex(prev => (prev + 1) % clip.frames.length);
    }, 1000 / (clip.fps || 8));
    return () => clearInterval(interval);
  }, [isMoving, direction, clips]);

  const imageUrl = useMemo(() => {
    if (!activePlayerChar) return '';
    const clipName = isMoving ? `walk_${direction}` : `idle_${direction}`;
    const clip = clips.find(c => c.name === clipName) || clips.find(c => c.name === `idle_${direction}`);
    if (clip && clip.frames.length > 0) {
      const frame = clip.frames[frameIndex % clip.frames.length];
      return resolveMediaUrl(`${activePlayerChar.path}/frames/${frame.image}`);
    }
    return resolveMediaUrl(`${activePlayerChar.path}/frames/idle_${direction}_1.png`);
  }, [activePlayerChar, clips, direction, isMoving, frameIndex]);

  return (
    <div 
      style={{ 
        position: 'absolute', 
        zIndex: 10,
        opacity: activeCutscene ? 0.5 : 1,
        width: `${(CHARACTER_WIDTH / MAP_WIDTH) * 100}%`, 
        left: `${(x / MAP_WIDTH) * 100}%`, 
        top: `${(y / MAP_HEIGHT) * 100}%`
      }}
    >
      <Image 
        src={imageUrl} 
        alt="Player" 
        width={256} 
        height={256} 
        className="w-full h-auto"
        unoptimized 
      />
    </div>
  );
});
PlayerLayer.displayName = 'PlayerLayer';

/** カットシーンキャラレイヤー (メモ化) */
const CutsceneLayer = memo(({ cutsceneChars }: { cutsceneChars: Record<string, any> }) => (
  <>
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
  </>
));
CutsceneLayer.displayName = 'CutsceneLayer';

// --- Types ---
type ShopData = { id: string; name: string; itemIds?: string[]; dishIds?: string[]; };
type CollectionPointData = { id: string; name: string; itemIds: string[]; };
type MeetingPlaceData = { id: string; name: string; eventIds: string[]; };
type Waypoint = { x: number; y: number; eventId?: string; };
type SequenceChar = { id: string; objectId: string; speed: number; path: Waypoint[]; };
type StoryData = { id: string; name: string; mapId: string; worldId?: string; bgmUrl?: string; characters: SequenceChar[]; };
type CutsceneStep = { type: "story" | "video"; storyId?: string; videoTitle?: string; videoUrl?: string; };
type NarrativeSequence = { id: string; title: string; description: string; steps: CutsceneStep[]; };
type AnimationFrame = { id: string; image: string; };
type AnimationClip = { id: string; name: string; frames: AnimationFrame[]; fps: number; };
type Movement = { type: 'stationary' | 'patrol-h'; range?: number; };
type PlacedObject = { id: string; objectId: string; x: number; y: number; width: number; height: number; transition?: { targetWorldId?: string; targetMapId: string; targetX: number; targetY: number; }; conversation?: string; audioPath?: string; eventId?: string; movement?: Movement; };
type AvailableObject = { id: string; name: string; imageUrl: string; width?: number; height?: number; type?: 'person' | 'door' | 'item' | 'building' | 'monster' | 'shop'; itemIds?: string[]; description?: string; recoveryAmount?: number; isDish?: boolean; rarity?: number; itemType?: string; ingredients?: { name: string; id: string }[]; personality?: string; age?: number; gender?: string; introduction?: string; };
type PlayerCharacter = { id: string; name: string; path: string; };
type MapCell = { id: string; name: string; imageUrl: string; objects: PlacedObject[]; };
type WorldData = { id: string; name: string; bgmUrl?: string; audioUrl?: string; rows: number; cols: number; maps: MapCell[]; };
type CharacterDirection = 'up' | 'down' | 'left' | 'right';
type SavedInventoryItem = { itemId: string; quantity: number; };
export type EventNode = { id: string; type: 'start' | 'story' | 'choice' | 'reward' | 'end'; content: string; nextStepId?: string; audioUrl?: string; choices?: { text: string; nextStepId: string; audioUrl?: string }[]; reward?: { itemId?: string; itemName?: string; amount?: number; }; };
export type EventFlow = { id: string; title: string; villagerId?: string; villagerName?: string; tags?: string[]; nodes: EventNode[]; };
type NpcState = { x: number; y: number; originX: number; movement: Movement; direction: number; };

function DialogueBox({ conversation, audioPath, onComplete }: { conversation: string; audioPath?: string; onComplete: () => void; }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => { if (audioPath && audioRef.current) audioRef.current.play().catch(e => console.error("Audio play failed:", e)); }, [audioPath]);
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4 z-50 text-foreground shadow-lg">
      <p className="mb-4 text-lg whitespace-pre-wrap">{conversation}</p>
      <div className="flex justify-end"><Button onClick={onComplete}>閉じる</Button></div>
      {audioPath && <audio ref={audioRef} src={resolveMediaUrl(audioPath)} preload="auto" />}
    </div>
  );
}

function MiniMap({ world, activeIndex }: { world: WorldData | undefined, activeIndex: number }) {
  if (!world || !world.rows || !world.cols) return null;
  return (
    <div className="absolute top-4 right-4 bg-background/60 backdrop-blur-md border border-border p-2 rounded-lg z-40 shadow-xl">
      <div className="flex items-center gap-2 mb-2"><MapIcon className="h-3 w-3 text-muted-foreground" /><span className="text-[10px] font-bold uppercase tracking-wider">{world.name}</span></div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${world.cols}, 1fr)`, width: '80px' }}>
        {Array.from({ length: world.rows * world.cols }).map((_, i) => (
          <div key={i} className={cn("aspect-square border rounded-[1px]", i === activeIndex ? "bg-primary border-primary shadow-[0_0_5px_rgba(var(--primary),0.5)]" : "bg-muted/40 border-border/50")} />
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
  
  // Position and direction state
  const [characterPosition, setCharacterPosition] = useState({x: initialData?.positionX || MAP_WIDTH / 2, y: initialData?.positionY || MAP_HEIGHT / 2});
  const [characterDirection, setCharacterDirection] = useState<CharacterDirection>('down');
  const [isMoving, setIsMoving] = useState(false);

  const [targetPosition, setTargetPosition] = useState<{x: number, y: number} | null>(null);
  const [inventory, setInventory] = useState<SavedInventoryItem[]>(initialData?.inventory || []);
  const [gold, setGold] = useState(initialData?.gold || 0);
  const [affection, setAffection] = useState<Record<string, number>>(initialData?.affection || {});
  const [hp, setHp] = useState(initialData?.hp ?? 1000);
  const [maxHp, setMaxHp] = useState(initialData?.maxHp ?? 1000);
  const [hunger, setHunger] = useState(initialData?.hunger ?? 100);
  const [maxHunger, setMaxHunger] = useState(initialData?.maxHunger ?? 100);
  const [level, setLevel] = useState(initialData?.level ?? 1);
  const [xp, setXp] = useState(initialData?.xp ?? 0);
  const [day, setDay] = useState(initialData?.day ?? 1);

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
  const [bgmVolume, setBgmVolume] = useState(initialData?.bgmVolume ?? 0.5);
  const [voiceVolume, setVoiceVolume] = useState(initialData?.voiceVolume ?? 0.5);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const [playerClips, setPlayerClips] = useState<AnimationClip[]>([]);
  const gameLoopRef = useRef<number>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!bgmRef.current) bgmRef.current = new Audio();
    bgmRef.current.loop = true;
    bgmRef.current.muted = isMuted;
    bgmRef.current.volume = bgmVolume;
    if (!voiceRef.current) voiceRef.current = new Audio();
    voiceRef.current.muted = isMuted;
    voiceRef.current.volume = voiceVolume;
  }, [isMuted, bgmVolume, voiceVolume]);

  const activePlayerChar = useMemo(() => playerCharacters.find(c => c.id === activePlayerId) || (playerCharacters.length > 0 ? playerCharacters[0] : null), [playerCharacters, activePlayerId]);
  const currentWorld = useMemo(() => masterWorlds.find(w => w.id === selectedWorldId), [masterWorlds, selectedWorldId]);
  const activeMapData = currentWorld?.maps[activeCellIndex];
  const isGamePaused = activeInteraction !== null || isMenuOpen || activeEvent !== null || activeCutscene !== null || activeShop !== null || activeMeetingPlace !== null;

  // 近接判定の自動計算 (レンダリングサイクルで実行)
  const isNearInteractable = useMemo(() => {
    if (!activeMapData || isGamePaused) return false;
    const charCX = characterPosition.x + CHARACTER_WIDTH / 2;
    const charCY = characterPosition.y + CHARACTER_HEIGHT / 2;
    
    return activeMapData.objects.some(obj => {
      const currentX = npcStates[obj.id]?.x ?? obj.x;
      const dist = Math.sqrt(
        Math.pow(charCX - (currentX + obj.width / 2), 2) + 
        Math.pow(charCY - (obj.y + obj.height / 2), 2)
      );
      return dist < INTERACTION_RADIUS;
    });
  }, [characterPosition, activeMapData, npcStates, isGamePaused]);

  const getNextXp = useCallback((lvl: number) => LEVEL_COEFF_A * (lvl ** 2) + LEVEL_COEFF_B * lvl + LEVEL_COEFF_C, []);
  const getLevelBonus = useCallback((lvl: number) => 1.0 + (lvl - 1) * BONUS_PER_LEVEL, []);

  const gainXp = useCallback((amount: number) => {
    setXp(prevXp => {
      let newXp = prevXp + amount;
      let newLevel = level;
      let requiredXp = getNextXp(newLevel);
      while (newXp >= requiredXp) {
        newXp -= requiredXp;
        newLevel += 1;
        requiredXp = getNextXp(newLevel);
      }
      if (newLevel !== level) {
        setLevel(newLevel);
        toast({ title: "Level Up!", description: `レベル ${newLevel} に到達。活動効率が5%向上した！` });
      }
      return newXp;
    });
  }, [level, getNextXp, toast]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const fetchData = async (file: string) => {
          const res = await fetch(`/data/${file}.json`);
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : (data.worlds || data.events || data.sequences || data.stories || data.shops || data.collectionPoints || data.rooms || data.meetingPlaces || data.villagers || data.items || data.buildings || data.monsters || data.dishes || []);
        };
        const [worldIndex, roomsRes, rawVillagers, rawItems, buildings, events, collectionPoints, meetingPlaces, monsters, rawDishes, shops, playerListRes, sequences, stories] = await Promise.all([
          fetchData('worlds'), fetchData('rooms'), fetchData('villagers'), fetchData('items'), fetchData('buildings'), fetchData('eventFlows'), fetchData('collectionPoints'), fetchData('meetingPlaces'), fetchData('monsters'), fetchData('dishes'), fetchData('shops'), fetch('/characters/characters.json').then(res => res.ok ? res.json() : { characters: [] }), fetchData('narrativeSequences'), fetchData('stories')
        ]);
        const fullWorlds = await Promise.all(worldIndex.map(async (w: any) => {
          try { const detailRes = await fetch(`/data/${w.id}.json`); if (detailRes.ok) return { ...w, ...(await detailRes.json()) }; } catch (e) {}
          return w;
        }));
        const roomWorlds = roomsRes.map((r: any) => ({ id: r.id, name: r.name, rows: 1, cols: 1, maps: [r] }));
        const mergedWorlds = [...fullWorlds, ...roomWorlds];
        setMasterWorlds(mergedWorlds);
        
        const allAvailable = [...rawVillagers.map((v:any)=>({...v,type:'person',description:v.introduction||v.description})), ...rawItems.map((i:any)=>({...i,type:'item',itemType:i.type})), ...buildings, ...collectionPoints, ...meetingPlaces, ...monsters, ...rawDishes.map((d:any)=>({...d,type:'item',isDish:true})), ...shops];
        setAvailableObjects(allAvailable);

        // Preload object images
        if (typeof window !== 'undefined') {
          allAvailable.forEach(obj => {
            if (obj.imageUrl) {
              const img = new (window as any).Image();
              img.src = resolveMediaUrl(obj.imageUrl);
            }
          });
        }

        setMasterEvents(events);
        setPlayerCharacters(playerListRes.characters || []);
        setMasterSequences(sequences);
        setMasterStories(stories);
        setMasterShops(shops);
        setMasterCollectionPoints(collectionPoints);
        setMasterMeetingPlaces(meetingPlaces);
        if (playerListRes.characters?.length > 0 && !activePlayerId) setActivePlayerId(playerListRes.characters[0].id);
        if (mergedWorlds.length > 0 && !selectedWorldId) setSelectedWorldId(mergedWorlds[0].id);
      } catch (e) { console.error("Initialization error:", e); } finally { setLoading(false); }
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

          // Preload player animation frames
          if (typeof window !== 'undefined') {
            clips.forEach((clip: AnimationClip) => {
              clip.frames.forEach((frame) => {
                const img = new (window as any).Image();
                img.src = resolveMediaUrl(`${activePlayerChar.path}/frames/${frame.image}`);
              });
            });
          }
        }
      } catch (e) { setPlayerClips([]); }
    };
    fetchAnims();
  }, [activePlayerChar]);

  useEffect(() => {
    if (!currentWorld || activeCutscene) return;
    const targetBgm = currentWorld.bgmUrl || currentWorld.audioUrl;
    if (targetBgm && bgmRef.current) {
      const resolved = resolveMediaUrl(targetBgm);
      if (bgmRef.current.getAttribute('src') !== resolved) { bgmRef.current.setAttribute('src', resolved); bgmRef.current.play().catch(()=>{}); }
      else if (bgmRef.current.paused) bgmRef.current.play().catch(()=>{});
    } else if (bgmRef.current) { bgmRef.current.pause(); bgmRef.current.removeAttribute('src'); }
  }, [currentWorld, activeCutscene]);

  useEffect(() => {
    if (!activeMapData) return;
    const newNpcStates: Record<string, NpcState> = {};
    activeMapData.objects.forEach(obj => { if (obj.movement?.type === 'patrol-h') newNpcStates[obj.id] = { x: obj.x, y: obj.y, originX: obj.x, movement: obj.movement, direction: 1 }; });
    setNpcStates(newNpcStates);
  }, [activeMapData]);

  const handleSave = () => {
    const saveData = {
      userId: user.uid, mapId: selectedWorldId, positionX: characterPosition.x, positionY: characterPosition.y,
      hp, maxHp, hunger, maxHunger, level, xp, day, inventory, gold, affection, bgmVolume, voiceVolume, isMuted, updatedAt: serverTimestamp(),
    };
    setDocumentNonBlocking(saveDocRef.current, saveData, { merge: true });
    toast({ title: "セーブ完了", description: "進行状況を保存しました。" });
  };

  const playNodeVoice = useCallback((node: EventNode) => {
    if (!voiceRef.current) voiceRef.current = new Audio();
    if (node.audioUrl) { voiceRef.current.src = resolveMediaUrl(node.audioUrl); voiceRef.current.play().catch(()=>{}); }
  }, []);

  const transitionToNode = useCallback((node: EventNode | null | undefined) => {
    if (!node) { setActiveEvent(null); setCurrentEventNode(null); return; }
    setCurrentEventNode(node);
    playNodeVoice(node);
    if (node.type === 'reward' && node.reward) {
      const { itemId, itemName, amount } = node.reward;
      const isLaborEvent = activeEvent?.tags?.includes('労働力');
      if (isLaborEvent && amount) {
        const hpCost = Math.floor(amount / 10);
        const hungerCost = Math.floor(amount / 20);
        setHp(prev => Math.max(0, prev - hpCost));
        setHunger(prev => Math.max(0, prev - hungerCost));
        gainXp(hpCost);
        toast({ variant: "destructive", title: "労働による消耗", description: `労働により HP が ${hpCost}、空腹度が ${hungerCost} 減少しました。(+${hpCost} XP)` });
      }
      if (amount) {
        setGold(prev => prev + amount);
        if (activeEvent?.villagerId) { setAffection(prev => ({ ...prev, [activeEvent.villagerId!]: (prev[activeEvent.villagerId!] || 0) + amount })); }
      }
      if (itemId && itemName) {
        setInventory(prev => {
          const existing = prev.find(i => i.itemId === itemId);
          return existing ? prev.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { itemId, quantity: 1 }];
        });
      }
    }
  }, [playNodeVoice, toast, activeEvent, gainXp]);

  const endCutscene = useCallback(() => {
    if (originalPlayerState) {
      setSelectedWorldId(originalPlayerState.worldId); setActiveCellIndex(originalPlayerState.cellIndex);
      setCharacterPosition(originalPlayerState.pos);
    }
    setActiveCutscene(null); setCurrentCutsceneStepIndex(-1); setCutsceneChars({}); setOriginalPlayerState(null);
  }, [originalPlayerState]);

  const startCutsceneStep = useCallback(async (sequence: NarrativeSequence, index: number) => {
    if (index >= sequence.steps.length) { endCutscene(); return; }
    const step = sequence.steps[index];
    setCurrentCutsceneStepIndex(index);
    if (step.type === 'story') {
      const story = masterStories.find(s => s.id === step.storyId);
      if (story) {
        const world = masterWorlds.find(w => w.id === (story.worldId || story.mapId));
        const mapIdx = world?.maps?.findIndex(m => m.id === story.mapId);
        if (world && mapIdx !== undefined && mapIdx !== -1) { setSelectedWorldId(world.id); setActiveCellIndex(mapIdx); }
        const newCutChars: Record<string, any> = {};
        story.characters.forEach(sc => {
          const vData = availableObjects.find(v => v.id === sc.objectId);
          if (vData && sc.path.length > 0) newCutChars[sc.id || `cut_${sc.objectId}`] = { x: sc.path[0].x, y: sc.path[0].y, data: vData, targetIdx: 0, path: sc.path, speed: sc.speed || 1 };
        });
        setCutsceneChars(newCutChars);
      }
    } else if (step.type === 'video') { setCutsceneChars({}); if (bgmRef.current) bgmRef.current.pause(); }
  }, [masterStories, masterWorlds, availableObjects, endCutscene]);

  const handlePlaySequence = (sequenceId: string) => {
    const seq = masterSequences.find(s => s.id === sequenceId);
    if (!seq) return;
    setIsMenuOpen(false);
    setOriginalPlayerState({ worldId: selectedWorldId, cellIndex: activeCellIndex, pos: { ...characterPosition } });
    setActiveCutscene(seq);
    startCutsceneStep(seq, 0);
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (bgmRef.current?.paused && bgmRef.current.getAttribute('src')) bgmRef.current.play().catch(()=>{});
    if (isGamePaused || !mapContainerRef.current) return;
    const rect = mapContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH - CHARACTER_WIDTH / 2;
    const y = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT - CHARACTER_HEIGHT / 2;
    setTargetPosition({ x, y });
  };

  const checkForInteraction = useCallback(() => {
    if (isGamePaused || !activeMapData) return;
    const pos = characterPosition;
    const charCX = pos.x + CHARACTER_WIDTH / 2;
    const charCY = pos.y + CHARACTER_HEIGHT / 2;
    for (const obj of activeMapData.objects) {
      const currentX = npcStates[obj.id]?.x ?? obj.x;
      const dist = Math.sqrt(Math.pow(charCX - (currentX + obj.width / 2), 2) + Math.pow(charCY - (obj.y + obj.height / 2), 2));
      if (dist < INTERACTION_RADIUS) {
        const asset = availableObjects.find(a => a.id === obj.objectId);
        if (asset?.name === '布団') { 
          setHp(maxHp); 
          setHunger(50); 
          setDay(prev => prev + 1);
          toast({ title: "休息", description: "ぐっすり眠って、日付が進んだ！" }); 
          return; 
        }
        if (asset?.name === '仏壇') { setHp(prev => Math.min(maxHp, prev + 20)); setHunger(10); toast({ title: "お祈り", description: "静かに祈りを捧げた。体力が少し回復した。" }); return; }
        const cp = masterCollectionPoints.find(c => c.id === obj.objectId);
        if (cp && cp.itemIds.length > 0) {
          const bonus = getLevelBonus(level);
          const hpCost = Math.floor(HP_COLLECTION_COST_BASE / bonus);
          if (hp < hpCost) { toast({ variant: "destructive", title: "体力が足りません" }); return; }
          const gatheredItem = availableObjects.find(a => a.id === cp.itemIds[Math.floor(Math.random() * cp.itemIds.length)]);
          if (gatheredItem) {
            setHp(prev => Math.max(0, prev - hpCost)); setHunger(prev => Math.max(0, prev - HUNGER_COLLECTION_COST_BASE)); gainXp(hpCost);
            setInventory(prev => { const existing = prev.find(i => i.itemId === gatheredItem.id); return existing ? prev.map(i => i.itemId === gatheredItem.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { itemId: gatheredItem.id, quantity: 1 }]; });
            toast({ title: "発見！", description: `${cp.name} から「${gatheredItem.name}」を手に入れた！` });
          }
          return;
        }
        const shop = masterShops.find(s => s.id === (obj.eventId?.startsWith('shop:') ? obj.eventId.split(':')[1] : obj.objectId));
        if (shop) { setActiveShop(shop); return; }

        // Meeting Place Logic
        const mp = masterMeetingPlaces.find(m => m.id === obj.objectId || m.id === obj.eventId);
        if (mp) {
          setActiveMeetingPlace(mp);
          return;
        }

        if (obj.transition) {
          const { targetWorldId, targetMapId, targetX, targetY } = obj.transition;
          let targetWorld = targetWorldId ? masterWorlds.find(w => w.id === targetWorldId) : masterWorlds.find(w => w.id === targetMapId || w.maps?.some(m => m.id === targetMapId));
          const targetCellIdx = targetWorld?.maps?.findIndex(m => m.id === targetMapId) ?? 0;
          if (targetWorld) setSelectedWorldId(targetWorld.id); else setSelectedWorldId(targetMapId);
          setActiveCellIndex(targetCellIdx === -1 ? 0 : targetCellIdx);
          setCharacterPosition({ x: targetX, y: targetY });
          setTargetPosition(null); return;
        }
        if (obj.eventId) { const flow = masterEvents.find(e => e.id === obj.eventId); if (flow) { setActiveEvent(flow); transitionToNode(flow.nodes.find(n => n.type === 'start')); return; } }
        if (obj.conversation) { setActiveInteraction({ conversation: obj.conversation, audioPath: obj.audioPath }); return; }
      }
    }
  }, [activeMapData, npcStates, masterEvents, isGamePaused, masterWorlds, toast, availableObjects, masterShops, masterCollectionPoints, masterMeetingPlaces, hp, transitionToNode, maxHp, level, getLevelBonus, gainXp, characterPosition]);

  useEffect(() => {
    const loop = (currentTime: number) => {
      if (activeCutscene && currentCutsceneStepIndex >= 0) {
        const step = activeCutscene.steps[currentCutsceneStepIndex];
        if (step.type === 'story' && !activeEvent) {
          setCutsceneChars(prev => {
            const next = { ...prev };
            let anyMoving = false;
            for (const id in next) {
              const c = next[id]; if (c.targetIdx >= c.path.length) continue;
              anyMoving = true; const target = c.path[c.targetIdx]; const dx = target.x - c.x, dy = target.y - c.y; const dist = Math.sqrt(dx * dx + dy * dy); const moveSpeed = (c.speed || 1) * 5;
              if (dist < moveSpeed) {
                next[id] = { ...c, x: target.x, y: target.y, targetIdx: c.targetIdx + 1 };
                if (target.eventId) { const event = masterEvents.find(e => e.id === target.eventId); if (event) { setActiveEvent(event); transitionToNode(event.nodes.find(n => n.type === 'start')); break; } }
              } else next[id] = { ...c, x: c.x + (dx / dist) * moveSpeed, y: c.y + (dy / dist) * moveSpeed };
            }
            if (!anyMoving && Object.keys(next).length > 0 && !activeEvent) setTimeout(() => startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1), 500);
            return next;
          });
        }
      }
      if (!isGamePaused) {
        let moveX = 0, moveY = 0;
        const currentSpeed = BASE_SPEED + level;
        const keys = pressedKeys;
        const isKeyPressed = keys.has('ArrowUp') || keys.has('w') || keys.has('ArrowDown') || keys.has('s') || keys.has('ArrowLeft') || keys.has('a') || keys.has('ArrowRight') || keys.has('d');
        if (isKeyPressed) {
          setTargetPosition(null);
          if (keys.has('ArrowUp') || keys.has('w')) moveY -= 1; if (keys.has('ArrowDown') || keys.has('s')) moveY += 1;
          if (keys.has('ArrowLeft') || keys.has('a')) moveX -= 1; if (keys.has('ArrowRight') || keys.has('d')) moveX += 1;
        } else if (targetPosition) {
          const dx = targetPosition.x - characterPosition.x, dy = targetPosition.y - characterPosition.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > currentSpeed) { moveX = dx / dist; moveY = dy / dist; } else setTargetPosition(null);
        }
        const moving = moveX !== 0 || moveY !== 0;
        if (isMoving !== moving) setIsMoving(moving);
        if (moving) {
          let newDir: CharacterDirection = characterDirection;
          if (Math.abs(moveX) > Math.abs(moveY)) newDir = moveX > 0 ? 'right' : 'left'; else if (moveY !== 0) newDir = moveY > 0 ? 'down' : 'up';
          if (newDir !== characterDirection) setCharacterDirection(newDir);
          const pos = characterPosition;
          const nextX = pos.x + moveX * currentSpeed, nextY = pos.y + moveY * currentSpeed;
          if (currentWorld?.rows && currentWorld.cols) {
            const currentRow = Math.floor(activeCellIndex / currentWorld.cols), currentCol = activeCellIndex % currentWorld.cols;
            let nextCellIdx = activeCellIndex, finalX = nextX, finalY = nextY, transitioned = false;
            const THR = 50;
            if (nextX < -THR && currentCol > 0) { nextCellIdx = activeCellIndex - 1; finalX = MAP_WIDTH - CHARACTER_WIDTH + THR; transitioned = true; }
            else if (nextX > MAP_WIDTH - CHARACTER_WIDTH + THR && currentCol + 1 < currentWorld.cols) { nextCellIdx = activeCellIndex + 1; finalX = -THR; transitioned = true; }
            else if (nextY < -THR && currentRow > 0) { nextCellIdx = activeCellIndex - currentWorld.cols; finalY = MAP_HEIGHT - CHARACTER_HEIGHT + THR; transitioned = true; }
            else if (nextY > MAP_HEIGHT - CHARACTER_HEIGHT + THR && currentRow + 1 < currentWorld.rows) { nextCellIdx = activeCellIndex + currentWorld.cols; finalY = -THR; transitioned = true; }
            if (transitioned) { setActiveCellIndex(nextCellIdx); setCharacterPosition({ x: finalX, y: finalY }); setTargetPosition(null); }
            else setCharacterPosition({ x: Math.max(-CHARACTER_WIDTH/2, Math.min(MAP_WIDTH - CHARACTER_WIDTH/2, nextX)), y: Math.max(-CHARACTER_HEIGHT/2, Math.min(MAP_HEIGHT - CHARACTER_HEIGHT/2, nextY)) });
          } else setCharacterPosition({ x: Math.max(0, Math.min(MAP_WIDTH - CHARACTER_WIDTH, nextX)), y: Math.max(0, Math.min(MAP_HEIGHT - CHARACTER_HEIGHT, nextY)) });
        }
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [pressedKeys, targetPosition, isGamePaused, isMoving, characterDirection, activeCellIndex, currentWorld, activeCutscene, currentCutsceneStepIndex, activeEvent, startCutsceneStep, level, characterPosition]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      if (bgmRef.current?.paused && bgmRef.current.getAttribute('src')) bgmRef.current.play().catch(()=>{});
      if ([' ', 'Enter'].includes(e.key)) { e.preventDefault(); checkForInteraction(); }
      else if (!isGamePaused) setPressedKeys(prev => new Set(prev).add(e.key));
    };
    const handleUp = (e: KeyboardEvent) => setPressedKeys(prev => { const n = new Set(prev); n.delete(e.key); return n; });
    window.addEventListener('keydown', handleDown); window.addEventListener('keyup', handleUp);
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
  }, [checkForInteraction, isGamePaused]);

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <div className="flex flex-col h-full gap-4 relative">
        <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border gap-4 z-10 flex-wrap">
          <div className="flex items-center gap-2 flex-grow max-w-[200px]">
            <Label className="whitespace-nowrap text-xs">マップ</Label>
            <Select value={selectedWorldId} onValueChange={(val) => { setSelectedWorldId(val); setActiveCellIndex(0); }} disabled={activeCutscene !== null}>
              <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{masterWorlds.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 shrink-0 items-center flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border rounded-lg h-10 w-20 md:w-24">
              <CalendarDays className="h-4 w-4 shrink-0 text-accent" />
              <div className="flex flex-col flex-grow min-w-0">
                <span className="text-[10px] font-bold whitespace-nowrap">{day} 日目</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border rounded-lg h-10 w-28 md:w-36">
              <Star className="h-4 w-4 shrink-0 text-yellow-500 fill-current" />
              <div className="flex flex-col flex-grow min-w-0">
                <div className="flex justify-between items-baseline mb-0.5"><span className="text-[10px] font-bold">Lv.{level}</span><span className="text-[8px] font-mono text-muted-foreground">{Math.floor(xp)}/{getNextXp(level)}</span></div>
                <Progress value={(xp / getNextXp(level)) * 100} className="h-1.5" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-background/50 border rounded-lg h-10 w-28 md:w-32">
              <Heart className={cn("h-4 w-4 shrink-0", hp < (maxHp * 0.2) ? "text-destructive animate-pulse" : "text-red-500")} /><div className="flex flex-col flex-grow min-w-0"><Progress value={(hp / maxHp) * 100} className="h-2" /><span className="text-[10px] font-mono leading-none mt-1 truncate">{Math.ceil(hp)}/{maxHp}</span></div>
            </div>
            <div className="flex items-center bg-background/50 border rounded-lg overflow-hidden h-10">
              <Button 
                size="icon" 
                variant="ghost" 
                className={cn(
                  "h-full w-10 rounded-none border-r transition-all duration-300",
                  isNearInteractable && "bg-accent/30 animate-pulse shadow-[inset_0_0_10px_hsl(var(--accent))]"
                )} 
                onClick={() => checkForInteraction()} 
                disabled={activeCutscene !== null || isGamePaused}
              >
                <Sparkles className={cn("h-4 w-4 text-accent transition-transform", isNearInteractable && "scale-110")} />
              </Button>
              <Popover><PopoverTrigger asChild><Button size="icon" variant="ghost" className="h-full w-10 rounded-none">{isMuted ? <VolumeX className="h-4 w-4 text-destructive" /> : <Volume2 className="h-4 w-4" />}</Button></PopoverTrigger><PopoverContent className="w-64 p-4 shadow-xl"><div className="space-y-4"><div className="flex items-center justify-between"><Label className="text-xs font-bold">全体消音</Label><Switch checked={isMuted} onCheckedChange={setIsMuted} /></div><Separator /><div className="space-y-3">
                <div className="space-y-1"><div className="flex items-center gap-2 mb-1"><Music className="h-3 w-3" /><Label className="text-[10px] font-bold">BGM</Label></div><Slider value={[bgmVolume * 100]} max={100} onValueChange={(v)=>setBgmVolume(v[0]/100)} /></div>
                <div className="space-y-1"><div className="flex items-center gap-2 mb-1"><Volume2 className="h-3 w-3" /><Label className="text-[10px] font-bold">VOICE</Label></div><Slider value={[voiceVolume * 100]} max={100} onValueChange={(v)=>setVoiceVolume(v[0]/100)} /></div>
              </div></div></PopoverContent></Popover>
            </div>
            <div className="bg-primary/10 px-4 py-2 rounded-full font-bold text-primary flex items-center shrink-0 h-10">{gold} K</div>
            <Button size="icon" variant="outline" className="h-10 w-10" onClick={handleSave} disabled={activeCutscene !== null}><Save className="h-4 w-4"/></Button>
            <SheetTrigger asChild><Button size="icon" variant="outline" className="h-10 w-10" disabled={activeCutscene !== null}><MenuIcon className="h-4 w-4"/></Button></SheetTrigger>
          </div>
        </div>
        <div ref={mapContainerRef} onClick={handleMapClick} className={cn("relative flex-grow bg-muted border-2 rounded-lg overflow-hidden aspect-[16/9]", isGamePaused ? "cursor-default" : "cursor-crosshair")}>
          {activeMapData ? (
            <>
              <MapLayer imageUrl={activeMapData.imageUrl} />
              <ObjectsLayer objects={activeMapData.objects} npcStates={npcStates} availableObjects={availableObjects} />
              <CutsceneLayer cutsceneChars={cutsceneChars} />
              <MiniMap world={currentWorld} activeIndex={activeCellIndex} />
              {!isGamePaused && targetPosition && <div className="absolute w-4 h-4 bg-primary/50 rounded-full animate-ping -translate-x-1/2 -translate-y-1/2" style={{ left: `${(targetPosition.x + CHARACTER_WIDTH/2) / MAP_WIDTH * 100}%`, top: `${(targetPosition.y + CHARACTER_HEIGHT/2) / MAP_HEIGHT * 100}%` }} />}
              <PlayerLayer 
                key={selectedWorldId + activeCellIndex}
                activePlayerChar={activePlayerChar} 
                clips={playerClips} 
                direction={characterDirection} 
                isMoving={isMoving} 
                activeCutscene={!!activeCutscene} 
                x={characterPosition.x} 
                y={characterPosition.y} 
              />
            </>
          ) : <div className="flex flex-col items-center justify-center h-full"><Loader2 className="h-12 w-12 animate-spin" /></div>}
          {activeCutscene && currentCutsceneStepIndex >= 0 && activeCutscene.steps[currentCutsceneStepIndex].type === 'video' && (
            <div className="absolute inset-0 bg-black z-[60] flex items-center justify-center"><video src={resolveMediaUrl(activeCutscene.steps[currentCutsceneStepIndex].videoUrl)} className="w-full h-full" autoPlay playsInline controls onEnded={() => startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1)} /><Button variant="ghost" className="absolute top-4 right-4 text-white" onClick={() => startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1)}>Skip</Button></div>
          )}
          {activeInteraction && <DialogueBox conversation={activeInteraction.conversation} audioPath={activeInteraction.audioPath} onComplete={() => setActiveInteraction(null)} />}
          {activeEvent && currentNode && (
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-8 z-50">
              <Card className="w-full max-w-2xl bg-background/95 backdrop-blur animate-in slide-in-from-bottom-4">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-xl font-medium whitespace-pre-wrap">{currentNode.content}</p>
                  <div className="flex flex-col gap-2">
                    {currentNode.type === 'choice' ? currentNode.choices?.map((choice, i) => <Button key={i} size="lg" className="w-full justify-start h-auto py-3" onClick={() => transitionToNode(activeEvent.nodes.find(n => n.id === choice.nextStepId))}>{choice.text}</Button>) : <Button size="lg" className="w-full" onClick={() => transitionToNode(activeEvent.nodes.find(n => n.id === currentNode.nextStepId))}>{currentNode.type === 'end' ? '物語を続ける' : '次へ'}</Button>}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Dialog open={activeShop !== null} onOpenChange={(open) => !open && setActiveShop(null)}>
        <DialogContent className="max-w-2xl"><DialogHeader><div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /><DialogTitle>{activeShop?.name}</DialogTitle></div></DialogHeader><div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 overflow-y-auto max-h-[60vh]">{[...(activeShop?.itemIds || []), ...(activeShop?.dishIds || [])].map((id) => {
          const item = availableObjects.find(a => a.id === id); if (!item) return null; const price = item.recoveryAmount || 0;
          return <Card key={id} className="flex flex-col"><CardHeader className="p-3"><div className="aspect-square relative bg-muted rounded-md mb-2"><Image src={resolveMediaUrl(item.imageUrl)} alt={item.name || ''} fill className="object-contain p-2" unoptimized /></div><CardTitle className="text-sm truncate">{item.name}</CardTitle></CardHeader><CardFooter className="p-3 pt-0"><Button className="w-full" size="sm" variant={gold >= price ? "default" : "secondary"} disabled={gold < price} onClick={() => { setGold(prev=>prev-price); setInventory(p=>{const e=p.find(i=>i.itemId===item.id);return e?p.map(i=>i.itemId===item.id?{...i,quantity:i.quantity+1}:i):[...p,{itemId:item.id,quantity:1}]}); toast({title:"購入完了"}); }}>{price} K</Button></CardFooter></Card>
        })}</div><DialogFooter className="flex justify-between border-t pt-4"><div>所持金: <span className="text-primary font-bold">{gold} K</span></div><Button variant="outline" onClick={()=>setActiveShop(null)}>店を出る</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={activeMeetingPlace !== null} onOpenChange={(open) => !open && setActiveMeetingPlace(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <DialogTitle>{activeMeetingPlace?.name}</DialogTitle>
            </div>
            <DialogDescription>実行するイベントを選択してください。</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {activeMeetingPlace?.eventIds.map((eventId) => {
              const event = masterEvents.find(e => e.id === eventId);
              return (
                <Button 
                  key={eventId} 
                  variant="outline" 
                  className="w-full justify-start h-auto py-3 px-4"
                  onClick={() => {
                    if (event) {
                      setActiveMeetingPlace(null);
                      setActiveEvent(event);
                      transitionToNode(event.nodes.find(n => n.type === 'start'));
                    }
                  }}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-bold">{event?.title || eventId}</span>
                    {event?.villagerName && <span className="text-[10px] text-muted-foreground">{event.villagerName}</span>}
                  </div>
                </Button>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveMeetingPlace(null)}>キャンセル</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SheetContent className="sm:max-w-xl"><SheetHeader><SheetTitle>ゲームメニュー</SheetTitle></SheetHeader><div className="mt-4"><MenuSimulatorClient inventoryItems={inventory.map(i=>{const d=availableObjects.find(a=>a.id===i.itemId); return {id:i.itemId,name:d?.name||'?',imageUrl:resolveMediaUrl(d?.imageUrl),quantity:i.quantity,canUse:(d?.recoveryAmount||0)>0,description:d?.description,rarity:d?.rarity,itemType:d?.itemType,recoveryAmount:d?.recoveryAmount,ingredients:d?.ingredients};})} sequences={masterSequences.map(s=>({id:s.id,title:s.title,description:s.description}))} characterAffection={availableObjects.filter(o=>o.type==='person').map(v=>({id:v.id,name:v.name||'?',imageUrl:resolveMediaUrl(v.imageUrl),points:affection[v.id]||0,description:v.description,personality:v.personality,age:v.age,gender:v.gender,introduction:v.introduction})).filter(c=>c.points>0).sort((a,b)=>b.points-a.points)} onPlaySequence={handlePlaySequence} onUseItem={(id)=>{
        const item = availableObjects.find(a=>a.id===id); if (!item) return; const bonus = getLevelBonus(level); const rec = Math.floor((item.recoveryAmount||0)*bonus); const hrec = item.isDish ? Math.floor((item.recoveryAmount||0)/10) : (item.recoveryAmount||0);
        if (hunger+hrec > maxHunger) { toast({variant:"destructive",title:"満腹です"}); return; }
        setHp(p=>Math.min(maxHp,p+rec)); setHunger(p=>Math.min(maxHunger,p+hrec));
        setInventory(p=>{const e=p.find(i=>i.itemId===id); if(e&&e.quantity>1) return p.map(i=>i.itemId===id?{...i,quantity:i.quantity-1}:i); return p.filter(i=>i.itemId!==id);});
        toast({title:"使用完了",description:`HP+${rec}, 満腹度+${hrec}`});
      }} /></div></SheetContent>
    </Sheet>
  );
}
