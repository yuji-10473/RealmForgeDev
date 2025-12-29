"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Image from "next/image";

type Tile = {
  id: string;
  name: string;
  color: string;
  image?: string;
};

const tiles: Tile[] = [
  { id: "grass", name: "草", color: "bg-green-500/20", image: PlaceHolderImages.find(p => p.id === 'grass-tile')?.imageUrl },
  { id: "water", name: "水", color: "bg-blue-500/20", image: PlaceHolderImages.find(p => p.id === 'water-tile')?.imageUrl },
  { id: "stone", name: "石", color: "bg-gray-500/20", image: PlaceHolderImages.find(p => p.id === 'stone-tile')?.imageUrl },
  { id: "tree", name: "木", color: "bg-transparent", image: PlaceHolderImages.find(p => p.id === 'tree-asset')?.imageUrl },
  { id: "chest", name: "宝箱", color: "bg-transparent", image: PlaceHolderImages.find(p => p.id === 'chest-asset')?.imageUrl },
];

const GRID_SIZE = 20;

export function MapEditorClient() {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(tiles[0]);
  const [grid, setGrid] = useState<Array<Tile | null>>(() => Array(GRID_SIZE * GRID_SIZE).fill(tiles[0]));

  const handleCellClick = (index: number) => {
    if (selectedTile) {
      const newGrid = [...grid];
      newGrid[index] = selectedTile;
      setGrid(newGrid);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-grow">
        <div
          className="grid border-2 border-dashed border-border"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: "100%",
            aspectRatio: "1 / 1",
          }}
        >
          {grid.map((cell, index) => (
            <div
              key={index}
              onClick={() => handleCellClick(index)}
              className={cn(
                "w-full h-full border-r border-b border-border/20 cursor-pointer hover:bg-accent/30 transition-colors relative",
                cell?.color
              )}
            >
              {cell?.image && cell.id !== 'grass' && cell.id !== 'water' && cell.id !== 'stone' && (
                 <Image src={cell.image} alt={cell.name} fill className="object-contain p-1" />
              )}
            </div>
          ))}
        </div>
      </div>
      <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle>タイルとオブジェクト</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 lg:grid-cols-2 gap-4">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                onClick={() => setSelectedTile(tile)}
                className={cn(
                  "flex flex-col items-center gap-2 p-2 rounded-lg cursor-pointer border-2 transition-all",
                  selectedTile?.id === tile.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-accent hover:bg-accent/10"
                )}
              >
                <div className={cn("w-12 h-12 rounded-md flex items-center justify-center relative", tile.color)}>
                  {tile.image && <Image src={tile.image} alt={tile.name} width={48} height={48} className="object-cover rounded-md" />}
                </div>
                <span className="text-xs text-center font-medium">{tile.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
