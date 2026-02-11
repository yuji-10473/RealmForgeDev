
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AvailableObject = {
  id: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  type?: 'person' | 'door' | 'item';
  baseValue?: number;
};

type ShopItem = {
  itemId: string;
  price: number;
};

type Shop = {
  id: string;
  name: string;
  items: ShopItem[];
};

type PlayerInventoryItem = {
  itemId: string;
  quantity: number;
};

export function ShopSimulatorClient() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shops, setShops] = useState<Shop[]>([]);
  const [allItems, setAllItems] = useState<AvailableObject[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');

  const [playerGold, setPlayerGold] = useState(500);
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([
    { itemId: 'item_potion', quantity: 3 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [shopsResponse, objectsResponse] = await Promise.all([
          fetch('/shops.json'),
          fetch('/objects.json'),
        ]);

        if (!shopsResponse.ok) throw new Error('ショップデータ(shops.json)の読み込みに失敗しました。');
        if (!objectsResponse.ok) throw new Error('オブジェクトデータ(objects.json)の読み込みに失敗しました。');

        const shopsData = await shopsResponse.json();
        const objectsData = await objectsResponse.json();

        setShops(shopsData.shops);
        setAllItems((objectsData.objects || []).filter((obj: AvailableObject) => obj.type === 'item'));
        
        if (shopsData.shops.length > 0) {
          setSelectedShopId(shopsData.shops[0].id);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedShop = useMemo(() => shops.find(s => s.id === selectedShopId), [shops, selectedShopId]);

  const buyableItems = useMemo(() => {
    if (!selectedShop) return [];
    return selectedShop.items.map(shopItem => {
      const itemDetails = allItems.find(item => item.id === shopItem.itemId);
      return { ...shopItem, ...itemDetails };
    }).filter(item => item.name);
  }, [selectedShop, allItems]);

  const sellableItems = useMemo(() => {
    return playerInventory.map(invItem => {
      const itemDetails = allItems.find(item => item.id === invItem.itemId);
      // If baseValue is defined in objects.json, use it. Otherwise, fall back to a calculated value.
      const sellPrice = itemDetails?.baseValue ?? Math.floor((buyableItems.find(bi => bi.itemId === invItem.itemId)?.price || 10) / 2);
      return { ...invItem, ...itemDetails, sellPrice };
    }).filter(item => item.name);
  }, [playerInventory, allItems, buyableItems]);
  
  const handleBuy = (itemId: string, price: number) => {
    if (playerGold < price) {
      toast({
        variant: "destructive",
        title: "ゴールドが足りません！",
        description: `このアイテムを買うには ${price} K 必要です。`,
      });
      return;
    }
    setPlayerGold(g => g - price);
    setPlayerInventory(inv => {
      const existing = inv.find(i => i.itemId === itemId);
      if (existing) {
        return inv.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...inv, { itemId, quantity: 1 }];
    });
    toast({
      title: "購入しました！",
      description: `${allItems.find(i=>i.id === itemId)?.name} を手に入れた。`,
    });
  };

  const handleSell = (itemId: string, sellPrice: number) => {
    setPlayerGold(g => g + sellPrice);
    setPlayerInventory(inv => {
      const item = inv.find(i => i.itemId === itemId);
      if (item && item.quantity > 1) {
        return inv.map(i => i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return inv.filter(i => i.itemId !== itemId);
    });
    toast({
      title: "売却しました！",
      description: `${allItems.find(i=>i.id === itemId)?.name} を ${sellPrice} K で売った。`,
    });
  };

  const renderItemCard = (item: any, action: 'buy' | 'sell') => {
    const price = action === 'buy' ? item.price : item.sellPrice;
    return (
      <Card key={item.id} className="overflow-hidden">
        <CardContent className="p-0">
          <div className="aspect-square w-full bg-muted flex items-center justify-center p-4">
            {item.imageUrl && (
              <Image src={item.imageUrl} alt={item.name} width={64} height={64} objectFit="contain" unoptimized />
            )}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start p-3 text-sm">
          <div className="w-full flex justify-between">
            <p className="font-medium truncate">{item.name}</p>
            {item.quantity && <p className="text-muted-foreground font-mono">x{item.quantity}</p>}
          </div>
          <div className="w-full mt-2">
            <Button
              className="w-full"
              size="sm"
              variant={action === 'buy' ? "default" : "secondary"}
              onClick={() => action === 'buy' ? handleBuy(item.itemId, price) : handleSell(item.itemId, price)}
              disabled={action === 'buy' && playerGold < price}
            >
              {action === 'buy' ? '買う' : '売る'} ({price} K)
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="mr-2 h-8 w-8 animate-spin" />データを読み込み中...</div>;
  }
  if (error) {
    return <Alert variant="destructive"><Terminal className="h-4 w-4" /><AlertTitle>読み込みエラー</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <Label htmlFor="shop-select">テストするショップ</Label>
              <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                <SelectTrigger id="shop-select" className="w-[280px] mt-2">
                  <SelectValue placeholder="ショップを選択..." />
                </SelectTrigger>
                <SelectContent>
                  {shops.map(shop => (
                    <SelectItem key={shop.id} value={shop.id}>{shop.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
             <div className="text-right">
                <p className="text-sm text-muted-foreground">所持金</p>
                <p className="text-2xl font-bold">{playerGold} K</p>
            </div>
          </CardHeader>
        </Card>
        
        {selectedShop ? (
          <Card>
            <Tabs defaultValue="buy">
              <CardHeader>
                <CardTitle>{selectedShop.name}</CardTitle>
                <TabsList className="grid w-full grid-cols-2 mt-4">
                  <TabsTrigger value="buy">買う</TabsTrigger>
                  <TabsTrigger value="sell">売る</TabsTrigger>
                </TabsList>
              </CardHeader>
              <TabsContent value="buy" className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 pt-0">
                    {buyableItems.map(item => renderItemCard(item, 'buy'))}
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="sell" className="p-0">
                 <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 pt-0">
                    {sellableItems.length > 0 ? (
                      sellableItems.map(item => renderItemCard(item, 'sell'))
                    ) : (
                      <p className="col-span-full text-center text-muted-foreground py-12">売却できるアイテムがありません。</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        ) : <p>ショップが選択されていません。</p>}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>シミュレーター設定</CardTitle>
            <CardDescription>プレイヤーのテストデータを変更します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="player-gold">所持金 (K)</Label>
              <Input
                id="player-gold"
                type="number"
                value={playerGold}
                onChange={e => setPlayerGold(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>プレイヤーの所持品</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {sellableItems.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Image src={item.imageUrl || ''} alt={item.name || ''} width={32} height={32} unoptimized/>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="font-mono text-sm">x{item.quantity}</span>
                  </div>
                ))}
                {sellableItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">アイテムがありません。</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
