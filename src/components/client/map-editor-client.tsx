
"use client";

import { useState, useRef, MouseEvent, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Download, Loader2, Terminal, Trash2, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { useToast } from "@/hooks/use-toast";

const MAP_WIDTH = 2752;
const MAP_HEIGHT = 1536;

type PlacedObject = {
  id: string;
  objectId: string;
  x: number; y: number; width: number; height: number;
  conversation?: string;
  audioPath?: string;
  eventId?: string;
};

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  type?: 'person' | 'door' | 'item';
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
  rows: number;
  cols: number;
  maps: MapCell[];
};

export function MapEditorClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [masterWorlds, setMasterWorlds] = useState<WorldData[]>([]);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<AvailableObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // v1.1.1 Path Resolution
  const resolveImagePath = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    if (path.startsWith('media/')) return `/${path}`;
    return `/media/images/${path}`;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const fetchData = async (file: string) => {
          const res = await fetch(`/data/${file}.json`);
          if (!res.ok) return [];
          const data = await res.json();
          return Array.isArray(data) ? data : (data[file] || []);
        };

        // v1.1.1: Fetch from consolidated files
        const [worlds, villagers, items, buildings] = await Promise.all([
          fetchData('worlds'),
          fetchData('villagers'),
          fetchData('items'),
          fetchData('buildings')
        ]);
        
        setMasterWorlds(worlds);
        setAvailableObjects([...villagers, ...items, ...buildings]);

        if (worlds.length > 0) setSelectedWorldId(worlds[0].id);
      } catch (err: any) {
        setError(err.message || 'データ読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const currentWorld = useMemo(() => masterWorlds.find(w => w.id === selectedWorldId), [masterWorlds, selectedWorldId]);
  const activeMapData = currentWorld?.maps[activeCellIndex];

  const handleMapClick = (e: MouseEvent<HTMLDivElement>) => {
    if (loading || !activeMapData) return;

    const target = e.target as HTMLElement;
    const clickedObjectId = target.closest('[data-object-id]')?.getAttribute('data-object-id');

    if (clickedObjectId) {
        const object = activeMapData.objects.find(o => o.id === clickedObjectId);
        if (object) {
            setSelectedObject(object);
            setSelectedAsset(null);
            return;
        }
    }

    if (!selectedAsset || !editorRef.current) {
      setSelectedObject(null);
      return;
    }

    const rect = editorRef.current.getBoundingClientRect();
    const scaledX = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const scaledY = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;

    const newObject: PlacedObject = {
      id: `${Date.now()}`,
      objectId: selectedAsset.id,
      x: scaledX - (selectedAsset.width || 256) / 2,
      y: scaledY - (selectedAsset.height || 256) / 2,
      width: selectedAsset.width || 256,
      height: selectedAsset.height || 256,
    };
    
    setMasterWorlds(prev => prev.map(w => {
      if (w.id === selectedWorldId) {
        const newMaps = [...w.maps];
        newMaps[activeCellIndex] = { ...newMaps[activeCellIndex], objects: [...newMaps[activeCellIndex].objects, newObject] };
        return { ...w, maps: newMaps };
      }
      return w;
    }));
    setSelectedObject(newObject);
    setSelectedAsset(null);
  };

  const handleUpdateObject = (updated: PlacedObject) => {
    setMasterWorlds(prev => prev.map(w => {
      if (w.id === selectedWorldId) {
        const newMaps = [...w.maps];
        newMaps[activeCellIndex] = {
          ...newMaps[activeCellIndex],
          objects: newMaps[activeCellIndex].objects.map(o => o.id === updated.id ? updated : o)
        };
        return { ...w, maps: newMaps };
      }
      return w;
    }));
    setSelectedObject(updated);
  };

  const handleDeleteObject = () => {
    if (!selectedObject) return;
    setMasterWorlds(prev => prev.map(w => {
      if (w.id === selectedWorldId) {
        const newMaps = [...w.maps];
        newMaps[activeCellIndex] = {
          ...newMaps[activeCellIndex],
          objects: newMaps[activeCellIndex].objects.filter(o => o.id !== selectedObject.id)
        };
        return { ...w, maps: newMaps };
      }
      return w;
    }));
    setSelectedObject(null);
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin mr-2" /> 読込中...</div>;
  if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>エラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="flex gap-4 h-full">
      <aside className="w-64 flex-shrink-0 flex flex-col gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">ワールド選択</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedWorldId} onValueChange={setSelectedWorldId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{masterWorlds.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>
        {currentWorld && (
          <Card className="flex-grow overflow-hidden flex flex-col">
            <CardHeader><CardTitle className="text-sm">区画</CardTitle></CardHeader>
            <CardContent className="flex-grow overflow-auto p-2">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${currentWorld.cols}, 1fr)` }}>
                {currentWorld.maps.map((m, i) => (
                  <button key={m.id} onClick={() => { setActiveCellIndex(i); setSelectedObject(null); }} className={cn("aspect-square border text-[10px] truncate p-1 transition-colors", activeCellIndex === i ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted")}>
                    {m.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </aside>

      <div className="flex-grow flex flex-col gap-4 min-w-0">
        <div ref={editorRef} onClick={handleMapClick} className={cn("relative aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed rounded-lg shadow-inner", selectedAsset ? "cursor-crosshair" : "cursor-default")}>
          {activeMapData ? (
            <>
              <Image src={resolveImagePath(activeMapData.imageUrl)} alt="" layout="fill" objectFit="cover" unoptimized priority />
              {activeMapData.objects.map(obj => {
                const asset = availableObjects.find(a => a.id === obj.objectId);
                if (!asset) return null;
                return (
                  <div key={obj.id} data-object-id={obj.id} style={{ left: `${(obj.x / MAP_WIDTH) * 100}%`, top: `${(obj.y / MAP_HEIGHT) * 100}%`, width: `${(obj.width / MAP_WIDTH) * 100}%`, position: 'absolute', cursor: 'pointer', zIndex: selectedObject?.id === obj.id ? 10 : 1 }}>
                    <Image 
                      src={resolveImagePath(asset.imageUrl)} 
                      alt="" 
                      layout="responsive" 
                      width={asset.width || 256} 
                      height={asset.height || 256} 
                      unoptimized 
                      className={cn("transition-all", selectedObject?.id === obj.id && "ring-4 ring-primary ring-offset-2 ring-offset-background rounded-sm")} 
                    />
                  </div>
                );
              })}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">マップを選択してください</div>
          )}
        </div>
        
        {selectedObject && (
          <Card className="animate-in slide-in-from-bottom-2">
            <CardHeader className="py-3"><CardTitle className="text-sm">オブジェクト設定: {availableObjects.find(a => a.id === selectedObject.objectId)?.name}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-3 gap-4 py-3">
              <div className="space-y-1">
                <Label className="text-xs">座標 (X, Y)</Label>
                <div className="flex gap-2">
                  <Input type="number" value={Math.round(selectedObject.x)} onChange={e => handleUpdateObject({...selectedObject, x: parseInt(e.target.value)})} />
                  <Input type="number" value={Math.round(selectedObject.y)} onChange={e => handleUpdateObject({...selectedObject, y: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">会話</Label>
                <Input value={selectedObject.conversation || ''} onChange={e => handleUpdateObject({...selectedObject, conversation: e.target.value})} placeholder="こんにちは..." />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="destructive" className="flex-1" onClick={handleDeleteObject}><Trash2 className="mr-2 h-4 w-4"/>削除</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
        <Card className="flex-grow overflow-hidden flex flex-col">
          <CardHeader className="pb-2"><CardTitle className="text-sm">アセット</CardTitle></CardHeader>
          <CardContent className="flex-grow overflow-auto p-2">
            <div className="grid grid-cols-3 gap-2">
              {availableObjects.map(asset => (
                <button key={asset.id} onClick={() => { setSelectedAsset(asset); setSelectedObject(null); }} className={cn("p-1 border rounded transition-all hover:bg-muted group", selectedAsset?.id === asset.id ? "border-primary bg-primary/10" : "border-border")}>
                  <div className="relative aspect-square mb-1">
                    <Image src={resolveImagePath(asset.imageUrl)} alt="" layout="fill" objectFit="contain" unoptimized />
                  </div>
                  <p className="text-[9px] truncate text-center">{asset.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Button variant="outline" onClick={() => {
          const blob = new Blob([JSON.stringify(masterWorlds, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = 'worlds.json'; a.click();
          toast({ title: "ダウンロード開始", description: "worlds.json を出力しました。" });
        }}>
          <Download className="mr-2 h-4 w-4"/>ワールド保存
        </Button>
      </aside>
    </div>
  );
}
