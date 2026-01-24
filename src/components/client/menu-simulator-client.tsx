"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export type DisplayInventoryItem = {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
};

export function MenuSimulatorClient({ inventoryItems = [] }: { inventoryItems: DisplayInventoryItem[] }) {
  return (
    <Tabs defaultValue="items" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="items">所持アイテム</TabsTrigger>
        <TabsTrigger value="quests" disabled>受注イベント</TabsTrigger>
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
                  <Card key={item.id} className="overflow-hidden relative hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="aspect-square w-full bg-muted flex items-center justify-center relative p-4">
                        <Image 
                          src={item.imageUrl} 
                          alt={item.name}
                          layout="fill"
                          objectFit="contain"
                          unoptimized
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="p-2 border-t flex justify-between items-center">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">x{item.quantity}</p>
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
      <TabsContent value="quests">
        {/* Placeholder for future implementation */}
      </TabsContent>
      <TabsContent value="bestiary">
        {/* Placeholder for future implementation */}
      </TabsContent>
    </Tabs>
  );
}
