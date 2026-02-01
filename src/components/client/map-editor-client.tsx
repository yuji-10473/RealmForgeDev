
"use client";

import { useState, useRef, MouseEvent, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Download, ZoomIn, ZoomOut, Hand, Loader2, Terminal, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";


// The canonical size of the map editor view.
const MAP_WIDTH = 2752;
const MAP_HEIGHT = 1536;

type PlacedObject = {
  id: string;
  objectId: string;
  x: number; // 0-1920
  y: number; // 0-1080
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

type WorldMap = MapCell[][];

type WorldMapOption = {
  id: string;
  name: string;
};

export function MapEditorClient() {
  const [worldMapOptions, setWorldMapOptions] = useState<WorldMapOption[]>([]);
  const [selectedWorldMapId, setSelectedWorldMapId] = useState<string>('');
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMap, setActiveMap] = useState({ r: 0, c: 0 });
  const [selectedAsset, setSelectedAsset] = useState<AvailableObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [worldsResponse, objectsResponse] = await Promise.all([
          fetch(`/maps/worlds.json`),
          fetch('/objects.json')
        ]);
        
        if (!worldsResponse.ok) throw new Error(`ワールドマップリスト(worlds.json)の読み込みに失敗しました。`);
        if (!objectsResponse.ok) throw new Error(`オブジェクトファイルの読み込みに失敗しました。`);

        const worldsData = await worldsResponse.json();
        const objectsData = await objectsResponse.json();
        
        const filteredWorlds = worldsData.worlds.filter((w: WorldMapOption) => w.id !== 'rooms');

        setAvailableObjects(objectsData.objects);
        setWorldMapOptions(filteredWorlds);

        if (filteredWorlds.length > 0) {
          setSelectedWorldMapId(filteredWorlds[0].id);
        } else {
           setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedWorldMapId) return;

    const loadMapData = async () => {
      setLoading(true);
      try {
        setError(null);
        setWorldMap(null);
        setActiveMap({ r: 0, c: 0 });
        setSelectedObject(null);

        const mapResponse = await fetch(`/maps/${selectedWorldMapId}.json`);
        
        if (!mapResponse.ok) {
          if(mapResponse.status === 404) {
            throw new Error(`マップファイルが見つかりません: ${selectedWorldMapId}.json`);
          }
          throw new Error(`マップファイルの読み込みに失敗しました: ${mapResponse.statusText}`);
        }

        const mapData = await mapResponse.json();
        
        const rows = mapData.rows || 1;
        const cols = mapData.cols || mapData.maps.length;

        const newWorldMap: WorldMap = Array(rows).fill(null).map(() => Array(cols).fill(null));
        mapData.maps.forEach((mapData: MapCell, index: number) => {
          const r = Math.floor(index / cols);
          const c = index % cols;
          if (newWorldMap[r]) {
            newWorldMap[r][c] = mapData;
          }
        });

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
    if (!selectedAsset || !editorRef.current || !worldMap) {
      // If we clicked on an existing object, select it.
      const target = e.target as HTMLElement;
      const objectId = target.closest('[data-object-id]')?.getAttribute('data-object-id');
      if (objectId) {
          const object = worldMap[activeMap.r][activeMap.c].objects.find(o => o.id === objectId);
          if (object) {
              setSelectedObject(object);
              setSelectedAsset(null);
          }
      } else {
        setSelectedObject(null);
      }
      return;
    }

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaledX = (x / rect.width) * MAP_WIDTH;
    const scaledY = (y / rect.height) * MAP_HEIGHT;

    const newObject: PlacedObject = {
      id: `${Date.now()}`,
      objectId: selectedAsset.id,
      x: scaledX - selectedAsset.width / 2,
      y: scaledY - selectedAsset.height / 2,
      width: selectedAsset.width,
      height: selectedAsset.height,
      conversation: selectedAsset.conversation,
    };
    
    const newWorldMap = worldMap.map(row => [...row].map(cell => ({...cell, objects: [...cell.objects]})));
    newWorldMap[activeMap.r][activeMap.c].objects.push(newObject);
    setWorldMap(newWorldMap);
    setSelectedObject(newObject);
    setSelectedAsset(null);
  };
  
  const handleObjectUpdate = (updatedObject: PlacedObject) => {
    if (!worldMap) return;
    const newWorldMap = worldMap.map(row => [...row].map(cell => ({...cell, objects: cell.objects.map(o => o.id === updatedObject.id ? updatedObject : o)})));
    setWorldMap(newWorldMap);
    setSelectedObject(updatedObject);
  }

  const handleObjectDelete = () => {
    if (!worldMap || !selectedObject) return;
    const newWorldMap = worldMap.map(row => [...row].map(cell => ({...cell, objects: cell.objects.filter(o => o.id !== selectedObject.id)})));
    setWorldMap(newWorldMap);
    setSelectedObject(null);
  }
  
  const handleExport = () => {
    if (!worldMap) {
      alert("エクスポートするマップデータがありません。");
      return;
    }

    const rows = worldMap.length;
    const cols = worldMap[0]?.length || 0;
    const maps = worldMap.flat();

    const exportData = {
      rows: rows,
      cols: cols,
      maps: maps,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedWorldMapId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const Inspector = () => {
    if (selectedObject) {
      const asset = availableObjects.find(a => a.id === selectedObject.objectId);
      const objectType = asset?.type;

      return (
        <Card>
          <CardHeader>
            <CardTitle>インスペクター: {asset?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>座標</Label>
              <div className="flex gap-2">
                <Input type="number" value={Math.round(selectedObject.x)} onChange={e => handleObjectUpdate({...selectedObject, x: parseInt(e.target.value)})} prefix="X" />
                <Input type="number" value={Math.round(selectedObject.y)} onChange={e => handleObjectUpdate({...selectedObject, y: parseInt(e.target.value)})} prefix="Y" />
              </div>
            </div>

            {objectType === 'person' && (
              <div className="space-y-2">
                <Label htmlFor="conversation">会話</Label>
                <Textarea 
                  id="conversation"
                  placeholder="キャラクターの会話を入力..."
                  value={selectedObject.conversation || ''}
                  onChange={(e) => handleObjectUpdate({...selectedObject, conversation: e.target.value})}
                  rows={5}
                />
              </div>
            )}
            
            {objectType === 'door' && (
              <Card className="bg-muted/50 p-4 space-y-2">
                  <CardDescription>トランジション</CardDescription>
                  <div>
                      <Label htmlFor="target-map">ターゲットマップID</Label>
                      <Input id="target-map" placeholder="例: room_1, maps2" value={selectedObject.transition?.targetMapId || ''} onChange={e => handleObjectUpdate({...selectedObject, transition: {...(selectedObject.transition || {targetMapId: '', targetX: 0, targetY: 0}), targetMapId: e.target.value}})} />
                  </div>
                  <div>
                      <Label>ターゲット座標</Label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="X" value={selectedObject.transition?.targetX || ''} onChange={e => handleObjectUpdate({...selectedObject, transition: {...(selectedObject.transition || {targetMapId: '', targetX: 0, targetY: 0}), targetX: parseInt(e.target.value) || 0}})} />
                        <Input type="number" placeholder="Y" value={selectedObject.transition?.targetY || ''} onChange={e => handleObjectUpdate({...selectedObject, transition: {...(selectedObject.transition || {targetMapId: '', targetX: 0, targetY: 0}), targetY: parseInt(e.target.value) || 0}})} />
                      </div>
                  </div>
              </Card>
            )}

            <Button variant="destructive" onClick={handleObjectDelete} className="w-full">
              <Trash2 className="mr-2" />
              オブジェクトを削除
            </Button>
          </CardContent>
        </Card>
      )
    }
    return (
       <Card>
        <CardHeader>
          <CardTitle>オブジェクト</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {availableObjects.map((asset) => (
            <div
              key={asset.id}
              onClick={() => { setSelectedAsset(asset); setSelectedObject(null); }}
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
    )
  }

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
                      onClick={() => { setActiveMap({ r, c }); setSelectedObject(null); }}
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
              className={cn("relative w-full aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed border-border", selectedAsset ? "cursor-crosshair" : "cursor-default")}
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
                  const asset = availableObjects.find(a => a.id === obj.objectId);
                  if (!asset || !asset.imageUrl) return null;
                  
                  const leftPercent = (obj.x / MAP_WIDTH) * 100;
                  const topPercent = (obj.y / MAP_HEIGHT) * 100;
                  const widthPercent = (obj.width / MAP_WIDTH) * 100;
                  
                  return (
                      <div key={obj.id} 
                           data-object-id={obj.id}
                           style={{ 
                              left: `${leftPercent}%`, 
                              top: `${topPercent}%`, 
                              width: `${widthPercent}%`, 
                              height: 'auto',
                              aspectRatio: `${obj.width} / ${obj.height}`,
                              position: 'absolute',
                              cursor: 'pointer',
                          }}>
                          <Image src={asset.imageUrl} alt={asset.name} layout="fill" objectFit="contain" unoptimized className={cn("pointer-events-none", selectedObject?.id === obj.id && "ring-2 ring-primary ring-offset-2 ring-offset-background")}/>
                      </div>
                  )
              })}
          </div>
        </div>

        <aside className="w-72 flex-shrink-0">
          <Inspector />
        </aside>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-4">
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
        <Button variant="outline" onClick={handleExport} className="self-end">
          <Download className="mr-2" />
          JSONをエクスポート
        </Button>
      </div>
      <div className="flex gap-8 flex-grow h-full min-h-0">
        <EditorContent />
      </div>
    </div>
  );
}
