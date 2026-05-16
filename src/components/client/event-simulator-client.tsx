
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";
import { LoadingSpinner } from "../ui/loading-spinner";

type NodeData = {
  id: string;
  type: string;
  content: string;
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
  nodes: Record<string, NodeData> | NodeData[]; // nodes can be object or array
};

export default function EventSimulatorClient({ eventId, onEventComplete }: { eventId: string; onEventComplete: () => void; }) {
  const [eventFlow, setEventFlow] = useState<EventFlow | null>(null);
  const [currentNode, setCurrentNode] = useState<NodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 親から渡される onEventComplete は再生成される可能性があるため、Refに保持して常に最新の関数を参照できるようにする
  const onEventCompleteRef = useRef(onEventComplete);
  useEffect(() => {
    onEventCompleteRef.current = onEventComplete;
  }, [onEventComplete]);

  useEffect(() => {
    // useEffectのクリーンアップ処理が実行された後に非同期処理が完了した場合に、
    // 古いコンポーネントの状態を更新しないようにするためのフラグ
    let isCancelled = false;

    async function loadEventFlow() {
      if (!eventId) {
        setCurrentNode(null);
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
          // eventFlows.jsonのnodesが配列でもオブジェクトでも対応できるようにMapに変換
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

    loadEventFlow();

    // クリーンアップ関数
    return () => {
      isCancelled = true;
    };
  }, [eventId]); // eventIdが変更されたときのみ、このeffectを再実行する

  const handleNext = useCallback((nextStepId: string | null) => {
    if (nextStepId && eventFlow) {
      const nodeMap = Array.isArray(eventFlow.nodes)
        ? eventFlow.nodes.reduce((map, node) => { map[node.id] = node; return map; }, {} as Record<string, NodeData>)
        : eventFlow.nodes;
      const nextNode = nodeMap[nextStepId];
      setCurrentNode(nextNode || null);
    } else {
      // nextStepIdがnullの場合はシーケンス完了
      onEventCompleteRef.current();
    }
  }, [eventFlow]);

  if (isLoading) return <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>;
  if (!currentNode) {
    // currentNodeが見つからない場合、ロード失敗か終端に到達したとみなし、親に完了を通知する
    // ただし、初回レンダリング時やeventId変更直後を考慮し、isLoadingがfalseの場合のみ実行
    if (!isLoading) {
        // このコンポーネントはもはや不要なので、親に完了を伝える
        // onEventCompleteRef.current();
    }
    return <div>イベントの開始、または次のノードの読み込みに失敗しました。</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{eventFlow?.name || 'イベント'}</CardTitle>
        <CardDescription>イベントシミュレーター</CardDescription>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentNode.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {currentNode.imageUrl && (
              <div className="mb-4">
                <AspectRatio ratio={16 / 9}>
                  <Image
                    src={currentNode.imageUrl}
                    alt={currentNode.speakerName || "Event Image"}
                    fill
                    className="rounded-md object-cover"
                    unoptimized
                    placeholder="blur"
                    blurDataURL={placeholderImages.default}
                  />
                </AspectRatio>
              </div>
            )}
            <div className="text-sm text-muted-foreground">{currentNode.speakerName || "ナレーション"}</div>
            <p className="text-lg whitespace-pre-wrap">{currentNode.content}</p>
          </motion.div>
        </AnimatePresence>
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
