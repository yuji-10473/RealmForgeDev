"use client";

import { useState, useRef, MouseEvent } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, Hand } from "lucide-react";

// The canonical size of the map editor view.
const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;

type MapObject = {
  id: string;
  tileId: string;
  x: number; // 0-1920
  y: number; // 0-1080
  width: number;
  height: number;
};

type MapCell = {
  backgroundId: string;
  objects: MapObject[];
};

type WorldMap = MapCell[][];

const TILE_ASSETS = [
  { id: "tree", name: "木", image: PlaceHolderImages.find(p => p.id === 'tree-asset')?.imageUrl, width: 64, height: 64 },
  { id: "chest", name: "宝箱", image: PlaceHolderImages.find(p => p.id === 'chest-asset')?.imageUrl, width: 48, height: 48 },
];

const createInitialWorldMap = (): WorldMap => {
  return Array(4).fill(null).map((_, r) =>
    Array(4).fill(null).map((_, c) => ({
      backgroundId: `map-bg-${r}-${c}`,
      objects: [],
    }))
  );
};

export function MapEditorClient() {
  const [worldMap, setWorldMap] = useState<WorldMap>(createInitialWorldMap);
  const [activeMap, setActiveMap] = useState({ r: 0, c: 0 });
  const [selectedAsset, setSelectedAsset] = useState<typeof TILE_ASSETS[0] | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  
  const activeMapData = worldMap[activeMap.r][activeMap.c];
  const bgImage = PlaceHolderImages.find(p => p.id === activeMapData.backgroundId);

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!selectedAsset || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    // Calculate click position relative to the editor element.
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Scale the coordinates to the canonical map size (1920x1080).
    const scaledX = (x / rect.width) * MAP_WIDTH;
    const scaledY = (y / rect.height) * MAP_HEIGHT;

    const newObject: MapObject = {
      id: `${Date.now()}`,
      tileId: selectedAsset.id,
      x: scaledX - selectedAsset.width / 2,
      y: scaledY - selectedAsset.height / 2,
      width: selectedAsset.width,
      height: selectedAsset.height,
    };
    
    const newWorldMap = [...worldMap];
    newWorldMap[activeMap.r][activeMap.c].objects.push(newObject);
    setWorldMap(newWorldMap);
  };


  return (
    <div className="flex gap-8 h-full">
      {/* World Map Navigator */}
      <aside className="w-64 flex-shrink-0">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>ワールドマップ</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center">
            <div className="grid grid-cols-4 gap-1 aspect-square w-full">
              {worldMap.map((row, r) =>
                row.map((_, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => setActiveMap({ r, c })}
                    className={cn(
                      "aspect-square border-2 flex items-center justify-center text-xs",
                      activeMap.r === r && activeMap.c === c
                        ? "border-primary bg-primary/20"
                        : "border-border hover:bg-accent/50"
                    )}
                  >
                   {r+1}-{c+1}
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Main Editor */}
      <div className="flex-grow flex flex-col gap-4">
        <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
                マップ: {activeMap.r + 1}-{activeMap.c + 1}
            </h2>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="icon"><ZoomIn /></Button>
                <Button variant="outline" size="icon"><ZoomOut /></Button>
                <Button variant="outline" size="icon"><Hand /></Button>
            </div>
        </div>
        <div
            ref={editorRef}
            onClick={handleMapClick}
            className="relative w-full aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed border-border cursor-crosshair"
        >
            {bgImage?.imageUrl && (
            <Image
                src={bgImage.imageUrl}
                alt={`Map background ${activeMap.r + 1}-${activeMap.c + 1}`}
                layout="fill"
                objectFit="cover"
            />
            )}
            {activeMapData.objects.map(obj => {
                const asset = TILE_ASSETS.find(a => a.id === obj.tileId);
                if (!asset || !asset.image) return null;
                // Scale object positions from canonical (1920x1080) to percentage for responsive rendering.
                const leftPercent = (obj.x / MAP_WIDTH) * 100;
                const topPercent = (obj.y / MAP_HEIGHT) * 100;
                // Scale object size based on the canonical width.
                const widthPercent = (obj.width / MAP_WIDTH) * 100;
                
                return (
                    <div key={obj.id} style={{ 
                        left: `${leftPercent}%`, 
                        top: `${topPercent}%`, 
                        width: `${widthPercent}%`, 
                        height: 'auto', // Let aspect-ratio handle height
                        aspectRatio: `${obj.width} / ${obj.height}`,
                        position: 'absolute' 
                    }}>
                        <Image src={asset.image} alt={asset.name} layout="fill" objectFit="contain" />
                    </div>
                )
            })}
        </div>
      </div>

      {/* Asset Palette */}
      <aside className="w-72 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle>オブジェクト</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {TILE_ASSETS.map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer border-2 transition-all",
                  selectedAsset?.id === asset.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-accent hover:bg-accent/10"
                )}
              >
                <div className={cn("w-16 h-16 rounded-md flex items-center justify-center relative bg-muted/50")}>
                  {asset.image && <Image src={asset.image} alt={asset.name} width={asset.width} height={asset.height} className="object-contain" />}
                </div>
                <span className="text-sm text-center font-medium">{asset.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
