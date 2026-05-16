'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingSpinner from "../ui/loading-spinner";

type NodeData = {
  id: string;
  type: string;
  content: string;
  speakerId?: string;
  speakerName?: string;
  audioUrl?: string;
  imageUrl?: string;
  nextStepId?: string | null;
  choices?: { text: string; nextStepId: string }[];
};

type EventFlow = {
  id: string;
  name: string;
  startNodeId: string;
  nodes: Record<string, NodeData> | NodeData[];
};

type Villager = {
  id: string;
  name: string;
  imageUrl?: string;
};

export default function EventSimulatorClient({ eventId, onEventComplete }: { eventId: string; onEventComplete: () => void; }) {
  const [eventFlow, setEventFlow] = useState<EventFlow | null>(null);
  const [currentNode, setCurrentNode] = useState<NodeData | null>(null);
  const [villagers, setVillagers] = useState<Record<string, Villager>>({});
  const [isLoading, setIsLoading] = useState(true);

  const onEventCompleteRef = useRef(onEventComplete);
  useEffect(() => {
    onEventCompleteRef.current = onEventComplete;
  }, [onEventComplete]);

  useEffect(() => {
    let isCancelled = false;

    async function loadVillagers() {
      try {
        const response = await fetch(`/data/villagers.json`);
        const villagersData = await response.json();
        if (isCancelled) return;
        const villagersMap = villagersData.reduce((map: Record<string, Villager>, villager: Villager) => {
          map[villager.id] = villager;
          return map;
        }, {});
        setVillagers(villagersMap);
      } catch (error) {
        if (isCancelled) return;
        console.error("Failed to load villagers data:", error);
      }
    }
    
    loadVillagers();
    return () => { isCancelled = true; };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function loadEventFlow() {
      if (!eventId) {
        setCurrentNode(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      try {
        const response = await fetch(`/data/eventFlows.json`);
        const allFlows = await response.json();
        const flow = allFlows[eventId];

        if (isCancelled) return;

        if (flow) {
          setEventFlow(flow);
          const nodeMap = Array.isArray(flow.nodes)
            ? flow.nodes.reduce((map, node) => { map[node.id] = node; return map; }, {} as Record<string, NodeData>)
            : flow.nodes;
          
          const startNode = nodeMap[flow.startNodeId];
          setCurrentNode(startNode || null);

        } else {
          console.error(`Event with ID "${eventId}" not found.`);
          setEventFlow(null);
          setCurrentNode(null);
        }
      } catch (error) {
        if (isCancelled) return;
        console.error("Failed to load event flow:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    if (Object.keys(villagers).length > 0) {
      loadEventFlow();
    } else {
        setIsLoading(true);
    }

    return () => { isCancelled = true; };
  }, [eventId, villagers]);

  const handleNext = useCallback((nextStepId: string | null) => {
    if (nextStepId && eventFlow) {
      const nodeMap = Array.isArray(eventFlow.nodes)
        ? eventFlow.nodes.reduce((map, node) => { map[node.id] = node; return map; }, {} as Record<string, NodeData>)
        : eventFlow.nodes;
      const nextNode = nodeMap[nextStepId];
      setCurrentNode(nextNode || null);
    } else {
      onEventCompleteRef.current();
    }
  }, [eventFlow]);

  const speakerCharacter = currentNode?.speakerId ? villagers[currentNode.speakerId] : null;

  let avatarImageUrl = undefined;
  if (speakerCharacter && speakerCharacter.imageUrl) {
    avatarImageUrl = speakerCharacter.imageUrl.startsWith('/') 
      ? speakerCharacter.imageUrl 
      : `/${speakerCharacter.imageUrl}`;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  }
  
  if (!currentNode) {
    return <div>イベントの開始、または次のノードの読み込みに失敗しました。</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{eventFlow?.name || 'イベント'}</CardTitle>
        <CardDescription>イベントシミュレーター</CardDescription>
      </CardHeader>
      <CardContent>
        <div key={currentNode.id}>
          {currentNode.imageUrl && (
            <div className="mb-4">
              <Image
                src={currentNode.imageUrl}
                alt={currentNode.speakerName || "Event Image"}
                width={1280}
                height={720}
                className="w-full h-auto rounded-md object-cover"
              />
            </div>
          )}
          <div className="flex items-start gap-4">
            {avatarImageUrl ? (
                <Image
                    src={avatarImageUrl}
                    alt={speakerCharacter?.name || ''}
                    width={48}
                    height={48}
                    className="rounded-full bg-muted border"
                />
            ) : (
                <div className="w-12 h-12 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-sm font-bold text-muted-foreground">{speakerCharacter?.name || currentNode.speakerName || "ナレーション"}</div>
              <p className="text-lg mt-1 whitespace-pre-wrap">{currentNode.content}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-end gap-2">
        {currentNode.type === "choice" && currentNode.choices ? (
          currentNode.choices.map((choice, index) => (
            <Button key={index} onClick={() => handleNext(choice.nextStepId)} className="w-full">
              {choice.text}
            </Button>
          ))
        ) : (
          <Button onClick={() => handleNext(currentNode.nextStepId || null)}>
            次へ
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
