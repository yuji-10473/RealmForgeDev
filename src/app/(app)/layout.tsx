"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { MapIcon } from "@/components/icons/MapIcon";
import { CharacterIcon } from "@/components/icons/CharacterIcon";
import { EventIcon } from "@/components/icons/EventIcon";
import { StoryIcon } from "@/components/icons/StoryIcon";
import { CombatIcon } from "@/components/icons/CombatIcon";
import { ExportIcon } from "@/components/icons/ExportIcon";
import { AssetIcon } from "@/components/icons/AssetIcon";
import { PlayTestIcon } from "@/components/icons/PlayTestIcon";

const navItems = [
  { href: "/", label: "マップエディター", icon: MapIcon },
  { href: "/character-editor", label: "キャラクターエディター", icon: CharacterIcon },
  { href: "/event-editor", label: "イベントエディター", icon: EventIcon },
  { href: "/story-assist", label: "ストーリーアシスト", icon: StoryIcon },
  { href: "/combat-simulator", label: "戦闘シミュレーター", icon: CombatIcon },
  { href: "/asset-library", label: "アセットライブラリ", icon: AssetIcon },
  { href: "/play-test", label: "プレイテスト", icon: PlayTestIcon },
  { href: "/export", label: "ゲームをエクスポート", icon: ExportIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Button variant="ghost" className="h-10 w-full justify-start px-2">
            <RealmforgeLogo className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-bold ml-2">RealmForge</span>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
