"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Sparkles, History, BookOpen, Target, HelpCircle, MessageCircle, FileText, ShieldCheck, Presentation } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex items-center justify-between border-b pb-6">
          <Link href="/" className="flex items-center gap-2">
            <RealmforgeLogo className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl font-bold">RealmForge</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
          </Link>
        </header>

        <main className="space-y-16">
          <section className="text-center space-y-6">
            <h1 className="text-5xl font-bold font-headline tracking-tighter">
              このサイトについて
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              RealmForge は、13世紀の日本・鎌倉時代の深遠な歴史を、最新の生成AI技術を用いて再構築するクリエイティブ・プロジェクトです。
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary font-bold">
                <Target className="h-5 w-5" />
                私たちのミッション
              </div>
              <h2 className="text-3xl font-bold font-headline">歴史の「息吹」を、誰でも形にできる世界へ</h2>
              <p className="leading-relaxed text-muted-foreground">
                かつて鎌倉という地で生きた人々の営み、武士の覚悟、庶民の信仰。それらをただ知識として知るだけでなく、一つの「世界」として歩き、話し、体験すること。RealmForge は、専門的な知識が必要だった「歴史RPG制作」の壁を、AIとの対話によって取り払い、誰もが歴史の編纂者になれる場所を提供します。
              </p>
            </div>
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <History className="text-primary h-5 w-5" />
                なぜ「鎌倉時代」なのか
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                13世紀の鎌倉は、古い貴族の支配から武士の時代へと大きく転換する、エネルギーに満ちた激動の時代でした。当時の生活感、独自の経済圏、そして日蓮大聖人をはじめとする宗教的・思想的な深まりは、RPGという形式で表現するのに最も適した「重厚な物語」を秘めています。
              </p>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
              <HelpCircle className="text-primary h-8 w-8" />
              よくある質問 (FAQ)
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>RealmForge は無料で利用できますか？</AccordionTrigger>
                <AccordionContent>
                  はい、主要なエディター機能やプレイテスト機能はどなたでも無料で体験いただけます。プロジェクトの維持・向上のために広告を表示させていただいております。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>AIはどのように物語を生成しているのですか？</AccordionTrigger>
                <AccordionContent>
                  Gemini をはじめとする最新の生成モデルを使用しています。ユーザーが入力したプロンプトに基づき、当時の歴史的背景や言葉遣いを考慮したシナリオや対話をAIが提案します。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>作成したゲームデータのエクスポートは可能ですか？</AccordionTrigger>
                <AccordionContent>
                  現在、ブラウザ上での保存機能を提供しています。外部形式へのエクスポート機能については、順次開発・公開を予定しております。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>スマートフォンのブラウザでも動作しますか？</AccordionTrigger>
                <AccordionContent>
                  エディター機能は PC の大画面での操作を推奨しておりますが、チュートリアルや作品紹介の閲覧、一部のプレイテストはモバイル環境でも最適化が進んでおります。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="bg-muted/20 p-8 md:p-12 rounded-3xl border border-border/50 text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-headline">一緒に歴史を紡ぎましょう</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                あなたの想像力が、失われた13世紀の断片を現代に蘇らせます。まずは作品紹介やチュートリアルから、その可能性に触れてみてください。
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/showcase">
                <Button variant="outline" size="lg">作品紹介を見る</Button>
              </Link>
              <Link href="/tutorial">
                <Button size="lg">チュートリアルを読む</Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <Link href="/showcase" className="hover:text-primary transition-colors flex items-center gap-1">
                <Presentation className="h-3 w-3" /> 作品紹介
              </Link>
              <Link href="/tutorial" className="hover:text-primary transition-colors flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> チュートリアル
              </Link>
              <Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> お問い合わせ
              </Link>
              <Link href="/tos" className="hover:text-primary transition-colors flex items-center gap-1">
                <FileText className="h-3 w-3" /> 利用規約
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> プライバシー
              </Link>
            </div>
            <p>© 2024 RealmForge Project. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
