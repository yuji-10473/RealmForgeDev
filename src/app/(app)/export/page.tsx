"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, Sparkles } from "lucide-react";

export default function ExportPage() {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "エクスポート機能",
      description: "今後のアップデートで、ゲームのパッケージ化機能を提供予定です。最新情報をお待ちください！",
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">ゲームをエクスポート</h1>
        <p className="text-muted-foreground">ウェブまたはデスクトップ用にゲームをパッケージ化し、世界へ共有します。</p>
      </header>
      <Card className="max-w-lg mx-auto text-center border-primary/20 shadow-md">
        <CardHeader>
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="text-primary h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">作品を共有する準備はできましたか？</CardTitle>
          <CardDescription className="text-base">
            完成したゲームをプレイ可能な形式にパッケージ化する機能を現在準備中です。<br/>最新のアップデートにより順次提供を予定しています。
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <Button size="lg" onClick={handleExport} className="px-8 py-6 text-lg font-bold">
            <Download className="mr-2 h-5 w-5" />
            エクスポート機能を予約
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
