import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Separator } from "@/components/ui/separator";

export default function CharacterEditorPage() {
  const heroSprite = PlaceHolderImages.find(p => p.id === 'hero-sprite');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">キャラクターエディター</h1>
        <p className="text-muted-foreground">ヒーローや悪役に命を吹き込みましょう。</p>
      </header>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4 flex flex-col items-center">
              <CardTitle className="text-lg text-center">スプライト</CardTitle>
              <div className="relative w-48 h-48 bg-muted rounded-lg border-2 border-dashed flex items-center justify-center">
                {heroSprite && (
                  <Image 
                    src={heroSprite.imageUrl} 
                    alt={heroSprite.description}
                    width={192}
                    height={192}
                    className="object-contain p-2"
                    data-ai-hint={heroSprite.imageHint}
                  />
                )}
              </div>
              <Button variant="outline">スプライトを変更</Button>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="char-name" className="text-base">名前</Label>
                <Input id="char-name" placeholder="例：勇敢なサー・ケイラン" defaultValue="アリア" />
              </div>
              <Separator />
              <div>
                <CardTitle className="text-lg mb-4">ステータス</CardTitle>
                <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="char-hp">体力 (HP)</Label>
                    <div className="flex items-center gap-4">
                      <Slider id="char-hp" defaultValue={[80]} max={100} step={1} />
                      <span className="font-mono w-12 text-center">80</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="char-atk">攻撃</Label>
                     <div className="flex items-center gap-4">
                      <Slider id="char-atk" defaultValue={[55]} max={100} step={1} />
                      <span className="font-mono w-12 text-center">55</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="char-def">防御</Label>
                     <div className="flex items-center gap-4">
                      <Slider id="char-def" defaultValue={[45]} max={100} step={1} />
                      <span className="font-mono w-12 text-center">45</span>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="char-skills" className="text-base">スキル</Label>
                <Textarea 
                  id="char-skills" 
                  placeholder="例：ファイアボール、ヒール、ダブルストライク"
                  defaultValue="斬撃\n受け流し\n応急処置" 
                />
                <CardDescription>1行に1つのスキルを入力してください。</CardDescription>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end p-6 border-t">
          <Button>キャラクターを保存</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
