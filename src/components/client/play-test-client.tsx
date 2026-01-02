"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

// The canonical size of the map editor view.
const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;
const CHARACTER_SPEED = 20;
const CHARACTER_WIDTH = 64;
const CHARACTER_HEIGHT = 64;

type MapCell = {
  id: string;
  name: string;
  imageUrl: string;
};

type WorldMap = MapCell[][];

export function PlayTestClient() {
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState({ r: 0, c: 0 });
  const [characterPosition, setCharacterPosition] = useState({ x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 });

  const playerSprite = PlaceHolderImages.find(p => p.id === 'hero-sprite-1');

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/maps/maps.json');
        if (!response.ok) {
          throw new Error(`マップファイルの読み込みに失敗しました: ${response.statusText}`);
        }
        const data = await response.json();
        
        const newWorldMap: WorldMap = Array(4).fill(null).map(() => Array(4).fill(null));
        data.maps.forEach((mapData: MapCell, index: number) => {
          const r = Math.floor(index / 4);
          const c = index % 4;
          newWorldMap[r][c] = mapData;
        });

        setWorldMap(newWorldMap);
      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    loadMapData();
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!worldMap) return;

    let newPos = { ...characterPosition };
    let newActiveMap = { ...activeMap };

    switch (event.key) {
      case "ArrowUp":
        newPos.y -= CHARACTER_SPEED;
        break;
      case "ArrowDown":
        newPos.y += CHARACTER_SPEED;
        break;
      case "ArrowLeft":
        newPos.x -= CHARACTER_SPEED;
        break;
      case "ArrowRight":
        newPos.x += CHARACTER_SPEED;
        break;
      default:
        return; 
    }

    // Map transitions
    if (newPos.x + CHARACTER_WIDTH < 0) { // Move left
      if (activeMap.c > 0) {
        newActiveMap.c--;
        newPos.x = MAP_WIDTH - CHARACTER_WIDTH;
      } else {
        newPos.x = 0;
      }
    } else if (newPos.x > MAP_WIDTH) { // Move right
      if (activeMap.c < worldMap[0].length - 1) {
        newActiveMap.c++;
        newPos.x = 0;
      } else {
        newPos.x = MAP_WIDTH - CHARACTER_WIDTH;
      }
    }

    if (newPos.y + CHARACTER_HEIGHT < 0) { // Move up
      if (activeMap.r > 0) {
        newActiveMap.r--;
        newPos.y = MAP_HEIGHT - CHARACTER_HEIGHT;
      } else {
        newPos.y = 0;
      }
    } else if (newPos.y > MAP_HEIGHT) { // Move down
      if (activeMap.r < worldMap.length - 1) {
        newActiveMap.r++;
        newPos.y = 0;
      } else {
        newPos.y = MAP_HEIGHT - CHARACTER_HEIGHT;
      }
    }

    // Clamp position within current map boundaries if not transitioning
    newPos.x = Math.max(0, Math.min(newPos.x, MAP_WIDTH - CHARACTER_WIDTH));
    newPos.y = Math.max(0, Math.min(newPos.y, MAP_HEIGHT - CHARACTER_HEIGHT));

    setCharacterPosition(newPos);
    setActiveMap(newActiveMap);

  }, [activeMap, characterPosition, worldMap]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        <p>マップデータを読み込み中...</p>
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

  if (!worldMap) {
     return <p>マップデータが見つかりません。</p>
  }
  
  const activeMapData = worldMap[activeMap.r][activeMap.c];

  return (
    <div className="flex justify-center items-center h-full">
      <div
        className="relative aspect-[16/9] w-full max-w-full h-auto max-h-full bg-muted overflow-hidden border-2 border-border"
      >
        {activeMapData.imageUrl && (
          <Image
            src={activeMapData.imageUrl}
            alt={`Map background ${activeMapData.name}`}
            layout="fill"
            objectFit="cover"
            unoptimized
          />
        )}
        {playerSprite && (
          <div style={{
            position: 'absolute',
            left: `${(characterPosition.x / MAP_WIDTH) * 100}%`,
            top: `${(characterPosition.y / MAP_HEIGHT) * 100}%`,
            width: `${CHARACTER_WIDTH}px`,
            height: `${CHARACTER_HEIGHT}px`,
            transition: 'left 0.1s linear, top 0.1s linear',
          }}>
            <Image
              src={playerSprite.imageUrl}
              alt="Player Character"
              data-ai-hint={playerSprite.imageHint}
              width={CHARACTER_WIDTH}
              height={CHARACTER_HEIGHT}
              objectFit="contain"
              unoptimized
            />
          </div>
        )}
      </div>
    </div>
  );
}
