'use client';

import { PlayTestClient } from "@/components/client/play-test-client";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function PlayTestPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-6rem)] text-center">
        <h1 className="text-2xl font-bold mb-4">アクセスが拒否されました</h1>
        <p className="text-muted-foreground mb-6">プレイテストを行うにはログインが必要です。</p>
        {/* We can't use AuthButton here as it requires router which can't be used in a server component with this setup */}
        <p className="text-sm text-muted-foreground">サイドバーのボタンからログインしてください。</p>

      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      <header className="py-4 flex-shrink-0">
        <h1 className="text-3xl font-bold font-headline">プレイテスト</h1>
        <p className="text-muted-foreground">マップ上をキャラクターを動かしてテストします。</p>
      </header>
      <div className="flex-grow min-h-0">
        <PlayTestClient user={user} />
      </div>
    </div>
  );
}
