import { CombatSimulatorClient } from "@/components/client/combat-simulator-client";

export default function CombatSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">戦闘シミュレーター</h1>
        <p className="text-muted-foreground">キャラクターをテストし、戦闘メカニクスのバランスを調整します。</p>
      </header>
      <CombatSimulatorClient />
    </div>
  );
}
