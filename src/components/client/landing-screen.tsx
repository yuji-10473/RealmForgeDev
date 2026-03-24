'use client';

import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { useAuth, useFirestore } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc } from "firebase/firestore";
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Map, Users, Sparkles, Sword } from "lucide-react";

export function LandingScreen() {
  const auth = useAuth();
  const firestore = useFirestore();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Create a user profile in Firestore if it doesn't exist
      const userRef = doc(firestore, 'users', user.uid);
      setDocumentNonBlocking(userRef, {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }, { merge: true });

    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full space-y-12 text-center z-10">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-2xl ring-4 ring-primary/20">
              <RealmforgeLogo className="h-20 w-20 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold font-headline tracking-tighter text-foreground">
            RealmForge
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            自分だけの2D RPGを創造し、テストし、共有するためのプラットフォーム。
            直感的なツールで、あなたの想像する世界を形にしましょう。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">マップエディター</h3>
            <p className="text-sm text-muted-foreground">タイルベースの直感的な操作で、広大なワールドや詳細なルームを構築できます。</p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">ストーリーアシスト</h3>
            <p className="text-sm text-muted-foreground">AIの力を借りて、魅力的なキャラクターの背景や対話、物語の断片を生成します。</p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Sword className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">プレイテスト</h3>
            <p className="text-sm text-muted-foreground">作成した世界をすぐに冒険。セーブ機能や戦闘シミュレーターでバランスを調整できます。</p>
          </div>
        </div>

        <div className="pt-8 space-y-6">
          <Button 
            size="lg" 
            className="h-14 px-10 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={handleSignIn}
          >
            <Users className="mr-2 h-6 w-6" />
            Google でログインしてプレイを開始
          </Button>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted-foreground">
              ログインすることで、当社の
              <a href="#" className="underline hover:text-primary mx-1">利用規約</a>
              と
              <a href="#" className="underline hover:text-primary mx-1">プライバシーポリシー</a>
              に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 opacity-20 pointer-events-none">
        <p className="text-[10px] font-mono tracking-widest uppercase">Ancient Parchment Style</p>
      </div>
    </div>
  );
}
