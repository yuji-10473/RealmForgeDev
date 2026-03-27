"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "../ui/button";
import { Play, Heart, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export type DisplayInventoryItem = {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
  canUse?: boolean;
  description?: string;
};

export type DisplaySequence = {
  id: string;
  title: string;
  description: string;
};

export type DisplayAffection = {
  id: string;
  name: string;
  imageUrl: string;
  points: number;
  description?: string;
};

export function MenuSimulatorClient({ 
  inventoryItems = [], 
  sequences = [],
  characterAffection = [],
  onPlaySequence,
  onUseItem
}: { 
  inventoryItems?: DisplayInventoryItem[];
  sequences?: DisplaySequence[];
  characterAffection?: DisplayAffection[];
  onPlaySequence?: (sequenceId: string) => void;
  onUseItem?: (itemId: string) => void;
}) {
  return (
    <Tabs defaultValue="items" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="items">所持アイテム</TabsTrigger>
        <TabsTrigger value="characters">人物</TabsTrigger>
        <TabsTrigger value="story">物語</TabsTrigger>
      </TabsList>
      
      <TabsContent value="items" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>所持アイテム</CardTitle>
            <CardDescription>現在プレイヤーが所持しているアイテムの一覧です。</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh] px-6 pb-6">
              {inventoryItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {inventoryItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden relative hover:shadow-lg transition-shadow flex flex-col">
                      <CardContent className="p-0 flex-grow">
                        <div className="aspect-square w-full bg-muted flex items-center justify-center relative p-4">
                          {item.imageUrl ? (
                            <Image 
                              src={item.imageUrl} 
                              alt={item.name || 'Item'}
                              fill
                              className="object-contain p-4"
                              unoptimized
                            />
                          ) : (
                            <div className="text-muted-foreground text-[10px] text-center">画像なし</div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-2 border-t flex flex-col gap-2">
                        <div className="flex justify-between items-center w-full min-w-0">
                          <p className="text-sm font-bold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground font-mono shrink-0">x{item.quantity}</p>
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2 w-full italic">
                            {item.description}
                          </p>
                        )}
                        {item.canUse && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full h-7 text-xs"
                            onClick={() => onUseItem?.(item.id)}
                          >
                            使用する
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>所持アイテムはありません。</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="characters" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>人物名鑑</CardTitle>
            <CardDescription>これまでに出会った人々との絆（好感度）を確認できます。</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh] px-6 pb-6">
              {characterAffection.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {characterAffection.map((char) => (
                    <Card key={char.id} className="flex overflow-hidden hover:bg-muted/30 transition-colors">
                      <div className="w-24 h-24 bg-muted flex-shrink-0 relative border-r">
                        {char.imageUrl ? (
                          <Image 
                            src={char.imageUrl} 
                            alt={char.name || 'Character'}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full"><User className="text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="p-3 flex-grow flex flex-col justify-center gap-2 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold truncate">{char.name}</h3>
                            {char.description && (
                              <p className="text-[10px] text-muted-foreground line-clamp-1 italic mt-0.5">
                                {char.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-red-500 shrink-0">
                            <Heart className="h-4 w-4 fill-current" />
                            <span className="font-mono text-sm font-bold">{char.points}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            <span>Affection</span>
                            <span>Lv.{Math.floor(char.points / 100) + 1}</span>
                          </div>
                          <Progress value={char.points % 100} className="h-1.5" />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>絆を深めた人はまだいません。</p>
                  <p className="text-xs mt-2">依頼をこなして報酬を得ると、好感度が上がります。</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="story" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>物語の記憶</CardTitle>
            <CardDescription>これまでの冒険や、紐解かれた物語を再生します。</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[60vh] px-6 pb-6">
              {sequences.length > 0 ? (
                <div className="space-y-4">
                  {sequences.map((seq) => (
                    <Card key={seq.id} className="overflow-hidden hover:bg-muted/30 transition-colors">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg">{seq.title}</CardTitle>
                        <CardDescription>{seq.description}</CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0">
                        <Button 
                          size="sm" 
                          className="w-full sm:w-auto"
                          onClick={() => onPlaySequence?.(seq.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          物語を再生する
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>再生可能な物語がありません。</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
