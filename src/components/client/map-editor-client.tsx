
"use client";

import { useState, useRef, MouseEvent, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ZoomIn, ZoomOut, Hand, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


// The canonical size of the map editor view.
const MAP_WIDTH = 1920;
const MAP_HEIGHT = 1080;

type PlacedObject = {
  id: string;
  tileId: string;
  x: number; // 0-1920
  y: number; // 0-1080
  width: number;
  height: number;
};

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

type MapCell = {
  id: string;
  name: string;
  imageUrl: string;
  objects: PlacedObject[];
};

type WorldMap = MapCell[][];

const worldMapOptions = [
  { id: 'maps', name: 'ワールドマップ 1' },
  { id: 'maps2', name: 'ワールドマップ 2' },
];

export function MapEditorClient() {
  const [selectedWorldMapId, setSelectedWorldMapId] = useState<string>(worldMapOptions[0].id);
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState({ r: 0, c: 0 });
  const [selectedAsset, setSelectedAsset] = useState<AvailableObject | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        setError(null);
        setWorldMap(null);
        setActiveMap({ r: 0, c: 0 });

        const response = await fetch(`/maps/${selectedWorldMapId}.json`);
        if (!response.ok) {
          if(response.status === 404) {
            throw new Error(`マップファイルが見つかりません: ${selectedWorldMapId}.json`);
          }
          throw new Error(`マップファイルの読み込みに失敗しました: ${response.statusText}`);
        }
        const data = await response.json();
        
        const rows = data.rows || 1;
        const cols = data.cols || data.maps.length;

        const newWorldMap: WorldMap = Array(rows).fill(null).map(() => Array(cols).fill(null));
        data.maps.forEach((mapData: MapCell, index: number) => {
          const r = Math.floor(index / cols);
          const c = index % cols;
          newWorldMap[r][c] = mapData;
        });

        setAvailableObjects(data.objects);
        setWorldMap(newWorldMap);
      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    loadMapData();
  }, [selectedWorldMapId]);
  
  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!selectedAsset || !editorRef.current || !worldMap) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaledX = (x / rect.width) * MAP_WIDTH;
    const scaledY = (y / rect.height) * MAP_HEIGHT;

    const newObject: PlacedObject = {
      id: `${Date.now()}`,
      tileId: selectedAsset.id,
      x: scaledX - selectedAsset.width / 2,
      y: scaledY - selectedAsset.height / 2,
      width: selectedAsset.width,
      height: selectedAsset.height,
    };
    
    const newWorldMap = worldMap.map(row => [...row]);
    newWorldMap[activeMap.r][activeMap.c].objects.push(newObject);
    setWorldMap(newWorldMap);
  };
  
  const EditorContent = () => {
    if (loading) {
      return (
        <div className="col-span-full flex items-center justify-center h-full">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <p>マップデータを読み込み中...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="col-span-full">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>読み込みエラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }
  
    if (!worldMap) {
       return <div className="col-span-full flex items-center justify-center h-full"><p>マップデータが見つかりません。</p></div>
    }

    const activeMapData = worldMap[activeMap.r][activeMap.c];
    const gridCols = worldMap[0].length;

    return (
      <>
        <aside className="w-64 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>ワールドマップ</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center">
              <div 
                className="grid gap-1 aspect-square w-full"
                style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
              >
                {worldMap.map((row, r) =>
                  row.map((cell, c) => (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => setActiveMap({ r, c })}
                      className={cn(
                        "aspect-square border-2 flex items-center justify-center text-xs p-1 text-center",
                        activeMap.r === r && activeMap.c === c
                          ? "border-primary bg-primary/20"
                          : "border-border hover:bg-accent/50"
                      )}
                      title={cell.name}
                    >
                     <span className="truncate">{cell.name}</span>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="flex-grow flex flex-col gap-4">
          <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">
                  マップ: {activeMapData.name}
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
              {activeMapData.imageUrl && (
              <Image
                  src={activeMapData.imageUrl}
                  alt={`Map background ${activeMapData.name}`}
                  layout="fill"
                  objectFit="cover"
                  unoptimized
              />
              )}
              {activeMapData.objects.map(obj => {
                  const asset = availableObjects.find(a => a.id === obj.tileId);
                  if (!asset || !asset.imageUrl) return null;
                  
                  const leftPercent = (obj.x / MAP_WIDTH) * 100;
                  const topPercent = (obj.y / MAP_HEIGHT) * 100;
                  const widthPercent = (obj.width / MAP_WIDTH) * 100;
                  
                  return (
                      <div key={obj.id} style={{ 
                          left: `${leftPercent}%`, 
                          top: `${topPercent}%`, 
                          width: `${widthPercent}%`, 
                          height: 'auto',
                          aspectRatio: `${obj.width} / ${obj.height}`,
                          position: 'absolute' 
                      }}>
                          <Image src={asset.imageUrl} alt={asset.name} layout="fill" objectFit="contain" unoptimized/>
                      </div>
                  )
              })}
          </div>
        </div>

        <aside className="w-72 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>オブジェクト</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {availableObjects.map((asset) => (
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
                    {asset.imageUrl && <Image src={asset.imageUrl} alt={asset.name} width={asset.width} height={asset.height} className="object-contain" unoptimized />}
                  </div>
                  <span className="text-sm text-center font-medium">{asset.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <Label htmlFor="world-map-select">ワールドマップ</Label>
        <Select value={selectedWorldMapId} onValueChange={setSelectedWorldMapId}>
          <SelectTrigger id="world-map-select" className="w-[280px] mt-2">
            <SelectValue placeholder="編集するマップを選択..." />
          </SelectTrigger>
          <SelectContent>
            {worldMapOptions.map(map => (
              <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-8 flex-grow h-full min-h-0">
        <EditorContent />
      </div>
    </div>
  );
}
