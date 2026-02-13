

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, StepForward, RotateCcw, Plus, Trash2, Route, Play, StopCircle } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

// --- Event System Types ---
type Choice = {
  text: string;
  nextStepId: string;
  requiredItemId?: string;
  lockedText?: string;
};

type Reward = {
  itemId?: string;
  itemName?: string;
  amount?: number;
};

type EventNode = {
  id: string;
  type: 'start' | 'story' | 'choice' | 'reward' | 'end';
  content: string;
  setFlag?: string;
  nextStepId?: string;
  requiredFlag?: string;
  choices?: Choice[];
  reward?: Reward;
};

type GameEvent = {
  id: string; // Document ID
  title: string;
  nodes: EventNode[];
};
// --- End Event System Types ---

function EventPlayerUI({
    currentNode,
    onChoice,
    onNext,
    onClose,
  }: {
    currentNode: EventNode;
    onChoice: (choice: Choice) => void;
    onNext: (nodeId: string) => void;
    onClose: () => void;
  }) {
    if (!currentNode) return null;
  
    return (
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-6 z-50 text-foreground shadow-lg space-y-4 max-w-3xl mx-auto">
        <p className="text-lg whitespace-pre-wrap min-h-[3rem]">{currentNode.content}</p>
        <div className="flex flex-col gap-2">
          {currentNode.type === 'choice' && currentNode.choices?.map((choice, index) => {
            return (
              <Button
                key={index}
                onClick={() => onChoice(choice)}
                className="w-full justify-between"
              >
                <span>{choice.text}</span>
              </Button>
            );
          })}
          {(currentNode.type === 'start' || currentNode.type === 'story' || currentNode.type === 'reward') && currentNode.nextStepId && (
            <Button onClick={() => onNext(currentNode.nextStepId!)} className="w-full">
              次へ
            </Button>
          )}
          {(currentNode.type === 'end' || ((currentNode.type === 'start' || currentNode.type === 'story' || currentNode.type === 'reward') && !currentNode.nextStepId)) && (
            <Button onClick={onClose} variant="outline" className="w-full">
              閉じる
            </Button>
          )}
        </div>
      </div>
    );
  }


type Waypoint = { x: number; y: number; eventId?: string };

type SequenceCharacter = {
  id: string; // instance id
  objectId: string; // e.g. "player_main" or "villager_1"
  path: Waypoint[];
  speed: number;
};

