import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  type?: 'person' | 'door' | 'item';
};

async function getItems(): Promise<AvailableObject[]> {
  try {
    const response = await fetch(`${process.env.APP_URL}/data/items.json`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching items:", error);
    return [];
  }
}

export default async function ItemListPage() {
  const items = await getItems();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">アイテムリスト</h1>
        <p className="text-muted-foreground">アイテム図鑑のデータを一覧表示します。</p>
      </header>
      <div className="sticky top-0 z-10 py-4 bg-background/80 backdrop-blur-sm">
        <Input placeholder="アイテムを検索..." className="max-w-sm" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
            <CardFooter className="p-3 border-t">
              <p className="text-sm font-medium truncate">{item.name}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
