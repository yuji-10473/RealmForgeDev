
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;
const CHARACTER_SPEED = 20;
const CHARACTER_WIDTH = 64;
const CHARACTER_HEIGHT = 64;
const ANIMATION_FPS = 8;

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

type MapCell = {
  id: string;
  name: string;
  imageUrl: string;
};

type WorldMap = MapCell[][];

type CharacterState = "idle" | "walk_up" | "walk_down" | "walk_left" | "walk_right";
type CharacterDirection = "up" | "down" | "left" | "right";

export function PlayTestClient() {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [clips, setClips] = useState<AnimationClip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState({ r: 0, c: 0 });
  const [characterPosition, setCharacterPosition] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [characterState, setCharacterState] = useState<CharacterState>("idle");
  const [characterDirection, setCharacterDirection] = useState<CharacterDirection>("down");
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [mapResponse, animResponse] = await Promise.all([
          fetch('/maps/maps.json'),
          fetch('/characters/player/animations.json')
        ]);

        if (!mapResponse.ok) {
          throw new Error(`マップファイルの読み込みに失敗しました: ${mapResponse.statusText}`);
        }
        if (!animResponse.ok) {
          throw new Error(`アニメーションファイルの読み込みに失敗しました: ${animResponse.statusText}`);
        }

        const mapData = await mapResponse.json();
        const animData = await animResponse.json();
        
        const newWorldMap: WorldMap = Array(4).fill(null).map(() => Array(4).fill(null));
        mapData.maps.forEach((mapCell: MapCell, index: number) => {
          const r = Math.floor(index / 4);
          const c = index % 4;
          newWorldMap[r][c] = mapCell;
        });

        setWorldMap(newWorldMap);
        setClips(animData.clips);
      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!worldMap || isTransitioning) return;
    
    let newPos = { ...characterPosition };
    let newActiveMap = { ...activeMap };
    let didTransition = false;
    let newDirection = characterDirection;
    let newState: CharacterState = "idle";

    switch (event.key) {
      case "ArrowUp":
        newPos.y -= CHARACTER_SPEED;
        newDirection = "up";
        newState = "walk_up";
        break;
      case "ArrowDown":
        newPos.y += CHARACTER_SPEED;
        newDirection = "down";
        newState = "walk_down";
        break;
      case "ArrowLeft":
        newPos.x -= CHARACTER_SPEED;
        newDirection = "left";
        newState = "walk_left";
        break;
      case "ArrowRight":
        newPos.x += CHARACTER_SPEED;
        newDirection = "right";
        newState = "walk_right";
        break;
      default:
        return; 
    }

    setCharacterDirection(newDirection);
    setCharacterState(newState);

    if (newPos.x < 0) {
      if (activeMap.c > 0) {
        newActiveMap.c--;
        newPos.x = MAP_WIDTH - CHARACTER_WIDTH;
        didTransition = true;
      }
    } else if (newPos.x > MAP_WIDTH - CHARACTER_WIDTH) {
      if (activeMap.c < worldMap[0].length - 1) {
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
      if (activeMap.r < worldMap.length - 1) {
        newActiveMap.r++;
        newPos.y = 0;
        didTransition = true;
      }
    }

    if (didTransition) {
      setIsTransitioning(true);
      setActiveMap(newActiveMap);
    } else {
      newPos.x = Math.max(0, Math.min(newPos.x, MAP_WIDTH - CHARACTER_WIDTH));
      newPos.y = Math.max(0, Math.min(newPos.y, MAP_HEIGHT - CHARACTER_HEIGHT));
    }

    setCharacterPosition(newPos);

  }, [activeMap, characterPosition, characterDirection, worldMap, isTransitioning]);
  
  const handleKeyUp = useCallback(() => {
    setCharacterState("idle");
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);
  
  const activeClipName = characterState === "idle" ? `idle_${characterDirection}` : characterState;
  const activeClip = clips?.find(c => c.name === activeClipName);

  useEffect(() => {
    let animationInterval: NodeJS.Timeout;
    if (activeClip && activeClip.frames.length > 0) {
      animationInterval = setInterval(() => {
        setCurrentFrameIndex(
          (prevIndex) => (prevIndex + 1) % activeClip.frames.length
        );
      }, 1000 / (activeClip.fps || ANIMATION_FPS));
    } else if (characterState !== "idle") { // Fallback if walk clip is missing
       const idleClip = clips?.find(c => c.name === `idle_${characterDirection}`)
       if(idleClip && idleClip.frames.length > 0) {
          setCurrentFrameIndex(0);
       }
    }
    return () => clearInterval(animationInterval);
  }, [activeClip, characterState, characterDirection, clips]);
  
  useEffect(() => {
    setCurrentFrameIndex(0);
  }, [characterState, characterDirection])


  const handleImageLoad = () => {
    setIsTransitioning(false);
  };
  
  const currentFrame = activeClip?.frames[currentFrameIndex];
  const characterImageUrl = currentFrame ? `/characters/player/frames/${currentFrame.image}` : `/characters/player/frames/idle_down_1.png`; // Fallback image


  if (loading) {
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

  if (!worldMap || !clips) {
     return <p>マップまたはキャラクターデータが見つかりません。</p>
  }
  
  const activeMapData = worldMap[activeMap.r][activeMap.c];

  return (
    <div className="flex justify-center items-center h-full">
      <div
        className="relative aspect-[16/9] w-full max-w-full h-auto max-h-full bg-muted overflow-hidden border-2 border-border"
      >
        {isTransitioning && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
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
            onLoad={handleImageLoad}
            priority
          />
        )}
        
          <div style={{
            position: 'absolute',
            left: `${(characterPosition.x / MAP_WIDTH) * 100}%`,
            top: `${(characterPosition.y / MAP_HEIGHT) * 100}%`,
            width: `${CHARACTER_WIDTH}px`,
            height: `${CHARACTER_HEIGHT}px`,
            transition: isTransitioning ? 'none' : 'left 0.05s linear, top 0.05s linear',
            zIndex: 10,
            imageRendering: 'pixelated',
          }}>
            <Image
              key={characterImageUrl}
              src={characterImageUrl}
              alt="Player Character"
              width={CHARACTER_WIDTH}
              height={CHARACTER_HEIGHT}
              objectFit="contain"
              unoptimized
            />
          </div>
      </div>
    </div>
  );
}

    