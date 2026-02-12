
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, StopCircle, Play, Plus, Trash2, Route } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Waypoint = { x: number; y: number; eventId?: string };

type SequenceCharacter = {
  id: string; // instance id
  objectId: string; // e.g. "player_main" or "villager_1"
  path: Waypoint[];
  speed: number;
};

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

type AvailableMap = { id: string; name: string; url: string; };
type AvailableCharacter = { 
    id: string; 
    name: string; 
    imageUrl: string; 
    basePath: string;
    clips: AnimationClip[];
};
type AvailableEvent = { id: string; title: string; };

const EDITOR_WIDTH = 1920;
const EDITOR_HEIGHT = 1080;

type CharacterAnimationName = 'idle_down' | 'idle_up' | 'idle_left' | 'idle_right' | 'walk_down' | 'walk_up' | 'walk_left' | 'walk_right';

type PlaybackState = {
  x: number;
  y: number;
  targetWaypointIndex: number;
  status: 'idle' | 'moving' | 'event';
  animationName: CharacterAnimationName;
  animationFrame: number;
  lastFrameUpdate: number;
};

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
    
    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackState, setPlaybackState] = useState<Record<string, PlaybackState>>({});
    const [activeEvent, setActiveEvent] = useState<{event: AvailableEvent, triggererId: string} | null>(null);
    const animationLoopRef = useRef<number>();


    useEffect(() => {
        const loadAssets = async () => {
            try {
                setLoading(true);
                setError(null);

                const allMaps: AvailableMap[] = [];
                const worldsRes = await fetch('/maps/worlds.json');
                if (!worldsRes.ok) throw new Error('ワールドリスト(worlds.json)の読み込みに失敗しました。');
                const worldsData = await worldsRes.json();
                const worldList = worldsData.worlds || [];
                
                if (worldList.length > 0) {
                    const allWorldData = await Promise.all(
                        worldList.map((world: any) => 
                            fetch(`/maps/${world.id}.json`)
                                .then(res => res.ok ? res.json() : null)
                                .catch(() => null)
                        )
                    );

                    allWorldData.forEach(worldData => {
                        if (worldData && worldData.maps) {
                            worldData.maps.forEach((mapCell: any) => {
                                allMaps.push({ id: mapCell.id, name: mapCell.name, url: mapCell.imageUrl });
                            });
                        }
                    });
                }
                
                const roomsRes = await fetch('/rooms/rooms.json');
                if (roomsRes.ok) {
                    const roomsData = await roomsRes.json();
                    if (roomsData && roomsData.rooms) {
                         roomsData.rooms.forEach((room: any) => {
                            allMaps.push({ id: room.id, name: `(ルーム) ${room.name}`, url: room.imageUrl });
                        });
                    }
                }
                
                setAvailableMaps(allMaps);
                if (allMaps.length > 0) {
                    setMapId(allMaps[0].id);
                }

                const [objectsRes, playerCharsRes, eventsRes] = await Promise.all([
                    fetch('/objects.json'),
                    fetch('/characters/characters.json'),
                    fetch('/events/sub-events.json'),
                ]);

                if (!objectsRes.ok) throw new Error('オブジェクトデータ(objects.json)の読み込みに失敗しました。');
                if (!playerCharsRes.ok) throw new Error('プレイヤーキャラクターデータ(characters.json)の読み込みに失敗しました。');
                if (!eventsRes.ok) throw new Error('イベントデータ(sub-events.json)の読み込みに失敗しました。');

                const objectsData = await objectsRes.json();
                const playerCharsData = await playerCharsRes.json();
                
                const playerCharPromises = (playerCharsData.characters || []).map(async (c: any) => {
                    let imageUrl = `${c.path}/frames/idle_down_1.png`;
                    let clips: AnimationClip[] = [];
                    try {
                        const animRes = await fetch(`${c.path}/animations.json`);
                        if (animRes.ok) {
                            const animData = await animRes.json();
                            clips = animData.clips || [];
                            const idleDownClip = clips.find((clip: any) => clip.name === 'idle_down');
                            if (idleDownClip && idleDownClip.frames.length > 0) {
                                imageUrl = `${c.path}/frames/${idleDownClip.frames[0].image}`;
                            }
                        }
                    } catch (e) {
                        console.warn(`Could not load animations for ${c.name}`, e);
                    }
                    return { id: `player_${c.id}`, name: c.name, imageUrl, basePath: c.path, clips };
                });

                const playerChars = await Promise.all(playerCharPromises);

                const npcChars = (objectsData.objects || [])
                    .filter((o: any) => o.type === 'person')
                    .map((o: any) => ({ id: o.id, name: o.name, imageUrl: o.imageUrl, basePath: '', clips: [] as AnimationClip[] }));

                setAvailableCharacters([...playerChars, ...npcChars]);

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

    const handlePlay = useCallback(() => {
        if (sequenceCharacters.length === 0) return;

        const initialState: Record<string, PlaybackState> = {};
        sequenceCharacters.forEach(char => {
            if (char.path.length > 0) {
                initialState[char.id] = {
                    x: char.path[0].x,
                    y: char.path[0].y,
                    targetWaypointIndex: 1,
                    status: char.path.length > 1 ? 'moving' : 'idle',
                    animationName: 'idle_down',
                    animationFrame: 0,
                    lastFrameUpdate: performance.now(),
                };
            }
        });

        setPlaybackState(initialState);
        setIsPlaying(true);
        setSelectedElement(null);
    }, [sequenceCharacters]);

    const handleStop = useCallback(() => {
        setIsPlaying(false);
        setPlaybackState({});
        setActiveEvent(null);
        if (animationLoopRef.current) {
            cancelAnimationFrame(animationLoopRef.current);
        }
    }, []);
    
    useEffect(() => {
        if (!isPlaying) {
            if (animationLoopRef.current) {
                cancelAnimationFrame(animationLoopRef.current);
            }
            return;
        }
    
        let lastTime = performance.now();
    
        const gameLoop = (currentTime: number) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
    
            setPlaybackState(currentPlaybackState => {
                const newState: Record<string, PlaybackState> = JSON.parse(JSON.stringify(currentPlaybackState));
                let allIdle = true;
    
                for (const charId in newState) {
                    const charState = newState[charId];
                    const sequenceChar = sequenceCharacters.find(sc => sc.id === charId);
                    const asset = sequenceChar ? getCharacterAsset(sequenceChar.objectId) : undefined;
                    
                    if (!sequenceChar || charState.status !== 'moving') {
                        if (charState.status !== 'idle') allIdle = false;
                        continue;
                    }
                    
                    allIdle = false;
                    const targetWaypoint = sequenceChar.path[charState.targetWaypointIndex];
                    
                    if (!targetWaypoint) {
                        const currentDir = charState.animationName.split('_')[1] || 'down';
                        newState[charId] = { ...charState, status: 'idle', animationName: `idle_${currentDir}` as CharacterAnimationName };
                        continue;
                    }
    
                    const dx = targetWaypoint.x - charState.x;
                    const dy = targetWaypoint.y - charState.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const speed = (sequenceChar.speed || 1) * 150; // pixels per second
                    const moveDistance = (speed * deltaTime) / 1000;
    
                    let animationName = charState.animationName;
    
                    if (distance <= moveDistance) {
                        // Reached waypoint
                        newState[charId].x = targetWaypoint.x;
                        newState[charId].y = targetWaypoint.y;
                        newState[charId].targetWaypointIndex = charState.targetWaypointIndex + 1;
                        
                        if (targetWaypoint.eventId) {
                            const event = availableEvents.find(e => e.id === targetWaypoint.eventId);
                            if (event) {
                                setActiveEvent({ event, triggererId: charId });
                                newState[charId].status = 'event';
                            }
                        }
                        
                        if (charState.targetWaypointIndex >= sequenceChar.path.length - 1) {
                           const currentDir = animationName.split('_')[1] || 'down';
                           newState[charId].status = 'idle';
                           newState[charId].animationName = `idle_${currentDir}` as CharacterAnimationName;
                        }
    
                    } else {
                        // Still moving
                        const moveX = (dx / distance) * moveDistance;
                        const moveY = (dy / distance) * moveDistance;
                        
                        newState[charId].x += moveX;
                        newState[charId].y += moveY;

                        if (Math.abs(dx) > Math.abs(dy)) {
                            animationName = dx > 0 ? 'walk_right' : 'walk_left';
                        } else {
                            animationName = dy > 0 ? 'walk_down' : 'walk_up';
                        }
                        
                        newState[charId].animationName = animationName;

                        const animClip = asset?.clips.find(c => c.name === animationName);
                        const fps = animClip?.fps || 10;
                        if (currentTime - charState.lastFrameUpdate > 1000 / fps) {
                           newState[charId].animationFrame = (charState.animationFrame + 1) % (animClip?.frames.length || 1);
                           newState[charId].lastFrameUpdate = currentTime;
                        }
                    }
                }
    
                if (allIdle && Object.keys(newState).length > 0) {
                    setTimeout(() => handleStop(), 500);
                }
    
                return newState;
            });
    
            animationLoopRef.current = requestAnimationFrame(gameLoop);
        };
    
        animationLoopRef.current = requestAnimationFrame(gameLoop);
    
        return () => {
            if (animationLoopRef.current) {
                cancelAnimationFrame(animationLoopRef.current);
            }
        };
    }, [isPlaying, sequenceCharacters, availableEvents, getCharacterAsset, handleStop]);


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
        if (isPlaying) return;
        
        const target = e.target as HTMLElement;
        const isCharacterClick = !!target.closest('[data-char-id]');
        const isWaypointClick = !!target.closest('[data-waypoint-index]');
        
        if (!selectedElement?.charId || selectedElement.waypointIndex !== undefined) {
             if (!isCharacterClick && !isWaypointClick) {
                 setSelectedElement(null);
             }
             return;
        }

        if (isCharacterClick || isWaypointClick || !stageRef.current) {
            return;
        }
        
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
    
    const selectCharacter = (charId: string) => {
        setSelectedElement({ charId });
    }

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
    const getCharacterAsset = useCallback((objectId: string) => availableCharacters.find(c => c.id === objectId), [availableCharacters]);
    const mapUrl = availableMaps.find(m => m.id === mapId)?.url || '';

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
            {/* Main Stage Panel */}
            <div className="xl:col-span-3 space-y-4 flex flex-col">
                 <div className="flex-shrink-0">
                    <Select value={mapId} onValueChange={setMapId} disabled={isPlaying}>
                        <SelectTrigger id="map-select" className="max-w-sm">
                            <SelectValue placeholder="背景マップを選択..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMaps.map(map => <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div 
                    ref={stageRef} 
                    onClick={handleStageClick} 
                    className="relative w-full bg-muted overflow-hidden border-2 border-dashed border-border flex-grow aspect-video"
                >
                    {mapUrl ? (
                      <Image src={mapUrl} alt="Map Background" layout="fill" objectFit="cover" unoptimized priority/>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">マップ画像が見つかりません</div>
                    )}

                    {/* Waypoints and Paths */}
                    {!isPlaying && sequenceCharacters.map(char => {
                        const isSelected = char.id === selectedChar?.id;
                        if (!isSelected) return null;
                        
                        return (
                            <React.Fragment key={`${char.id}-path`}>
                                {char.path.map((point, index, arr) => (
                                    <React.Fragment key={index}>
                                        {index > 0 && <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"><line x1={`${(arr[index-1].x / EDITOR_WIDTH) * 100}%`} y1={`${(arr[index-1].y / EDITOR_HEIGHT) * 100}%`} x2={`${(point.x / EDITOR_WIDTH) * 100}%`} y2={`${(point.y / EDITOR_HEIGHT) * 100}%`} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4" /></svg>}
                                        <div 
                                            data-waypoint-index={index}
                                            className={cn("absolute w-3 h-3 bg-background border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer ring-offset-background ring-offset-2", selectedElement?.waypointIndex === index ? 'ring-2 ring-primary' : '')}
                                            style={{ left: `${(point.x / EDITOR_WIDTH) * 100}%`, top: `${(point.y / EDITOR_HEIGHT) * 100}%` }}
                                            onClick={(e) => { e.stopPropagation(); setSelectedElement({ charId: char.id, waypointIndex: index }); }}
                                        />
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        );
                    })}

                     {/* Characters */}
                    {sequenceCharacters.map(char => {
                        const asset = getCharacterAsset(char.objectId);
                        if (!asset) return null;

                        let position = { x: -1000, y: -1000 };
                        let imageToShow = asset.imageUrl;
                        
                        const state = playbackState[char.id];
                        
                        if (isPlaying && state) {
                            position = { x: state.x, y: state.y };
                            const animClip = asset.clips.find(c => c.name === state.animationName);
                            if (animClip && animClip.frames.length > 0) {
                                const frame = animClip.frames[state.animationFrame % animClip.frames.length];
                                if(frame) imageToShow = `${asset.basePath}/frames/${frame.image}`;
                            }
                        } else if (char.path.length > 0) {
                            position = { x: char.path[0].x, y: char.path[0].y };
                        } else {
                            return null; // Don't render if no path and not playing
                        }
                        
                        const left = (position.x / EDITOR_WIDTH) * 100;
                        const top = (position.y / EDITOR_HEIGHT) * 100;
                        
                        return (
                            <div 
                                key={char.id}
                                data-char-id={char.id}
                                className="absolute w-16 h-16 -translate-x-1/2 -translate-y-full cursor-pointer"
                                style={{ left: `${left}%`, top: `${top}%`, transition: isPlaying ? 'none' : 'left 0.2s, top 0.2s' }}
                                onClick={(e) => {
                                  if (isPlaying) return;
                                  e.stopPropagation();
                                  selectCharacter(char.id);
                                }}
                            >
                                <Image src={imageToShow} alt={asset.name} layout="fill" objectFit="contain" unoptimized/>
                                <div className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/30 rounded-full blur-sm", char.id === selectedElement?.charId && !isPlaying ? 'ring-2 ring-primary' : '')}></div>
                            </div>
                        )
                    })}

                    {activeEvent && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-8">
                            <Card className="max-w-md">
                                <CardHeader><CardTitle>{activeEvent.event.title}</CardTitle></CardHeader>
                                <CardContent><p>イベント「{activeEvent.event.title}」がここで再生されます。</p></CardContent>
                                <CardFooter>
                                    <Button onClick={() => {
                                        setPlaybackState(current => ({
                                            ...current,
                                            [activeEvent.triggererId]: {
                                                ...current[activeEvent.triggererId],
                                                status: 'moving',
                                            }
                                        }));
                                        setActiveEvent(null);
                                    }}>閉じる</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1 flex flex-col h-full min-h-0 space-y-4">
                <Card>
                    <CardHeader className="flex-row items-center justify-between">
                        <CardTitle>シーケンス制御</CardTitle>
                        {isPlaying ? (
                            <Button variant="destructive" onClick={handleStop}><StopCircle className="mr-2"/>停止</Button>
                        ) : (
                            <Button variant="outline" onClick={handlePlay}><Play className="mr-2"/>再生</Button>
                        )}
                    </CardHeader>
                </Card>

                <Card className="flex-grow flex flex-col min-h-0">
                    <CardHeader>
                        <CardTitle>シーケンス構成</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <ScrollArea className="h-40">
                            {sequenceCharacters.map(char => {
                                const asset = getCharacterAsset(char.objectId);
                                return (
                                    <div key={char.id} className={cn('p-3 rounded-lg mb-2 border', selectedElement?.charId === char.id && !selectedElement.waypointIndex ? 'bg-secondary border-primary' : 'border-border')}>
                                        <div className="flex justify-between items-center">
                                            <button onClick={() => selectCharacter(char.id)} className="font-semibold w-full text-left flex items-center gap-2 hover:text-primary"><Route/> {asset?.name || 'Unknown'}</button>
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
                             {sequenceCharacters.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">キャラクターをアセットから追加してください。</p>}
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Tabs defaultValue="assets" className="flex-grow flex flex-col min-h-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="assets">アセット</TabsTrigger>
                    <TabsTrigger value="inspector">インスペクター</TabsTrigger>
                  </TabsList>
                  <TabsContent value="assets" className="flex-grow mt-4">
                    <Card className="h-full">
                      <CardHeader><CardTitle>キャラクター</CardTitle></CardHeader>
                      <CardContent>
                        <ScrollArea className="h-48">
                            <div className="grid grid-cols-3 gap-2">
                                {availableCharacters.map(char => (
                                    <button key={char.id} onClick={() => handleAddCharacter(char.id)} className="flex flex-col items-center p-2 rounded-md hover:bg-muted" disabled={isPlaying}>
                                        <div className="w-12 h-12 relative"><Image src={char.imageUrl} alt={char.name} layout="fill" objectFit="contain" unoptimized/></div>
                                        <p className="text-xs text-center truncate">{char.name}</p>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="inspector" className="flex-grow mt-4">
                    <Card className="h-full">
                        <CardHeader><CardTitle>インスペクター</CardTitle></CardHeader>
                        <CardContent className="space-y-4 min-h-[10rem]">
                            {isPlaying && <p className="text-muted-foreground text-sm">再生中は編集できません。</p>}
                            {!isPlaying && !selectedElement && <p className="text-muted-foreground text-sm">要素を選択してください</p>}
                            {!isPlaying && selectedChar && !selectedWaypoint && (
                                <div className="space-y-4">
                                    <div>
                                        <Label>キャラクター</Label>
                                        <p className="font-semibold">{getCharacterAsset(selectedChar.objectId)?.name}</p>
                                        <p className="text-xs text-muted-foreground">ステージをクリックして移動経路を作成します。</p>
                                    </div>
                                     <div>
                                        <Label htmlFor="char-speed">移動速度</Label>
                                        <Input
                                            id="char-speed"
                                            type="number"
                                            value={selectedChar.speed}
                                            onChange={(e) => setSequenceCharacters(prev => prev.map(c => c.id === selectedChar.id ? {...c, speed: parseFloat(e.target.value) || 1} : c))}
                                            min="0.1"
                                            step="0.1"
                                        />
                                    </div>
                                </div>
                            )}
                            {!isPlaying && selectedChar && selectedWaypoint && (
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
                  </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

