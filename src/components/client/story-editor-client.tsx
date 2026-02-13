

'use client';

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

type AnimationFrame = {
    id: string;
    image: string;
};

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
      <div className="bg-background/80 backdrop-blur-sm border border-border rounded-lg p-6 z-50 text-foreground shadow-lg space-y-4 max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
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

type AvailableEvent = GameEvent;


const EDITOR_WIDTH = 1920;
const EDITOR_HEIGHT = 1080;

type PlaybackState = { x: number; y: number; targetWaypointIndex: number; };

type CharacterPlaybackAnimationState = {
    animationName: string;
    frameIndex: number;
    lastFrameUpdateTime: number;
};

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
    const [playbackAnimationState, setPlaybackAnimationState] = useState<Record<string, CharacterPlaybackAnimationState>>({});
    const [isPlaying, setIsPlaying] = useState(false);
    const [isStepModeActive, setIsStepModeActive] = useState(false);

    const [activeEvent, setActiveEvent] = useState<{event: GameEvent, triggererId: string} | null>(null);
    const [currentEventNode, setCurrentEventNode] = useState<EventNode | null>(null);
    
    const gameLoopRef = useRef<number>();
    const animationLoopRef = useRef<number>();

    const getCharacterAsset = useCallback((objectId: string) => availableCharacters.find(c => c.id === objectId), [availableCharacters]);
    const selectedChar = sequenceCharacters.find(c => c.id === selectedElement?.charId);
    
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

    // Preload animation frames
    useEffect(() => {
        if (typeof window === 'undefined') return;

        availableCharacters.forEach(char => {
            if (char.basePath && char.clips) {
                char.clips.forEach(clip => {
                    clip.frames.forEach(frame => {
                        if (frame.image) {
                            const img = new (window as any).Image();
                            img.src = `${char.basePath}/frames/${frame.image}`;
                        }
                    });
                });
            }
        });
    }, [availableCharacters]);


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
        if (isStepModeActive) {
            const charState = selectedChar ? playbackState[selectedChar.id] : null;
            if (charState) {
                const nextWaypointIndex = charState.targetWaypointIndex;
                if (nextWaypointIndex >= (selectedChar?.path.length || 0) -1) {
                     toast({ title: 'シーケンス終了', description: '「リセット」で最初からやり直せます。' });
                }
            }
        }
    }, [isStepModeActive, playbackState, selectedChar, toast]);

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
        const initialPlaybackState: Record<string, PlaybackState> = {};
        const initialAnimationState: Record<string, CharacterPlaybackAnimationState> = {};

        sequenceCharacters.forEach(char => {
            if (char.path.length > 0) {
                initialPlaybackState[char.id] = {
                    x: char.path[0].x,
                    y: char.path[0].y,
                    targetWaypointIndex: 0,
                };
                initialAnimationState[char.id] = {
                    animationName: 'idle_down',
                    frameIndex: 0,
                    lastFrameUpdateTime: 0,
                }
            }
        });
        setPlaybackState(initialPlaybackState);
        setPlaybackAnimationState(initialAnimationState);
        setIsPlaying(false);
        setActiveEvent(null);
        setCurrentEventNode(null);
        setIsStepModeActive(false); 
    }, [sequenceCharacters]);

    const handlePlay = useCallback(() => {
        if (sequenceCharacters.length === 0) return;
        handleReset();
        setIsPlaying(true);
    }, [sequenceCharacters, handleReset]);

    const handleStop = useCallback(() => {
        setIsPlaying(false);
    }, []);
    
    const handleStepExecute = useCallback(() => {
        if (isPlaying || activeEvent) {
            if (isPlaying) {
                toast({ variant: 'destructive', title: '再生中はステップ実行できません' });
            }
            if (activeEvent) {
                toast({ title: 'イベント進行中', description: 'イベントを完了しないと次のステップへは進めません。' });
            }
            return;
        }

        // Must have a character selected to do anything
        if (!selectedChar) {
            toast({ variant: 'destructive', title: 'キャラクターを選択してください' });
            return;
        }

        // First click setup
        if (!isStepModeActive) {
            handleReset();
            setIsStepModeActive(true);

            // After resetting, check for an event at the starting waypoint (index 0)
            if (selectedChar.path.length > 0) {
                const startingWaypoint = selectedChar.path[0];
                if (startingWaypoint.eventId) {
                    const event = availableEvents.find(e => e.id === startingWaypoint.eventId);
                    if (event) {
                        startEvent(event, selectedChar.id);
                    }
                }
            }
            return;
        }

        // Subsequent clicks
        const charState = playbackState[selectedChar.id];
        if (!charState && selectedChar.path.length === 0) {
            toast({ title: 'ウェイポイントがありません', description: 'キャラクターの移動経路を設定してください。' });
            return;
        }
        if (!charState) return;

        const currentWaypointIndex = charState.targetWaypointIndex;
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
            
            // Check the event on the waypoint we just arrived at.
            if (nextWaypoint.eventId) {
                const event = availableEvents.find(e => e.id === nextWaypoint.eventId);
                if (event) {
                    startEvent(event, selectedChar.id);
                }
            }
        } else {
            toast({ title: 'シーケンス終了', description: '「リセット」で最初からやり直せます。' });
        }
    }, [selectedChar, isStepModeActive, activeEvent, playbackState, isPlaying, handleReset, availableEvents, startEvent, toast]);
    
    useEffect(() => {
        if (!isPlaying) {
            if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
            return;
        }

        const loop = (currentTime: number) => {
            if (!isPlaying) return;

            if (activeEvent) {
                gameLoopRef.current = requestAnimationFrame(loop);
                return;
            }

            let allFinished = true;
            const newPlaybackState: Record<string, PlaybackState> = {};
            const newAnimationStates: Record<string, Partial<CharacterPlaybackAnimationState>> = {};
            
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
                    
                    let idleDirection = 'down';
                    const nextTargetIndex = targetIndex + 1;
                    if (nextTargetIndex < char.path.length) {
                        const nextTarget = char.path[nextTargetIndex];
                        const nextDx = nextTarget.x - targetWaypoint.x;
                        const nextDy = nextTarget.y - targetWaypoint.y;
                        if (Math.abs(nextDx) > Math.abs(nextDy)) {
                            idleDirection = nextDx > 0 ? 'right' : 'left';
                        } else if (nextDy !== 0) {
                            idleDirection = nextDy > 0 ? 'down' : 'up';
                        }
                    }
                    newAnimationStates[char.id] = { animationName: `idle_${idleDirection}`};

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

                    let animationName: string;
                     if (Math.abs(dx) > Math.abs(dy)) {
                        animationName = dx > 0 ? 'walk_right' : 'walk_left';
                    } else {
                        animationName = dy > 0 ? 'walk_down' : 'walk_up';
                    }
                    newAnimationStates[char.id] = { animationName };
                }
            }

            setPlaybackState(newPlaybackState);

            setPlaybackAnimationState(prev => {
                const newState = {...prev};
                for (const charId in newAnimationStates) {
                    const newAnim = newAnimationStates[charId];
                    if (newState[charId]?.animationName !== newAnim.animationName) {
                        newState[charId] = {
                            animationName: newAnim.animationName || 'idle_down',
                            frameIndex: 0,
                            lastFrameUpdateTime: currentTime,
                        };
                    }
                }
                return newState;
            });


            if (allFinished) {
                setIsPlaying(false);
                toast({ title: 'シーケンス再生終了' });
            }

            gameLoopRef.current = requestAnimationFrame(loop);
        };
        
        gameLoopRef.current = requestAnimationFrame(loop);

        return () => {
            if (gameLoopRef.current) {
                cancelAnimationFrame(gameLoopRef.current);
            }
        }
    }, [isPlaying, playbackState, activeEvent, sequenceCharacters, availableEvents, startEvent, toast]);


    useEffect(() => {
        if (!isPlaying) {
            if (animationLoopRef.current) cancelAnimationFrame(animationLoopRef.current);
            return;
        }
    
        const animate = (currentTime: number) => {
            setPlaybackAnimationState(currentStates => {
                const newStates = { ...currentStates };
                let hasChanged = false;
    
                for (const charId in newStates) {
                    const state = newStates[charId];
                    const char = sequenceCharacters.find(c => c.id === charId);
                    const asset = char ? getCharacterAsset(char.objectId) : undefined;
                    const clip = asset?.clips.find(c => c.name === state.animationName);
    
                    if (clip && clip.frames.length > 0) {
                        const frameDuration = 1000 / (clip.fps || 8);
                        if (currentTime - state.lastFrameUpdateTime > frameDuration) {
                            newStates[charId] = {
                                ...state,
                                frameIndex: (state.frameIndex + 1) % clip.frames.length,
                                lastFrameUpdateTime: currentTime
                            };
                            hasChanged = true;
                        }
                    }
                }
                return hasChanged ? newStates : currentStates;
            });
    
            animationLoopRef.current = requestAnimationFrame(animate);
        };
    
        animationLoopRef.current = requestAnimationFrame(animate);
    
        return () => {
            if (animationLoopRef.current) {
                cancelAnimationFrame(animationLoopRef.current);
            }
        };
    }, [isPlaying, sequenceCharacters, getCharacterAsset]);


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
        if (isPlaying || activeEvent) return;
        
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

        const newPathPoint = { x: x * EDITOR_WIDTH, y: y * EDITOR_HEIGHT };

        setSequenceCharacters(prevChars => {
            const newChars = [...prevChars];
            const charIndex = newChars.findIndex(c => c.id === selectedElement.charId);
            if (charIndex === -1) return prevChars;

            const charToUpdate = { ...newChars[charIndex] };
            charToUpdate.path = [...charToUpdate.path, newPathPoint];
            newChars[charIndex] = charToUpdate;

            if (charToUpdate.path.length === 1) {
                setPlaybackState(prevPlayback => ({
                    ...prevPlayback,
                    [charToUpdate.id]: { x: newPathPoint.x, y: newPathPoint.y, targetWaypointIndex: 0 }
                }));
                setPlaybackAnimationState(prev => ({
                    ...prev,
                    [charToUpdate.id]: { animationName: 'idle_down', frameIndex: 0, lastFrameUpdateTime: 0 }
                }));
            }
            return newChars;
        });
    };
    
    const selectCharacter = (charId: string) => {
        if(isPlaying || activeEvent) return;
        setSelectedElement({ charId });
    }

    const updateWaypointEvent = (charId: string, waypointIndex: number, eventId: string) => {
        setSequenceCharacters(prev =>
            prev.map(char => {
                if (char.id === charId) {
                    const newPath = [...char.path];
                    const pointToUpdate = { ...newPath[waypointIndex] };
                    pointToUpdate.eventId = eventId === 'none' ? undefined : eventId;
                    newPath[waypointIndex] = pointToUpdate;
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

    const isPlaybackActive = isPlaying || isStepModeActive;
    const isEditingDisabled = isPlaying || isStepModeActive || !!activeEvent;

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
                        <Button onClick={handlePlay} disabled={isPlaybackActive}><Play className="mr-2"/>再生</Button>
                        <Button onClick={handleStop} disabled={!isPlaying} variant="secondary"><StopCircle className="mr-2"/>停止</Button>
                        <Button onClick={handleStepExecute}><StepForward className="mr-2"/>ステップ実行</Button>
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
                    {!isPlaybackActive && selectedChar && (
                        <React.Fragment>
                            {selectedChar.path.map((point, index, arr) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"><line x1={`${(arr[index-1].x / EDITOR_WIDTH) * 100}%`} y1={`${(arr[index-1].y / EDITOR_HEIGHT) * 100}%`} x2={`${(point.x / EDITOR_WIDTH) * 100}%`} y2={`${(point.y / EDITOR_HEIGHT) * 100}%`} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="4" /></svg>}
                                    <div 
                                        data-waypoint-index={index}
                                        className={cn("absolute w-3 h-3 bg-background border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-pointer ring-offset-background ring-offset-2", selectedElement?.waypointIndex === index ? 'ring-2 ring-primary' : '')}
                                        style={{ left: `${(point.x / EDITOR_WIDTH) * 100}%`, top: `${(point.y / EDITOR_HEIGHT) * 100}%` }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (isEditingDisabled) return;
                                            setSelectedElement({ charId: selectedChar.id, waypointIndex: index });
                                        }}
                                    />
                                </React.Fragment>
                            ))}
                        </React.Fragment>
                    )}

                     {/* Characters */}
                    {sequenceCharacters.map(char => {
                        const asset = getCharacterAsset(char.objectId);
                        if (!asset) return null;

                        let position = { x: -1000, y: -1000 };
                        let imageToShow = asset.imageUrl;
                        
                        const posState = playbackState[char.id];
                        const animState = playbackAnimationState[char.id];
                        
                        if (isPlaybackActive && posState) {
                            position = { x: posState.x, y: posState.y };
                            if (animState && asset && asset.clips.length > 0) {
                                const activeClip = asset.clips.find(c => c.name === animState.animationName);
                                if (activeClip && activeClip.frames.length > 0) {
                                    const frame = activeClip.frames[animState.frameIndex % activeClip.frames.length];
                                    if (frame && asset.basePath) {
                                        imageToShow = `${asset.basePath}/frames/${frame.image}`;
                                    }
                                }
                            }
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
                         <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 p-8" onClick={(e) => e.stopPropagation()}>
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
                                        <div className="flex justify-between items-center" onClick={(e) => { e.stopPropagation(); selectCharacter(char.id); }}>
                                            <span className="font-semibold w-full text-left flex items-center gap-2 hover:text-primary" ><Route/> {asset?.name || 'Unknown'}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => {e.stopPropagation(); handleRemoveCharacter(char.id);}} disabled={isEditingDisabled}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                        <div className="pl-4 mt-2 space-y-1 border-l-2 ml-2">
                                            {char.path.length === 0 && <p className="text-xs text-muted-foreground pl-2 py-1">ステージをクリックしてウェイポイントを追加</p>}
                                            {char.path.map((point, index) => (
                                                <div 
                                                    key={index}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isEditingDisabled) return;
                                                        setSelectedElement({ charId: char.id, waypointIndex: index });
                                                    }}
                                                    className={cn('p-2 rounded-md cursor-pointer', selectedElement?.waypointIndex === index && selectedElement?.charId === char.id ? 'bg-primary/20' : 'hover:bg-muted')}
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
