
"use client";

import { useState, useRef, MouseEvent, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ZoomIn, ZoomOut, Hand, Loader2, Terminal, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const EDITOR_WIDTH = 1920;
const EDITOR_HEIGHT = 1080;

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
};

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  type?: 'person' | 'door' | 'item';
  conversation?: string;
  audioPath?: string;
};

type Room = {
  id: string;
  name: string;
  imageUrl: string;
  objects: PlacedObject[];
};

type RoomData = {
  rooms: Room[];
};

export function RoomEditorClient() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AvailableObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<PlacedObject | null>(null);


  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        setRooms(null);
        setActiveRoomId(null);
        setSelectedObject(null);

        const [roomsResponse, objectsResponse] = await Promise.all([
          fetch(`/rooms/rooms.json`),
          fetch('/objects.json')
        ]);
        
        if (!roomsResponse.ok) {
          if(roomsResponse.status === 404) {
            throw new Error(`ルームファイルが見つかりません: rooms.json`);
          }
          throw new Error(`ルームファイルの読み込みに失敗しました: ${roomsResponse.statusText}`);
        }
         if (!objectsResponse.ok) {
          throw new Error(`オブジェクトファイルの読み込みに失敗しました: ${objectsResponse.statusText}`);
        }

        const roomData: RoomData = await roomsResponse.json();
        const objectsData = await objectsResponse.json();
        
        setAvailableObjects(objectsData.objects);
        setRooms(roomData.rooms);
        if (roomData.rooms.length > 0) {
          setActiveRoomId(roomData.rooms[0].id);
        }
      } catch (err: any) {
        setError(err.message || '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoomData();
  }, []);
  
  const handleEditorClick = (e: MouseEvent<HTMLDivElement>) => {
    // If we clicked on an existing object, select it.
    const target = e.target as HTMLElement;
    const objectId = target.closest('[data-object-id]')?.getAttribute('data-object-id');
    if (objectId) {
        const object = activeRoom?.objects.find(o => o.id === objectId);
        if (object) {
            setSelectedObject(object);
            setSelectedAsset(null);
        }
        return;
    }

    if (!selectedAsset || !editorRef.current || !rooms || !activeRoomId) {
      setSelectedObject(null);
      return;
    }

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaledX = (x / rect.width) * EDITOR_WIDTH;
    const scaledY = (y / rect.height) * EDITOR_HEIGHT;

    const newObject: PlacedObject = {
      id: `${Date.now()}`,
      objectId: selectedAsset.id,
      x: scaledX - selectedAsset.width / 2,
      y: scaledY - selectedAsset.height / 2,
      width: selectedAsset.width,
      height: selectedAsset.height,
      conversation: selectedAsset.conversation,
      audioPath: selectedAsset.audioPath,
    };
    
    const newRooms = rooms.map(room => {
      if (room.id === activeRoomId) {
        return { ...room, objects: [...room.objects, newObject] };
      }
      return room;
    });
    setRooms(newRooms);
    setSelectedObject(newObject);
    setSelectedAsset(null);
  };
  
  const activeRoom = rooms?.find(r => r.id === activeRoomId);

  const handleObjectUpdate = (updatedObject: PlacedObject) => {
    if (!rooms) return;
    const newRooms = rooms.map(r => r.id === activeRoomId ? {...r, objects: r.objects.map(o => o.id === updatedObject.id ? updatedObject : o)} : r);
    setRooms(newRooms);
    setSelectedObject(updatedObject);
  }

  const handleObjectDelete = () => {
    if (!rooms || !activeRoomId || !selectedObject) return;
    const newRooms = rooms.map(r => r.id === activeRoomId ? {...r, objects: r.objects.filter(o => o.id !== selectedObject.id)} : r);
    setRooms(newRooms);
    setSelectedObject(null);
  }
  
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
              <>
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
                <div className="space-y-2">
                  <Label htmlFor="audioPath">音声パス</Label>
                  <Input
                    id="audioPath"
                    placeholder="音声ファイルのパス"
                    value={selectedObject.audioPath || ''}
                    onChange={(e) => handleObjectUpdate({...selectedObject, audioPath: e.target.value})}
                  />
                </div>
              </>
            )}
            
            {objectType === 'door' && (
              <Card className="bg-muted/50 p-4 space-y-2">
                  <CardDescription>トランジション</CardDescription>
                  <div>
                      <Label htmlFor="target-map">ターゲットマップID</Label>
                      <Input id="target-map" placeholder="例: maps, maps2" value={selectedObject.transition?.targetMapId || ''} onChange={e => handleObjectUpdate({...selectedObject, transition: {...(selectedObject.transition || {targetMapId: '', targetX: 0, targetY: 0}), targetMapId: e.target.value}})} />
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
        <CardContent>
          <ScrollArea className="h-[calc(100vh-14rem)]">
            <div className="grid grid-cols-2 gap-4">
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
                    {asset.imageUrl && <Image src={asset.imageUrl} alt={asset.name} width={asset.width} height={asset.height} className="object-contain p-1" unoptimized />}
                  </div>
                  <span className="text-sm text-center font-medium">{asset.name}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    )
  }


  const EditorContent = () => {
    if (loading) {
      return (
        <div className="col-span-full flex items-center justify-center h-full">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <p>ルームデータを読み込み中...</p>
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
  
    if (!rooms) {
       return <div className="col-span-full flex items-center justify-center h-full"><p>ルームデータが見つかりません。</p></div>
    }

    return (
      <>
        <aside className="w-64 flex-shrink-0">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>ルーム一覧</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-2">
              <ScrollArea className="h-full pr-2">
                <div className="flex flex-col gap-2">
                  {rooms.map(room => (
                    <Button
                      key={room.id}
                      variant={activeRoomId === room.id ? "secondary" : "ghost"}
                      onClick={() => { setActiveRoomId(room.id); setSelectedObject(null); }}
                      className="w-full justify-start"
                    >
                      {room.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-2 border-t">
              <Button variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" />ルームを追加</Button>
            </CardFooter>
          </Card>
        </aside>

        <div className="flex-grow flex flex-col gap-4">
          <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate">
                  ルーム: {activeRoom?.name || '未選択'}
              </h2>
              <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="icon"><ZoomIn /></Button>
                  <Button variant="outline" size="icon"><ZoomOut /></Button>
                  <Button variant="outline" size="icon"><Hand /></Button>
              </div>
          </div>
          {activeRoom ? (
            <div
                ref={editorRef}
                onClick={handleEditorClick}
                className={cn("relative w-full aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed border-border", selectedAsset ? "cursor-crosshair" : "cursor-default")}
            >
                {activeRoom.imageUrl && (
                <Image
                    src={activeRoom.imageUrl}
                    alt={`Room background ${activeRoom.name}`}
                    layout="fill"
                    objectFit="cover"
                    unoptimized
                />
                )}
                {activeRoom.objects.map(obj => {
                    const asset = availableObjects.find(a => a.id === obj.objectId);
                    if (!asset || !asset.imageUrl) return null;
                    
                    const leftPercent = (obj.x / EDITOR_WIDTH) * 100;
                    const topPercent = (obj.y / EDITOR_HEIGHT) * 100;
                    const widthPercent = (obj.width / EDITOR_WIDTH) * 100;
                    
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
                                cursor: 'pointer'
                            }}>
                            <Image src={asset.imageUrl} alt={asset.name} layout="fill" objectFit="contain" unoptimized className={cn("pointer-events-none", selectedObject?.id === obj.id && "ring-2 ring-primary ring-offset-2 ring-offset-background")} />
                        </div>
                    )
                })}
            </div>
          ) : (
             <div className="relative w-full aspect-[16/9] bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed">
              <p>左のリストからルームを選択してください</p>
            </div>
          )}
        </div>

        <aside className="w-72 flex-shrink-0">
          <Inspector />
        </aside>
      </>
    );
  };

  return (
    <div className="flex gap-8 h-full">
        <EditorContent />
    </div>
  );
}
