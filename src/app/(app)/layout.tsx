// src/app/(app)/layout.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
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
  SidebarTrigger,
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
import { StoryEditorIcon } from "@/components/icons/StoryEditorIcon";
import { SequencePlayerIcon } from "@/components/icons/SequencePlayerIcon";
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { LandingScreen } from "@/components/client/landing-screen";
import { Loader2 } from "lucide-react";
import { preloadCharacterAnimation } from "@/lib/character-preload";

const navItems = [
  { href: "/", label: "マップエディター", icon: MapIcon },
  { href: "/room-editor", label: "ルームエディター", icon: RoomIcon },
  { href: "/object-list", label: "オブジェクトリスト", icon: ObjectIcon },
  { href: "/item-list", label: "アイテムリスト", icon: ItemIcon },
  { href: "/character-editor", label: "キャラクターエディター", icon: CharacterIcon },
  { href: "/event-editor", label: "イベントエディター", icon: EventIcon },
  { href: "/event-simulator", label: "イベントシミュレーター", icon: EventSimulatorIcon },
  { href: "/story-editor", label: "ストーリーエディター", icon: StoryEditorIcon },
  { href: "/story-archive", label: "物語の記憶", icon: SequencePlayerIcon },
  { href: "/story-assist", label: "ストーリーアシスト", icon: StoryIcon },
  { href: "/menu-simulator", label: "メニューシミュレーター", icon: MenuIcon },
  { href: "/shop-simulator", label: "ショップシミュレーター", icon: ShopIcon },
  { href: "/combat-simulator", label: "戦闘シミュレーター", icon: CombatIcon },
  { href: "/asset-library", label: "アセットライブラリ", icon: AssetIcon },
  { href: "/play-test", label: "プレイテスト", icon: PlayTestIcon },
  { href: "/play-test-vertical", label: "縦型プレイテスト", icon: PlayTestIcon },
  { href: "/play-test-1080p", label: "プレイテスト (1080p)", icon: PlayTestIcon },
  { href: "/export", label: "ゲームをエクスポート", icon: ExportIcon },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const version = packageJson.version;
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);
  const isAdmin = !!adminData && (adminData.isAdmin !== false);

  useEffect(() => {
    const isAllowedPath = pathname === '/play-test' || pathname === '/play-test-vertical' || pathname === '/play-test-1080p' || pathname === '/story-archive' || pathname.startsWith('/sequence-player');
    if (!isUserLoading && !isAdminLoading && user && !isAdmin && !isAllowedPath) {
      router.push('/play-test');
    }
  }, [user, isAdmin, isUserLoading, isAdminLoading, pathname, router]);

  useEffect(() => {
    const mainCharacterIdsToPreload = ["player", "goblin", "sub1", "villagers"];
    mainCharacterIdsToPreload.forEach(async (id) => {
      try {
        await preloadCharacterAnimation(id);
      } catch (error) {
        console.error(`Failed to preload character ${id}:`, error);
      }
    });
  }, []);

  if (isUserLoading || (user && isAdminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingScreen />;
  }

  const filteredNavItems = isAdmin 
    ? navItems 
    : navItems.filter(item => item.href === '/play-test' || item.href === '/play-test-vertical' || item.href === '/play-test-1080p' || item.href === '/story-archive');

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
                <SidebarMenuButton tooltip="RealmForge" asChild className="w-10 h-10 p-2">
                    <Link href="/">
                        <RealmforgeLogo className="h-6 w-6 text-primary" />
                    </Link>
                </SidebarMenuButton>
                <h1 className="font-headline text-lg font-bold truncate group-data-[state=collapsed]:opacity-0 group-data-[state=collapsed]:w-0 transition-opacity duration-200">
                    RealmForge
                </h1>
            </div>
            <AuthButton />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="truncate group-data-[state=collapsed]:hidden">
                      {item.label}
                    </span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          <SidebarTrigger className="w-full" variant="outline" />
          <div className="text-center text-xs text-muted-foreground pt-1 group-data-[state=collapsed]:hidden">
            Ver {version}
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <AppShell>{children}</AppShell>
    </FirebaseClientProvider>
  );
}
