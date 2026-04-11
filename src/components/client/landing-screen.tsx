'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { useAuth, useFirestore, initiateEmailSignIn, initiateEmailSignUp, setDocumentNonBlocking } from "@/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Map, Users, Sparkles, Sword, Mail, Lock, Info, CheckCircle2, FileText, ShieldCheck, Presentation, BookOpen, ArrowRight, MessageCircle, HelpCircle, X, ScrollText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import packageJson from "../../../package.json";
import { doc } from "firebase/firestore";

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

/**
 * Cookie 同意バナー
 */
function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-[100] p-4 animate-in slide-in-from-bottom-full duration-500">
      <Card className="max-w-4xl mx-auto shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full hidden sm:block">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-left">
              当サイトでは利便性向上、アクセス解析、広告配信のためにクッキーを使用しています。詳細は
              <Link href="/privacy" className="text-primary underline mx-1">プライバシーポリシー</Link>
              をご確認ください。
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" onClick={accept} className="px-6 font-bold">同意する</Button>
            <Button size="icon" variant="ghost" onClick={() => setShow(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LandingScreen() {
  const auth = useAuth();
  const firestore = useFirestore();
  const version = packageJson.version;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // ポップアップ方式でサインイン
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        const userRef = doc(firestore, 'users', result.user.uid);
        setDocumentNonBlocking(userRef, {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        }, { merge: true });
      }
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
      <CookieConsent />
      
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
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> About
            </Link>
            <Link href="/showcase" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <Presentation className="h-3 w-3" /> 作品紹介
            </Link>
            <Link href="/tutorial" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> チュートリアル
            </Link>
            <Link href="/guide" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <ScrollText className="h-3 w-3" /> 制作ガイド
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              <MessageCircle className="h-3 w-3" /> お問い合わせ
            </Link>
          </nav>
          <Button variant="ghost" size="sm" className="lg:hidden">
            <Info className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-4xl w-full space-y-12 text-center z-10 py-20 px-4">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-4 rounded-2xl ring-4 ring-primary/20">
              <Sparkles className="h-20 w-20 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold font-headline tracking-tighter text-foreground text-balance">
            AIと紡ぐ、あなただけの壮大な物語。
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            最新の生成AIと対話し、鎌倉時代の深淵を形にする。あなたの想像力が、歴史の「もしも」を創り出すRPG制作プラットフォーム。
          </p>
        </div>

        <GoogleAd />

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
                    <Button onClick={handleEmailSignIn} className="flex-1 font-bold">ログイン</Button>
                    <Button onClick={handleEmailSignUp} variant="outline" className="flex-1 font-bold">新規登録</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
