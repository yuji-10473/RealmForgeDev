import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

export default function AssetLibraryPage() {
  const assets = PlaceHolderImages.filter(p => p.id.includes('asset') || p.id.includes('tile'));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Asset Library</h1>
        <p className="text-muted-foreground">Browse built-in and community-created assets for your game.</p>
      </header>
      <div className="sticky top-0 z-10 py-4 bg-background/80 backdrop-blur-sm">
        <Input placeholder="Search for assets..." className="max-w-sm" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {assets.map((asset) => (
          <Card key={asset.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              <div className="aspect-square w-full bg-muted flex items-center justify-center relative">
                <Image 
                  src={asset.imageUrl} 
                  alt={asset.description}
                  layout="fill"
                  objectFit="contain"
                  className="p-4"
                  data-ai-hint={asset.imageHint}
                />
              </div>
            </CardContent>
            <CardFooter className="p-3 border-t">
              <p className="text-sm font-medium truncate">{asset.description}</p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
