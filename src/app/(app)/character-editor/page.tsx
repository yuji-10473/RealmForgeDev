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
        <h1 className="text-3xl font-bold font-headline">Character Editor</h1>
        <p className="text-muted-foreground">Breathe life into your heroes and villains.</p>
      </header>
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4 flex flex-col items-center">
              <CardTitle className="text-lg text-center">Sprite</CardTitle>
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
              <Button variant="outline">Change Sprite</Button>
            </div>
            
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="char-name" className="text-base">Name</Label>
                <Input id="char-name" placeholder="e.g., Sir Kaelan the Brave" defaultValue="Aria" />
              </div>
              <Separator />
              <div>
                <CardTitle className="text-lg mb-4">Stats</CardTitle>
                <div className="space-y-6">
                  <div className="grid gap-2">
                    <Label htmlFor="char-hp">Health Points (HP)</Label>
                    <div className="flex items-center gap-4">
                      <Slider id="char-hp" defaultValue={[80]} max={100} step={1} />
                      <span className="font-mono w-12 text-center">80</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="char-atk">Attack</Label>
                     <div className="flex items-center gap-4">
                      <Slider id="char-atk" defaultValue={[55]} max={100} step={1} />
                      <span className="font-mono w-12 text-center">55</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="char-def">Defense</Label>
                     <div className="flex items-center gap-4">
                      <Slider id="char-def" defaultValue={[45]} max={100} step={1} />
                      <span className="font-mono w-12 text-center">45</span>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="char-skills" className="text-base">Skills</Label>
                <Textarea 
                  id="char-skills" 
                  placeholder="e.g., Fireball, Heal, Double Strike"
                  defaultValue="Slash\nParry\nFirst Aid" 
                />
                <CardDescription>Enter one skill per line.</CardDescription>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end p-6 border-t">
          <Button>Save Character</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
