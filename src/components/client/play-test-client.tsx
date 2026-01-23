'use client';

import {useState, useEffect, useCallback, useRef} from 'react';
import Image from 'next/image';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';
import {Loader2, Terminal, MessageSquare} from 'lucide-react';
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

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;
const CHARACTER_SPEED = 10;
const CHARACTER_WIDTH = 64;
const CHARACTER_HEIGHT = 64;
const ANIMATION_FPS = 8;
const INTERACTION_RADIUS = 50;

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

function InventoryBar({ items }: { items: AvailableObject[] }) {
  const inventorySize = 8;
  const slots = Array(inventorySize).fill(null);
  
  items.forEach((item, index) => {
    if (index < inventorySize) {
      slots[index] = item;
    }
  });

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="flex gap-2 p-2 bg-background/70 backdrop-blur-sm rounded-lg border border-border shadow-lg">
        {slots.map((item, index) => (
          <div 
            key={index}
            className="w-16 h-16 bg-muted/50 rounded-md border-2 border-dashed border-border flex items-center justify-center"
          >
            {item && (
              <Image 
                src={item.imageUrl}
                alt={item.name}
                width={48}
                height={48}
                className="object-contain"
                unoptimized
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlayTestClient() {
  const [selectedMapId, setSelectedMapId] = useState<string>(
    worldMapOptions[0].id
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [characterState, setCharacterState] = useState<CharacterState>('idle');
  const [characterDirection, setCharacterDirection] =
    useState<CharacterDirection>('down');
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [activeDialogue, setActiveDialogue] = useState<string | null>(null);
  const [interactableNpcs, setInteractableNpcs] = useState<string[]>([]);
  const [inventory, setInventory] = useState<AvailableObject[]>([]);

  const gameViewRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const destinationRef = useRef<{x: number; y: number} | null>(null);
  const characterPosRef = useRef({x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2});

  const isRoom = selectedMapId === 'rooms';
  const isInDialogue = activeDialogue !== null;

  const loadData = useCallback(
    async (
      mapId: string,
      targetRoomId?: string,
      targetPos?: {x: number; y: number}
    ) => {
      try {
        setIsTransitioning(true);
        setError(null);
        destinationRef.current = null;

        const isSwitchingToRoom =
          mapId === 'rooms' || mapId.startsWith('room_');

        // Fetch common data only if not already loaded
        if (availableObjects.length === 0) {
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

        // Fetch map/room specific data
        if (isSwitchingToRoom) {
          const roomsResponse = await fetch('/rooms/rooms.json');
          if (!roomsResponse.ok) throw new Error(`ルームファイルの読み込みに失敗しました: ${roomsResponse.statusText}`);
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
          if (!mapResponse.ok) throw new Error(`マップファイルの読み込みに失敗しました: ${mapResponse.statusText}`);
          const mapData = await mapResponse.json();
          setRooms(null);
          setActiveRoomId(null);
          const rows = mapData.rows || 1;
          const cols = mapData.cols || 1;

           if (typeof rows !== 'number' || typeof cols !== 'number' || rows <= 0 || cols <= 0) {
            throw new Error(`マップファイル '${mapId}.json' に無効な行または列の定義が含まれています。`);
          }

          const newWorldMap: WorldMap = Array(rows).fill(null).map(() => Array(cols).fill(null));
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
        
        const newPos = targetPos || {x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2};
        characterPosRef.current = newPos;
        setCharacterPosition(newPos);

      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
      } finally {
        setTimeout(() => setIsTransitioning(false), 100);
      }
    },
    [clips, availableObjects.length]
  );
  
  useEffect(() => {
    loadData(selectedMapId);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkForInteraction = useCallback(() => {
    const activeMapData = isRoom
      ? rooms?.find(r => r.id === activeRoomId)
      : worldMap?.[activeMap.r]?.[activeMap.c];
    if (!activeMapData) return;

    const characterCenterX = characterPosRef.current.x + CHARACTER_WIDTH / 2;
    const characterCenterY = characterPosRef.current.y + CHARACTER_HEIGHT / 2;

    for (const obj of activeMapData.objects) {
      const asset = availableObjects.find(a => a.id === obj.objectId);
      if (!asset) continue;

      const objCenterX = obj.x + obj.width / 2;
      const objCenterY = obj.y + obj.height / 2;
      const distance = Math.sqrt(
        Math.pow(characterCenterX - objCenterX, 2) +
          Math.pow(characterCenterY - objCenterY, 2)
      );
      const interactionZone = INTERACTION_RADIUS + Math.min(obj.width, obj.height) / 2;

      if (distance < interactionZone) {
        destinationRef.current = null;
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
              const targetIsRoom = targetMapId === 'rooms' || targetMapId.startsWith('room_');
              loadData(
                targetIsRoom ? 'rooms' : targetMapId,
                targetIsRoom ? targetMapId : undefined,
                {x: targetX, y: targetY}
              );
              return;
            }
            break;
        }
      }
    }
  }, [isRoom, rooms, activeRoomId, worldMap, activeMap, loadData, availableObjects]);


  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isInDialogue || !gameViewRef.current) return;

    const rect = gameViewRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const targetX = (clickX / rect.width) * MAP_WIDTH;
    const targetY = (clickY / rect.height) * MAP_HEIGHT;

    destinationRef.current = {
      x: targetX - CHARACTER_WIDTH / 2,
      y: targetY - CHARACTER_HEIGHT / 2,
    };
    pressedKeysRef.current.clear();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isInDialogue) return;

      if (['e', 'E', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        checkForInteraction();
        return;
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key.toLowerCase())) {
        destinationRef.current = null;
        pressedKeysRef.current.add(event.key.toLowerCase());
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeysRef.current.delete(event.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInDialogue, checkForInteraction]);
  
  // Main game loop
  useEffect(() => {
    const loop = () => {
      if (isTransitioning || isInDialogue) {
        setCharacterState('idle');
        gameLoopRef.current = requestAnimationFrame(loop);
        return;
      }

      let moveVector = {x: 0, y: 0};
      let isMoving = false;

      const destination = destinationRef.current;
      const pressedKeys = pressedKeysRef.current;

      if (destination) {
        const dx = destination.x - characterPosRef.current.x;
        const dy = destination.y - characterPosRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < CHARACTER_SPEED) {
          destinationRef.current = null;
          isMoving = false;
        } else {
          moveVector = {x: dx / distance, y: dy / distance};
          isMoving = true;
        }
      } else if (pressedKeys.size > 0) {
        if (pressedKeys.has('arrowup') || pressedKeys.has('w')) moveVector.y -= 1;
        if (pressedKeys.has('arrowdown') || pressedKeys.has('s')) moveVector.y += 1;
        if (pressedKeys.has('arrowleft') || pressedKeys.has('a')) moveVector.x -= 1;
        if (pressedKeys.has('arrowright') || pressedKeys.has('d')) moveVector.x += 1;
        isMoving = true;
      }

      // Animation and direction state
      let newState: CharacterState = 'idle';
      let newDirection = characterDirection;
      if (isMoving) {
        if (Math.abs(moveVector.x) > Math.abs(moveVector.y)) {
          if (moveVector.x > 0) {
            newState = 'walk_right'; newDirection = 'right';
          } else {
            newState = 'walk_left'; newDirection = 'left';
          }
        } else {
          if (moveVector.y > 0) {
            newState = 'walk_down'; newDirection = 'down';
          } else {
            newState = 'walk_up'; newDirection = 'up';
          }
        }
      }
      
      // Normalize vector for consistent diagonal speed
      const magnitude = Math.sqrt(moveVector.x * moveVector.x + moveVector.y * moveVector.y);
      if (magnitude > 1) {
        moveVector.x /= magnitude;
        moveVector.y /= magnitude;
      }

      let newPos = {
        x: characterPosRef.current.x + moveVector.x * CHARACTER_SPEED,
        y: characterPosRef.current.y + moveVector.y * CHARACTER_SPEED,
      };

      // Clamp position within map boundaries
      newPos.x = Math.max(0, Math.min(newPos.x, MAP_WIDTH - CHARACTER_WIDTH));
      newPos.y = Math.max(0, Math.min(newPos.y, MAP_HEIGHT - CHARACTER_HEIGHT));
      characterPosRef.current = newPos;

      // Update React state for rendering
      setCharacterPosition(newPos);
      setCharacterState(newState);
      setCharacterDirection(newDirection);
      
      // Check for interactable NPCs
      const currentActiveMap = isRoom
        ? rooms?.find(r => r.id === activeRoomId)
        : worldMap?.[activeMap.r]?.[activeMap.c];

      if (currentActiveMap) {
          const characterCenterX = newPos.x + CHARACTER_WIDTH / 2;
          const characterCenterY = newPos.y + CHARACTER_HEIGHT / 2;
          const newInteractables: string[] = [];

          for (const obj of currentActiveMap.objects) {
              const asset = availableObjects.find(a => a.id === obj.objectId);
              if (asset?.type !== 'person') continue;

              const objCenterX = obj.x + obj.width / 2;
              const objCenterY = obj.y + obj.height / 2;
              const distance = Math.sqrt(
                  Math.pow(characterCenterX - objCenterX, 2) +
                  Math.pow(characterCenterY - objCenterY, 2)
              );
              const interactionZone = INTERACTION_RADIUS + Math.min(obj.width, obj.height) / 2;

              if (distance < interactionZone) {
                  newInteractables.push(obj.id);
              }
          }
          setInteractableNpcs(newInteractables);
      }


      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTransitioning, isInDialogue, isRoom, activeRoomId, worldMap, activeMap, availableObjects, rooms]);

  const activeClipName = characterState === 'idle' ? `idle_${characterDirection}` : characterState;
  const activeClip = clips?.find(c => c.name === activeClipName);

  useEffect(() => {
    let frameId: number;
    if (!activeClip || activeClip.frames.length === 0) return;

    const animate = () => {
      setCurrentFrameIndex(prevIndex => (prevIndex + 1) % activeClip.frames.length);
      frameId = window.setTimeout(animate, 1000 / (activeClip.fps || ANIMATION_FPS));
    };

    frameId = window.setTimeout(animate, 1000 / (activeClip.fps || ANIMATION_FPS));
    return () => clearTimeout(frameId);
  }, [activeClip]);

  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [activeClipName]);
  
  const safeFrameIndex = activeClip ? Math.min(currentFrameIndex, activeClip.frames.length - 1) : 0;

  const GameView = () => {
    const firstLoad = loading && !worldMap && !rooms;
    if (firstLoad) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <p>データを読み込み中...</p>
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

          {activeMapData.objects.map(obj => {
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
                  zIndex: Math.floor(obj.y / 10) + 1,
                }}
              >
                <Image
                  src={asset.imageUrl}
                  alt={asset.name}
                  layout="fill"
                  objectFit="contain"
                  unoptimized
                />
                 {interactableNpcs.includes(obj.id) && (
                   <div 
                      className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce"
                      style={{ zIndex: 9999 }}
                    >
                      <MessageSquare className="w-6 h-6 text-white bg-blue-500 rounded-full p-1" />
                   </div>
                 )}
              </div>
            );
          })}

          <div
            style={{
              position: 'absolute',
              left: `${(characterPosition.x / MAP_WIDTH) * 100}%`,
              top: `${(characterPosition.y / MAP_HEIGHT) * 100}%`,
              width: `${CHARACTER_WIDTH}px`,
              height: `${CHARACTER_HEIGHT}px`,
              zIndex: Math.floor(characterPosition.y / 10) + 2,
              imageRendering: 'pixelated',
            }}
          >
            {activeClip && activeClip.frames.length > 0 && (
                <Image
                  key={activeClip.frames[safeFrameIndex].id}
                  src={`/characters/player/frames/${activeClip.frames[safeFrameIndex].image}`}
                  alt="Player Character"
                  width={CHARACTER_WIDTH}
                  height={CHARACTER_HEIGHT}
                  objectFit="contain"
                  unoptimized
                  priority
                  className="absolute inset-0"
                />
              )}
          </div>
          
          {destinationRef.current && (
             <div
                className="absolute z-20 w-4 h-4 bg-red-500 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${(destinationRef.current.x + CHARACTER_WIDTH / 2) / MAP_WIDTH * 100}%`,
                  top: `${(destinationRef.current.y + CHARACTER_HEIGHT / 2) / MAP_HEIGHT * 100}%`,
                }}
             />
          )}

          {isInDialogue && (
            <DialogueBox
              conversation={activeDialogue}
              onComplete={() => setActiveDialogue(null)}
            />
          )}
          <InventoryBar items={inventory} />
        </div>
      </div>
    );
  };

  const handleMapSelectionChange = (mapId: string) => {
    loadData(mapId);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-end gap-4">
        <div>
          <Label htmlFor="world-map-select">マップ</Label>
          <Select
            value={selectedMapId}
            onValueChange={handleMapSelectionChange}
            disabled={isInDialogue}
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
              disabled={isInDialogue}
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
        <GameView />
      </div>
    </div>
  );
}
