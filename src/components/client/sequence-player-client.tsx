// src/components/client/sequence-player-client.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import LoadingSpinner from "@/components/ui/loading-spinner";

// --- 型定義 ---

interface EventFlowNode {
  id: string;
  type: "start" | "story" | "choice" | "reward" | "end";
  content: string;
  speakerName?: string;
  speakerId?: string;
  audioUrl?: string;
  expressionName?: string;
  nextStepId?: string;
  choices?: { text: string; nextStepId: string }[];
}

interface EventFlow {
  id: string;
  title: string;
  villagerId?: string;
  villagerName?: string;
  nodes: EventFlowNode[];
}

interface MasterAsset {
  id: string;
  name: string;
  imageUrl: string;
}

interface StoryDataCharacter {
  id: string;
  objectId: string;
  path: Array<{ eventId?: string }>;
}

interface StoryData {
  id: string;
  name: string;
  bgmUrl?: string;
  characters?: StoryDataCharacter[];
}

interface NarrativeSequenceStep {
  type: "video" | "story";
  videoUrl?: string;
  storyId?: string;
}

interface NarrativeSequence {
  id: string;
  title: string;
  description?: string;
  steps: NarrativeSequenceStep[];
}

const resolveMediaUrl = (path: string | undefined) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return `/${path}`;
};

// --- コンポーネント ---

interface SequencePlayerClientProps {
  narrativeSequenceId: string;
}

