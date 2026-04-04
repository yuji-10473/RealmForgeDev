'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { useAuth, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { Map, Users, Sparkles, Sword, Mail, Lock, Info, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

/**
 * AdSense 広告ユニットコンポーネント
 */
function GoogleAd() {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  }, []);

  return (
    <div className="my-12 flex flex-col items-center">
      <span className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">スポンサーリンク</span>
      <div className="w-full max-w-[728px] min-h-[90px] bg-muted/20 border border-dashed rounded flex items-center justify-center overflow-hidden">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%' }}
             data-ad-client="ca-pub-7148894079314433"
             data-ad-slot="2910984428"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}

export function LandingScreen() {
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
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
    <div className="min-h-screen bg-background flex flex-col items-center p-4 relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full space-y-12 text-center z-10 py-20">
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

        {/* AdSense Placement */}
        <GoogleAd />

        {/* Detailed Information Section (SEO/AdSense Content) */}
        <div className="text-left space-y-12 py-12 border-t border-b bg-muted/5 px-6 rounded-3xl">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
              <Info className="text-primary h-8 w-8" />
              RealmForgeで始まる、あなたの創作の旅
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              RealmForgeは、プログラミングの専門知識がなくても、自分だけの壮大な2Dロールプレイングゲーム（RPG）をゼロから構築できる革新的なブラウザベースのプラットフォームです。私たちのミッションは、すべての物語の語り手に、自らの空想の世界を形にし、それを他者と共有するための強力かつシンプルなツールを提供することです。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">直感的なビジュアル制作</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                タイルベースのマップエディターを使用すれば、広大なフィールドから詳細な建物の内装まで、クリックとドラッグだけで簡単に作成できます。複数のワールドを定義し、それらをドアやワープポイントで繋ぐことで、プレイヤーが探索できるシームレスな冒険体験を構築しましょう。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">AIによるナラティブの強化</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                最新の生成AI技術を統合した「ストーリーアシスト」機能が、あなたの創作をサポートします。キャラクターの深いバックストーリー、村人との自然な会話、あるいは世界観の根幹を成す伝説のアイデアをAIが提案。AIと対話しながら、より深みのあるゲーム体験を作り上げることが可能です。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">高度なゲーム内システム</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                HPや空腹度の管理、レベルアップに伴う補正、村人との好感度システムなど、RPGに欠かせない複雑なロジックがプリセットとして用意されています。さらに、ショップでの売買や特定の場所でのランダムイベントなど、プレイヤーを飽きさせない多彩なギミックを簡単に導入できます。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">開発と検証のサイクル</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                作成したマップは、即座に「プレイテスト」モードで検証できます。実際の操作感、イベントの発生フラグ、アイテムの有用性などを開発者自身がリアルタイムでチェック。納得がいくまで調整を繰り返し、あなたの「理想のRPG」を完璧な形に仕上げることができます。
              </p>
            </div>
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
