import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft, BookOpen, Sparkles, History, Map, Users, ArrowRight, MessageCircle, HelpCircle, FileText, ShieldCheck, Presentation, ScrollText } from "lucide-react";
import packageJson from "../../../package.json";

export const metadata: Metadata = {
  title: "AIと紡ぐ13世紀：鎌倉時代RPG制作ガイド | RealmForge",
  description: "13世紀の日本を舞台にした歴史RPGを制作するための、生成AI活用術と時代考証のガイドです。独自のナラティブ構築から世界観の具現化までを詳しく解説します。",
  openGraph: {
    title: "AIと紡ぐ13世紀：鎌倉時代RPG制作ガイド | RealmForge",
    description: "最新のAI技術で歴史の深淵を描くためのRPG制作バイブル。",
    type: "article",
  }
};

export default function GuidePage() {
  const version = packageJson.version;

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
              ホームへ戻る
            </Button>
          </Link>
        </header>

        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground flex items-center gap-2">
          <Link href="/" className="hover:text-primary">ホーム</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="font-bold text-foreground">RPG制作ガイド</span>
        </nav>

        <main className="space-y-16">
          <section className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter text-balance">
              AIと紡ぐ13世紀：<br/>鎌倉時代RPG制作ガイド
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed font-medium">
              歴史の「もしも」を形にするための、生成AI活用術とデザインの美学。
            </p>
          </section>

          <div className="prose prose-neutral max-w-none space-y-12 text-foreground/90">
            <section className="space-y-4">
              <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
                <History className="text-primary h-7 w-7" />
                1. 13世紀鎌倉：激動の時代背景を理解する
              </h2>
              <p className="leading-relaxed">
                13世紀の日本は、貴族中心の平安時代から、武士が実権を握る中世へと大きく転換した時期でした。鎌倉幕府の成立、承久の乱、そして蒙古襲来（元寇）。これらの出来事は、単なる年号の記憶ではなく、当時の人々の価値観や信仰心に多大な影響を与えました。
              </p>
              <p className="leading-relaxed">
                RPG制作において、この時代背景は「重厚な選択」を生み出す土壌となります。武士の忠義、民衆の新しい仏教への希求、そして迫り来る外敵。これらの要素をプロットに組み込むことで、プレイヤーは歴史の当事者としての葛藤を体験することができます。
              </p>
            </section>

            <section className="space-y-4 bg-primary/5 p-8 rounded-3xl border border-primary/10">
              <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Sparkles className="text-primary h-7 w-7" />
                2. 生成AIによる「時代考証」の高度な活用
              </h2>
              <p className="leading-relaxed">
                RealmForgeにおける最大の特徴は、Gemini 2.5 Flash などの最新LLMを「専属の歴史アドバイザー」として活用できる点です。
              </p>
              <ul className="list-disc pl-6 space-y-3 font-medium">
                <li><span className="text-primary">方言と台詞回し</span>：当時の言葉遣いや、特定の階級特有の言い回しをAIに生成させ、没入感を高めます。</li>
                <li><span className="text-primary">生活感の再現</span>：当時の食文化や服装、住宅構造（寝殿造から武家造への移行期など）をAIに尋ね、アセット配置の参考にします。</li>
                <li><span className="text-primary">ナラティブの分岐</span>：史実に基づく出来事に対し、プレイヤーが異なる選択をした場合にどのような「歴史のIF」が起こりうるかをAIとディスカッションします。</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
                <Map className="text-primary h-7 w-7" />
                3. 世界観を具現化するマップデザイン
              </h2>
              <p className="leading-relaxed">
                13世紀の風景は、現代のような整然とした美しさではなく、より荒々しく、生命力に満ちたものでした。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="p-6 border rounded-2xl space-y-2 bg-card shadow-sm">
                  <h3 className="font-bold text-lg">境界の曖昧さ</h3>
                  <p className="text-sm text-muted-foreground">村と山、聖と俗。境界線に鳥居や祠を配置することで、当時の人々が感じていた霊性を表現します。</p>
                </div>
                <div className="p-6 border rounded-2xl space-y-2 bg-card shadow-sm">
                  <h3 className="font-bold text-lg">生活の痕跡</h3>
                  <p className="text-sm text-muted-foreground">道端の轍、積み上げられた薪、軒先に干された魚。些細なオブジェクトが、AI生成された物語に真実味を与えます。</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-3xl font-bold font-headline flex items-center gap-2">
                <ScrollText className="text-primary h-7 w-7" />
                4. まとめ：物語の編纂者として
              </h2>
              <p className="leading-relaxed">
                RPGを作ることは、新しい歴史を編纂することに他なりません。RealmForgeは、専門的なスキルを必要とせず、あなたの想像力とAIの知性を同期させる場所です。13世紀の息吹を、現代の技術で形にする。その旅を、ここから始めましょう。
              </p>
            </section>
          </div>

          <section className="bg-primary/10 p-12 rounded-3xl text-center space-y-8 shadow-inner border border-primary/20">
            <h2 className="text-3xl font-bold font-headline">さあ、あなたの物語を始めましょう</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/tutorial">
                <Button size="lg" className="font-bold h-14 px-8">
                  チュートリアルを読む
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="font-bold h-14 px-8">
                  エディターを開く
                </Button>
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
                <li><Link href="/about" className="hover:text-primary transition-colors flex items-center gap-2"><HelpCircle className="h-3 w-3" /> About</Link></li>
                <li><Link href="/showcase" className="hover:text-primary transition-colors flex items-center gap-2"><Presentation className="h-3 w-3" /> 作品紹介</Link></li>
                <li><Link href="/tutorial" className="hover:text-primary transition-colors flex items-center gap-2"><BookOpen className="h-3 w-3" /> チュートリアル</Link></li>
                <li><Link href="/guide" className="text-primary font-bold flex items-center gap-2"><ScrollText className="h-3 w-3" /> 制作ガイド</Link></li>
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
