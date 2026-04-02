
'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { useAuth, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { Map, Users, Sparkles, Sword, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export function LandingScreen() {
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Switched to Redirect method as requested
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleEmailSignIn = () => {
    if (!email || !password) return;
    initiateEmailSignIn(auth, email, password);
  };

  const handleEmailSignUp = () => {
    if (!email || !password) return;
    initiateEmailSignUp(auth, email, password);
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

        <div className="pt-8 max-w-sm mx-auto">
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="google">Google ログイン</TabsTrigger>
              <TabsTrigger value="email">メールアドレス</TabsTrigger>
            </TabsList>
            
            <TabsContent value="google">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleGoogleSignIn}
              >
                <Users className="mr-2 h-6 w-6" />
                Google でログイン
              </Button>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4 text-left">
              <Card className="bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="example@mail.com" 
                        className="pl-10" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-10" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleEmailSignIn} className="flex-1">ログイン</Button>
                    <Button onClick={handleEmailSignUp} variant="outline" className="flex-1">新規登録</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex flex-col items-center gap-2">
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
