"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PlaceHolderImages, type ImagePlaceholder } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";

type AnimationFrame = {
  id: string;
  assetId: string;
  imageUrl: string;
};

type AnimationClip = {
  id: string;
  name: string;
  frames: AnimationFrame[];
  fps: number;
};

const initialClips: AnimationClip[] = [
  {
    id: "clip_idle",
    name: "待機",
    frames: [],
    fps: 4,
  },
  {
    id: "clip_walk",
    name: "歩行",
    frames: [],
    fps: 8,
  },
];

export function CharacterAnimatorClient() {
  const [assets, setAssets] = useState<ImagePlaceholder[]>([]);
  const [clips, setClips] = useState<AnimationClip[]>(initialClips);
  const [activeClipId, setActiveClipId] = useState<string>(
    initialClips[0]?.id || ""
  );
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  useEffect(() => {
    const characterAssets = PlaceHolderImages.filter((p) =>
      p.id.includes("hero-sprite") || p.id.includes('enemy-sprite')
    );
    setAssets(characterAssets);
  }, []);

  const activeClip = clips.find((c) => c.id === activeClipId);

  useEffect(() => {
    let animationInterval: NodeJS.Timeout;
    if (isPlaying && activeClip && activeClip.frames.length > 0) {
      animationInterval = setInterval(() => {
        setCurrentFrameIndex(
          (prevIndex) => (prevIndex + 1) % activeClip.frames.length
        );
      }, 1000 / activeClip.fps);
    }
    return () => clearInterval(animationInterval);
  }, [isPlaying, activeClip]);
  
  useEffect(() => {
    if(!activeClip || activeClip.frames.length === 0) {
      setIsPlaying(false);
    }
    setCurrentFrameIndex(0);
  }, [activeClipId, activeClip])

  const handleAddClip = () => {
    const newClip: AnimationClip = {
      id: `clip_${Date.now()}`,
      name: `新規アニメーション ${clips.length + 1}`,
      frames: [],
      fps: 8,
    };
    setClips([...clips, newClip]);
    setActiveClipId(newClip.id);
  };
  
  const handleClipNameChange = (clipId: string, newName: string) => {
    setClips(clips.map(c => c.id === clipId ? {...c, name: newName} : c));
  }

  const handleAddFrame = (asset: ImagePlaceholder) => {
    if (!activeClipId) return;
    const newFrame: AnimationFrame = {
      id: `frame_${Date.now()}`,
      assetId: asset.id,
      imageUrl: asset.imageUrl,
    };
    setClips(
      clips.map((c) =>
        c.id === activeClipId ? { ...c, frames: [...c.frames, newFrame] } : c
      )
    );
  };
  
  const handleRemoveFrame = () => {
    if (!activeClipId || !selectedFrameId) return;
     setClips(clips.map(c => {
       if (c.id === activeClipId) {
         return {...c, frames: c.frames.filter(f => f.id !== selectedFrameId)}
       }
       return c;
     }));
     setSelectedFrameId(null);
  }
  
  const handleFpsChange = (newFps: number[]) => {
     if (!activeClipId) return;
     setClips(clips.map(c => c.id === activeClipId ? {...c, fps: newFps[0]} : c));
  }

  const previewImage = activeClip?.frames[currentFrameIndex]?.imageUrl;


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column: Asset Library & Animation Clips */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card className="flex-shrink-0">
          <CardHeader>
            <CardTitle>アセット</CardTitle>
            <CardDescription>
              アニメーションに使用する画像を選択してください。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-4 gap-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => handleAddFrame(asset)}
                    className="aspect-square bg-muted rounded-md flex items-center justify-center p-1 cursor-pointer hover:bg-muted/80 border-2 border-transparent hover:border-primary"
                  >
                    <Image
                      src={asset.imageUrl}
                      alt={asset.description}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="flex-grow flex flex-col">
          <CardHeader>
            <CardTitle>アニメーションクリップ</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {clips.map((clip) => (
                  <Button
                    key={clip.id}
                    variant={clip.id === activeClipId ? "secondary" : "ghost"}
                    onClick={() => setActiveClipId(clip.id)}
                    className="w-full justify-start"
                  >
                    {clip.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-2 border-t">
            <Button variant="outline" className="w-full" onClick={handleAddClip}>
              <Plus className="mr-2" />
              クリップを追加
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column: Editor and Preview */}
      {activeClip ? (
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
          <Card className="flex-grow-[2] flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>プレビュー</CardTitle>
                <CardDescription>{activeClip.name}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsPlaying(!isPlaying)} disabled={activeClip.frames.length === 0}>
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                 <div className="flex items-center gap-2 w-48">
                  <Label>FPS</Label>
                  <Slider value={[activeClip.fps]} onValueChange={handleFpsChange} min={1} max={30} step={1} />
                  <span className="font-mono text-sm">{activeClip.fps}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center bg-muted/50">
              <div className="w-48 h-48 relative">
                {previewImage ? (
                  <Image
                    src={previewImage}
                    alt="Animation Preview"
                    layout="fill"
                    objectFit="contain"
                    key={currentFrameIndex}
                    className="animate-fade-in"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">フレームがありません</div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="flex-grow-[1] flex flex-col">
            <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle>タイムライン</CardTitle>
                  <CardDescription>
                    フレームをクリックして選択し、削除または順序を変更します。
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled={!selectedFrameId}><ChevronLeft /></Button>
                    <Button variant="outline" size="icon" disabled={!selectedFrameId}><ChevronRight /></Button>
                    <Button variant="outline" size="icon" disabled={!selectedFrameId}><Copy /></Button>
                    <Button variant="destructive" size="icon" onClick={handleRemoveFrame} disabled={!selectedFrameId}><Trash2 /></Button>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ScrollArea className="h-full whitespace-nowrap">
                 <div className="flex items-center h-full gap-2 p-2">
                    {activeClip.frames.map((frame) => (
                      <div
                        key={frame.id}
                        onClick={() => setSelectedFrameId(frame.id)}
                        className={cn("h-24 w-24 flex-shrink-0 bg-muted rounded-md flex items-center justify-center p-2 cursor-pointer border-2",
                          selectedFrameId === frame.id ? "border-primary" : "border-transparent"
                        )}
                      >
                        <Image
                          src={frame.imageUrl}
                          alt={`Frame ${frame.id}`}
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      </div>
                    ))}
                     <div className="h-24 w-24 flex-shrink-0 rounded-md border-2 border-dashed text-muted-foreground flex flex-col items-center justify-center">
                        <Plus />
                        <span className="text-xs mt-1">アセットを追加</span>
                     </div>
                 </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
         <div className="lg:col-span-2 flex items-center justify-center">
           <Card className="text-center">
             <CardHeader>
               <CardTitle>クリップが選択されていません</CardTitle>
               <CardDescription>左のリストからクリップを選択するか、新しいクリップを作成してください。</CardDescription>
             </CardHeader>
           </Card>
         </div>
      )}
    </div>
  );
}
