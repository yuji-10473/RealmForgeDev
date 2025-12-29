"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Swords, Shield } from "lucide-react";

type Character = {
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  spriteId: string;
};

const initialPlayer: Character = {
  name: "アリア",
  hp: 80,
  maxHp: 80,
  attack: 15,
  spriteId: "hero-sprite",
};

const initialEnemy: Character = {
  name: "ゴブリン",
  hp: 50,
  maxHp: 50,
  attack: 8,
  spriteId: "enemy-sprite",
};

export function CombatSimulatorClient() {
  const [player, setPlayer] = useState<Character>(initialPlayer);
  const [enemy, setEnemy] = useState<Character>(initialEnemy);
  const [log, setLog] = useState<string[]>(["戦闘開始！"]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);

  const heroSprite = PlaceHolderImages.find(p => p.id === player.spriteId);
  const enemySprite = PlaceHolderImages.find(p => p.id === enemy.spriteId);

  const addLog = (message: string) => {
    setLog(prev => [message, ...prev]);
  };

  const handlePlayerAttack = () => {
    if (!isPlayerTurn || winner) return;

    const damage = Math.floor(player.attack + Math.random() * 5);
    addLog(`⚔️ ${player.name}が${enemy.name}に${damage}のダメージを与えた！`);
    const newEnemyHp = Math.max(0, enemy.hp - damage);
    setEnemy(e => ({ ...e, hp: newEnemyHp }));

    if (newEnemyHp === 0) {
      setWinner(player.name);
      addLog(`🎉 ${player.name}の勝利！`);
    } else {
      setIsPlayerTurn(false);
    }
  };

  useEffect(() => {
    if (!isPlayerTurn && !winner) {
      const timer = setTimeout(() => {
        const damage = Math.floor(enemy.attack + Math.random() * 3);
        addLog(`💥 ${enemy.name}が反撃して${damage}のダメージを与えた！`);
        const newPlayerHp = Math.max(0, player.hp - damage);
        setPlayer(p => ({ ...p, hp: newPlayerHp }));

        if (newPlayerHp === 0) {
          setWinner(enemy.name);
          addLog(`☠️ ${player.name}は倒された。`);
        } else {
          setIsPlayerTurn(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, enemy, player]);

  const handleReset = () => {
    setPlayer(initialPlayer);
    setEnemy(initialEnemy);
    setLog(["戦闘開始！"]);
    setIsPlayerTurn(true);
    setWinner(null);
  };
  
  const CharacterCard = ({ character, spriteUrl, imageHint }: { character: Character, spriteUrl?: string, imageHint?: string }) => (
    <Card className="flex flex-col items-center text-center shadow-lg">
      <CardHeader>
        <CardTitle>{character.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-32 h-32 bg-muted rounded-lg border-2 border-dashed">
          {spriteUrl && (
            <Image src={spriteUrl} alt={character.name} layout="fill" objectFit="contain" data-ai-hint={imageHint} className="p-2"/>
          )}
        </div>
        <div>
          <Progress value={(character.hp / character.maxHp) * 100} className="h-3" />
          <p className="font-mono text-sm mt-1">{character.hp} / {character.maxHp} HP</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <CharacterCard character={player} spriteUrl={heroSprite?.imageUrl} imageHint={heroSprite?.imageHint}/>
            <CharacterCard character={enemy} spriteUrl={enemySprite?.imageUrl} imageHint={enemySprite?.imageHint}/>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>戦闘コントロール</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                <Button onClick={handlePlayerAttack} disabled={!isPlayerTurn || !!winner}><Swords className="mr-2"/> 攻撃</Button>
                <Button variant="outline" disabled={!isPlayerTurn || !!winner}><Shield className="mr-2"/> 防御</Button>
                 {winner && <Button onClick={handleReset}>戦闘をリスタート</Button>}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>戦闘ログ</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48 w-full rounded-md border p-4 font-mono text-sm">
                    {log.map((line, index) => (
                        <p key={index}>{line}</p>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
