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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnimationFrame = {
  id: string;
  image: string; // "idle_1.png"
};

type AnimationClip = {
  id: string;
  name: string;
  frames: AnimationFrame[];
  fps: number;
};

type CharacterConfig = {
  id: string;
  name: string;
  path: string; // "/characters/player"
};

const characters: CharacterConfig[] = [
    { id: "player", name: "プレイヤー", path: "/characters/player" },
    { id: "goblin", name: "ゴブリン", path: "/characters/goblin" },
];

export function CharacterAnimatorClient() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(characters[0].id);
  const [clips, setClips] = useState<AnimationClip[]>([]);
  const [availableFrames, setAvailableFrames] = useState<string[]>([]);
  const [activeClipId, setActiveClipId] = useState<string>("");
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId);

  useEffect(() => {
    if (!selectedCharacter) return;

    const loadAnimationData = async () => {
      setLoading(true);
      setError(null);
      setClips([]);
      setAvailableFrames([]);
      setActiveClipId("");

      try {
        const response = await fetch(`${selectedCharacter.path}/animations.json`);
        if (!response.ok) {
          throw new Error(`アニメーションファイルが見つかりません: ${response.statusText}`);
        }
        const data = await response.json();
        
        setClips(data.clips);
        setAvailableFrames(data.availableFrames);
        if (data.clips.length > 0) {
          setActiveClipId(data.clips[0].id);
        }

      } catch (err: any) {
        setError(err.message || 'アニメーションデータの読み込み中に不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };

    loadAnimationData();
  }, [selectedCharacter]);


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

  const handleAddFrame = (frameImage: string) => {
    if (!activeClipId) return;
    const newFrame: AnimationFrame = {
      id: `frame_${Date.now()}_${Math.random()}`,
      image: frameImage,
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

  const getFrameUrl = (imageName: string) => {
    if (!selectedCharacter) return "";
    // If imageName starts with '/', it's already a full path
    if (imageName.startsWith('/')) {
        return imageName;
    }
    return `${selectedCharacter.path}/frames/${imageName}`;
  }

  const previewImage = activeClip?.frames[currentFrameIndex]?.image;
  const previewImageUrl = previewImage ? getFrameUrl(previewImage) : undefined;
  
  const MainContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full col-span-3">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <p>{selectedCharacter?.name}のアニメーションを読み込み中...</p>
        </div>
      );
    }
  
    if (error) {
      return (
        <div className="col-span-3">
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>読み込みエラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    return (
    <>
      {/* Left Column: Asset Library & Animation Clips */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card className="flex-shrink-0">
          <CardHeader>
            <CardTitle>フレームアセット</CardTitle>
            <CardDescription>
              クリックしてタイムラインにフレームを追加します。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="grid grid-cols-4 gap-2">
                {availableFrames.map((frameImage) => (
                  <div
                    key={frameImage}
                    onClick={() => handleAddFrame(frameImage)}
                    className="aspect-square bg-muted rounded-md flex items-center justify-center p-1 cursor-pointer hover:bg-muted/80 border-2 border-transparent hover:border-primary"
                  >
                    <Image
                      src={getFrameUrl(frameImage)}
                      alt={frameImage}
                      width={64}
                      height={64}
                      className="object-contain"
                      unoptimized
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
            <ScrollArea className="h-full pr-4">
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
              <Plus className="mr-2 h-4 w-4" />
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
                {previewImageUrl ? (
                  <Image
                    src={previewImageUrl}
                    alt="Animation Preview"
                    layout="fill"
                    objectFit="contain"
                    key={currentFrameIndex}
                    unoptimized
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
                          src={getFrameUrl(frame.image)}
                          alt={`Frame ${frame.id}`}
                          width={80}
                          height={80}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    ))}
                     <div className="h-24 w-24 flex-shrink-0 rounded-md border-2 border-dashed text-muted-foreground flex flex-col items-center justify-center text-center p-2">
                        <Plus className="h-6 w-6"/>
                        <span className="text-xs mt-1">アセットをクリックして追加</span>
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
    </>
    )
  }

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex-shrink-0">
        <Label htmlFor="character-select">キャラクターを選択</Label>
        <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
          <SelectTrigger id="character-select" className="w-[280px] mt-2">
            <SelectValue placeholder="編集するキャラクターを選択..." />
          </SelectTrigger>
          <SelectContent>
            {characters.map(char => (
              <SelectItem key={char.id} value={char.id}>{char.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
        <MainContent />
      </div>
    </div>
  );
}
