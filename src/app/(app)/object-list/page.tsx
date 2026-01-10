import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
};

async function getObjects(): Promise<AvailableObject[]> {
  try {
    const response = await fetch(`${process.env.APP_URL}/objects.json`, { cache: 'no-store' });
    
    if (!response.ok) {
        console.error("Failed to fetch object data");
        return [];
    }
    
    const data = await response.json();
    return data.objects;

  } catch (error) {
    console.error("Error fetching objects:", error);
    return [];
  }
}


export default async function ObjectListPage() {
  const objects = await getObjects();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">オブジェクトリスト</h1>
        <p className="text-muted-foreground">ゲームワールドに配置可能なすべてのオブジェクトを閲覧します。</p>
      </header>
      <div className="sticky top-0 z-10 py-4 bg-background/80 backdrop-blur-sm">
        <Input placeholder="オブジェクトを検索..." className="max-w-sm" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {objects.map((obj) => (
          <Card key={obj.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-square w-full bg-muted flex items-center justify-center relative p-4">
                <Image 
                  src={obj.imageUrl} 
                  alt={obj.name}
                  layout="fill"
                  objectFit="contain"
                  unoptimized
                />
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t">
              <p className="text-sm font-medium truncate">{obj.name}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
