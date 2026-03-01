'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, ChevronRight, RotateCcw, AlertCircle, FileJson } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

// --- Grand Narrative Data Types (v1.0) ---

type Step = {
  type: "story" | "video";
  worldId?: string;
  storyId?: string;
  videoTitle?: string;
  videoUrl?: string;
};

type Sequence = {
  title: string;
  description: string;
  steps: Step[];
};

type Waypoint = {
  x: number;
  y: number;
  eventId?: string;
  visible?: boolean;
  waitCondition?: string;
};

type SequenceChar = {
  objectId: string;
  speed: number;
  path: Waypoint[];
};

type StoryData = {
  name: string;
  mapId: string;
  bgmUrl?: string;
  characters: SequenceChar[];
};

type VillagerData = {
  name: string;
  imageUrl: string;
  voiceName?: string;
  expressions?: any[];
};

type EventNode = {
  id: string;
  type: 'start' | 'story' | 'choice' | 'reward' | 'end';
  content: string;
  nextStepId?: string;
  choices?: { text: string; nextStepId: string }[];
};

type EventData = {
  id: string;
  nodes: EventNode[];
};

// --- Constants ---
const CANVAS_WIDTH = 2752;
const CANVAS_HEIGHT = 1536;
const CHAR_SIZE = 256;

