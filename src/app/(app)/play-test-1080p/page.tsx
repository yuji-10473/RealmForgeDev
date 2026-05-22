'use client';

import { useState, useEffect } from 'react';
import { PlayTest1080pClient } from "@/components/client/play-test-1080p-client";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// This is the new Load screen component that will be shown before the game starts.
function LoadScreen({
  saveData,
  isSaveLoading,
  onContinue,
}: {
  saveData: any,
  isSaveLoading: boolean,
  onContinue: () => void,
}) {
  const lastSaved = saveData?.updatedAt?.toDate();

  return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-center">
       <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">プレイテスト (1080p)</CardTitle>
          <CardDescription>
            {saveData 
              ? "保存されたデータから冒険を再開します。" 
              : "保存されたデータが見つかりません。新しい冒険を始めましょう。"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            size="lg"
            className="w-full"
            onClick={onContinue}
            disabled={isSaveLoading}
          >
            {isSaveLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "ロード"
            )}
          </Button>
        </CardContent>
        {lastSaved && (
          <CardFooter>
            <p className="text-sm text-muted-foreground w-full">
              最終セーブ: {format(lastSaved, 'yyyy年M月d日 HH:mm', { locale: ja })}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}


export default function PlayTest1080pPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  // 'menu' is the new load screen, 'playing' is the actual game
  const [gameState, setGameState] = useState<'loading' | 'menu' | 'playing'>('loading');
  // This will hold the save data to pass to the game client
  const [initialSave, setInitialSave] = useState<any | null>(null);

  // Memoize the document reference for useDoc, this is critical for performance
  const saveDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'playtestSaves', user.uid);
  }, [user, firestore]);

  const { data: saveData, isLoading: isSaveLoading } = useDoc(saveDocRef);

  // Once user and save data loading is finished, show the menu
  useEffect(() => {
    if (!isUserLoading && !isSaveLoading) {
      setGameState('menu');
    }
  }, [isUserLoading, isSaveLoading]);


  const handleContinue = () => {
    // We set whatever data we have (could be null) and start playing
    setInitialSave(saveData);
    setGameState('playing');
  };

  const handleNewGame = () => {
    setInitialSave(null);
    setGameState('playing');
  };

  // 1. Show loader while checking for user
  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 2. Deny access if not logged in
  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-4rem)] text-center">
        <h1 className="text-2xl font-bold mb-4">アクセスが拒否されました</h1>
        <p className="text-muted-foreground mb-6">プレイテストを行うにはログインが必要です。</p>
        <p className="text-sm text-muted-foreground">サイドバーのボタンからログインしてください。</p>
      </div>
    );
  }

  // 3. Show game or load screen
  if (gameState === 'playing') {
    return (
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        <header className="flex-shrink-0 mb-1">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg md:text-xl font-bold font-headline leading-none">プレイテスト (1080p)</h1>
            <p className="text-xs text-muted-foreground leading-none">マップ上をキャラクターを動かしてテストします。</p>
          </div>
        </header>
        <div className="flex-grow min-h-0">
          <PlayTest1080pClient user={user} initialData={initialSave} />
        </div>
      </div>
    );
  }

  // By default, show the loading or menu screen
  return (
    <LoadScreen 
      saveData={saveData}
      isSaveLoading={isSaveLoading || isUserLoading}
      onContinue={handleContinue}
    />
  );
}
