
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, ChevronRight, RotateCcw, AlertCircle, Volume2, VolumeX, FolderOpen } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- v1.2.0 Data Types ---

type Step = {
  type: "story" | "video";
  storyId?: string;
  videoTitle?: string;
  videoUrl?: string;
};

type NarrativeSequence = {
  id: string;
  title: string;
  description: string;
  steps: Step[];
};

type Waypoint = {
  x: number;
  y: number;
  eventId?: string;
};

type SequenceChar = {
  objectId: string;
  speed: number;
  path: Waypoint[];
};

type StoryData = {
  id: string;
  name: string;
  mapId: string;
  worldId?: string;
  bgmUrl?: string;
  characters: SequenceChar[];
};

type VillagerData = {
  id: string;
  name: string;
  imageUrl: string;
  first_encounter?: { audioUrl?: string };
  greeting?: { audioUrl?: string };
  daily_life?: { audioUrl?: string };
  rumors?: { audioUrl?: string };
  confide?: { audioUrl?: string };
};

type MapData = {
  id: string;
  name: string;
  imageUrl?: string;
};

type WorldData = {
  id: string;
  name: string;
  bgmUrl?: string;
  audioUrl?: string;
  maps?: MapData[];
};

type CatalogData = {
  id: string;
  name: string;
  imageUrl?: string;
  audioUrl?: string;
};

type EventNode = {
  id: string;
  type: 'start' | 'story' | 'choice' | 'reward' | 'end';
  content: string;
  nextStepId?: string;
  audioUrl?: string;
  choices?: { text: string; nextStepId: string; audioUrl?: string }[];
};

type EventFlow = {
  id: string;
  nodes: EventNode[];
};

const CANVAS_WIDTH = 2752;
const CANVAS_HEIGHT = 1536;
const CHAR_SIZE = 256;

