'use client';

import {
  useUser,
  useAuth,
  useFirestore,
  setDocumentNonBlocking,
} from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogIn, LogOut } from 'lucide-react';
import { doc } from 'firebase/firestore';

export function AuthButton() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // ポップアップ方式でサインインを実行
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        // サインイン成功直後にプロフィールを更新
        const userRef = doc(firestore, 'users', result.user.uid);
        setDocumentNonBlocking(userRef, {
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        }, { merge: true });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  if (isUserLoading) {
    return <Button variant="outline" size="icon" disabled />;
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
              <AvatarFallback>
                {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>ログアウト</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" />
      ログイン
    </Button>
  );
}
