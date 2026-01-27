'use client';

import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, Save, Terminal} from 'lucide-react';
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

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;
const CHARACTER_SPEED = 10;
const CHARACTER_WIDTH = 64;
const CHARACTER_HEIGHT = 64;
const ANIMATION_FPS = 8;
const INTERACTION_RADIUS = 32;

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
};

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  type?: 'person' | 'door' | 'item';
  conversation?: string;
};

type MapCell = {
  id: string;
  name: string;
  imageUrl: string;
  objects: PlacedObject[];
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

type WorldMap = MapCell[][];

type CharacterState =
  | 'idle'
  | 'walk_up'
  | 'walk_down'
  | 'walk_left'
  | 'walk_right';
type CharacterDirection = 'up' | 'down' | 'left' | 'right';

type SavedInventoryItem = {
  itemId: string;
  quantity: number;
};

const worldMapOptions = [
  {id: 'maps', name: 'ワールドマップ 1'},
  {id: 'maps2', name: 'ワールドマップ 2'},
  {id: 'rooms', name: 'ルーム'},
];

function DialogueBox({
  conversation,
  onComplete,
}: {
  conversation: string;
  onComplete: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-4 z-50 text-foreground shadow-lg">
      <p className="mb-4 text-lg whitespace-pre-wrap">{conversation}</p>
      <div className="flex justify-end">
        <Button onClick={onComplete}>閉じる</Button>
      </div>
    </div>
  );
}

const GameView = ({
  loading,
  worldMap,
  rooms,
  error,
  isRoom,
  activeRoomId,
  activeMap,
  gameViewRef,
  handleMapClick,
  isTransitioning,
  availableObjects,
  characterPosition,
  activeClip,
  safeFrameIndex,
  isMenuOpen,
  setIsMenuOpen,
  destination,
  isInDialogue,
  activeDialogue,
  setActiveDialogue,
  handleSave,
  displayInventoryItems,
  collectedObjectIds,
  gold,
}: {
  loading: boolean;
  worldMap: WorldMap | null;
  rooms: MapCell[] | null;
  error: string | null;
  isRoom: boolean;
  activeRoomId: string | null;
  activeMap: { r: number; c: number };
  gameViewRef: React.RefObject<HTMLDivElement>;
  handleMapClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isTransitioning: boolean;
  availableObjects: AvailableObject[];
  characterPosition: { x: number; y: number };
  activeClip: AnimationClip | undefined;
  safeFrameIndex: number;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  destination: { x: number; y: number } | null;
  isInDialogue: boolean;
  activeDialogue: string | null;
  setActiveDialogue: (dialogue: string | null) => void;
  handleSave: () => void;
  displayInventoryItems: DisplayInventoryItem[];
  collectedObjectIds: string[];
  gold: number;
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>ゲームデータを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Terminal className="h-4 w-4" />
        <AlertTitle>読み込みエラー</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const activeMapData = isRoom
    ? rooms?.find(r => r.id === activeRoomId)
    : worldMap?.[activeMap.r]?.[activeMap.c];

  if (!activeMapData) {
    return <p>マップまたはキャラクターデータが見つかりません。</p>;
  }

  return (
    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <div className="flex justify-center items-center h-full">
        <div
          ref={gameViewRef}
          onClick={handleMapClick}
          className="relative aspect-[16/9] w-full max-w-full h-auto max-h-full bg-muted overflow-hidden border-2 border-border cursor-pointer"
        >
          {isTransitioning && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-30">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          )}
          {activeMapData.imageUrl && (
            <Image
              key={activeMapData.id}
              src={activeMapData.imageUrl}
              alt={`Map background ${activeMapData.name}`}
              layout="fill"
              objectFit="cover"
              unoptimized
              className="z-0"
              priority
            />
          )}

          {activeMapData.objects.filter(obj => !collectedObjectIds.includes(obj.id)).map(obj => {
            const asset = availableObjects.find(a => a.id === obj.objectId);
            if (!asset || !asset.imageUrl) return null;

            const leftPercent = (obj.x / MAP_WIDTH) * 100;
            const topPercent = (obj.y / MAP_HEIGHT) * 100;
            const widthPercent = (obj.width / MAP_WIDTH) * 100;

            return (
              <div
                key={obj.id}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: 'auto',
                  aspectRatio: `${obj.width} / ${obj.height}`,
                  position: 'absolute',
                  zIndex: 1,
                }}
              >
                <Image
                  src={asset.imageUrl}
                  alt={asset.name}
                  layout="fill"
                  objectFit="contain"
                  unoptimized
                />
              </div>
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: `${(characterPosition.x / MAP_WIDTH) * 100}%`,
              top: `${(characterPosition.y / MAP_HEIGHT) * 100}%`,
              width: `${(CHARACTER_WIDTH / MAP_WIDTH) * 100}%`,
              height: 'auto',
              aspectRatio: `${CHARACTER_WIDTH} / ${CHARACTER_HEIGHT}`,
              zIndex: 10,
              imageRendering: 'pixelated',
            }}
          >
            {(!activeClip || activeClip.frames.length === 0) ? (
              <Image
                src={`/characters/player/frames/idle_down_1.png`}
                alt="Player Character"
                layout="fill"
                objectFit="contain"
                unoptimized
              />
            ) : (
              activeClip.frames.map((frame, index) => (
                <Image
                  key={frame.id}
                  src={`/characters/player/frames/${frame.image}`}
                  alt=""
                  layout="fill"
                  objectFit="contain"
                  unoptimized
                  aria-hidden="true"
                  priority
                  className={cn(
                    'absolute inset-0',
                    index === safeFrameIndex ? 'opacity-100' : 'opacity-0'
                  )}
                />
              ))
            )}
          </div>
          
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background/50 backdrop-blur-sm rounded-full px-3 h-10 text-foreground font-bold shadow">
              <span>{gold}</span>
              <span className="text-sm">K</span>
            </div>
            <Button size="icon" onClick={handleSave} className="bg-background/50 hover:bg-background/80 backdrop-blur-sm h-10 w-10">
                <Save className="h-5 w-5" />
                <span className="sr-only">Save Game</span>
            </Button>
            <SheetTrigger asChild>
              <Button size="icon" className="bg-background/50 hover:bg-background/80 backdrop-blur-sm h-10 w-10">
                  <MenuIcon className="h-6 w-6" />
                  <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
          </div>

          {destination && (
            <div
                className="absolute z-20 w-4 h-4 bg-red-500 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(destination.x + CHARACTER_WIDTH / 2) / MAP_WIDTH * 100}%`,
                  top: `${(destination.y + CHARACTER_HEIGHT / 2) / MAP_HEIGHT * 100}%`,
                }}
            />
          )}
          {isInDialogue && (
            <DialogueBox
              conversation={activeDialogue!}
              onComplete={() => setActiveDialogue(null)}
            />
          )}
        </div>
      </div>
      <SheetContent className="w-full sm:max-w-lg p-0">
        <div className="p-6 h-full overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>メニュー</SheetTitle>
          </SheetHeader>
          <MenuSimulatorClient inventoryItems={displayInventoryItems} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export function PlayTestClient({ user, initialData }: { user: User, initialData: any | null }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const saveDocRef = useRef(doc(firestore, 'playtestSaves', user.uid));
  
  const [selectedMapId, setSelectedMapId] = useState<string>(
    initialData?.mapId || worldMapOptions[0].id
  );
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [rooms, setRooms] = useState<MapCell[] | null>(null);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>(
    []
  );
  const [clips, setClips] = useState<AnimationClip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeMap, setActiveMap] = useState({r: 0, c: 0});
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  const [characterPosition, setCharacterPosition] = useState({
    x: MAP_WIDTH / 2,
    y: MAP_HEIGHT / 2,
  });
  const [inventory, setInventory] = useState<SavedInventoryItem[]>([]);
  const [collectedObjectIds, setCollectedObjectIds] = useState<string[]>([]);
  const [gold, setGold] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [characterDirection, setCharacterDirection] =
    useState<CharacterDirection>('down');
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeDialogue, setActiveDialogue] = useState<string | null>(null);
  const [destination, setDestination] = useState<{x: number; y: number} | null>(
    null
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const gameViewRef = useRef<HTMLDivElement>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();

  const isRoom = selectedMapId === 'rooms';
  const isInDialogue = activeDialogue !== null;
  const isGamePaused = isInDialogue || isMenuOpen;
  
  const loadData = useCallback(
    async (
      mapId: string,
      targetRoomId?: string,
      targetPos?: {x: number; y: number}
    ) => {
      try {
        setIsTransitioning(true);
        setError(null);

        const isSwitchingToRoom =
          mapId === 'rooms' || mapId.startsWith('room_');

        if (!availableObjects.length) {
          const objectsResponse = await fetch('/objects.json');
          if (!objectsResponse.ok)
            throw new Error(
              `オブジェクトファイルの読み込みに失敗しました: ${objectsResponse.statusText}`
            );
          const objectsData = await objectsResponse.json();
          setAvailableObjects(objectsData.objects);
        }

        if (!clips) {
          const animResponse = await fetch('/characters/player/animations.json');
          if (!animResponse.ok)
            throw new Error(
              `アニメーションファイルの読み込みに失敗しました: ${animResponse.statusText}`
            );
          const animData = await animResponse.json();
          setClips(animData.clips);
        }

        if (isSwitchingToRoom) {
          const roomsResponse = await fetch('/rooms/rooms.json');
          if (!roomsResponse.ok)
            throw new Error(
              `ルームファイルの読み込みに失敗しました: ${roomsResponse.statusText}`
            );
          const roomsData = await roomsResponse.json();

          setWorldMap(null);
          setRooms(roomsData.rooms);
          const targetId = targetRoomId
            ? roomsData.rooms.find((r: MapCell) => r.id === targetRoomId)?.id
            : roomsData.rooms[0]?.id;
          setActiveRoomId(targetId);
          setSelectedMapId('rooms');
        } else {
          const mapResponse = await fetch(`/${mapId}/${mapId}.json`);
          if (!mapResponse.ok)
            throw new Error(
              `マップファイルの読み込みに失敗しました: ${mapResponse.statusText}`
            );
          const mapData = await mapResponse.json();
          setRooms(null);
          setActiveRoomId(null);
          const rows = mapData.rows || 1;
          const cols = mapData.cols || 1;

          if (
            typeof rows !== 'number' ||
            typeof cols !== 'number' ||
            rows <= 0 ||
            cols <= 0
          ) {
            throw new Error(
              `マップファイル '${mapId}.json' に無効な行または列の定義が含まれています。`
            );
          }

          const newWorldMap: WorldMap = Array(rows)
            .fill(null)
            .map(() => Array(cols).fill(null));
          mapData.maps.forEach((mapCell: MapCell, index: number) => {
            const r = Math.floor(index / cols);
            const c = index % cols;
            if (newWorldMap[r]) {
              newWorldMap[r][c] = mapCell;
            }
          });
          setWorldMap(newWorldMap);
          setActiveMap({r: 0, c: 0});
          setSelectedMapId(mapId);
        }

        setCharacterPosition(targetPos || {x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2});
      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
      } finally {
        setTimeout(() => setIsTransitioning(false), 100);
      }
    },
    [clips, availableObjects]
  );
  
  useEffect(() => {
    const initializeGame = async () => {
      setLoading(true);
      if (initialData) {
        await loadData(
          initialData.mapId,
          initialData.roomId,
          { x: initialData.positionX, y: initialData.positionY }
        );
        setInventory(initialData.inventory || []);
        setCollectedObjectIds(initialData.collectedObjectIds || []);
        setGold(initialData.gold || 0);
      } else {
        await loadData(worldMapOptions[0].id);
        setInventory([]);
        setCollectedObjectIds([]);
        setGold(0);
      }
      setLoading(false);
    };

    initializeGame();
  }, [initialData, loadData]);

  const handleSave = () => {
    const saveData = {
      userId: user.uid,
      mapId: selectedMapId,
      roomId: activeRoomId,
      positionX: characterPosition.x,
      positionY: characterPosition.y,
      inventory: inventory,
      collectedObjectIds: collectedObjectIds,
      gold: gold,
      updatedAt: serverTimestamp(),
    };
    
    setDocumentNonBlocking(saveDocRef.current, saveData, { merge: true });
    toast({
      title: "ゲームをセーブしました！",
      description: "進行状況が正常に保存されました。",
    });
  };

  useEffect(() => {
    if (!clips) return;
    clips.forEach(clip => {
      clip.frames.forEach(frame => {
        const img = new (window as any).Image();
        img.src = `/characters/player/frames/${frame.image}`;
      });
    });
  }, [clips]);

  const checkForInteraction = useCallback(() => {
    if (isGamePaused) return;
    
    const activeMapData = isRoom
      ? rooms?.find(r => r.id === activeRoomId)
      : worldMap?.[activeMap.r]?.[activeMap.c];
    if (!activeMapData) return;

    const characterCenterX = characterPosition.x + CHARACTER_WIDTH / 2;
    const characterCenterY = characterPosition.y + CHARACTER_HEIGHT / 2;

    for (const obj of activeMapData.objects) {
      const asset = availableObjects.find(a => a.id === obj.objectId);
      if (!asset) continue;

      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const distance = Math.sqrt(
        Math.pow(characterCenterX - objCenterX, 2) +
          Math.pow(characterCenterY - objCenterY, 2)
      );
      const interactionZone =
        INTERACTION_RADIUS + Math.min(obj.width, obj.height) / 2;

      if (distance < interactionZone) {
        switch (asset.type) {
          case 'person':
            if (obj.conversation) {
              setActiveDialogue(obj.conversation);
              return;
            }
            break;
          case 'door':
            if (obj.transition) {
              const {targetMapId, targetX, targetY} = obj.transition;
              const targetIsRoom =
                targetMapId === 'rooms' || targetMapId.startsWith('room_');
              loadData(
                targetIsRoom ? 'rooms' : targetMapId,
                targetIsRoom ? targetMapId : undefined,
                {x: targetX, y: targetY}
              );
              return;
            }
            break;
          case 'item':
            if (collectedObjectIds.includes(obj.id)) {
              continue;
            }
            setInventory(prevInventory => {
              const existingItem = prevInventory.find(i => i.itemId === obj.objectId);
              if (existingItem) {
                return prevInventory.map(i => i.itemId === obj.objectId ? { ...i, quantity: i.quantity + 1 } : i);
              } else {
                return [...prevInventory, { itemId: obj.objectId, quantity: 1 }];
              }
            });

            setCollectedObjectIds(prev => [...prev, obj.id]);
            setDestination(null);

            toast({
              title: "アイテムをゲット！",
              description: `${asset.name} を手に入れた。`,
            });
            return;
        }
      }
    }
  }, [
    isGamePaused,
    isRoom,
    rooms,
    activeRoomId,
    worldMap,
    activeMap,
    characterPosition,
    loadData,
    availableObjects,
    collectedObjectIds,
    toast,
  ]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isGamePaused || !gameViewRef.current) return;

    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }

    const rect = gameViewRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetX = (clickX / rect.width) * MAP_WIDTH;
    const targetY = (clickY / rect.height) * MAP_HEIGHT;

    setDestination({
      x: targetX - CHARACTER_WIDTH / 2,
      y: targetY - CHARACTER_HEIGHT / 2,
    });

    setPressedKeys(new Set());
  };

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isGamePaused) return;

      if (['e', 'E', 'Enter'].includes(event.key)) {
        checkForInteraction();
        return;
      }

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
      ) {
        setPressedKeys(prev => new Set(prev).add(event.key));
        setDestination(null);
      }
    },
    [isGamePaused, checkForInteraction]
  );

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setPressedKeys(prev => {
      const next = new Set(prev);
      next.delete(event.key);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const loop = () => {
      if (isTransitioning || isGamePaused) {
        setCharacterState('idle');
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      let moveVector = {x: 0, y: 0};
      let isMoving = false;

      if (destination) {
        const dx = destination.x - characterPosition.x;
        const dy = destination.y - characterPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CHARACTER_SPEED) {
          setDestination(null);
          isMoving = false;
        } else {
          moveVector = {x: dx / distance, y: dy / distance};
          isMoving = true;
        }
      } else if (pressedKeys.size > 0) {
        if (pressedKeys.has('ArrowUp')) moveVector.y -= 1;
        if (pressedKeys.has('ArrowDown')) moveVector.y += 1;
        if (pressedKeys.has('ArrowLeft')) moveVector.x -= 1;
        if (pressedKeys.has('ArrowRight')) moveVector.x += 1;
        isMoving = true;
      }

      if (!isMoving) {
        setCharacterState('idle');
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      const magnitude = Math.sqrt(
        moveVector.x * moveVector.x + moveVector.y * moveVector.y
      );
      if (magnitude > 1) {
        moveVector.x /= magnitude;
        moveVector.y /= magnitude;
      }

      let newPos = {
        x: characterPosition.x + moveVector.x * CHARACTER_SPEED,
        y: characterPosition.y + moveVector.y * CHARACTER_SPEED,
      };
      let newActiveMap = {...activeMap};
      let didTransition = false;

      let newState: CharacterState = 'idle';
      let newDirection = characterDirection;
      if (Math.abs(moveVector.x) > Math.abs(moveVector.y)) {
        if (moveVector.x > 0) {
          newState = 'walk_right';
          newDirection = 'right';
        } else {
          newState = 'walk_left';
          newDirection = 'left';
        }
      } else {
        if (moveVector.y > 0) {
          newState = 'walk_down';
          newDirection = 'down';
        } else {
          newState = 'walk_up';
          newDirection = 'up';
        }
      }
      setCharacterState(newState);
      setCharacterDirection(newDirection);

      if (!isRoom && worldMap) {
        const currentRows = worldMap.length;
        const currentCols = worldMap[0]?.length || 1;

        if (newPos.x < 0) {
          if (activeMap.c > 0) {
            newActiveMap.c--;
            newPos.x = MAP_WIDTH - CHARACTER_WIDTH;
            didTransition = true;
          }
        } else if (newPos.x > MAP_WIDTH - CHARACTER_WIDTH) {
          if (activeMap.c < currentCols - 1) {
            newActiveMap.c++;
            newPos.x = 0;
            didTransition = true;
          }
        } else if (newPos.y < 0) {
          if (activeMap.r > 0) {
            newActiveMap.r--;
            newPos.y = MAP_HEIGHT - CHARACTER_HEIGHT;
            didTransition = true;
          }
        } else if (newPos.y > MAP_HEIGHT - CHARACTER_HEIGHT) {
          if (activeMap.r < currentRows - 1) {
            newActiveMap.r++;
            newPos.y = 0;
            didTransition = true;
          }
        }
      }

      newPos.x = Math.max(0, Math.min(newPos.x, MAP_WIDTH - CHARACTER_WIDTH));
      newPos.y = Math.max(0, Math.min(newPos.y, MAP_HEIGHT - CHARACTER_HEIGHT));
      setCharacterPosition(newPos);

      if (didTransition) {
        setIsTransitioning(true);
        setActiveMap(newActiveMap);
        setTimeout(() => setIsTransitioning(false), 100);
      }

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [
    isTransitioning,
    isGamePaused,
    pressedKeys,
    destination,
    characterPosition,
    activeMap,
    isRoom,
    worldMap,
    characterDirection,
  ]);

  const activeClipName =
    characterState === 'idle' ? `idle_${characterDirection}` : characterState;
  const activeClip = clips?.find(c => c.name === activeClipName);

  useEffect(() => {
    let frameId: number;
    let lastTime = 0;

    if (!activeClip || activeClip.frames.length === 0) {
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTime === 0) {
        lastTime = currentTime;
      }

      const deltaTime = currentTime - lastTime;
      const frameDuration = 1000 / (activeClip.fps || ANIMATION_FPS);

      if (deltaTime > frameDuration) {
        const framesToAdvance = Math.floor(deltaTime / frameDuration);
        lastTime += framesToAdvance * frameDuration;
        setCurrentFrameIndex(
          prevIndex => (prevIndex + framesToAdvance) % activeClip.frames.length
        );
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [activeClip]);

  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [activeClipName]);

  const safeFrameIndex = activeClip
    ? Math.min(currentFrameIndex, activeClip.frames.length - 1)
    : 0;

  const handleMapSelectionChange = (mapId: string) => {
    loadData(mapId);
  };
  
  const displayInventoryItems: DisplayInventoryItem[] = useMemo(() => {
    if (!availableObjects.length) return [];
    return inventory.map(savedItem => {
      const itemDetails = availableObjects.find(obj => obj.id === savedItem.itemId);
      return {
        id: savedItem.itemId,
        name: itemDetails?.name || '不明なアイテム',
        imageUrl: itemDetails?.imageUrl || '',
        quantity: savedItem.quantity,
      };
    }).filter(item => item.imageUrl);
  }, [inventory, availableObjects]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-end gap-4">
        <div>
          <Label htmlFor="world-map-select">マップ</Label>
          <Select
            value={selectedMapId}
            onValueChange={handleMapSelectionChange}
            disabled={isGamePaused}
          >
            <SelectTrigger id="world-map-select" className="w-[280px] mt-2">
              <SelectValue placeholder="テストするマップを選択..." />
            </SelectTrigger>
            <SelectContent>
              {worldMapOptions.map(map => (
                <SelectItem key={map.id} value={map.id}>
                  {map.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isRoom && rooms && (
          <div>
            <Label htmlFor="room-select">ルーム</Label>
            <Select
              value={activeRoomId || ''}
              onValueChange={roomId => setActiveRoomId(roomId)}
              disabled={isGamePaused}
            >
              <SelectTrigger id="room-select" className="w-[280px] mt-2">
                <SelectValue placeholder="テストするルームを選択..." />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex-grow min-h-0">
        <GameView
          loading={loading}
          worldMap={worldMap}
          rooms={rooms}
          error={error}
          isRoom={isRoom}
          activeRoomId={activeRoomId}
          activeMap={activeMap}
          gameViewRef={gameViewRef}
          handleMapClick={handleMapClick}
          isTransitioning={isTransitioning}
          availableObjects={availableObjects}
          characterPosition={characterPosition}
          activeClip={activeClip}
          safeFrameIndex={safeFrameIndex}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          destination={destination}
          isInDialogue={isInDialogue}
          activeDialogue={activeDialogue}
          setActiveDialogue={setActiveDialogue}
          handleSave={handleSave}
          displayInventoryItems={displayInventoryItems}
          collectedObjectIds={collectedObjectIds}
          gold={gold}
        />
      </div>
    </div>
  );
}
