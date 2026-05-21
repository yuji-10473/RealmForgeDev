
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Sparkles, History, BookOpen, Target, HelpCircle, MessageCircle, FileText, ShieldCheck, Presentation, Clock, ScrollText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "このサイトについて | RealmForge - 13世紀鎌倉をAIで描くRPG制作プラットフォーム",
  description: "RealmForgeプロジェクトの理念、13世紀鎌倉時代へのこだわり、最新の生成AIを活用した新たなRPG制作の形について詳しく解説します。FAQや更新履歴もご覧いただけます。",
  openGraph: {
    title: "About | RealmForge",
    description: "歴史の息吹を、誰でも形にできる世界へ。生成AIと紡ぐ鎌倉時代RPGプロジェクト。",
    type: "website",
  }
};

export default function AboutPage() {
  const version = packageJson.version;

  // Structured Data for Google (JSON-LD)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "RealmForge",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "description": "13世紀の日本・鎌倉時代を舞台にした歴史RPG制作プラットフォーム。",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY"
    },
    "author": {
      "@type": "Organization",
      "name": "RealmForge Project"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-12 text-balance">
        <header className="flex items-center justify-between border-b pb-6">
          <Link href="/" className="flex items-center gap-2">
            <RealmforgeLogo className="h-8 w-8 text-primary" />
            <span className="font-headline text-xl font-bold">RealmForge</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              ホームへ戻る
            </Button>
          </Link>
        </header>

        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary">ホーム</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="font-bold text-foreground">About</span>
        </nav>

        <main className="space-y-16">
          <section className="text-center space-y-6">
            <h1 className="text-5xl font-bold font-headline tracking-tighter">
              このサイトについて
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto font-medium">
              RealmForge は、13世紀の日本・鎌倉時代の深遠な歴史を、最新の生成AI技術を用いて再構築するクリエイティブ・プロジェクトです。
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary font-bold">
                <Target className="h-5 w-5" />
                私たちのミッション
              </div>
              <h2 className="text-3xl font-bold font-headline">歴史の「息吹」を, 誰でも形にできる世界へ</h2>
              <p className="leading-relaxed text-muted-foreground">
                かつて鎌倉という地で生きた人々の営み、武士の覚悟、庶民の信仰. それらをただ知識として知るだけでなく、一つの「世界」として歩き、話し、体験すること。RealmForge は, 専門的な知識が必要だった「歴史RPG制作」の壁を, AIとの対話によって取り払い、誰もが歴史の編纂者になれる場所を提供します。
              </p>
            </div>
            <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 space-y-4 shadow-sm">
              <h3 className="font-bold flex items-center gap-2 text-primary">
                <History className="h-5 w-5" />
                なぜ「鎌倉時代」なのか
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                13世紀の鎌倉は、古い貴族の支配から武士の時代へと大きく転換する、エネルギーに満ちた激動の時代でした。当時の生活感、独自の経済圏、および独自の精神文化は、RPGという形式で表現するのに最も適した「重厚な物語」を秘めています。
              </p>
            </div>
          </section>

          {/* Update History Section */}
          <section className="space-y-8 bg-muted/10 p-8 rounded-3xl border shadow-inner">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
              <Clock className="text-primary h-8 w-8" />
              最新の更新履歴
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4 items-start border-b border-border/50 pb-4">
                <Badge variant="outline" className="mt-1 shrink-0 font-mono">Ver 0.1.26</Badge>
                <div>
                  <p className="font-bold">モバイル操作性の更なる最適化</p>
                  <p className="text-sm text-muted-foreground mt-1">縦型UIにおけるボタン配置とレスポンスの微調整、および内部ロジックのクリーンアップを行いました。</p>
                </div>
              </div>
              <div className="flex gap-4 items-start border-b border-border/50 pb-4 opacity-90">
                <Badge variant="outline" className="mt-1 shrink-0 font-mono">Ver 0.1.25</Badge>
                <div>
                  <p className="font-bold">UI/UXの更なる安定化</p>
                  <p className="text-sm text-muted-foreground mt-1">モバイル環境における全体的なコードの整理と、視認性の向上を行いました。</p>
                </div>
              </div>
              <div className="flex gap-4 items-start border-b border-border/50 pb-4 opacity-80">
                <Badge variant="outline" className="mt-1 shrink-0 font-mono">Ver 0.1.24</Badge>
                <div>
                  <p className="font-bold">UI/UXの安定化と最適化</p>
                  <p className="text-sm text-muted-foreground mt-1">モバイル操作パネルの視認性向上と、全体的なパフォーマンスの最適化を行いました。</p>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className="space-y-8">
            <h2 className="text-3xl font-bold font-headline flex items-center gap-2 text-balance">
              <HelpCircle className="text-primary h-8 w-8" />
              よくある質問 (FAQ)
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">RealmForge は無料で利用できますか？</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  はい, 主要なエディター機能やプレイテスト機能はどなたでも無料で体験いただけます。プロジェクトの維持・向上のために一部で広告を表示させていただいております。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">AIはどのように物語を生成しているのですか？</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Gemini をはじめとする最新の生成モデルを使用しています。ユーザーが入力したプロンプトに基づき, 当時の歴史的背景や言葉遣いを考慮したシナリオや対話をAIが提案します。
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">作成したゲームデータのエクスポートは可能ですか？</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  現在, ブラウザ上でのクラウド保存機能を提供しています。外部形式（パッケージ）へのエクスポート機能については, 最新のロードマップに基づき順次アップデート予定です。
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          <section className="bg-primary/5 p-8 md:p-12 rounded-3xl border border-primary/10 text-center space-y-8 shadow-sm">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-headline">一緒に歴史を紡ぎましょう</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                あなたの想像力が、失われた13世紀の断片を現代に蘇らせます。まずは制作ガイドやチュートリアルから、その可能性に触れてみてください。
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/guide">
                <Button size="lg" className="font-bold">制作ガイドを読む</Button>
              </Link>
              <Link href="/showcase">
                <Button variant="outline" size="lg" className="font-bold">作品紹介を見る</Button>
              </Link>
            </div>
          </section>
        </main>

        {/* Categories Footer */}
        <footer className="border-t pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider">コンテンツ</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="text-primary font-bold flex items-center gap-2"><HelpCircle className="h-3 w-3" /> About</Link></li>
                <li><Link href="/showcase" className="hover:text-primary transition-colors flex items-center gap-2"><Presentation className="h-3 w-3" /> 作品紹介</Link></li>
                <li><Link href="/tutorial" className="hover:text-primary transition-colors flex items-center gap-2"><BookOpen className="h-3 w-3" /> チュートリアル</Link></li>
                <li><Link href="/guide" className="hover:text-primary transition-colors flex items-center gap-2"><ScrollText className="h-3 w-3" /> 制作ガイド</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider">サポート</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-2"><MessageCircle className="h-3 w-3" /> お問い合わせ</Link></li>
                <li><Link href="/about#faq" className="hover:text-primary transition-colors flex items-center gap-2"><HelpCircle className="h-3 w-3" /> よくある質問</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider">法的情報</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/tos" className="hover:text-primary transition-colors flex items-center gap-2"><FileText className="h-3 w-3" /> 利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> プライバシー</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <RealmforgeLogo className="h-4 w-4 opacity-50" />
              <p>© 2024 RealmForge Project. All rights reserved. (Ver {version})</p>
            </div>
            <p className="font-mono tracking-widest uppercase opacity-30">AI-Powered Historical Creation</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
