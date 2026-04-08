import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Map, Users, Sparkles, Sword, BookOpen, Heart } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function ShowcasePage() {
  // サンプルのためにプレースホルダー画像からいくつか抽出
  const samples = [
    {
      title: "始まりの村「カナリア」",
      description: "タイルエディターで作成された平和な村。NPCとの会話イベントや、家の中に入れるトランジションが設定されています。",
      image: PlaceHolderImages.find(p => p.id === 'map-bg-0-0')?.imageUrl,
      icon: Map,
      category: "マップ"
    },
    {
      title: "英雄アリアの物語",
      description: "ストーリーエディターで構築されたカットシーン。複数のキャラクターが連動して動き、ドラマチックな演出を可能にします。",
      image: PlaceHolderImages.find(p => p.id === 'hero-sprite-1')?.imageUrl,
      icon: Sparkles,
      category: "ストーリー"
    },
    {
      title: "影の森の収集ポイント",
      description: "サバイバルシステムを活用した探索エリア。HPを消費してレア素材を収集し、レベルアップに繋げるゲームループを構築。",
      image: PlaceHolderImages.find(p => p.id === 'tree-asset')?.imageUrl,
      icon: Heart,
      category: "システム"
    },
    {
      title: "賑やかな宿場の食堂",
      description: "料理屋納品システムを導入した経済拠点。プレイヤーが持ち込んだ素材から料理が作られ、翌日に報酬が得られます。",
      image: PlaceHolderImages.find(p => p.id === 'map-bg-1-3')?.imageUrl,
      icon: Sword,
      category: "経済"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center">
      {/* Navigation Header */}
      <header className="w-full border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <RealmforgeLogo className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl font-bold tracking-tight">RealmForge</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl w-full py-16 px-4 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest mb-4">
            Showcase
          </div>
          <h1 className="text-5xl md:text-6xl font-bold font-headline tracking-tighter">
            創造された世界たち
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            RealmForgeのツールを使って作成された、RPG制作の可能性を示すサンプルプロジェクトをご紹介します。
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
                  ※これらのアセットは組み込みライブラリを使用して構築されています。
                </p>
              </CardFooter>
            </Card>
          ))}
        </section>

        {/* Informational Text Section (AdSense Support) */}
        <section className="bg-muted/30 p-8 md:p-12 rounded-3xl border border-border/50 space-y-12">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold font-headline mb-6">RPG制作を、もっと身近に。</h2>
            <p className="text-lg leading-relaxed text-muted-foreground mb-8">
              RealmForgeは、プログラミングの壁を取り払い、誰もが自分の物語を形にできる場所を目指しています。
              直感的なエディターとAIアシストを組み合わせることで、これまで数ヶ月かかっていた「動くRPG」の構築を数分で開始できます。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Map className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">高度なマップ構造</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                広大なオープンワールドから、複雑に入り組んだダンジョン、そして生活感あふれる民家まで、タイルベースのエディターで自由自在に描けます。
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">生きているNPC</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                AIストーリーアシストにより、NPC一人ひとりに深い背景と独自の口調を設定。プレイヤーの行動次第で変化する絆（好感度）システムも標準搭載。
              </p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl">経済と成長の循環</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                素材の採取、アイテムの購入、料理屋への納品、そして報酬による強化。本格的なRPGに欠かせないゲームループをプリセットから選択するだけ。
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="text-center py-12 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold font-headline">あなたも、鍛冶屋の一人になりませんか？</h2>
            <p className="text-muted-foreground">想像した世界を、そのまま形にしましょう。</p>
          </div>
          <Link href="/">
            <Button size="lg" className="h-14 px-12 text-lg font-bold rounded-full shadow-lg hover:shadow-xl transition-all">
              今すぐ無料で制作を始める
            </Button>
          </Link>
        </section>
      </main>

      {/* Simple Footer for Showcase */}
      <footer className="w-full border-t bg-muted/20 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <RealmforgeLogo className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-bold">RealmForge</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 RealmForge Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
