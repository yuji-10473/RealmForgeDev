
"use client";

import { useState, useRef, MouseEvent, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ZoomIn, ZoomOut, Hand, Loader2, Terminal, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

const EDITOR_WIDTH = 1920;
const EDITOR_HEIGHT = 1080;

type PlacedObject = {
  id: string;
  objectId: string;
  x: number;
  y: number;
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

type Room = {
  id: string;
  name: string;
  imageUrl: string;
  objects: PlacedObject[];
};

type RoomData = {
  objects: AvailableObject[];
  rooms: Room[];
};

export function RoomEditorClient() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [availableObjects, setAvailableObjects] = useState<AvailableObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AvailableObject | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        setError(null);
        setRooms(null);
        setActiveRoomId(null);

        const response = await fetch(`/rooms/rooms.json`);
        if (!response.ok) {
          if(response.status === 404) {
            throw new Error(`ルームファイルが見つかりません: rooms.json`);
          }
          throw new Error(`ルームファイルの読み込みに失敗しました: ${response.statusText}`);
        }
        const data: RoomData = await response.json();
        
        setAvailableObjects(data.objects);
        setRooms(data.rooms);
        if (data.rooms.length > 0) {
          setActiveRoomId(data.rooms[0].id);
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
    if (!selectedAsset || !editorRef.current || !rooms || !activeRoomId) return;

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
    };
    
    const newRooms = rooms.map(room => {
      if (room.id === activeRoomId) {
        return { ...room, objects: [...room.objects, newObject] };
      }
      return room;
    });
    setRooms(newRooms);
  };
  
  const activeRoom = rooms?.find(r => r.id === activeRoomId);

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
                      onClick={() => setActiveRoomId(room.id)}
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
                className="relative w-full aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed border-border cursor-crosshair"
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
          ) : (
             <div className="relative w-full aspect-[16/9] bg-muted flex items-center justify-center text-muted-foreground border-2 border-dashed">
              <p>左のリストからルームを選択してください</p>
            </div>
          )}
        </div>

        <aside className="w-72 flex-shrink-0">
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
                      onClick={() => setSelectedAsset(asset)}
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
