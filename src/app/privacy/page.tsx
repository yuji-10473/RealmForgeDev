import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, HelpCircle, Presentation, BookOpen, MessageCircle, FileText, ShieldCheck, ScrollText } from "lucide-react";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "プライバシーポリシー | RealmForge",
  description: "RealmForgeプロジェクトのプライバシーポリシーです。個人情報の収集目的、利用、およびGoogle AdSenseによる広告配信とCookieの使用について詳細に説明しています。",
  openGraph: {
    title: "Privacy Policy | RealmForge",
    description: "個人情報の取り扱い、Google AdSenseによる広告配信、Cookieの使用について説明しています。",
    type: "website",
  }
};

export default function PrivacyPolicyPage() {
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
          <span className="font-bold text-foreground">プライバシーポリシー</span>
        </nav>

        <main className="prose prose-neutral max-w-none space-y-6">
          <h1 className="text-4xl font-bold font-headline">プライバシーポリシー</h1>
          <p className="text-muted-foreground">最終更新日：2024年12月1日</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. 収集する情報</h2>
            <p>当サービスでは、以下の情報を取得する場合があります。</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Googleアカウント連携時のプロフィール情報（名前、メールアドレス、プロフィール写真）</li>
              <li>サービス内での制作データおよびプレイログ</li>
              <li>クッキー（Cookie）およびアクセス解析データ</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. 情報の利用目的</h2>
            <p>取得した情報は、以下の目的で利用されます。</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>サービスの提供およびユーザー認証</li>
              <li>サービスの改善、不具合の修正</li>
              <li>ユーザーからのお問い合わせへの対応</li>
              <li>広告の配信および最適化</li>
            </ul>
          </section>

          <section className="space-y-4 border-l-4 border-primary pl-6 py-2">
            <h2 className="text-2xl font-bold">3. 広告配信について（Google AdSense）</h2>
            <div className="bg-muted/30 p-6 border rounded-lg space-y-4 text-sm leading-relaxed">
              <p>
                当サイトでは、第三者配信事業者（Google AdSense）が提供する広告サービスを利用しています。
              </p>
              <p>
                Google などの第三者配信事業者は Cookie を使用して、ユーザーが当サイトや他のウェブサイトに過去にアクセスした際の情報に基づいて広告を配信します。
              </p>
              <p>
                Google が広告 Cookie を使用することにより、ユーザーが当サイトや他のサイトにアクセスした際の情報に基づいて、Google やそのパートナーが適切な広告をユーザーに表示できます。
              </p>
              <p>
                ユーザーは、Googleのアカウントの「<a href="https://adssettings.google.com/authenticated" target="_blank" rel="noopener noreferrer" className="text-primary underline">広告設定</a>」で、パーソナライズ広告を無効にできます。また、「<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.aboutads.info</a>」にアクセスすれば、第三者配信事業者がパーソナライズ広告の掲載で使用する Cookie を無効にできます。
              </p>
              <p>
                詳細については、Googleの「<a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-primary underline">広告に関するポリシーと規約</a>」をご覧ください。
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. クッキー（Cookie）の使用</h2>
            <p>
              当サイトは、ユーザーの利便性向上、トラフィック分析、および広告配信の最適化のためにクッキーを使用しています。ユーザーはブラウザの設定によりクッキーを無効にすることができますが、その場合、当サイトの一部機能が正常に動作しない可能性があります。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. 情報の第三者提供</h2>
            <p>
              当サービスは、法令に基づく場合や、サービスの提供に必要な範囲（認証プロバイダ等）を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">6. お問い合わせ</h2>
            <p>
              当サービスに関するお問い合わせは、<Link href="/contact" className="text-primary underline">お問い合わせフォーム</Link>よりご連絡ください。
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
                <li><Link href="/tos" className="hover:text-primary transition-colors flex items-center gap-2"><FileText className="h-3 w-3" /> 利用規約</Link></li>
                <li><Link href="/privacy" className="text-primary font-bold flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> プライバシー</Link></li>
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
