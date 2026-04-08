import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              戻る
            </Button>
          </Link>
        </header>

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

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">3. 広告配信について（重要）</h2>
            <div className="bg-muted/30 p-4 border rounded-lg">
              <p>
                当サイトでは、第三者配信事業者（Google AdSense）が提供する広告を配信しています。
              </p>
              <p className="mt-2">
                これらの事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報「Cookie」（氏名、住所、メールアドレス、電話番号は含まれません）を使用することがあります。
              </p>
              <p className="mt-2">
                Google AdSenseに関して、プロセスの詳細やこのような情報が広告配信事業者に使用されないようにする方法については、
                <a href="https://policies.google.com/technologies/ads" className="text-primary underline ml-1" target="_blank" rel="noopener noreferrer">Googleのポリシーと規約</a> 
                をご確認ください。
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">4. クッキー（Cookie）の使用</h2>
            <p>
              当サイトは、ユーザーの利便性向上およびアクセス解析、広告配信のためにクッキーを使用しています。ユーザーはブラウザの設定によりクッキーを無効にすることができますが、その場合、当サービスの一部機能が利用できなくなる可能性があります。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">5. 情報の第三者提供</h2>
            <p>
              当サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold">6. お問い合わせ</h2>
            <p>
              当サービスに関するお問い合わせ、またはプライバシーポリシーに関するご質問は、以下のメールアドレス、または
              <a 
                href="https://docs.google.com/forms/d/e/1FAIpQLSfA-PnpIzXaM1935pJ4nF6SsqyDSOeowzxYhamHnbgH4iIsOg/viewform?usp=header" 
                className="text-primary underline mx-1" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                お問い合わせフォーム
              </a>
              よりご連絡ください。
            </p>
            <p className="text-sm font-mono mt-2 bg-muted/50 p-2 rounded w-fit">
              Email: firebase.25.11.11@gmail.com
            </p>
          </section>
        </main>

        <footer className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2024 RealmForge Project. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