export function SequencePlayerClient() {
  const { toast } = useToast();
  const [sequencePath, setSequencePath] = useState('/sequences/demo'); // デフォルトパス
  const [sequence, setSequence] = useState<Sequence | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1); // -1: 待機, >=0: 再生中
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playback State
  const [currentMapUrl, setCurrentMapUrl] = useState<string | null>(null);
  const [chars, setChars] = useState<Record<string, { x: number; y: number; data: VillagerData; targetIdx: number; path: Waypoint[]; speed: number }>>({});
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [currentNode, setCurrentNode] = useState<EventNode | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const gameLoopRef = useRef<number>(null);

  // Helper to resolve media paths robustly
  const resolvePath = useCallback((url: string | undefined) => {
    if (!url) return '';
    // If it's already an absolute URL or starting with /
    if (url.startsWith('http') || url.startsWith('/')) return url;
    // Otherwise append to sequencePath
    return `${sequencePath}/${url}`;
  }, [sequencePath]);

  // Sequence Loading
  const loadSequence = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${sequencePath}/sequence.json`);
      if (!res.ok) throw new Error('sequence.json の読み込みに失敗しました。パスが正しいか確認してください。');
      const data = await res.json();
      setSequence(data);
      setCurrentStepIndex(-1);
      setIsFinished(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step Execution
  const startStep = useCallback(async (index: number) => {
    if (!sequence) return;
    
    if (index >= sequence.steps.length) {
      setIsFinished(true);
      setCurrentStepIndex(-1);
      return;
    }

    const step = sequence.steps[index];
    if (step.type === 'story') {
      await initStoryStep(step);
    } else if (step.type === 'video') {
      // Clear story state when entering video step
      setChars({});
      setCurrentMapUrl(null);
    }
    setCurrentStepIndex(index);
  }, [sequence, sequencePath]);

  const initStoryStep = async (step: Step) => {
    try {
      // 1. Load Story
      const storyRes = await fetch(`${sequencePath}/data/stories/${step.storyId}.json`);
      if (!storyRes.ok) throw new Error('Story data not found');
      const story: StoryData = await storyRes.json();

      // 2. Load Map
      const mapPath = `${sequencePath}/media/backgrounds/${story.mapId}.png`;
      const mapRes = await fetch(mapPath);
      if (mapRes.ok) {
        setCurrentMapUrl(mapPath);
      } else {
        // Fallback or attempt jpg
        setCurrentMapUrl(`${sequencePath}/media/backgrounds/${story.mapId}.jpg`);
      }

      // 3. Load Villagers and Initial State
      const newChars: Record<string, any> = {};
      for (const sc of story.characters) {
        try {
          const vRes = await fetch(`${sequencePath}/data/villagers/${sc.objectId}.json`);
          if (!vRes.ok) continue;
          const vData: VillagerData = await vRes.json();
          if (sc.path.length > 0) {
            newChars[sc.objectId] = {
              x: sc.path[0].x,
              y: sc.path[0].y,
              data: vData,
              targetIdx: 0,
              path: sc.path,
              speed: sc.speed || 1
            };
          }
        } catch (e) {
          console.warn(`Failed to load villager: ${sc.objectId}`);
        }
      }
      setChars(newChars);
      setActiveEvent(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'ステップの初期化に失敗', description: 'ストーリーデータまたはマップが見つかりません。' });
    }
  };

  // Event Trigger
  const triggerEvent = async (eventId: string) => {
    try {
      const res = await fetch(`${sequencePath}/data/events/${eventId}.json`);
      if (!res.ok) return;
      const data: EventData = await res.json();
      const startNode = data.nodes.find(n => n.type === 'start');
      if (startNode) {
        setActiveEvent(data);
        setCurrentNode(startNode);
      }
    } catch (e) {
      console.error("Event load failed", e);
    }
  };

  // Game Loop for Movement
  useEffect(() => {
    if (currentStepIndex === -1 || isFinished || activeEvent) return;

    const step = sequence?.steps[currentStepIndex];
    if (step?.type !== 'story') return;

    const loop = () => {
      setChars(prev => {
        const next = { ...prev };
        let allStopped = true;
        let eventTriggered = false;

        for (const id in next) {
          const c = next[id];
          if (c.targetIdx >= c.path.length) continue;

          allStopped = false;
          const target = c.path[c.targetIdx];
          const dx = target.x - c.x;
          const dy = target.y - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const moveSpeed = (c.speed || 1) * 5;

          if (dist < moveSpeed) {
            next[id] = { ...c, x: target.x, y: target.y, targetIdx: c.targetIdx + 1 };
            if (target.eventId) {
              triggerEvent(target.eventId);
              eventTriggered = true;
              break; // Trigger one event at a time and pause
            }
          } else {
            next[id] = { ...c, x: c.x + (dx / dist) * moveSpeed, y: c.y + (dy / dist) * moveSpeed };
          }
        }

        if (eventTriggered) return next;

        if (allStopped && Object.keys(next).length > 0) {
          // All characters in this step finished their paths
          // Use a timeout to avoid recursive state updates in render
          setTimeout(() => startStep(currentStepIndex + 1), 100);
          return next;
        }

        return next;
      });
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [currentStepIndex, isFinished, activeEvent, sequence, startStep]);

  const handleNextStep = () => startStep(currentStepIndex + 1);

  const reset = () => {
    setCurrentStepIndex(-1);
    setIsFinished(false);
    setChars({});
    setCurrentMapUrl(null);
    setActiveEvent(null);
    setCurrentNode(null);
  };

  // Renderers
  if (loading) return <div className="flex flex-col items-center justify-center h-full space-y-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p>物語をロード中...</p></div>;

  if (error) return <Card className="border-destructive max-w-md mx-auto"><CardHeader><CardTitle className="text-destructive flex items-center gap-2"><AlertCircle />エラー</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => setError(null)}>戻る</Button></CardContent></Card>;

  if (!sequence) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>物語をインポート</CardTitle>
          <CardDescription>配置したデータのディレクトリパスを入力してください。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={sequencePath} onChange={e => setSequencePath(e.target.value)} placeholder="/sequences/my-story" />
            <Button onClick={loadSequence}><FileJson className="mr-2 h-4 w-4"/>読み込み</Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>※ `public/` フォルダ内に配置されたデータを参照します。</p>
            <p>※ 例: `public/sequences/demo/sequence.json` がある場合、`/sequences/demo` と入力します。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const step = currentStepIndex >= 0 ? sequence.steps[currentStepIndex] : null;

  return (
    <div className="flex flex-col h-full space-y-4">
      {currentStepIndex === -1 && !isFinished && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{sequence.title}</CardTitle>
            <CardDescription>{sequence.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium mb-4">構成: {sequence.steps.length} ステップ</p>
              <Button size="lg" className="w-48 h-16 text-xl" onClick={() => startStep(0)}>
                <Play className="mr-2 fill-current" /> 物語を再生
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStepIndex >= 0 && !isFinished && (
        <div className="relative flex-grow min-h-0 bg-black border-2 border-border overflow-hidden rounded-lg shadow-2xl">
          {/* Story Type Rendering */}
          {step?.type === 'story' && (
            <div className="relative w-full h-full">
              {currentMapUrl ? (
                <Image src={currentMapUrl} alt="Background" layout="fill" objectFit="cover" unoptimized priority />
              ) : (
                <div className="flex items-center justify-center h-full text-white">マップ画像を読み込めません</div>
              )}
              {Object.entries(chars).map(([id, char]) => (
                <div
                  key={id}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{
                    left: `${(char.x / CANVAS_WIDTH) * 100}%`,
                    top: `${(char.y / CANVAS_HEIGHT) * 100}%`,
                    width: `${(CHAR_SIZE / CANVAS_WIDTH) * 100}%`,
                    aspectRatio: '1/1',
                    zIndex: 10
                  }}
                >
                  <Image 
                    src={resolvePath(char.data.imageUrl)} 
                    alt={char.data.name} 
                    layout="fill" 
                    objectFit="contain" 
                    unoptimized 
                  />
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                    {char.data.name}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Video Type Rendering */}
          {step?.type === 'video' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black p-4">
              <h2 className="text-white text-xl mb-4">{step.videoTitle || 'Movie'}</h2>
              <div className="relative w-full max-w-4xl aspect-video bg-black flex items-center justify-center">
                <video
                  key={step.videoUrl} // Force remount when step changes
                  src={resolvePath(step.videoUrl)}
                  className="max-w-full max-h-full"
                  autoPlay
                  playsInline
                  controls
                  onEnded={handleNextStep}
                  onError={(e) => {
                    console.error("Video Playback Error:", e);
                    toast({ 
                      variant: 'destructive', 
                      title: '動画の再生に失敗', 
                      description: `ファイルが見つからないか、形式が非対応です: ${step.videoUrl}` 
                    });
                  }}
                />
              </div>
              <Button onClick={handleNextStep} variant="ghost" className="text-white mt-4 hover:bg-white/10">
                スキップ <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Event Overlay */}
          {activeEvent && currentNode && (
            <div className="absolute inset-0 bg-black/40 flex items-end justify-center p-8 z-50">
              <Card className="w-full max-w-2xl bg-background/95 backdrop-blur shadow-2xl border-primary/20">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-xl leading-relaxed whitespace-pre-wrap">{currentNode.content}</p>
                  <div className="flex flex-col gap-2">
                    {currentNode.type === 'choice' ? (
                      currentNode.choices?.map((choice, i) => (
                        <Button key={i} size="lg" className="w-full justify-start" onClick={() => {
                          const next = activeEvent.nodes.find(n => n.id === choice.nextStepId);
                          if (next) setCurrentNode(next); else setActiveEvent(null);
                        }}>
                          {choice.text}
                        </Button>
                      ))
                    ) : (
                      <Button size="lg" className="w-full" onClick={() => {
                        const next = activeEvent.nodes.find(n => n.id === currentNode.nextStepId);
                        if (next) setCurrentNode(next); else setActiveEvent(null);
                      }}>
                        {currentNode.type === 'end' ? '閉じる' : '次へ'}
                      </Button>
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
          <CardHeader>
            <CardTitle className="text-3xl">完</CardTitle>
            <CardDescription>物語はすべて終了しました。</CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={reset} variant="outline">
              <RotateCcw className="mr-2" /> 最初から
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
