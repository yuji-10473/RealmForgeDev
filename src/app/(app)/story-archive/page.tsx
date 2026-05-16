// src/app/(app)/story-archive/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/loading-spinner";

interface NarrativeSequenceStep {
  type: "video" | "story";
  videoTitle?: string;
  videoUrl?: string;
  storyId?: string; // public/data/stories.json の id を参照
  worldId?: string;
}

interface NarrativeSequence {
  id: string;
  title: string;
  description?: string;
  steps: NarrativeSequenceStep[];
  createdAt?: { nanoseconds: number; seconds: number };
}

const StoryArchivePage: React.FC = () => {
  const [narrativeSequences, setNarrativeSequences] = useState<NarrativeSequence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNarrativeSequences = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/data/narrativeSequences.json`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch narrativeSequences from /data/narrativeSequences.json: ${res.status} ${res.statusText} - ${errorText}`);
        }
        const data: NarrativeSequence[] = await res.json();
        console.log("Fetched narrativeSequences data:", data); // デバッグ用
        setNarrativeSequences(data);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching narrative sequences in StoryArchivePage:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNarrativeSequences();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center text-lg">エラーが発生しました: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">物語の記憶</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {narrativeSequences.length > 0 ? (
          narrativeSequences.map((sequence) => (
            <Link 
              key={sequence.id} 
              href={`/sequence-player?narrativeSequenceId=${sequence.id}`} // narrativeSequenceId を渡す
              className="block p-6 border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-white"
            >
              <h2 className="text-xl font-semibold mb-2 text-blue-700">{sequence.title || sequence.id}</h2>
              <p className="text-gray-600">{sequence.description || "説明なし"}</p>
            </Link>
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500 text-lg">物語が見つかりませんでした。</p>
        )}
      </div>
    </div>
  );
};

export default StoryArchivePage;
