"use client";

import { useState, useRef, MouseEvent, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Download, ZoomIn, ZoomOut, Hand, Loader2, Terminal, Trash2, Play } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [masterWorlds, setMasterWorlds] = useState<WorldData[]>([]);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [activeCellIndex, setActiveCellIndex] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<AvailableObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const fetchData = async (file: string) => {
          const res = await fetch(`/data/${file}.json`);
          return res.ok ? await res.json() : [];
        };

        const [worlds, villagers, items, buildings, events] = await Promise.all([
          fetchData('worlds'),
          fetchData('villagers'),
          fetchData('items'),
          fetchData('buildings'),
          fetchData('eventFlows')
        ]);
        
        setMasterWorlds(worlds);
        setAvailableObjects([...villagers, ...items, ...buildings]);
        setAvailableEvents(events);

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
    if (!selectedAsset || !editorRef.current || !activeMapData) {
      const target = e.target as HTMLElement;
      const objectId = target.closest('[data-object-id]')?.getAttribute('data-object-id');
      if (objectId) {
          const object = activeMapData?.objects.find(o => o.id === objectId);
          if (object) { setSelectedObject(object); setSelectedAsset(null); }
      } else { setSelectedObject(null); }
      return;
    }

    const rect = editorRef.current.getBoundingClientRect();
    const scaledX = ((e.clientX - rect.left) / rect.width) * MAP_WIDTH;
    const scaledY = ((e.clientY - rect.top) / rect.height) * MAP_HEIGHT;

    const newObject: PlacedObject = {
      id: `${Date.now()}`,
      objectId: selectedAsset.id,
      x: scaledX - selectedAsset.width / 2,
      y: scaledY - selectedAsset.height / 2,
      width: selectedAsset.width,
      height: selectedAsset.height,
    };
    
    if (currentWorld) {
      const newWorlds = masterWorlds.map(w => {
        if (w.id === selectedWorldId) {
          const newMaps = [...w.maps];
          newMaps[activeCellIndex] = { ...newMaps[activeCellIndex], objects: [...newMaps[activeCellIndex].objects, newObject] };
          return { ...w, maps: newMaps };
        }
        return w;
      });
      setMasterWorlds(newWorlds);
      setSelectedObject(newObject);
      setSelectedAsset(null);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin mr-2" /> 読込中...</div>;
  if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>エラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="flex gap-4 h-full">
      <aside className="w-64 flex flex-col gap-4">
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
          <Card className="flex-grow">
            <CardHeader><CardTitle className="text-sm">区画</CardTitle></CardHeader>
            <CardContent className="grid gap-1" style={{ gridTemplateColumns: `repeat(${currentWorld.cols}, 1fr)` }}>
              {currentWorld.maps.map((m, i) => (
                <button key={m.id} onClick={() => setActiveCellIndex(i)} className={cn("aspect-square border text-[10px] truncate p-1", activeCellIndex === i ? "bg-primary text-white" : "hover:bg-muted")}>
                  {m.name}
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </aside>

      <div className="flex-grow flex flex-col gap-4">
        <div ref={editorRef} onClick={handleMapClick} className="relative aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed">
          {activeMapData && (
            <>
              <Image src={activeMapData.imageUrl} alt="" layout="fill" objectFit="cover" unoptimized />
              {activeMapData.objects.map(obj => {
                const asset = availableObjects.find(a => a.id === obj.objectId);
                if (!asset) return null;
                return (
                  <div key={obj.id} data-object-id={obj.id} style={{ left: `${(obj.x / MAP_WIDTH) * 100}%`, top: `${(obj.y / MAP_HEIGHT) * 100}%`, width: `${(obj.width / MAP_WIDTH) * 100}%`, position: 'absolute', cursor: 'pointer' }}>
                    <Image src={asset.imageUrl} alt="" layout="responsive" width={asset.width} height={asset.height} unoptimized className={cn(selectedObject?.id === obj.id && "ring-2 ring-primary")} />
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <aside className="w-72">
        <Card className="h-full">
          <CardHeader><CardTitle className="text-sm">アセット</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {availableObjects.map(asset => (
                <button key={asset.id} onClick={() => setSelectedAsset(asset)} className={cn("p-1 border rounded hover:bg-muted", selectedAsset?.id === asset.id && "border-primary")}>
                  <Image src={asset.imageUrl} alt="" width={48} height={48} unoptimized className="mx-auto" />
                  <p className="text-[10px] truncate">{asset.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
