import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Map, Users, Sparkles, Sword, BookOpen, Heart, History } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import packageJson from "../../../package.json";

export default function ShowcasePage() {
  const version = packageJson.version;

  // 鎌倉時代のコンセプトに合わせたサンプル
  const samples = [
    {
      title: "鎌倉の港町「津」",
      description: "タイルエディターで再現された13世紀の交易拠点。AIが当時の生活様式を考案し、活気ある港町の雰囲気を再現しています。",
      image: PlaceHolderImages.find(p => p.id === 'map-bg-0-0')?.imageUrl,
      icon: Map,
      category: "歴史都市"
    },
    {
      title: "北条政子の決意",
      description: "ストーリーエディターで描かれる歴史的瞬間。AIが彼女の心情を膨大な歴史データから推察し、重厚な台詞として生成しています。",
      image: PlaceHolderImages.find(p => p.id === 'hero-sprite-1')?.imageUrl,
      icon: Sparkles,
      category: "AIナラティブ"
    },
    {
      title: "修善寺の収集ポイント",
      description: "史実に基づいた素材獲得システム。当時の食生活や薬草、工芸品の素材をAIがリサーチし、探索のリアリティを高めています。",
      image: PlaceHolderImages.find(p => p.id === 'tree-asset')?.imageUrl,
      icon: Heart,
      category: "サバイバル"
    },
    {
      title: "幕府の御家人食堂",
      description: "料理屋納品システムを導入した経済拠点。プレイヤーが持ち込んだ素材から当時の献立が作られ、翌日に報酬（ゴールド）が得られます。",
      image: PlaceHolderImages.find(p => p.id === 'map-bg-1-3')?.imageUrl,
      icon: Sword,
      category: "経済"
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
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
        </header>

        <main className="space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-4">
              Historical Showcase
            </div>
            <h1 className="text-5xl md:text-6xl font-bold font-headline tracking-tighter">
              歴史を刻む、AIとの対話
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              鎌倉時代の息吹をAIと共に再現。膨大な歴史データと生成AIを融合させ、失われた物語を現代に蘇らせる新しいRPG制作の形。
            </p>
          </section>

          {/* Gallery Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {samples.map((sample, index) => (
              <Card key={index} className="overflow-hidden border-border/50 group hover:shadow-xl transition-all duration-300">
                <div className="aspect-video relative overflow-hidden bg-muted">
                  {sample.image && (
                    <Image 
                      src={sample.image} 
                      alt={sample.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-background/90 backdrop-blur shadow-sm text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-border">
                      <sample.icon className="h-3 w-3 text-primary" />
                      {sample.category}
                    </span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">{sample.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {sample.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="border-t bg-muted/5 py-4">
                  <p className="text-xs text-muted-foreground italic">
                    ※これらのアセットは歴史データに基づき、AIとの対話によって構築されています。
                  </p>
                </CardFooter>
              </Card>
            ))}
          </section>

          {/* Informational Text Section (AdSense Support) */}
          <section className="bg-muted/30 p-8 md:p-12 rounded-3xl border border-border/50 space-y-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-bold font-headline mb-6">歴史RPG制作を、もっと身近に。</h2>
              <p className="text-lg leading-relaxed text-muted-foreground mb-8">
                RealmForgeは、最新の生成AI技術を活用し、歴史の深淵を誰でも形にできる場所を目指しています。
                直感的なエディターとAIの対話機能を組み合わせることで、難解になりがちな歴史考証を「物語の種」へと変え、数分で歴史の世界を構築開始できます。
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
                  <Users className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">生きている歴史上の人物</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  AIストーリーアシストにより、NPC一人ひとりに当時の価値観に基づいた独自の背景と口調を設定。プレイヤーの選択が歴史の潮流を変える体験も可能です。
                </p>
              </div>
              <div className="space-y-3">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl">当時の経済とサバイバル</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  素材の採取、御家人としての勤め、料理屋への納品、そして報酬による位階の向上。鎌倉時代の生活圏を模したゲームループを直感的に導入できます。
                </p>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center py-12 space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">あなたも、歴史の語り手になりませんか？</h2>
              <p className="text-muted-foreground">AIと共に、想像した歴史の世界をそのまま形にしましょう。</p>
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
