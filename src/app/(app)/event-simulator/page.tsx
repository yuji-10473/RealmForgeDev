import { EventSimulatorClient } from "@/components/client/event-simulator-client";
import { Suspense } from "react";

export default function EventSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">イベントシミュレーター</h1>
        <p className="text-muted-foreground">イベントのフローと分岐をテストします。</p>
      </header>
      <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
        <EventSimulatorClient />
      </Suspense>
    </div>
  );
}