type AnimationClip = {
  id: string;
  name: string;
  frames: any[];
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

type AvailableEvent = GameEvent;


const EDITOR_WIDTH = 1920;
const EDITOR_HEIGHT = 1080;

type PlaybackState = { x: number; y: number; targetWaypointIndex: number; };

export function StoryEditorClient() {
    const { toast } = useToast();
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
    const [playbackState, setPlaybackState] = useState<Record<string, PlaybackState>>({});
    const [isPlaying, setIsPlaying] = useState(false);
    const [stepPhase, setStepPhase] = useState<'event' | 'move'>('event');

    const [activeEvent, setActiveEvent] = useState<{event: GameEvent, triggererId: string} | null>(null);
    const [currentEventNode, setCurrentEventNode] = useState<EventNode | null>(null);
    
    const gameLoopRef = useRef<number>();

    const selectedChar = sequenceCharacters.find(c => c.id === selectedElement?.charId);
    
    const getCharacterAsset = useCallback((objectId: string) => availableCharacters.find(c => c.id === objectId), [availableCharacters]);
    
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
                    let clips: AnimationClip[] = [];
                    let imageUrl = `${c.path}/frames/idle_down_1.png`; // Fallback
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
                setAvailableEvents(eventsData.events || []);

            } catch (e: any) {
                setError(e.message || "アセットの読み込みに失敗しました。");
            } finally {
                setLoading(false);
            }
        };
        loadAssets();
    }, []);


    const startEvent = useCallback((event: GameEvent, triggererId: string) => {
        const startNode = event.nodes.find(n => n.type === 'start');
        if (startNode) {
            setActiveEvent({ event, triggererId });
            setCurrentEventNode(startNode);
        }
    }, []);
    
    const endEvent = useCallback(() => {
        setActiveEvent(null);
        setCurrentEventNode(null);
    }, []);

    const goToNextEventNode = useCallback((nodeId: string | undefined) => {
        if (!activeEvent || !nodeId) {
            endEvent();
            return;
        }
        const nextNode = activeEvent.event.nodes.find(n => n.id === nodeId);
        if (nextNode) {
            setCurrentEventNode(nextNode);
        } else {
            endEvent();
        }
    }, [activeEvent, endEvent]);

    const handleEventChoice = useCallback((choice: Choice) => {
        goToNextEventNode(choice.nextStepId);
    }, [goToNextEventNode]);

    const handleReset = useCallback(() => {
        const initialState: Record<string, PlaybackState> = {};
        sequenceCharacters.forEach(char => {
            if (char.path.length > 0) {
                initialState[char.id] = {
                    x: char.path[0].x,
                    y: char.path[0].y,
                    targetWaypointIndex: 0,
                };
            }
        });
        setPlaybackState(initialState);
        setIsPlaying(false);
        setActiveEvent(null);
        setCurrentEventNode(null);
        setStepPhase('event');
    }, [sequenceCharacters]);
    
    const handlePlay = useCallback(() => {
        if (sequenceCharacters.length === 0) return;
        
        const initialState: Record<string, PlaybackState> = {};
        sequenceCharacters.forEach(char => {
            if (char.path.length > 0) {
                initialState[char.id] = {
                    x: char.path[0].x,
                    y: char.path[0].y,
                    targetWaypointIndex: 1,
                };
            }
        });
        setPlaybackState(initialState);
        setActiveEvent(null);
        setCurrentEventNode(null);
        setIsPlaying(true);
    }, [sequenceCharacters]);

    const handleStop = useCallback(() => {
        setIsPlaying(false);
        handleReset();
    }, [handleReset]);

    const handleStepExecute = useCallback(() => {
        if (!selectedChar) {
            toast({ variant: 'destructive', title: 'キャラクターを選択してください' });
            return;
        }
        if (activeEvent) {
            toast({ title: 'イベント進行中', description: 'イベントを完了しないと次のステップへは進めません。' });
            return;
        }
    
        const charState = playbackState[selectedChar.id];
    
        // Initialize on first step
        if (!charState) {
            handleReset();
            // The state update is async, so we use a timeout to run the first step check after state is set.
            setTimeout(() => {
                const firstWaypoint = selectedChar.path[0];
                if (firstWaypoint && firstWaypoint.eventId) {
                    const event = availableEvents.find(e => e.id === firstWaypoint.eventId);
                    if (event) {
                        startEvent(event, selectedChar.id);
                        setStepPhase('move');
                    }
                }
            }, 0);
            return;
        }
    
        const currentWaypointIndex = charState.targetWaypointIndex;
        const currentWaypoint = selectedChar.path[currentWaypointIndex];
    
        // Phase 1: Check for event at current location
        if (stepPhase === 'event' && currentWaypoint?.eventId) {
            const event = availableEvents.find(e => e.id === currentWaypoint.eventId);
            if (event) {
                startEvent(event, selectedChar.id);
                setStepPhase('move'); // Next step will be a move
                return;
            }
        }
    
        // Phase 2: Move to next waypoint (if no event was triggered or if it's move phase)
        const nextWaypointIndex = currentWaypointIndex + 1;
        if (nextWaypointIndex < selectedChar.path.length) {
            const nextWaypoint = selectedChar.path[nextWaypointIndex];
            setPlaybackState(prev => ({
                ...prev,
                [selectedChar.id]: {
                    ...charState,
                    x: nextWaypoint.x,
                    y: nextWaypoint.y,
                    targetWaypointIndex: nextWaypointIndex,
                }
            }));
            setStepPhase('event'); // After moving, next step is to check for an event
        } else {
            toast({ title: 'シーケンス終了', description: '「リセット」で最初からやり直せます。' });
        }
    }, [selectedChar, playbackState, activeEvent, handleReset, availableEvents, startEvent, toast, stepPhase]);

    useEffect(() => {
        if (!isPlaying) {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            return;
        }

        const loop = () => {
            if (!isPlaying) return;

            if (activeEvent) {
                gameLoopRef.current = requestAnimationFrame(loop);
                return;
            }

            let allFinished = true;
            const newPlaybackState: Record<string, PlaybackState> = {};
            
            for (const char of sequenceCharacters) {
                const charState = playbackState[char.id];
                if (!charState || !char.path.length) continue;

                const targetIndex = charState.targetWaypointIndex;

                if (targetIndex >= char.path.length) {
                    newPlaybackState[char.id] = charState; 
                    continue; 
                }
                
                allFinished = false;
                const targetWaypoint = char.path[targetIndex];
                const dx = targetWaypoint.x - charState.x;
                const dy = targetWaypoint.y - charState.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                const speed = char.speed * 5;

                if (distance < speed) {
                    newPlaybackState[char.id] = { x: targetWaypoint.x, y: targetWaypoint.y, targetWaypointIndex: targetIndex + 1 };
                    if (targetWaypoint.eventId) {
                        const event = availableEvents.find(e => e.id === targetWaypoint.eventId);
                        if (event) {
                            startEvent(event, char.id);
                        }
                    }
                } else {
                    const moveX = (dx / distance) * speed;
                    const moveY = (dy / distance) * speed;
                    newPlaybackState[char.id] = { ...charState, x: charState.x + moveX, y: charState.y + moveY };
                }
            }

            setPlaybackState(newPlaybackState);

            if (allFinished) {
                handleStop();
            }

            gameLoopRef.current = requestAnimationFrame(loop);
        };
        
        gameLoopRef.current = requestAnimationFrame(loop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        }
    }, [isPlaying, playbackState, activeEvent, sequenceCharacters, availableEvents, startEvent, handleStop]);


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
        setSequenceCharacters(prev => {
            const newChars = prev.filter(c => c.id !== charId);
            // Also update playback state
            setPlaybackState(currentPlaybackState => {
                const newPlaybackState = { ...currentPlaybackState };
                delete newPlaybackState[charId];
                return newPlaybackState;
            });
            return newChars;
        });
        if (selectedElement?.charId === charId) {
            setSelectedElement(null);
        }
    }

    const handleStageClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPlaying) return;
        
        const target = e.target as HTMLElement;
        const isCharacterClick = !!target.closest('[data-char-id]');
        const isWaypointClick = !!target.closest('[data-waypoint-index]');
        
        if (!selectedElement?.charId) {
             if (!isCharacterClick && !isWaypointClick) {
                 setSelectedElement(null);
             }
             return;
        }

        if (selectedElement.waypointIndex !== undefined) {
             if (!isCharacterClick && !isWaypointClick) {
                 setSelectedElement({ charId: selectedElement.charId });
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
                const newPath = [...char.path, { x: x * EDITOR_WIDTH, y: y * EDITOR_HEIGHT }];
                // if it's the first waypoint, reset playback state for this char
                if (newPath.length === 1) {
                    setPlaybackState(prevPlayback => ({
                        ...prevPlayback,
                        [char.id]: { x: newPath[0].x, y: newPath[0].y, targetWaypointIndex: 0 }
                    }));
                }
                return { ...char, path: newPath };
            }
            return char;
        }));
    };
    
    const selectCharacter = (charId: string) => {
        if(isPlaying) return;
        setSelectedElement({ charId });
    }

    const updateWaypointEvent = (charId: string, waypointIndex: number, eventId: string) => {
      setSequenceCharacters(prev => 
          prev.map(char => {
              if (char.id === charId) {
                  const newPath = char.path.map((point, index) => {
                      if (index === waypointIndex) {
                          return { ...point, eventId: eventId === 'none' ? undefined : eventId };
                      }
                      return point;
                  });
                  return { ...char, path: newPath };
              }
              return char;
          })
      );
    }
    
    const selectedWaypoint = selectedChar && selectedElement?.waypointIndex !== undefined ? selectedChar.path[selectedElement.waypointIndex] : undefined;
    const mapUrl = availableMaps.find(m => m.id === mapId)?.url || '';

    if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (error) return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;

    const isPlaybackActive = isPlaying || Object.keys(playbackState).length > 0;
    const isEditingDisabled = isPlaying || !!activeEvent;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
            {/* Main Stage Panel */}
            <div className="xl:col-span-3 space-y-4 flex flex-col">
                 <div className="flex items-center justify-between flex-shrink-0">
                    <Select value={mapId} onValueChange={setMapId} disabled={isPlaybackActive}>
                        <SelectTrigger id="map-select" className="max-w-sm">
                            <SelectValue placeholder="背景マップを選択..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMaps.map(map => <SelectItem key={map.id} value={map.id}>{map.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                     <div className="flex items-center gap-2">
                        {isPlaying ? (
                             <Button onClick={handleStop} variant="destructive"><StopCircle className="mr-2"/>停止</Button>
                        ) : (
                             <Button onClick={handlePlay}><Play className="mr-2"/>シーケンス再生</Button>
                        )}
                        <Button onClick={handleStepExecute} disabled={isEditingDisabled}><StepForward className="mr-2"/>ステップ実行</Button>
                        <Button onClick={handleReset} disabled={isPlaying} variant="outline"><RotateCcw className="mr-2"/>リセット</Button>
                    </div>
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
                        
                        if (isPlaybackActive && state) {
                            position = { x: state.x, y: state.y };
                        } else if (!isPlaybackActive && char.path.length > 0) {
                             position = { x: char.path[0].x, y: char.path[0].y };
                        } else if (!isPlaybackActive) {
                            return null;
                        }
                        
                        const left = (position.x / EDITOR_WIDTH) * 100;
                        const top = (position.y / EDITOR_HEIGHT) * 100;
                        
                        return (
                            <div 
                                key={char.id}
                                data-char-id={char.id}
                                className="absolute w-16 h-16 -translate-x-1/2 -translate-y-full cursor-pointer"
                                style={{ left: `${left}%`, top: `${top}%` }}
                                onClick={(e) => {
                                  if (isPlaying) return;
                                  e.stopPropagation();
                                  selectCharacter(char.id);
                                }}
                            >
                                <Image src={imageToShow} alt={asset.name} layout="fill" objectFit="contain" unoptimized/>
                                <div className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/30 rounded-full blur-sm", char.id === selectedElement?.charId && !isEditingDisabled ? 'ring-2 ring-primary' : '')}></div>
                            </div>
                        )
                    })}

                    {activeEvent && currentEventNode && (
                         <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 p-8">
                            <EventPlayerUI
                                currentNode={currentEventNode}
                                onChoice={handleEventChoice}
                                onNext={goToNextEventNode}
                                onClose={endEvent}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar */}
            <div className="xl:col-span-1 flex flex-col h-full min-h-0 space-y-4">
                 <Card className="flex-grow-[2] flex flex-col min-h-0">
                    <CardHeader>
                        <CardTitle>シーケンス構成</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-2">
                        <ScrollArea className="h-full pr-2">
                            {sequenceCharacters.map(char => {
                                const asset = getCharacterAsset(char.objectId);
                                return (
                                    <div key={char.id} className={cn('p-3 rounded-lg mb-2 border', selectedElement?.charId === char.id && !selectedElement.waypointIndex ? 'bg-secondary border-primary' : 'border-border')}>
                                        <div className="flex justify-between items-center">
                                            <button onClick={() => selectCharacter(char.id)} className="font-semibold w-full text-left flex items-center gap-2 hover:text-primary" disabled={isEditingDisabled}><Route/> {asset?.name || 'Unknown'}</button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveCharacter(char.id)} disabled={isEditingDisabled}><Trash2 className="h-4 w-4"/></Button>
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
                <div className="flex-grow-[3]">
                    <Tabs defaultValue="assets" className="flex flex-col h-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="assets">アセット</TabsTrigger>
                        <TabsTrigger value="inspector">インスペクター</TabsTrigger>
                      </TabsList>
                      <TabsContent value="assets" className="flex-grow mt-4">
                        <Card className="h-full">
                          <CardHeader><CardTitle>キャラクター</CardTitle></CardHeader>
                           <CardContent className="p-2">
                            <ScrollArea className="h-full max-h-48 pr-2">
                                <div className="grid grid-cols-3 gap-2">
                                    {availableCharacters.map(char => (
                                        <button key={char.id} onClick={() => handleAddCharacter(char.id)} className="flex flex-col items-center p-2 rounded-md hover:bg-muted" disabled={isEditingDisabled}>
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
                                {isEditingDisabled && <p className="text-muted-foreground text-sm">再生中またはイベント中は編集できません。</p>}
                                {!isEditingDisabled && !selectedElement && <p className="text-muted-foreground text-sm">要素を選択してください</p>}
                                {!isEditingDisabled && selectedChar && !selectedWaypoint && (
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
                                {!isEditingDisabled && selectedChar && selectedWaypoint && (
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
        </div>
    );
}
