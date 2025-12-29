import { CombatSimulatorClient } from "@/components/client/combat-simulator-client";

export default function CombatSimulatorPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Combat Simulator</h1>
        <p className="text-muted-foreground">Test your characters and balance battle mechanics.</p>
      </header>
      <CombatSimulatorClient />
    </div>
  );
}
