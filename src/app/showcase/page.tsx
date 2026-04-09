"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Map, Sparkles, Sword, BookOpen, History, Youtube, Heart } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import packageJson from "../../../package.json";

export default function ShowcasePage() {
  const version = packageJson.version;

  const samples = [
    {
      title: "鎌倉の流刑地、伊豆の再現",
      description: "平凡と述懐に満ちた13世紀の流刑地を再現。当時の穏やかな田舎や庶民の生活風景を描き出し、流刑地特有の空気感を体験できます。",
      image: "/maps/backgrounds/map_0_0.png",
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
      description: "AIが考える史実に基づいた素材獲得システム。当時の生活に欠かせなかった薬草や料理の素材を各地で収集し、穏やかな時代を生き抜くサバイバル体験。",
      image: "/maps/backgrounds/map_1_0.png",
      fallbackImage: PlaceHolderImages.find(p => p.id === 'tree-asset')?.imageUrl,
      icon: Heart,
      category: "サバイバル"
    },
    {
      title: "御家人食堂の経済圏",
      description: "集めた素材から当時の献立を作り、報酬を得る経済ループ. 村の発展に貢献し、広宣流布を広めていく広布の記録。",
      image: "/maps/backgrounds/map_1_3.png",
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
                戻る
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
                    alt={sample.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (sample.fallbackImage) target.src = sample.fallbackImage;
                    }}
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

          <section className="bg-muted/30 p-8 md:p-12 rounded-3xl border border-border/50 space-y-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold font-headline mb-6">歴史RPG制作を、もっと身近に。</h2>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8">
                RealmForgeは、歴史の深淵を誰でも形にできる場所を目指しています。
                直感的なエディターとAIのサポートを組み合わせることで、難解になりがちな時代考証を「物語の種」へと変え、数分で歴史の世界を構築開始できます。
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">高度な歴史考証マップ</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  広大な鎌倉幕府の威容から、静寂に包まれた寺社、そして庶民の生活が息づく長屋まで。タイルベースのエディターで、史実に基づいた空間を描けます。
                </p>
              </div>
              <div className="space-y-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">生きている歴史上の人物</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  当時の価値観に基づいた独自の背景と口調を設定。プレイヤーの選択が歴史の潮流を変える体験も可能です。
                </p>
              </div>
              <div className="space-y-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">当時の経済とサバイバル</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  素材の採取、御家人としての勤め、料理屋への納品、および報酬による位階の向上。鎌倉時代の生活圏を模したゲームループを直感的に導入できます。
                </p>
              </div>
            </div>
          </section>

          <section className="text-center py-12 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">あなたも、歴史の語り手になりませんか？</h2>
              <p className="text-muted-foreground">想像した歴史の世界をそのまま形にしましょう。</p>
            </div>
            <Link href="/">
              <Button size="lg" className="h-14 px-12 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
                今すぐ無料で歴史を創造する
              </Button>
            </Link>
          </section>
        </main>

        <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <RealmforgeLogo className="h-6 w-6 text-primary" />
              <span className="font-headline font-bold">RealmForge</span>
            </div>
            <p>© 2024 RealmForge Project. All rights reserved. (Ver {version})</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
