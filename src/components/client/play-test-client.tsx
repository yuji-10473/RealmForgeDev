
'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, Save, Terminal, User as UserIcon, Map as MapIcon, Volume2, VolumeX, Play, Music} from 'lucide-react';
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
import { MenuSimulatorClient, type DisplayInventoryItem, type DisplaySequence } from './menu-simulator-client';
import type { User } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '../ui/card';

const MAP_WIDTH = 2752;
const MAP_HEIGHT = 1536;
const CHARACTER_SPEED = 12;
const CHARACTER_WIDTH = 256;
const CHARACTER_HEIGHT = 256;
const INTERACTION_RADIUS = 150;

// v1.1.1 Path Resolution
const resolveMediaUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
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

// --- End Cutscene Types ---

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
  itemIds?: string[];
  description?: string;
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

  // State
  const [loading, setLoading] = useState(true);
  const [selectedWorldId, setSelectedWorldId] = useState<string>(initialData?.mapId || '');
  const [activePlayerId, setActivePlayerId] = useState<string>('');
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [characterPosition, setCharacterPosition] = useState({x: initialData?.positionX || MAP_WIDTH / 2, y: initialData?.positionY || MAP_HEIGHT / 2});
  const [targetPosition, setTargetPosition] = useState<{x: number, y: number} | null>(null);
  const [inventory, setInventory] = useState<SavedInventoryItem[]>(initialData?.inventory || []);
  const [gold, setGold] = useState(initialData?.gold || 0);
  const [characterDirection, setCharacterDirection] = useState<CharacterDirection>('down');
  const [isMoving, setIsMoving] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeInteraction, setActiveInteraction] = useState<{ conversation: string; audioPath?: string } | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventFlow | null>(null);
  const [currentNode, setCurrentNode] = useState<EventNode | null>(null);
  const [npcStates, setNpcStates] = useState<Record<string, NpcState>>({});

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
  const isGamePaused = activeInteraction !== null || isMenuOpen || activeEvent !== null || activeCutscene !== null;

  useEffect(() => {
    if (!currentWorld || activeCutscene) return; // In cutscene, bgm is handled by startCutsceneStep
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
          return Array.isArray(data) ? data : (data.worlds || data.events || data.sequences || data.stories || []);
        };

        const [worldIndex, villagers, items, buildings, events, collectionPoints, meetingPlaces, monsters, dishes, shops, playerListRes, sequences, stories] = await Promise.all([
          fetchData('worlds'),
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

        setMasterWorlds(fullWorlds);
        setAvailableObjects([...villagers, ...items, ...buildings, ...collectionPoints, ...meetingPlaces, ...monsters, ...dishes, ...shops]);
        setMasterEvents(events);
        setPlayerCharacters(playerListRes.characters || []);
        setMasterSequences(sequences);
        setMasterStories(stories);

        if (playerListRes.characters?.length > 0 && !activePlayerId) {
          setActivePlayerId(playerListRes.characters[0].id);
        }

        if (fullWorlds.length > 0 && !selectedWorldId) {
          setSelectedWorldId(fullWorlds[0].id);
        }
      } catch (e: any) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Fetch animations.json and preload frames when active player changes
  useEffect(() => {
    if (!activePlayerChar) return;
    const fetchAnims = async () => {
      try {
        const res = await fetch(`${activePlayerChar.path}/animations.json`);
        if (res.ok) {
          const data = await res.json();
          const clips = data.clips || [];
          setPlayerClips(clips);

          // Preload all frames
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
      inventory,
      gold,
      bgmVolume,
      voiceVolume,
      isMuted,
      updatedAt: serverTimestamp(),
    };
    setDocumentNonBlocking(saveDocRef.current, saveData, { merge: true });
    toast({ title: "セーブ完了", description: "進行状況を保存しました。" });
  };

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

  const playNodeVoice = useCallback((node: EventNode) => {
    if (!voiceRef.current) voiceRef.current = new Audio();
    if (node.audioUrl) {
      voiceRef.current.src = resolveMediaUrl(node.audioUrl);
      voiceRef.current.muted = isMuted;
      voiceRef.current.volume = voiceVolume;
      voiceRef.current.play().catch(() => {});
    }
  }, [isMuted, voiceVolume]);

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

        // BGM切り替え
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
    
    // Save original state
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

  const checkForInteraction = useCallback(() => {
    if (isGamePaused || !activeMapData) return;
    const charCX = characterPosition.x + CHARACTER_WIDTH / 2;
    const charCY = characterPosition.y + CHARACTER_HEIGHT / 2;

    for (const obj of activeMapData.objects) {
      const currentX = npcStates[obj.id]?.x ?? obj.x;
      const dist = Math.sqrt(Math.pow(charCX - (currentX + obj.width / 2), 2) + Math.pow(charCY - (obj.y + obj.height / 2), 2));

      if (dist < INTERACTION_RADIUS) {
        const asset = availableObjects.find(a => a.id === obj.objectId);
        if (asset?.itemIds && asset.itemIds.length > 0) {
          const randomItemId = asset.itemIds[Math.floor(Math.random() * asset.itemIds.length)];
          const gatheredItem = availableObjects.find(a => a.id === randomItemId);
          if (gatheredItem) {
            setInventory(prev => {
              const existing = prev.find(i => i.itemId === randomItemId);
              if (existing) return prev.map(i => i.itemId === randomItemId ? { ...i, quantity: i.quantity + 1 } : i);
              return [...prev, { itemId: randomItemId, quantity: 1 }];
            });
            toast({ title: "採集完了", description: `${asset.name} から「${gatheredItem.name}」を手に入れた！` });
          }
          return;
        }

        if (obj.transition) {
          const { targetMapId, targetX, targetY } = obj.transition;
          
          const mapIdx = currentWorld?.maps.findIndex(m => m.id === targetMapId);
          if (mapIdx !== undefined && mapIdx !== -1) {
            setActiveCellIndex(mapIdx);
          } else {
            setSelectedWorldId(targetMapId);
            setActiveCellIndex(0);
          }
          
          setCharacterPosition({ x: targetX, y: targetY });
          setTargetPosition(null);
          toast({ title: "エリア移動", description: "新しい場所へ移動しました。" });
          return;
        }

        if (obj.eventId) {
          const flow = masterEvents.find(e => e.id === obj.eventId);
          if (flow) {
            setActiveEvent(flow);
            const startNode = flow.nodes.find(n => n.type === 'start');
            setCurrentNode(startNode || null);
            if (startNode) playNodeVoice(startNode);
            return;
          }
        }
        if (obj.conversation) {
          setActiveInteraction({ conversation: obj.conversation, audioPath: obj.audioPath });
          return;
        }
      }
    }
  }, [activeMapData, characterPosition, npcStates, masterEvents, isGamePaused, currentWorld, toast, availableObjects, playNodeVoice]);

  useEffect(() => {
    let nextStepTimeout: NodeJS.Timeout | null = null;

    const loop = (currentTime: number) => {
      // 1. Cutscene Character Movement (Runs even if player is paused)
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
                      setCurrentNode(startNode);
                      playNodeVoice(startNode);
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
              // Advance step after a small delay to feel more natural
              nextStepTimeout = setTimeout(() => {
                startCutsceneStep(activeCutscene, currentCutsceneStepIndex + 1);
                nextStepTimeout = null;
              }, 500);
            }
            return next;
          });
        }
      }

      // 2. Player Movement Logic (Only if NOT paused)
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

        // Animation Update
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
  }, [pressedKeys, targetPosition, isGamePaused, playerClips, characterDirection, characterPosition, animState, activeCellIndex, currentWorld, activeCutscene, currentCutsceneStepIndex, activeEvent, masterEvents, startCutsceneStep, playNodeVoice]);

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
    return { id: i.itemId, name: details?.name || 'Unknown', imageUrl: resolveMediaUrl(details?.imageUrl), quantity: i.quantity };
  });

  const displaySequences: DisplaySequence[] = masterSequences.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description
  }));

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

          <div className="flex items-center gap-2 flex-grow max-w-sm">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <Select value={activePlayerId} onValueChange={setActivePlayerId} disabled={activeCutscene !== null}>
              <SelectTrigger><SelectValue placeholder="プレイヤー選択" /></SelectTrigger>
              <SelectContent>
                {playerCharacters.map(pc => <SelectItem key={pc.id} value={pc.id}>{pc.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 shrink-0 items-center">
            <div className="flex items-center bg-background/50 border rounded-lg overflow-hidden h-10">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-full w-10 rounded-none border-r">
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
            <div className="bg-primary/10 px-4 py-2 rounded-full font-bold text-primary flex items-center">{gold} K</div>
            <Button size="icon" variant="outline" onClick={handleSave} disabled={activeCutscene !== null}><Save className="h-4 w-4"/></Button>
            <SheetTrigger asChild><Button size="icon" variant="outline" disabled={activeCutscene !== null}><MenuIcon className="h-4 w-4"/></Button></SheetTrigger>
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
              
              {/* Normal Map Objects */}
              {activeMapData.objects.map(obj => {
                const asset = availableObjects.find(a => a.id === obj.objectId);
                if (!asset || !asset.imageUrl) return null;
                const curX = npcStates[obj.id]?.x ?? obj.x;
                const imgUrl = resolveMediaUrl(asset.imageUrl);
                if (!imgUrl) return null;

                return (
                  <div key={obj.id} style={{ left: `${(curX / MAP_WIDTH) * 100}%`, top: `${(obj.y / MAP_HEIGHT) * 100}%`, width: `${(obj.width / MAP_WIDTH) * 100}%`, position: 'absolute' }}>
                    <Image src={imgUrl} alt="" layout="responsive" width={asset.width || 256} height={asset.height || 256} unoptimized />
                  </div>
                );
              })}
              
              {/* Cutscene Characters */}
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
                    alt={char.data.name} 
                    fill 
                    className="object-contain" 
                    unoptimized 
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                    {char.data.name}
                  </div>
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
                  opacity: activeCutscene ? 0.5 : 1 // Dim player during cutscene if not explicitly moving
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

          {/* Video Overlay */}
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
                          if (next) { setCurrentNode(next); playNodeVoice(next); } else { setActiveEvent(null); }
                        }}>{choice.text}</Button>
                      ))
                    ) : (
                      <Button size="lg" className="w-full" onClick={() => {
                        const next = activeEvent.nodes.find(n => n.id === currentNode.nextStepId);
                        if (next) { setCurrentNode(next); playNodeVoice(next); } else { setActiveEvent(null); }
                      }}>{currentNode.type === 'end' ? '物語を続ける' : '次へ'}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>ゲームメニュー</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <MenuSimulatorClient 
            inventoryItems={displayInventory} 
            sequences={displaySequences}
            onPlaySequence={handlePlaySequence}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
