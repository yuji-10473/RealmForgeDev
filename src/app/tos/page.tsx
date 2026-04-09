import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, HelpCircle, Presentation, BookOpen, MessageCircle, FileText, ShieldCheck, ScrollText } from "lucide-react";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "利用規約 | RealmForge",
  description: "RealmForgeプロジェクトの利用規約です。本サービスを利用する際のルールと権利義務について規定しています。",
  openGraph: {
    title: "Terms of Service | RealmForge",
    description: "本サービスを利用する際のルールと権利義務について規定しています。",
    type: "website",
  }
};

export default function TermsOfServicePage() {
  const version = packageJson.version;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
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
          <span className="font-bold text-foreground">利用規約</span>
        </nav>

        <main className="prose prose-neutral max-w-none space-y-6">
          <h1 className="text-4xl font-bold font-headline">利用規約</h1>
          <p className="text-muted-foreground">最終更新日：2024年12月1日</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. 規約への同意</h2>
            <p>
              本規約は、RealmForge（以下「当サービス」）を利用するすべてのユーザーに適用されます。ユーザーは、当サービスを利用することで、本規約に完全に同意したものとみなされます。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. サービス内容</h2>
            <p>
              当サービスは、2D RPGのマップ制作、キャラクター管理、およびそれらのプレイテストを行うためのプラットフォームを提供します。当サービスは予告なく内容の変更または提供の停止を行う場合があります。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3. ユーザーアカウント</h2>
            <p>
              当サービスの一部の機能を利用するには、Googleアカウント等を用いた登録が必要です。ユーザーは自身のログイン情報を厳重に管理し、不正利用を防止する義務を負います。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. 知的財産権</h2>
            <p>
              ユーザーが当サービス上で作成したデータ（マップ、イベント、ストーリー等）の著作権は、当該ユーザーに帰属します。ただし、当サービス内で提供されるデフォルトのアセット（画像、音声等）の知的財産権は、当サービスまたはその提供元に帰属します。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. 禁止事項</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>公序良俗に反するコンテンツの公開</li>
              <li>他者の権利を侵害する行為</li>
              <li>サービスの運営を妨げるような不正アクセスや負荷をかける行為</li>
              <li>当サービスの事前の承諾なく、当サービスを利用して営利活動を行う行為（広告表示機能を除く）</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">6. 免責事項</h2>
            <p>
              当サービスは、その完全性、正確性、有用性等についていかなる保証も行いません。ユーザーが当サービスを利用したことにより生じた損害について、当サービスは一切の責任を負いません。
            </p>
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
                <li><Link href="/contact" className="hover:text-primary transition-colors flex items-center gap-2"><MessageCircle className="h-3 w-3" /> お問い合わせ</Link></li>
                <li><Link href="/about#faq" className="hover:text-primary transition-colors flex items-center gap-2"><HelpCircle className="h-3 w-3" /> よくある質問</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-foreground uppercase tracking-wider">法的情報</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/tos" className="text-primary font-bold flex items-center gap-2"><FileText className="h-3 w-3" /> 利用規約</Link></li>
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
