import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, HelpCircle, Presentation, BookOpen, MessageCircle, FileText, ShieldCheck } from "lucide-react";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "利用規約 | RealmForge",
  description: "RealmForgeプロジェクトの利用規約です。本サービスを利用する際のルールと権利義務について規定しています。",
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
