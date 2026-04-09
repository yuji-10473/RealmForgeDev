'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { useAuth, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { Map, Users, Sparkles, Sword, Mail, Lock, Info, CheckCircle2, FileText, ShieldCheck, Presentation, BookOpen, ArrowRight, MessageCircle, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import packageJson from "../../../package.json";

/**
 * AdSense 広告ユニットコンポーネント
 * 最小の高さを確保して CLS (Layout Shift) を防ぎます。
 */
function GoogleAd() {
  useEffect(() => {
    const pushAd = () => {
      try {
        if (typeof window !== 'undefined') {
          const adsbygoogle = (window as any).adsbygoogle;
          if (adsbygoogle && typeof adsbygoogle.push === 'function') {
            const unprocessedAds = document.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status="done"])');
            if (unprocessedAds.length > 0) {
              adsbygoogle.push({});
            }
          }
        }
      } catch (e) {
        console.debug("AdSense push handled or already processed:", e);
      }
    };

    const timeoutId = setTimeout(pushAd, 200);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="my-12 flex flex-col items-center">
      <span className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">スポンサーリンク</span>
      <div className="w-full max-w-[728px] min-h-[100px] bg-muted/10 border border-dashed rounded-lg flex items-center justify-center overflow-hidden">
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', minHeight: '90px' }}
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
  const version = packageJson.version;

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
    <div className="min-h-screen bg-background flex flex-col items-center relative overflow-x-hidden">
      {/* Navigation Header */}
      <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RealmforgeLogo className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="font-headline text-xl font-bold tracking-tight leading-none">RealmForge</span>
              <span className="text-[10px] text-muted-foreground font-mono">Ver {version}</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> About
            </Link>
            <Link href="/showcase" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Presentation className="h-3 w-3" /> 作品紹介
            </Link>
            <Link href="/tutorial" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> チュートリアル
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> お問い合わせ
            </Link>
          </nav>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary opacity-5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent opacity-5 rounded-full blur-[120px]" />
        
        <div className="absolute inset-0 opacity-15">
          <Image 
            src="/images/syugo.png" 
            alt="Background Illustration" 
            fill 
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>

      <div className="max-w-4xl w-full space-y-12 text-center z-10 py-20 px-4">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-2xl ring-4 ring-primary/20">
              <Sparkles className="h-20 w-20 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold font-headline tracking-tighter text-foreground">
            AIと紡ぐ、あなただけの壮大な物語。
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            最新の生成AIと対話し、鎌倉時代の深淵を形にする。あなたの想像力が、歴史の「もしも」を創り出すRPG制作プラットフォーム。
          </p>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">AI共創エンジニアリング</h3>
            <p className="text-sm text-muted-foreground">プロンプト一つで当時の人物背景や複雑なイベント分岐を生成。AIがあなたのクリエイティブ・パートナーになります。</p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">歴史アセット・タイル</h3>
            <p className="text-sm text-muted-foreground">13世紀の日本を再現するために最適化されたアセット群。AIによる歴史考証に基づいたマップデザインが可能です。</p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Sword className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">即時プレイテスト</h3>
            <p className="text-sm text-muted-foreground">構築した世界をワンクリックでテスト。AIが生成した対話のテンポやゲームバランスをリアルタイムでリファインできます。</p>
          </div>
        </div>

        {/* AdSense Placement */}
        <GoogleAd />

        {/* Detailed Information Section (SEO/AdSense Content) */}
        <div id="about" className="text-left space-y-12 py-12 border-t border-b bg-muted/5 px-6 rounded-3xl">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
              <Sparkles className="text-primary h-8 w-8" />
              生成AIが解き放つ、RPG制作の新たな可能性
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              RealmForgeは、プログラミングや複雑な設定の壁を取り払い、純粋な「物語の構築」に集中できる環境を提供します。膨大な歴史データと生成AIを統合することで、鎌倉時代という激動の時代を舞台にした深みのあるRPGを、誰でも、驚くほど短時間で制作することができます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">AIによるナラティブの自動生成</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                NPC一人ひとりの会話や、プレイヤーの選択によって分岐するシナリオをAIが考案。歴史の史実をなぞるだけでなく、あなたが想像した「歴史のIF」を整合性を保ちながら物語へと昇華させます。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">直感的なビジュアルエディター</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                AIが提案したデザイン案を、タイルベースのエディターで即座に具現化。建物、人物、収集ポイントを配置するだけで、13世紀の息吹を感じさせるマップが完成します。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">高度なサバイバル・経済ロジック</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                HP、空腹度、当時の通貨による取引、料理屋への納品システムなど、ゲームに必要な基幹システムを標準搭載。AIと相談しながら、最適なパラメータ調整を行うことが可能です。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">制作と改善の高速ループ</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                「物語を生成し、配置し、遊ぶ」。このサイクルを極限まで高速化しました。AIとの対話を繰り返すことで、一人では到達できなかったクオリティの歴史RPGを作り上げることができます。
              </p>
            </div>
          </div>

          <div className="flex justify-center pt-8">
            <Link href="/showcase">
              <Button variant="outline" className="group">
                実際の制作例を見る
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
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
              <Link href="/tos" className="underline hover:text-primary mx-1">利用規約</Link>
              と
              <Link href="/privacy" className="underline hover:text-primary mx-1">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>

      {/* Consistent Footer for all public pages */}
      <footer className="w-full border-t bg-muted/20 py-12 mt-20 z-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <RealmforgeLogo className="h-6 w-6 text-primary" />
              <div className="flex flex-col">
                <span className="font-headline text-lg font-bold">RealmForge</span>
                <span className="text-[10px] text-muted-foreground font-mono">Ver {version}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              創造性を解き放ち、AIと共に歴史を紡ぐ。
              RealmForgeはすべての歴史創作者のためのプラットフォームです。
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">コンテンツ</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">このサイトについて</Link></li>
              <li><Link href="/showcase" className="hover:text-primary transition-colors">作品紹介</Link></li>
              <li><Link href="/tutorial" className="hover:text-primary transition-colors">チュートリアル</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">サポート</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/contact" className="hover:text-primary transition-colors">お問い合わせ</Link></li>
              <li><Link href="/tos" className="hover:text-primary transition-colors">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">プライバシーポリシー</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">クッキーについて</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              当サイトでは、サービスの改善および広告配信のためにクッキー（Cookie）を使用しています。
              詳細はプライバシーポリシーをご確認ください。
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-muted-foreground">© 2024 RealmForge Project. All rights reserved.</p>
          <div className="opacity-20 pointer-events-none">
            <p className="text-[10px] font-mono tracking-widest uppercase">AI-Powered Historical Creation</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
