"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Gamepad2, HeartPulse, Coins, Users, BookOpen, Moon, ArrowRight, PackagePlus, Presentation, MessageCircle, HelpCircle, FileText, ShieldCheck } from "lucide-react";
import packageJson from "../../../package.json";

export default function TutorialPage() {
  const version = packageJson.version;

  const phases = [
    {
      title: "Phase 1: 基本操作と探索",
      description: "まずはこの世界での動き方を覚えましょう。",
      icon: Gamepad2,
      steps: [
        "移動：WASDキー または マップ上をクリックしてキャラクターを動かします。",
        "アクション：対象に近づくと画面上部の「キラキラボタン」が反応します。クリックまたは Space/Enter キーで話しかけたり調べたりできます。",
        "近接判定：インタラクションには距離が必要です。キャラクターをしっかりと対象に近づけましょう。"
      ]
    },
    {
      title: "Phase 2: サバイバルと自己管理",
      description: "伊豆の国で生き抜くための基本ルールです。",
      icon: HeartPulse,
      steps: [
        "ステータス：HP（生命力）と空腹度を管理します。探索や労働でこれらは減少します。",
        "素材の収集：マップ上の「木」や「草むら」を調べると素材が手に入ります。収集にはHPを消費します。",
        "回復：手に入れた食べ物や薬は、メニュー（右上のボタン）の「所持アイテム」から使用できます。"
      ]
    },
    {
      title: "Phase 3: 経済サイクルと発展",
      description: "村の経済に貢献し、報酬を得る流れを学びましょう。",
      icon: Coins,
      steps: [
        "ショップ：道具屋でアイテムを購入したり、不要なものを売却したりできます。",
        "料理屋への納品：集めた素材を料理屋へ「納品（補充）」できます。メニューの「納品」タブを確認してください。",
        "売上精算：布団で「休息」して翌日になると、納品した素材で作られた料理の売上がゴールド（K）として支払われます。"
      ]
    },
    {
      title: "Phase 4: 物語と人間関係",
      description: "人々との絆を深め、歴史の目撃者となりましょう。",
      icon: Users,
      steps: [
        "好感度（Affection）：村人の依頼をこなし、報酬を得ることでその人物との絆が深まります。",
        "イベント分岐：あなたの選択や持っているアイテムによって、物語の展開が変化することがあります。",
        "アーカイブ：これまでに体験した物語（カットシーン）は、メニューの「物語」タブからいつでも再再生できます。"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b pb-6">
          <Link href="/" className="flex items-center gap-2">
            <RealmforgeLogo className="h-10 w-10 text-primary" />
            <div className="flex flex-col">
              <span className="font-headline text-2xl font-bold">RealmForge</span>
              <span className="text-xs text-muted-foreground font-mono">Ver {version}</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/showcase">
              <Button variant="outline" size="sm">
                <Presentation className="mr-2 h-4 w-4" />
                作品紹介
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

        <main className="space-y-12">
          <section className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">
              冒険の手引き
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              RealmForgeでのプレイテストを100%楽しむための、システムと操作のガイドです。
            </p>
          </section>

          <div className="grid grid-cols-1 gap-8">
            {phases.map((phase, index) => (
              <Card key={index} className="overflow-hidden border-border/50">
                <CardHeader className="bg-muted/30 flex flex-row items-center gap-4 space-y-0">
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <phase.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-headline">{phase.title}</CardTitle>
                    <CardDescription>{phase.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {phase.steps.map((step, sIndex) => (
                      <li key={sIndex} className="flex gap-3 text-sm leading-relaxed">
                        <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold">{sIndex + 1}</span>
                        </div>
                        {step}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <section className="bg-primary/5 p-8 rounded-3xl border border-primary/10 space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Moon className="h-6 w-6" />
              <h2 className="text-2xl font-bold font-headline">一日の終わりと始まり</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              マップ上のどこかにある「布団」を見つけて休息すると、HPが全快し、日付が1日進みます。
              前日に料理屋へ素材を納品していた場合、起床時にその売上が報酬として加算されます。
              効率よく稼ぐには、毎日欠かさず探索し、納品してから眠りにつくのがコツです。
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-background rounded-full border">
                <PackagePlus className="h-3 w-3 text-accent" /> 素材納品
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-background rounded-full border">
                <Moon className="h-3 w-3 text-primary" /> 休息
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
              <div className="flex items-center gap-2 text-xs font-bold px-3 py-1.5 bg-background rounded-full border text-primary">
                <Coins className="h-3 w-3" /> 売上獲得
              </div>
            </div>
          </section>

          <section className="text-center py-12 space-y-8 bg-muted/30 rounded-3xl border border-border/50">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold font-headline">実際の風景を見る</h2>
              <p className="text-muted-foreground">これらのシステムによって構築された、鎌倉時代の世界観を確認しましょう。</p>
            </div>
            <Link href="/showcase">
              <Button size="lg" variant="secondary" className="h-14 px-12 text-lg font-bold rounded-full group">
                作品紹介へ進む
                <Presentation className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
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
