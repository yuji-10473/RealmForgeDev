'use client';

import { useState, useEffect } from 'react';
import { PlayTestClient } from "@/components/client/play-test-client";
import { useUser, useFirestore, useMemoFirebase, useDoc } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// セーブデータ選択／開始画面コンポーネント
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
    <div className="flex flex-col justify-center items-center h-[calc(100vh-6rem)] text-center">
       <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">プレイテスト</CardTitle>
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

export default function PlayTestPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  // 'loading' (初期確認) -> 'menu' (セーブ選択) -> 'playing' (ゲーム本体マウント、内部でプリロード＆ロード画面表示)
  const [gameState, setGameState] = useState<'loading' | 'menu' | 'playing'>('loading');
  const [initialSave, setInitialSave] = useState<any | null>(null);

  // Memoize the document reference for useDoc
  const saveDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'playtestSaves', user.uid);
  }, [user, firestore]);

  const { data: saveData, isLoading: isSaveLoading } = useDoc(saveDocRef);

  // ユーザーとセーブデータの取得が完了したらメニュー画面へ
  useEffect(() => {
    if (!isUserLoading && !isSaveLoading && gameState === 'loading') {
      setGameState('menu');
    }
  }, [isUserLoading, isSaveLoading, gameState]);

  const handleContinue = () => {
    setInitialSave(saveData);
    setGameState('playing');
  };

  // 1. ユーザーチェック中
  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 2. 未ログインの場合
  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-6rem)] text-center">
        <h1 className="text-2xl font-bold mb-4">アクセスが拒否されました</h1>
        <p className="text-muted-foreground mb-6">プレイテストを行うにはログインが必要です。</p>
        <p className="text-sm text-muted-foreground">サイドバーのボタンからログインしてください。</p>
      </div>
    );
  }

  // 3. ゲーム画面（内部でマスターデータ取得＆全画像onload完了までLoadingOverlayが表示される）
  if (gameState === 'playing') {
    return (
      <div className="h-[calc(100vh-6rem)] flex flex-col">
        <header className="flex-shrink-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-headline leading-none">プレイテスト</h1>
          <p className="text-sm text-muted-foreground leading-none">マップ上をキャラクターを動かしてテストします。</p>
        </header>
        <div className="flex-grow min-h-0">
          <PlayTestClient user={user} initialData={initialSave} />
        </div>
      </div>
    );
  }

  // 4. セーブデータ選択メニュー
  return (
    <LoadScreen 
      saveData={saveData}
      isSaveLoading={isSaveLoading || isUserLoading}
      onContinue={handleContinue}
    />
  );
}
