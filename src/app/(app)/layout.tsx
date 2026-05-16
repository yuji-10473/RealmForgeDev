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
import { preloadCharacterAnimation } from "@/lib/character-preload"; // 追加

const navItems = [
  { href: "/", label: "マップエディター", icon: MapIcon },
  { href: "/room-editor", label: "ルームエディター", icon: RoomIcon },
  { href: "/object-list", label: "オブジェクトリスト", icon: ObjectIcon },
  { href: "/item-list", label: "アイテムリスト", icon: ItemIcon },
  { href: "/character-editor", label: "キャラクターエディター", icon: CharacterIcon },
  { href: "/event-editor", label: "イベントエディター", icon: EventIcon },
  { href: "/event-simulator", label: "イベントシミュレーター", icon: EventSimulatorIcon },
  { href: "/story-editor", label: "ストーリーエディター", icon: StoryEditorIcon },
  { href: "/story-archive", label: "物語の記憶", icon: SequencePlayerIcon }, // 変更: /sequence-player から /story-archive へ
  { href: "/story-assist", label: "ストーリーアシスト", icon: StoryIcon },
  { href: "/menu-simulator", label: "メニューシミュレーター", icon: MenuIcon },
  { href: "/shop-simulator", label: "ショップシミュレーター", icon: ShopIcon },
  { href: "/combat-simulator", label: "戦闘シミュレーター", icon: CombatIcon },
  { href: "/asset-library", label: "アセットライブラリ", icon: AssetIcon },
  { href: "/play-test", label: "プレイテスト", icon: PlayTestIcon },
  { href: "/play-test-vertical", label: "縦型プレイテスト", icon: PlayTestIcon },
  { href: "/export", label: "ゲームをエクスポート", icon: ExportIcon },
];

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const version = packageJson.version;
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  // Admin status check - based on existence of document in 'admins' collection
  const adminDocRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, 'admins', user.uid);
  }, [user, firestore]);

  const { data: adminData, isLoading: isAdminLoading } = useDoc(adminDocRef);
  
  // Robust admin check: 
  // 1. Must have document data (not null)
  // 2. If 'isAdmin' field exists, it must not be explicitly false
  const isAdmin = !!adminData && (adminData.isAdmin !== false);

  // Access guard logic: Non-admins are redirected to /play-test if they try to access other routes
  // Modified to allow /play-test-vertical for non-admins as well
  useEffect(() => {
    const isAllowedPath = pathname === '/play-test' || pathname === '/play-test-vertical' || pathname === '/story-archive' || pathname.startsWith('/sequence-player'); // story-archive と sequence-player も許可
    if (!isUserLoading && !isAdminLoading && user && !isAdmin && !isAllowedPath) {
      router.push('/play-test');
    }
  }, [user, isAdmin, isUserLoading, isAdminLoading, pathname, router]);

  // 追加: アプリケーション起動時にキャラクターアニメーションをプリロード
  useEffect(() => {
    // プリロードする主要なキャラクターIDのリスト
    // public/characters/ に存在するIDを参考にしています。
    const mainCharacterIdsToPreload = ["player", "goblin", "sub1", "villagers"]; // 例: 必要に応じて調整してください

    mainCharacterIdsToPreload.forEach(async (id) => {
      try {
        // storageBasePath はpreload時点ではFirestoreから取得できない可能性が高いため、
        // デフォルトパス (`/characters/${id}`) でプリロードを試みます。
        await preloadCharacterAnimation(id);
      } catch (error) {
        console.error(`Failed to preload character ${id}:`, error);
      }
    });
  }, []); // アプリケーション起動時に一度だけ実行

  // Loading state
  if (isUserLoading || (user && isAdminLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing screen if not logged in
  if (!user) {
    return <LandingScreen />;
  }

  // Filter navigation items based on permissions
  // Now includes both standard and vertical play-test for non-admin users
  const filteredNavItems = isAdmin 
    ? navItems 
    : navItems.filter(item => item.href === '/play-test' || item.href === '/play-test-vertical' || item.href === '/story-archive'); // 非管理者にも story-archive を許可

  return (
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
            {filteredNavItems.map((item) => (
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
