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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { RealmforgeLogo } from "@/components/icons/RealmforgeLogo";
import { MapIcon } from "@/components/icons/MapIcon";
import { RoomIcon } from "@/components/icons/RoomIcon";
import { CharacterIcon } from "@/components/icons/CharacterIcon";
import { ObjectIcon } from "@/components/icons/ObjectIcon";
import { ItemIcon } from "@/components/icons/ItemIcon";
import { EventIcon } from "@/components/icons/EventIcon";
import { EventSimulatorIcon } from "@/components/icons/EventSimulatorIcon";
import { StoryIcon } from "@/components/icons/StoryIcon";
import { CombatIcon } from "@/components/icons/CombatIcon";
import { ExportIcon } from "@/components/icons/ExportIcon";
import { AssetIcon } from "@/components/icons/AssetIcon";
import { PlayTestIcon } from "@/components/icons/PlayTestIcon";
import { MenuIcon } from "@/components/icons/MenuIcon";
import { ShopIcon } from "@/components/icons/ShopIcon";
import packageJson from "../../../package.json";
import { AuthButton } from "@/components/client/auth-button";
import { FirebaseClientProvider } from "@/firebase/client-provider";

const navItems = [
  { href: "/", label: "マップエディター", icon: MapIcon },
  { href: "/room-editor", label: "ルームエディター", icon: RoomIcon },
  { href: "/object-list", label: "オブジェクトリスト", icon: ObjectIcon },
  { href: "/item-list", label: "アイテムリスト", icon: ItemIcon },
  { href: "/character-editor", label: "キャラクターエディター", icon: CharacterIcon },
  { href: "/event-editor", label: "イベントエディター", icon: EventIcon },
  { href: "/event-simulator", label: "イベントシミュレーター", icon: EventSimulatorIcon },
  { href: "/story-assist", label: "ストーリーアシスト", icon: StoryIcon },
  { href: "/menu-simulator", label: "メニューシミュレーター", icon: MenuIcon },
  { href: "/shop-simulator", label: "ショップシミュレーター", icon: ShopIcon },
  { href: "/combat-simulator", label: "戦闘シミュレーター", icon: CombatIcon },
  { href: "/asset-library", label: "アセットライブラリ", icon: AssetIcon },
  { href: "/play-test", label: "プレイテスト", icon: PlayTestIcon },
  { href: "/export", label: "ゲームをエクスポート", icon: ExportIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const version = packageJson.version;

  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between p-2">
              <Button variant="ghost" className="h-10 justify-start px-2">
                <RealmforgeLogo className="h-6 w-6 text-primary" />
                <span className="font-headline text-lg font-bold ml-2">RealmForge</span>
              </Button>
              <AuthButton />
            </div>
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
          <SidebarFooter>
            <div className="text-center text-xs text-muted-foreground p-2">
              Ver {version}
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <main className="min-h-screen p-4 sm:p-6 lg:p-8">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
