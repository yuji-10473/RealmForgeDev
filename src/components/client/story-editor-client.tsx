"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, MapPin, Play, Plus, Trash2, Route } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

type Waypoint = { x: number; y: number; eventId?: string };

type SequenceCharacter = {
  id: string; // instance id
  objectId: string; // e.g. "player_main" or "villager_1"
  path: Waypoint[];
  speed: number;
};

type AvailableMap = { id: string; name: string; url: string; };
type AvailableCharacter = { id: string; name: string; imageUrl: string; };
type AvailableEvent = { id: string; title: string; };

const EDITOR_WIDTH = 1920;
const EDITOR_HEIGHT = 1080;

export function StoryEditorClient() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [availableMaps, setAvailableMaps] = useState<AvailableMap[]>([]);
    const [availableCharacters, setAvailableCharacters] = useState<AvailableCharacter[]>([]);
    const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([]);

    const [mapId, setMapId] = useState<string>('');
    const [sequenceCharacters, setSequenceCharacters] = useState<SequenceCharacter[]>([]);
    const [selectedElement, setSelectedElement] = useState<{ charId: string; waypointIndex?: number } | null>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadAssets = async () => {
            try {
                setLoading(true);
                setError(null);

                // --- 1. Fetch and process maps ---
                const allMaps: AvailableMap[] = [];

                // Fetch world list
                const worldsRes = await fetch('/maps/worlds.json');
                if (!worldsRes.ok) throw new Error('ワールドリスト(worlds.json)の読み込みに失敗しました。');
                const worldsData = await worldsRes.json();
                const worldList = worldsData.worlds || [];

                // Fetch data for each world
                if (worldList.length > 0) {
                    const worldDataPromises = worldList.map((world: any) => 
                        fetch(`/maps/${world.id}.json`)
                            .then(res => {
                                if (!res.ok) {
                                    console.warn(`マップファイル /maps/${world.id}.json が見つからないか、読み込めません。`);
                                    return null; // Continue even if one file is missing
                                }
                                return res.json();
                            })
                    );
                    const allWorldData = await Promise.all(worldDataPromises);

                    // Extract individual map cells from each world's data
                    allWorldData.forEach(worldData => {
                        if (worldData && worldData.maps) {
                            worldData.maps.forEach((mapCell: any) => {
                                allMaps.push({
                                    id: mapCell.id,
                                    name: mapCell.name,
                                    url: mapCell.imageUrl,
                                });
                            });
                        }
                    });
                }

                // Fetch rooms
                const roomsRes = await fetch('/rooms/rooms.json');
                if (roomsRes.ok) {
                    const roomsData = await roomsRes.json();
                    if (roomsData && roomsData.rooms) {
                         roomsData.rooms.forEach((room: any) => {
                            allMaps.push({
                                id: room.id,
                                name: `(ルーム) ${room.name}`,
                                url: room.imageUrl,
                            });
                        });
                    }
                } else {
                    console.warn('ルームデータ(rooms.json)の読み込みに失敗しました。');
                }
                
                setAvailableMaps(allMaps);
                if (allMaps.length > 0) {
                    setMapId(allMaps[0].id);
                }

                // --- 2. Fetch other assets (characters, events) ---
                const [objectsRes, playerCharsRes, eventsRes] = await Promise.all([
                    fetch('/objects.json'),
                    fetch('/characters/characters.json'),
                    fetch('/events/sub-events.json'),
                ]);

                if (!objectsRes.ok) throw new Error('オブジェクトデータ(objects.json)の読み込みに失敗しました。');
                if (!playerCharsRes.ok) throw new Error('プレイヤーキャラクターデータ(characters.json)の読み込みに失敗しました。');
                if (!eventsRes.ok) throw new Error('イベントデータ(sub-events.json)の読み込みに失敗しました。');

                // Characters
                const objectsData = await objectsRes.json();
                const playerCharsData = await playerCharsRes.json();
                const npcChars = (objectsData.objects || []).filter((o: any) => o.type === 'person').map((o: any) => ({ id: o.id, name: o.name, imageUrl: o.imageUrl }));
                const playerChars = (playerCharsData.characters || []).map((c: any) => ({ id: `player_${c.id}`, name: c.name, imageUrl: `${c.path}/frames/idle_down_1.png`}));
                setAvailableCharacters([...playerChars, ...npcChars]);

                // Events
                const eventsData = await eventsRes.json();
                setAvailableEvents((eventsData.events || []).map((e:any) => ({ id: e.id, title: e.title })));

            } catch (e: any) {
                setError(e.message || "アセットの読み込みに失敗しました。");
            } finally {
                setLoading(false);
            }
        };
        loadAssets();
    }, []);

    const handleAddCharacter = (objectId: string) => {
        const newChar: SequenceCharacter = {
            id: `seq_char_${Date.now()}`,
            objectId,
            path: [],
            speed: 1,
        };
        setSequenceCharacters(prev => [...prev, newChar]);
        setSelectedElement({ charId: newChar.id });
    };

    const handleRemoveCharacter = (charId: string) => {
        setSequenceCharacters(prev => prev.filter(c => c.id !== charId));
        if (selectedElement?.charId === charId) {
            setSelectedElement(null);
        }
    }

    const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!selectedElement?.charId || selectedElement.waypointIndex !== undefined || !stageRef.current) return;
        
        const rect = stageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setSequenceCharacters(prev => prev.map(char => {
            if (char.id === selectedElement.charId) {
                return { ...char, path: [...char.path, { x: x * EDITOR_WIDTH, y: y * EDITOR_HEIGHT }] };
            }
            return char;
        }));
    };

    const updateWaypointEvent = (charId: string, waypointIndex: number, eventId: string) => {
        setSequenceCharacters(prev => prev.map(char => {
            if (char.id === charId) {
                const newPath = [...char.path];
                newPath[waypointIndex] = { ...newPath[waypointIndex], eventId: eventId === 'none' ? undefined : eventId };
                return { ...char, path: newPath };
            }
            return char;
        }));
    }
    
    const selectedChar = sequenceCharacters.find(c => c.id === selectedElement?.charId);
    const selectedWaypoint = selectedChar && selectedElement?.waypointIndex !== undefined ? selectedChar.path[selectedElement.waypointIndex] : undefined;
    const getCharacterAsset = (objectId: string) => availableCharacters.find(c => c.id === objectId);
    const mapUrl = availableMaps.find(m => m.id === mapId)?.url || '';

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
            {/* Main Stage Panel (wider) */}
            <div className="xl:col-span-3 space-y-4 flex flex-col">
                <div ref={stageRef} onClick={handleStageClick} className="relative w-full aspect-[16/9] bg-muted overflow-hidden border-2 border-dashed border-border cursor-crosshair flex-grow">
                    {mapUrl ? (
                      <Image src={mapUrl} alt="Map Background" layout="fill" objectFit="cover" unoptimized priority/>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">マップ画像が見つかりません</div>
                    )}
                    {sequenceCharacters.map(char => {
                        const asset = getCharacterAsset(char.objectId);
                        if (!asset) return null;
                        const isSelected = char.id === selectedChar?.id;
                        
                        return (
                            <React.Fragment key={char.id}>
                                {isSelected && char.path.map((point, index, arr) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"><line x1={`${(arr[index-1].x / EDITOR_WIDTH) * 100}%`} y1={`${(arr[index-1].y / EDITOR_HEIGHT) * 100}%`} x2={`${(point.x / EDITOR_WIDTH) * 100}%`} y2={`${(point.y / EDITOR_HEIGHT) * 100}%`} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4" /></svg>}
                                        <div 
                                            className={cn("absolute w-3 h-3 bg-background border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer ring-offset-background ring-offset-2", selectedElement?.waypointIndex === index ? 'ring-2 ring-primary' : '')}
                                            style={{ left: `${(point.x / EDITOR_WIDTH) * 100}%`, top: `${(point.y / EDITOR_HEIGHT) * 100}%` }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedElement({ charId: char.id, waypointIndex: index }); }}
                                        />
                                    </React.Fragment>
                                ))}
                                {char.path.length > 0 && (
                                     <div 
                                        className="absolute w-12 h-12 -translate-x-1/2 -translate-y-[90%]"
                                        style={{ left: `${(char.path[0].x / EDITOR_WIDTH) * 100}%`, top: `${(char.path[0].y / EDITOR_HEIGHT) * 100}%` }}>
                                         <Image src={asset.imageUrl} alt={asset.name} layout="fill" objectFit="contain" unoptimized/>
                                     </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1 flex flex-col h-full min-h-0">
                <ScrollArea className="h-full pr-2 -mr-2">
                  <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle>シーケンス設定</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="map-select">背景マップ</Label>
                                <Select value={mapId} onValueChange={setMapId}>
                                    <SelectTrigger id="map-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {availableMaps.map(map => <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>アセット</CardTitle></CardHeader>
                        <CardContent>
                            <ScrollArea className="h-48">
                                <div className="grid grid-cols-3 gap-2">
                                    {availableCharacters.map(char => (
                                        <button key={char.id} onClick={() => handleAddCharacter(char.id)} className="flex flex-col items-center p-2 rounded-md hover:bg-muted">
                                            <div className="w-12 h-12 relative"><Image src={char.imageUrl} alt={char.name} layout="fill" objectFit="contain" unoptimized/></div>
                                            <p className="text-xs text-center truncate">{char.name}</p>
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                    <Card className="flex-grow flex flex-col min-h-0">
                        <CardHeader><CardTitle>シーケンス構成</CardTitle></CardHeader>
                        <CardContent className="flex-grow">
                             <ScrollArea className="h-64">
                                {sequenceCharacters.map(char => {
                                    const asset = getCharacterAsset(char.objectId);
                                    return (
                                        <div key={char.id} className={cn('p-3 rounded-lg mb-4 border', selectedElement?.charId === char.id && !selectedElement.waypointIndex ? 'bg-secondary border-primary' : 'border-transparent')}>
                                            <div className="flex justify-between items-center">
                                                <button onClick={() => setSelectedElement({ charId: char.id })} className="font-semibold w-full text-left flex items-center gap-2 hover:text-primary"><Route/> {asset?.name || 'Unknown'}</button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCharacter(char.id)}><Trash2 className="h-4 w-4"/></Button>
                                            </div>
                                            <div className="pl-4 mt-2 space-y-1 border-l-2 ml-2">
                                                {char.path.length === 0 && <p className="text-xs text-muted-foreground pl-2 py-1">ステージをクリックしてウェイポイントを追加</p>}
                                                {char.path.map((point, index) => (
                                                    <div 
                                                        key={index} 
                                                        className={cn('p-2 rounded-md cursor-pointer', selectedElement?.waypointIndex === index && selectedElement?.charId === char.id ? 'bg-primary/20' : 'hover:bg-muted')}
                                                        onClick={() => setSelectedElement({ charId: char.id, waypointIndex: index })}
                                                    >
                                                        <p className="text-sm font-medium">ウェイポイント {index + 1}</p>
                                                        {point.eventId && <p className="text-xs text-muted-foreground">イベント: {availableEvents.find(e => e.id === point.eventId)?.title || point.eventId}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </ScrollArea>
                        </CardContent>
                         <CardFooter>
                            <Button variant="outline" className="w-full"><Play className="mr-2"/> シーケンスを再生</Button>
                        </CardFooter>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>インスペクター</CardTitle></CardHeader>
                        <CardContent className="space-y-4 min-h-[10rem]">
                            {!selectedElement && <p className="text-muted-foreground text-sm">要素を選択してください</p>}
                            {selectedChar && !selectedWaypoint && (
                                <div className="space-y-2">
                                    <Label>キャラクター: {getCharacterAsset(selectedChar.objectId)?.name}</Label>
                                    <p className="text-xs text-muted-foreground">ステージをクリックして移動経路を作成します。</p>
                                </div>
                            )}
                            {selectedChar && selectedWaypoint && (
                                <div>
                                    <Label htmlFor="event-id">ウェイポイント {selectedElement!.waypointIndex! + 1} のイベント</Label>
                                    <Select 
                                        value={selectedWaypoint.eventId || 'none'}
                                        onValueChange={(value) => updateWaypointEvent(selectedChar.id, selectedElement!.waypointIndex!, value)}
                                    >
                                        <SelectTrigger id="event-id"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">なし</SelectItem>
                                            {availableEvents.map(evt => (
                                                <SelectItem key={evt.id} value={evt.id}>{evt.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                  </div>
                </ScrollArea>
            </div>
        </div>
    );
}
