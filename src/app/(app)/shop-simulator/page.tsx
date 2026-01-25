import { ShopSimulatorClient } from "@/components/client/shop-simulator-client";
import { Suspense } from "react";

export default function ShopSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">ショップシミュレーター</h1>
        <p className="text-muted-foreground">ショップのUIと売買ロジックをテストします。</p>
      </header>
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <ShopSimulatorClient />
      </Suspense>
    </div>
  );
}
