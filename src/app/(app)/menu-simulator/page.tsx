import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

type InventoryItem = {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
  description: string;
  imageHint: string;
};

// Simulate fetching player inventory
function getInventoryItems(): InventoryItem[] {
  const sword = PlaceHolderImages.find(p => p.id === 'sword-asset');
  const shield = PlaceHolderImages.find(p => p.id === 'shield-asset');
  const potion = PlaceHolderImages.find(p => p.id === 'chest-asset'); // Using chest as a potion placeholder
  const key = PlaceHolderImages.find(p => p.id === 'tree-asset'); // Using tree as a key placeholder

  const inventory: InventoryItem[] = [];

  if (sword) {
    inventory.push({ ...sword, name: "勇者の剣", quantity: 1 });
  }
  if (shield) {
    inventory.push({ ...shield, name: "鋼の盾", quantity: 1 });
  }
  if (potion) {
    inventory.push({ ...potion, name: "回復ポーション", quantity: 5, id: "potion" });
  }
   if (key) {
    inventory.push({ ...key, name: "古い鍵", quantity: 2, id: "key" });
  }

  return inventory;
}


export default function MenuSimulatorPage() {
  const inventoryItems = getInventoryItems();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">メニューシミュレーター</h1>
        <p className="text-muted-foreground">所持アイテムやイベント、図鑑などのゲームメニューを確認します。</p>
      </header>

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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {inventoryItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden relative hover:shadow-lg transition-shadow">
                      <CardContent className="p-0">
                        <div className="aspect-square w-full bg-muted flex items-center justify-center relative p-4">
                          <Image 
                            src={item.imageUrl} 
                            alt={item.name}
                            layout="fill"
                            objectFit="contain"
                            data-ai-hint={item.imageHint}
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
    </div>
  );
}
