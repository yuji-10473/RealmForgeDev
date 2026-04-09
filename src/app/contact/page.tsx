import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, Mail, MessageSquare, Send, FileText, ShieldCheck, HelpCircle, BookOpen, Presentation, MessageCircle, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "お問い合わせ | RealmForge プロジェクト事務局",
  description: "RealmForgeプロジェクトに関するご質問、不具合の報告、時代考証に関するご提案など、お気軽にお寄せください。",
  openGraph: {
    title: "Contact | RealmForge",
    description: "不具合報告、機能要望、時代考証に関するご提案などはこちらから。",
    type: "website",
  }
};

export default function ContactPage() {
  const version = packageJson.version;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-12">
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
          <span className="font-bold text-foreground">お問い合わせ</span>
        </nav>

        <main className="space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold font-headline">お問い合わせ</h1>
            <p className="text-muted-foreground leading-relaxed">
              RealmForge プロジェクトに関するご質問、不具合の報告、時代考証に関するご提案など、お気軽にお寄せください。内容を確認の上、担当者より順次対応させていただきます。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-2">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <CardTitle>お問い合わせフォーム</CardTitle>
                <CardDescription>Google フォームより詳細を送信いただけます。</CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="https://docs.google.com/forms/d/e/1FAIpQLSfA-PnpIzXaM1935pJ4nF6SsqyDSOeowzxYhamHnbgH4iIsOg/viewform?usp=header" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    フォームを開く
                  </Button>
                </a>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <div className="h-10 w-10 bg-accent/10 rounded-lg flex items-center justify-center text-accent mb-2">
                  <Mail className="h-6 w-6" />
                </div>
                <CardTitle>メールで連絡</CardTitle>
                <CardDescription>事務局へ直接メールでのご連絡も承っております。</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono bg-muted p-3 rounded text-center border">
                  firebase.25.11.11@gmail.com
                </p>
              </CardContent>
            </Card>
          </div>

          <section className="bg-muted/30 p-8 rounded-2xl border space-y-6">
            <h2 className="text-2xl font-bold font-headline">お問い合わせの際のお願い</h2>
            <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>
                不具合の報告については、発生した状況やブラウザの種類（Chrome, Safariなど）、OS（Windows, macOS等）を併記いただけますとスムーズな調査が可能です。
              </p>
              <p>
                プロジェクトは現在も継続的にアップデートを行っており、皆様からのフィードバックを大切にしています。特定の歴史的出来事の追加要望や、専門的な考証に関するアドバイスも歓迎しております。
              </p>
            </div>
          </section>
        </main>

        {/* Categories Footer */}
        <footer className="border-t pt-16 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-sm">
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider">コンテンツ</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="hover:text-primary transition-colors flex items-center gap-2"><HelpCircle className="h-3 w-3" /> About</Link></li>
                <li><Link href="/showcase" className="hover:text-primary transition-colors flex items-center gap-2"><Presentation className="h-3 w-3" /> 作品紹介</Link></li>
                <li><Link href="/tutorial" className="hover:text-primary transition-colors flex items-center gap-2"><BookOpen className="h-3 w-3" /> チュートリアル</Link></li>
                <li><Link href="/guide" className="hover:text-primary transition-colors flex items-center gap-2"><ScrollText className="h-3 w-3" /> 制作ガイド</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider">サポート</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/contact" className="text-primary font-bold flex items-center gap-2"><MessageCircle className="h-3 w-3" /> お問い合わせ</Link></li>
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