const SequencePlayerClient: React.FC<SequencePlayerClientProps> = ({ narrativeSequenceId }) => {
  const [currentNarrativeSequence, setCurrentNarrativeSequence] = useState<NarrativeSequence | null>(null);
  const [currentNarrativeStepIndex, setCurrentNarrativeStepIndex] = useState<number>(-1);
  const [allStories, setAllStories] = useState<StoryData[]>([]);
  const [allEventFlows, setAllEventFlows] = useState<EventFlow[]>([]);
  const [masterAssets, setMasterAssets] = useState<Record<string, MasterAsset>>({});
  
  const [currentEventFlow, setCurrentEventFlow] = useState<EventFlow | null>(null);
  const [currentEventNode, setCurrentEventNode] = useState<EventFlowNode | null>(null);
  const [eventNodesMap, setEventNodesMap] = useState<Record<string, EventFlowNode>>({});
  const [pendingEventIds, setPendingEventIds] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);

  // データロード
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const smartFetch = async (filename: string) => {
      const paths = [`/data/${filename}`, `/sequences/demo/data/${filename}`];
      for (const path of paths) {
        try {
          const res = await fetch(path);
          if (res.ok) {
            const data = await res.json();
            return Array.isArray(data) ? data : (data.sequences || data.stories || data.eventFlows || data.villagers || data.items || data.monsters || []);
          }
        } catch (e) {}
      }
      return [];
    };

    try {
      const [narrativeData, storiesData, eventFlowsData, villagers, items, monsters] = await Promise.all([
        smartFetch('narrativeSequences.json'),
        smartFetch('stories.json'),
        smartFetch('eventFlows.json'),
        smartFetch('villagers.json'),
        smartFetch('items.json'),
        smartFetch('monsters.json')
      ]);

      // アセットマップの構築
      const assetMap: Record<string, MasterAsset> = {};
      [...villagers, ...items, ...monsters].forEach(a => {
        if (a.id) assetMap[a.id] = a;
      });
      setMasterAssets(assetMap);

      const targetSequence = narrativeData.find((seq: NarrativeSequence) => seq.id === narrativeSequenceId);
      if (!targetSequence) throw new Error(`シーケンス '${narrativeSequenceId}' が見つかりません。`);

      setCurrentNarrativeSequence(targetSequence);
      setAllStories(storiesData);
      setAllEventFlows(eventFlowsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [narrativeSequenceId]);

  useEffect(() => { loadAllData(); }, [loadAllData]);

  // 物語ステップの再生
  const playNarrativeStep = useCallback((index: number) => {
    if (!currentNarrativeSequence || index >= currentNarrativeSequence.steps.length) {
      setCurrentNarrativeSequence(null);
      bgmRef.current?.pause();
      return;
    }

    const step = currentNarrativeSequence.steps[index];
    setCurrentNarrativeStepIndex(index);

    if (step.type === "video") {
      setCurrentEventFlow(null);
      setCurrentEventNode(null);
      setPendingEventIds([]);
    } else if (step.type === "story") {
      const story = allStories.find(s => s.id === step.storyId);
      const extractedEventIds: string[] = [];
      story?.characters?.forEach(char => {
        char.path.forEach(p => {
          if (p.eventId && !extractedEventIds.includes(p.eventId)) {
            extractedEventIds.push(p.eventId);
          }
        });
      });

      if (extractedEventIds.length > 0) {
        startNextEvent(extractedEventIds[0], extractedEventIds.slice(1));
      } else {
        playNarrativeStep(index + 1);
      }
    }
  }, [currentNarrativeSequence, allStories, allEventFlows]);

  const startNextEvent = (nextId: string, remainingIds: string[]) => {
    const eventFlow = allEventFlows.find(f => f.id === nextId);
    if (eventFlow) {
      setCurrentEventFlow(eventFlow);
      const nodesMap: Record<string, EventFlowNode> = {};
      eventFlow.nodes.forEach(n => nodesMap[n.id] = n);
      setEventNodesMap(nodesMap);
      const startNode = eventFlow.nodes.find(n => n.type === 'start') || eventFlow.nodes[0];
      setCurrentEventNode(startNode);
      setPendingEventIds(remainingIds);
    } else if (remainingIds.length > 0) {
      startNextEvent(remainingIds[0], remainingIds.slice(1));
    } else {
      playNarrativeStep(currentNarrativeStepIndex + 1);
    }
  };

  // BGM再生制御
  useEffect(() => {
    const step = currentNarrativeSequence?.steps[currentNarrativeStepIndex];
    if (step?.type === "story" && hasInteracted) {
      const story = allStories.find(s => s.id === step.storyId);
      if (story?.bgmUrl && bgmRef.current) {
        const resolvedBgmUrl = resolveMediaUrl(story.bgmUrl);
        if (bgmRef.current.src !== window.location.origin + resolvedBgmUrl) {
          bgmRef.current.src = resolvedBgmUrl;
          bgmRef.current.loop = true;
          bgmRef.current.play().catch(console.error);
        }
      }
    } else if (step?.type === "video") {
      bgmRef.current?.pause();
    }
  }, [currentNarrativeStepIndex, currentNarrativeSequence, allStories, hasInteracted]);

  // 音声・動画の自動再生
  useEffect(() => {
    if (currentEventNode?.audioUrl && audioRef.current && hasInteracted) {
      audioRef.current.src = resolveMediaUrl(currentEventNode.audioUrl);
      audioRef.current.play().catch(console.error);
    }
  }, [currentEventNode, hasInteracted]);

  useEffect(() => {
    const step = currentNarrativeSequence?.steps[currentNarrativeStepIndex];
    if (step?.type === "video" && videoRef.current && hasInteracted) {
      videoRef.current.play().catch(console.error);
    }
  }, [currentNarrativeStepIndex, currentNarrativeSequence, hasInteracted]);

  const handleAdvance = (nextIdOverride?: string) => {
    const nextId = nextIdOverride || currentEventNode?.nextStepId;
    if (nextId && eventNodesMap[nextId]) {
      setCurrentEventNode(eventNodesMap[nextId]);
    } else if (pendingEventIds.length > 0) {
      startNextEvent(pendingEventIds[0], pendingEventIds.slice(1));
    } else {
      playNarrativeStep(currentNarrativeStepIndex + 1);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  if (currentNarrativeStepIndex === -1 && currentNarrativeSequence) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-slate-900 text-white p-6 text-center">
        <h2 className="text-4xl font-bold mb-4">{currentNarrativeSequence.title}</h2>
        <p className="mb-10 text-slate-400 max-w-md">{currentNarrativeSequence.description}</p>
        <button 
          onClick={() => { setHasInteracted(true); playNarrativeStep(0); }}
          className="bg-white text-slate-900 px-10 py-4 rounded-full text-xl font-bold shadow-2xl hover:scale-105 transition"
        >
          物語の記憶を辿る
        </button>
      </div>
    );
  }

  if (!currentNarrativeSequence) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-center bg-slate-50">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">物語は静かに幕を閉じた</h2>
        <button onClick={() => window.history.back()} className="text-blue-600 font-bold hover:underline">戻る</button>
      </div>
    );
  }

  const step = currentNarrativeSequence.steps[currentNarrativeStepIndex];
  const speakerId = currentEventNode?.speakerId;
  const asset = speakerId ? masterAssets[speakerId] : null;
  const charImageUrl = asset?.imageUrl ? resolveMediaUrl(asset.imageUrl) : null;

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col items-center min-h-screen bg-slate-50">
      <audio ref={bgmRef} hidden />
      <div className="w-full flex justify-between items-center mb-8 border-b pb-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{currentNarrativeSequence.title}</h3>
        <span className="text-xs text-slate-400">Step {currentNarrativeStepIndex + 1} / {currentNarrativeSequence.steps.length}</span>
      </div>

      {step.type === "video" ? (
        <div className="w-full animate-in zoom-in-95 duration-700 mt-10">
          <video 
            ref={videoRef} src={resolveMediaUrl(step.videoUrl)} 
            className="w-full rounded-2xl shadow-2xl border-4 border-white" 
            autoPlay controls onEnded={() => playNarrativeStep(currentNarrativeStepIndex + 1)} 
          />
        </div>
      ) : (
        <div className="w-full flex flex-col items-center mt-6">
          <div className="relative w-72 h-72 mb-6">
            {charImageUrl ? (
              <Image 
                src={charImageUrl} alt={currentEventNode?.speakerName || ""} 
                fill className="object-contain drop-shadow-2xl animate-in slide-in-from-bottom-10 duration-700" 
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-slate-200 rounded-full flex items-center justify-center text-slate-400 border-4 border-white shadow-inner">
                No Portrait
              </div>
            )}
          </div>

          <div className="w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 relative mt-4">
            <div className="absolute -top-4 left-10 bg-blue-600 text-white px-6 py-1 rounded-full text-sm font-bold shadow-lg">
              {currentEventNode?.speakerName || "???"}
            </div>
            <p className="text-xl leading-relaxed text-slate-800 min-h-[4rem] whitespace-pre-wrap font-medium">
              {currentEventNode?.content}
            </p>
            
            <audio ref={audioRef} onEnded={() => currentEventNode?.type === 'story' && !currentEventNode.choices && handleAdvance()} />

            <div className="mt-8 flex flex-col gap-3">
              {currentEventNode?.choices ? (
                currentEventNode.choices.map((c, i) => (
                  <button key={i} onClick={() => handleAdvance(c.nextStepId)} className="bg-slate-50 p-4 rounded-xl hover:bg-blue-50 text-left border-2 border-transparent hover:border-blue-200 transition-all font-bold text-slate-700">
                    {c.text}
                  </button>
                ))
              ) : (
                <button onClick={() => handleAdvance()} className="self-end bg-slate-900 text-white px-10 py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all font-bold">
                  次へ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequencePlayerClient;