export function SequencePlayerClient() {
  const { toast } = useToast();
  const [projectRoot, setProjectRoot] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Master Data Cache
  const [masterSequences, setMasterSequences] = useState<NarrativeSequence[]>([]);
  const [masterStories, setMasterStories] = useState<StoryData[]>([]);
  const [masterVillagers, setMasterVillagers] = useState<VillagerData[]>([]);
  const [masterEvents, setMasterEvents] = useState<EventFlow[]>([]);
  const [masterWorlds, setMasterWorlds] = useState<WorldData[]>([]);
  const [masterCollectionPoints, setMasterCollectionPoints] = useState<CatalogData[]>([]);
  const [masterMeetingPlaces, setMasterMeetingPlaces] = useState<CatalogData[]>([]);
  const [masterItems, setMasterItems] = useState<CatalogData[]>([]);
  const [masterMonsters, setMasterMonsters] = useState<CatalogData[]>([]);
  const [masterDishes, setMasterDishes] = useState<CatalogData[]>([]);
  const [masterBuildings, setMasterBuildings] = useState<CatalogData[]>([]);
  const [masterShops, setMasterShops] = useState<CatalogData[]>([]);

  // Playback State
  const [selectedSeqId, setSelectedSeqId] = useState<string>('');
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [currentMapUrl, setCurrentMapUrl] = useState<string | null>(null);
  const [chars, setChars] = useState<Record<string, { x: number; y: number; data: VillagerData; targetIdx: number; path: Waypoint[]; speed: number }>>({});
  const [activeEvent, setActiveEvent] = useState<EventFlow | null>(null);
  const [currentNode, setCurrentNode] = useState<EventNode | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const gameLoopRef = useRef<number>(null);

  // v1.2.0 Path Resolution
  const resolvePath = useCallback((path: string | undefined, type: 'image' | 'audio' | 'video') => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('/')) return path;
    
    const root = projectRoot.replace(/\/$/, '');
    if (path.startsWith('media/')) return `${root}/${path}`;
    
    let subFolder = '';
    switch(type) {
      case 'image': subFolder = 'media/images'; break;
      case 'audio': subFolder = 'media/audio'; break;
      case 'video': subFolder = 'media/videos'; break;
    }
    
    return `${root}/${subFolder}/${path}`;
  }, [projectRoot]);

  useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio();
      bgmRef.current.loop = true;
    }
    bgmRef.current.muted = isMuted;
  }, [isMuted]);

  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchData = async (file: string) => {
        const root = projectRoot.replace(/\/$/, '');
        const res = await fetch(`${root}/data/${file}.json`);
        if (!res.ok) return [];
        return await res.json();
      };

      const [seqs, stories, villagers, events, worlds, collectionPoints, meetingPlaces, items, monsters, dishes, buildings, shops] = await Promise.all([
        fetchData('narrativeSequences'),
        fetchData('stories'),
        fetchData('villagers'),
        fetchData('eventFlows'),
        fetchData('worlds'),
        fetchData('collectionPoints'),
        fetchData('meetingPlaces'),
        fetchData('items'),
        fetchData('monsters'),
        fetchData('dishes'),
        fetchData('buildings'),
        fetchData('shops')
      ]);

      setMasterSequences(seqs);
      setMasterStories(stories);
      setMasterVillagers(villagers);
      setMasterEvents(events);
      setMasterWorlds(worlds || []);
      setMasterCollectionPoints(collectionPoints || []);
      setMasterMeetingPlaces(meetingPlaces || []);
      setMasterItems(items || []);
      setMasterMonsters(monsters || []);
      setMasterDishes(dishes || []);
      setMasterBuildings(buildings || []);
      setMasterShops(shops || []);

      if (seqs.length === 0) throw new Error('物語データが見つかりませんでした。');
      
      setCurrentStepIndex(-1);
      setIsFinished(false);
      toast({ title: 'プロジェクト読み込み完了', description: `${seqs.length}個のシーケンスが見つかりました。` });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const startStep = useCallback(async (index: number) => {
    const sequence = masterSequences.find(s => s.id === selectedSeqId);
    if (!sequence) return;
    
    if (index >= sequence.steps.length) {
      setIsFinished(true);
      setCurrentStepIndex(-1);
      if (bgmRef.current) bgmRef.current.pause();
      return;
    }

    const step = sequence.steps[index];
    if (step.type === 'story') {
      const story = masterStories.find(s => s.id === step.storyId);
      if (!story) {
        toast({ variant: 'destructive', title: 'ストーリーが見つかりません', description: step.storyId });
        return;
      }

      const world = masterWorlds.find(w => w.id === (story.worldId || story.mapId));
      const mapData = world?.maps?.find(m => m.id === story.mapId);

      if (mapData?.imageUrl) {
        setCurrentMapUrl(resolvePath(mapData.imageUrl, 'image'));
      } else {
        setCurrentMapUrl(resolvePath(`${story.mapId}.png`, 'image'));
      }

      const targetBgm = story.bgmUrl || world?.bgmUrl || world?.audioUrl;
      if (targetBgm && bgmRef.current) {
        const resolvedBgm = resolvePath(targetBgm, 'audio');
        if (bgmRef.current.getAttribute('src') !== resolvedBgm) {
          bgmRef.current.setAttribute('src', resolvedBgm);
          bgmRef.current.play().catch(() => {});
        } else if (bgmRef.current.paused) {
          bgmRef.current.play().catch(() => {});
        }
      } else if (!targetBgm && bgmRef.current) {
        bgmRef.current.pause();
        bgmRef.current.removeAttribute('src');
      }

      const newChars: Record<string, any> = {};
      story.characters.forEach(sc => {
        const vData = masterVillagers.find(v => v.id === sc.objectId);
        if (vData && sc.path.length > 0) {
          newChars[sc.objectId] = {
            x: sc.path[0].x, y: sc.path[0].y,
            data: vData, targetIdx: 0, path: sc.path, speed: sc.speed || 1
          };
        }
      });
      setChars(newChars);
      setActiveEvent(null);
    } else {
      setChars({});
      setCurrentMapUrl(null);
      if (bgmRef.current) bgmRef.current.pause();
    }
    setCurrentStepIndex(index);
  }, [masterSequences, selectedSeqId, masterStories, masterVillagers, resolvePath, toast]);

  const playNodeVoice = (node: EventNode) => {
    if (!voiceRef.current) voiceRef.current = new Audio();
    if (node.audioUrl) {
      voiceRef.current.src = resolvePath(node.audioUrl, 'audio');
      voiceRef.current.muted = isMuted;
      voiceRef.current.play().catch(() => {});
    }
  };

  useEffect(() => {
    if (currentStepIndex === -1 || isFinished || activeEvent) return;
    const sequence = masterSequences.find(s => s.id === selectedSeqId);
    const step = sequence?.steps[currentStepIndex];
    if (step?.type !== 'story') return;

    const loop = () => {
      setChars(prev => {
        const next = { ...prev };
        let anyMoving = false;
        let eventTriggered = false;

        for (const id in next) {
          const c = next[id];
          if (c.targetIdx >= c.path.length) continue;

          anyMoving = true;
          const target = c.path[c.targetIdx];
          const dx = target.x - c.x;
          const dy = target.y - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const moveSpeed = (c.speed || 1) * 5;

          if (dist < moveSpeed) {
            next[id] = { ...c, x: target.x, y: target.y, targetIdx: c.targetIdx + 1 };
            if (target.eventId) {
              const event = masterEvents.find(e => e.id === target.eventId);
              if (event) {
                const startNode = event.nodes.find(n => n.type === 'start');
                if (startNode) {
                  setActiveEvent(event);
                  setCurrentNode(startNode);
                  playNodeVoice(startNode);
                  eventTriggered = true;
                  break;
                }
              }
            } else {
              // イベントが無い場合、挨拶音声等のプレビュー再生を試みる
              if (c.data?.greeting?.audioUrl && !activeEvent) {
                if (!voiceRef.current) voiceRef.current = new Audio();
                voiceRef.current.src = resolvePath(c.data.greeting.audioUrl, 'audio');
                voiceRef.current.muted = isMuted;
                voiceRef.current.play().catch(() => {});
              }
            }
          } else {
            next[id] = { ...c, x: c.x + (dx / dist) * moveSpeed, y: c.y + (dy / dist) * moveSpeed };
          }
        }

        if (eventTriggered) return next;
        if (!anyMoving && Object.keys(next).length > 0) {
          setTimeout(() => startStep(currentStepIndex + 1), 500);
          return next;
        }
        return next;
      });
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [currentStepIndex, isFinished, activeEvent, masterSequences, selectedSeqId, masterEvents, startStep]);

  const reset = () => {
    if (bgmRef.current) bgmRef.current.pause();
    setCurrentStepIndex(-1);
    setIsFinished(false);
    setChars({});
    setCurrentMapUrl(null);
    setActiveEvent(null);
    setCurrentNode(null);
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-full space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p>ロード中...</p></div>;

  if (error) return <Card className="border-destructive max-w-md mx-auto"><CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertCircle />エラー</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => setError(null)}>戻る</Button></CardContent></Card>;

  if (masterSequences.length === 0) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader><CardTitle>プロジェクト読込 (v1.2.0)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={projectRoot} onChange={e => setProjectRoot(e.target.value)} placeholder="例: /sequences/demo" />
            <Button onClick={loadProject}><FolderOpen className="mr-2 h-4 w-4"/>読み込み</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedSeq = masterSequences.find(s => s.id === selectedSeqId);
  const step = currentStepIndex >= 0 && selectedSeq ? selectedSeq.steps[currentStepIndex] : null;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border">
        <Select value={selectedSeqId} onValueChange={setSelectedSeqId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="物語を選択" /></SelectTrigger>
          <SelectContent>{masterSequences.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
          {isMuted ? '消音中' : '音声あり'}
        </Button>
      </div>

      {currentStepIndex === -1 && !isFinished && selectedSeq && (
        <Card className="max-w-2xl mx-auto text-center py-12">
          <CardHeader><CardTitle className="text-3xl">{selectedSeq.title}</CardTitle><CardDescription>{selectedSeq.description}</CardDescription></CardHeader>
          <CardContent><Button size="lg" className="w-48 h-16" onClick={() => startStep(0)}><Play className="mr-2" /> 再生開始</Button></CardContent>
        </Card>
      )}

      {currentStepIndex >= 0 && !isFinished && (
        <div className="relative flex-grow min-h-0 bg-black border rounded-lg overflow-hidden">
          {step?.type === 'story' && (
            <div className="relative w-full h-full">
              {currentMapUrl && <Image src={currentMapUrl} alt="Map" layout="fill" objectFit="cover" unoptimized priority />}
              {Object.entries(chars).map(([id, char]) => (
                <div key={id} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${(char.x / CANVAS_WIDTH) * 100}%`, top: `${(char.y / CANVAS_HEIGHT) * 100}%`, width: `${(CHAR_SIZE / CANVAS_WIDTH) * 100}%`, aspectRatio: '1/1' }}>
                  <Image src={resolvePath(char.data.imageUrl, 'image')} alt={char.data.name} layout="fill" objectFit="contain" unoptimized />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap">{char.data.name}</div>
                </div>
              ))}
            </div>
          )}
          {step?.type === 'video' && (
            <video key={step.videoUrl} src={resolvePath(step.videoUrl, 'video')} className="w-full h-full" autoPlay playsInline controls onEnded={() => startStep(currentStepIndex + 1)} />
          )}
          {activeEvent && currentNode && (
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-8 z-50">
              <Card className="w-full max-w-2xl bg-background/95 backdrop-blur animate-in slide-in-from-bottom-4">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-xl font-medium">{currentNode.content}</p>
                  <div className="flex flex-col gap-2">
                    {currentNode.type === 'choice' ? (
                      currentNode.choices?.map((choice, i) => (
                        <Button key={i} size="lg" className="w-full justify-start h-auto py-3" onClick={() => {
                          const next = activeEvent.nodes.find(n => n.id === choice.nextStepId);
                          if (next) { playNodeVoice(next); setCurrentNode(next); } else { setActiveEvent(null); }
                        }}>{choice.text}</Button>
                      ))
                    ) : (
                      <Button size="lg" className="w-full" onClick={() => {
                        const next = activeEvent.nodes.find(n => n.id === currentNode.nextStepId);
                        if (next) { playNodeVoice(next); setCurrentNode(next); } else { setActiveEvent(null); }
                      }}>{currentNode.type === 'end' ? '物語を続ける' : '次へ'}</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {isFinished && (
        <Card className="max-w-md mx-auto text-center py-12">
          <CardHeader><CardTitle className="text-3xl font-headline">完</CardTitle></CardHeader>
          <CardContent><Button size="lg" onClick={reset} variant="outline"><RotateCcw className="mr-2" /> 最初から</Button></CardContent>
        </Card>
      )}
    </div>
  );
}
