import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Map, Sparkles, Sword, BookOpen, History, Youtube, Heart, ArrowRight, MessageCircle, HelpCircle, FileText, ShieldCheck, Presentation } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "作品紹介 | RealmForge - AIと紡ぐ歴史RPGの制作事例",
  description: "13世紀の日本・鎌倉を舞台にした、RealmForgeによる歴史RPGの制作事例を紹介します。緻密な時代考証と物語性が融合した世界観をご覧ください。",
};

export default function ShowcasePage() {
  const version = packageJson.version;

  const samples = [
    {
      title: "鎌倉の流刑地、伊豆の再現",
      description: "平凡と述懐に満ちた13世紀の流刑地を再現。当時の穏やかな田舎や庶民の生活風景を描き出し、流刑地特有の空気感を体験できます。",
      image: "/images/Screenshot-kaigan1.png",
      fallbackImage: PlaceHolderImages.find(p => p.id === 'map-bg-0-0')?.imageUrl,
      icon: Map,
      category: "歴史都市"
    },
    {
      title: "日蓮大聖人の足跡",
      description: "鎌倉幕府の運命を左右する歴史的瞬間。重厚な台詞回しと緻密な感情描写により、彼の苦悩と決断を追体験するナラティブシーケンス。",
      image: "/images/syugo.png",
      fallbackImage: PlaceHolderImages.find(p => p.id === 'hero-sprite-1')?.imageUrl,
      icon: Sparkles,
      category: "歴史物語"
    },
    {
      title: "伊豆の国・探索と収集",
      description: "史実に基づいた素材獲得システム。当時の生活に欠かせなかった薬草や料理の素材を各地で収集し、穏やかな時代を生き抜くサバイバル体験。",
      image: "/images/items.jpg",
      fallbackImage: PlaceHolderImages.find(p => p.id === 'tree-asset')?.imageUrl,
      icon: Heart,
      category: "サバイバル"
    },
    {
      title: "日蓮食堂の経済圏",
      description: "集めた素材から当時の献立を作り、報酬を得る経済ループ。村の発展に貢献し、広宣流布を広めていく過程を体験できます。",
      image: "/images/sushi1.jpg",
      fallbackImage: PlaceHolderImages.find(p => p.id === 'map-bg-1-3')?.imageUrl,
      icon: Sword,
      category: "経済・生活"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b pb-6">
          <Link href="/" className="flex items-center gap-2">
            <RealmforgeLogo className="h-10 w-10 text-primary" />
            <div className="flex flex-col">
              <span className="font-headline text-2xl font-bold">RealmForge</span>
              <span className="text-xs text-muted-foreground font-mono">Ver {version}</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/tutorial">
              <Button variant="outline" size="sm">
                <BookOpen className="mr-2 h-4 w-4" />
                チュートリアル
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="mr-2 h-4 w-4" />
                ホームへ戻る
              </Button>
            </Link>
          </div>
        </header>

        <main className="space-y-16">
          <section className="text-center space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-4">
              Historical Showcase
            </div>
            <h1 className="text-5xl md:text-6xl font-bold font-headline tracking-tighter">
              歴史の息吹を、今ここに.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              13世紀、鎌倉。失われた物語を現代に蘇らせる。緻密な時代考証と物語性が融合した、新しい歴史RPGの形をご覧ください。
            </p>
          </section>

          {/* YouTube Video Section */}
          <section className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-headline flex items-center justify-center gap-2">
                <Youtube className="h-6 w-6 text-red-600" />
                コンセプトムービー
              </h2>
              <p className="text-sm text-muted-foreground">AIと紡ぐ鎌倉時代の世界観を、映像で体験してください。</p>
            </div>
            <div className="aspect-video w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-primary/10 bg-black relative group">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/SGxelqa2L00"
                title="RealmForge Concept Movie"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {samples.map((sample, index) => (
              <Card key={index} className="overflow-hidden border-border/50 group hover:shadow-xl transition-all duration-300">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  <Image 
                    src={sample.image} 
                    alt={`${sample.title}のゲーム画面プレビュー`} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-background/90 backdrop-blur shadow-sm text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-border">
                      <sample.icon className="h-3 w-3 text-primary" />
                      {sample.category}
                    </span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">{sample.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed text-foreground/80">
                    {sample.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="border-t bg-muted/5 py-4">
                  <p className="text-[10px] text-muted-foreground italic">
                    ※これらの物語や風景は、生成AIとの対話を通じた時代考証により構築されています。
                  </p>
                </CardFooter>
              </Card>
            ))}
          </section>

          <section className="text-center py-12 space-y-8 bg-primary/5 rounded-3xl border border-primary/10">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">システムを詳しく知る</h2>
              <p className="text-muted-foreground">これらのサンプルがどのように動作するか、冒険の手引きを確認しましょう。</p>
            </div>
            <Link href="/tutorial">
              <Button size="lg" className="h-14 px-12 text-lg font-bold rounded-full group">
                チュートリアルを読む
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </section>
        </main>

        {/* Consistent Footer */}
        <footer className="border-t pt-12 text-center text-sm text-muted-foreground space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/about" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <HelpCircle className="h-3 w-3" /> About
              </Link>
              <Link href="/showcase" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <Presentation className="h-3 w-3" /> 作品紹介
              </Link>
              <Link href="/tutorial" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <BookOpen className="h-3 w-3" /> チュートリアル
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <MessageCircle className="h-3 w-3" /> お問い合わせ
              </Link>
              <Link href="/tos" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <FileText className="h-3 w-3" /> 利用規約
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3 w-3" /> プライバシー
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <RealmforgeLogo className="h-5 w-5 text-primary opacity-50" />
              <p>© 2024 RealmForge Project. All rights reserved. (Ver {version})</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
