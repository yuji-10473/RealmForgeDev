// src/app/(app)/sequence-player/page.tsx
"use client";

import { Suspense } from 'react';
import SequencePlayerClient from "@/components/client/sequence-player-client";
import LoadingSpinner from "@/components/ui/loading-spinner"; 
import { useSearchParams } from 'next/navigation';

function SequencePlayerPageContent() {
  const searchParams = useSearchParams();
  const narrativeSequenceId = searchParams.get('narrativeSequenceId'); // 変更点：narrativeSequenceIdを取得

  if (!narrativeSequenceId) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500 text-xl">
        エラー: narrativeSequenceId が指定されていません。
      </div>
    );
  }

  return <SequencePlayerClient narrativeSequenceId={narrativeSequenceId} />; // 変更点：narrativeSequenceIdを渡す
}

export default function SequencePlayerPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SequencePlayerPageContent />
    </Suspense>
  );
}
