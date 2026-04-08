'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { useAuth, initiateEmailSignIn, initiateEmailSignUp } from "@/firebase";
import { GoogleAuthProvider, signInWithRedirect } from "firebase/auth";
import { Map, Users, Sparkles, Sword, Mail, Lock, Info, CheckCircle2, FileText, ShieldCheck, Presentation, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import packageJson from "../../../package.json";

/**
 * AdSense 広告ユニットコンポーネント
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
      <span className="text-[10px] text-muted-foreground mb-2 uppercase tracking-widest">広告</span>
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
            <Link href="/showcase" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Presentation className="h-3 w-3" /> 作品紹介
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">機能</Link>
            <Link href="#about" className="text-sm font-medium hover:text-primary transition-colors">当サービスについて</Link>
            <Link href="/tos" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <FileText className="h-3 w-3" /> 利用規約
            </Link>
            <Link href="/privacy" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> プライバシーポリシー
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
              <History className="h-20 w-20 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold font-headline tracking-tighter text-foreground">
            自分だけの「歴史」を創造する。
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            鎌倉時代の歴史をAIと対話し、形にする。直感的なエディターと高度な生成AIが、あなたの構想を壮大な物語へと昇華させます。
          </p>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">歴史都市の構築</h3>
            <p className="text-sm text-muted-foreground">鎌倉の街並みや寺社、武家屋敷をタイルエディターで自由に設計。当時の景観を直感的に再現できます。</p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">AI歴史考証アシスト</h3>
            <p className="text-sm text-muted-foreground">AIが当時の人物の口調や社会背景を提案。歴史のIF（もしも）を含めた魅力的な対話を生成します。</p>
          </div>
          <div className="p-6 bg-card border rounded-xl shadow-sm space-y-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Sword className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg">歴史の追体験</h3>
            <p className="text-sm text-muted-foreground">作成した世界を即座に冒険。御家人としての生活や幕府の経済システムをプレイテストで検証できます。</p>
          </div>
        </div>

        {/* AdSense Placement */}
        <GoogleAd />

        {/* Detailed Information Section (SEO/AdSense Content) */}
        <div id="about" className="text-left space-y-12 py-12 border-t border-b bg-muted/5 px-6 rounded-3xl">
          <div className="space-y-4 max-w-3xl">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
              <History className="text-primary h-8 w-8" />
              RealmForgeで始まる、時空を超えた創作の旅
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              RealmForgeは、生成AIの力を借りて日本の鎌倉時代という激動の時代をRPGとして再構築するためのプラットフォームです。私たちの使命は、歴史愛好家や物語の創作者が、AIとの対話を通じて当時の空気感を抽出し、それを誰もが遊べる体験へと変換できる場所を提供することです。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">史実と創造の融合</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                タイルベースのマップエディターは、13世紀の日本を再現するために最適化されています。寺社の境内から武家屋敷の構造まで、クリックとドラッグだけで構築可能。AIによる歴史考証データを下敷きにすることで、よりリアリティのある世界観を簡単に作り上げることができます。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">AIによるナラティブの強化</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                「ストーリーアシスト」機能は、鎌倉時代の語彙や価値観を学習したAIモデルをベースにしています。源頼朝や北条政子といった歴史上の人物とのIF対話や、市井の人々の暮らしを彩る台詞を生成。AIと対話しながら、これまでにない深みのあるナラティブを構築できます。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">高度な経済・生活システム</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                HPや空腹度といったサバイバル要素に加え、当時の通貨単位や料理屋への納品システムなど、鎌倉時代の生活圏を模したロジックがプリセットとして用意されています。プレイヤーは単なる冒険者ではなく、歴史の中に生きる一人の人間としての体験を享受できます。
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <h3 className="text-xl font-bold">検証とリファインのサイクル</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                制作したマップやストーリーは、即座に「プレイテスト」モードで検証可能です。AIが生成した台詞のテンポ、幕府内での立ち振る舞い、アイテムの価値バランスなどを開発者自身がリアルタイムでチェックし、納得がいくまで調整を繰り返すことができます。
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
              <Link href="/tos" className="underline hover:text-primary mx-1">利用規約</Link>
              と
              <Link href="/privacy" className="underline hover:text-primary mx-1">プライバシーポリシー</Link>
              に同意したものとみなされます。
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
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
            <h4 className="font-bold text-sm mb-4">サービス</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/showcase" className="hover:text-primary">作品紹介</Link></li>
              <li><Link href="#features" className="hover:text-primary">機能一覧</Link></li>
              <li><Link href="/asset-library" className="hover:text-primary">アセットライブラリ</Link></li>
              <li><Link href="/play-test" className="hover:text-primary">プレイテスト</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">サポート</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li><Link href="/tos" className="hover:text-primary">利用規約</Link></li>
              <li><Link href="/privacy" className="hover:text-primary">プライバシーポリシー</Link></li>
              <li>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfA-PnpIzXaM1935pJ4nF6SsqyDSOeowzxYhamHnbgH4iIsOg/viewform?usp=header" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary"
                >
                  お問い合わせ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4">コンプライアンス</h4>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              当サイトでは、サービスの改善および広告配信のためにクッキー（Cookie）を使用しています。
              詳細はプライバシーポリシーをご確認ください。
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-muted-foreground">© 2024 RealmForge Project. All rights reserved. (Ver {version})</p>
          <div className="opacity-20 pointer-events-none">
            <p className="text-[10px] font-mono tracking-widest uppercase">Ancient Parchment Style</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
