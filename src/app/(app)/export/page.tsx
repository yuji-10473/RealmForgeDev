"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

export default function ExportPage() {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "エクスポート開始",
      description: "この機能はまだ実装されていません。ここにゲームがパッケージ化されます！",
    });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">ゲームをエクスポート</h1>
        <p className="text-muted-foreground">ウェブまたはデスクトップ用にゲームをパッケージ化します。</p>
      </header>
      <Card className="max-w-lg mx-auto text-center">
        <CardHeader>
          <CardTitle>作品を共有する準備はできましたか？</CardTitle>
          <CardDescription>
            準備ができたら、ゲームをプレイ可能な形式にエクスポートできます。この機能は現在開発中です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={handleExport}>
            <Download className="mr-2" />
            ゲームをパッケージ化してエクスポート
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
