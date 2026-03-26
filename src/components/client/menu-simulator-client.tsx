"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "../ui/button";
import { Play } from "lucide-react";

export type DisplayInventoryItem = {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
  canUse?: boolean;
};

export type DisplaySequence = {
  id: string;
  title: string;
  description: string;
};

export function MenuSimulatorClient({ 
  inventoryItems = [], 
  sequences = [],
  onPlaySequence,
  onUseItem
}: { 
  inventoryItems?: DisplayInventoryItem[];
  sequences?: DisplaySequence[];
  onPlaySequence?: (sequenceId: string) => void;
  onUseItem?: (itemId: string) => void;
}) {
  return (
    <Tabs defaultValue="items" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="items">所持アイテム</TabsTrigger>
        <TabsTrigger value="story">物語</TabsTrigger>
        <TabsTrigger value="bestiary" disabled>図鑑</TabsTrigger>
      </TabsList>
      <TabsContent value="items" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>所持アイテム</CardTitle>
            <CardDescription>現在プレイヤーが所持しているアイテムの一覧です。</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {inventoryItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden relative hover:shadow-lg transition-shadow flex flex-col">
                    <CardContent className="p-0 flex-grow">
                      <div className="aspect-square w-full bg-muted flex items-center justify-center relative p-4">
                        {item.imageUrl ? (
                          <Image 
                            src={item.imageUrl} 
                            alt={item.name}
                            layout="fill"
                            objectFit="contain"
                            unoptimized
                          />
                        ) : (
                          <div className="text-muted-foreground text-[10px] text-center">画像なし</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 border-t flex flex-col gap-2">
                      <div className="flex justify-between items-center w-full">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">x{item.quantity}</p>
                      </div>
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
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="story" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>物語の記憶</CardTitle>
            <CardDescription>これまでの冒険や、紐解かれた物語を再生します。</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="bestiary">
        {/* Placeholder for future implementation */}
      </TabsContent>
    </Tabs>
  );
}
