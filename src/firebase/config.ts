// src/firebase/config.ts

/**
 * 認証ドメインを動的に取得します。
 * ブラウザ環境では現在のホスト名を使用し、リダイレクト認証を「ファーストパーティ」として扱えるようにします。
 * ローカル開発環境や開発用ワークステーション環境、または Firebase 標準ドメインの場合は
 * デフォルトのドメインを返し、404エラーを防止します。
 */
const getAuthDomain = () => {
  const defaultDomain = "studio-3109699954-e195d.firebaseapp.com";
  
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // 1. ローカル環境（localhost や IPアドレス）
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
    
    // 2. 開発用ワークステーション（Firebase Studio など）
    const isWorkstation = host.includes('cloudworkstations.dev');

    // 3. Firebase 標準ドメイン（これらはデフォルトのままで問題ない）
    const isFirebaseStandard = host.endsWith('web.app') || host.endsWith('firebaseapp.com');
    
    // 開発環境や標準ドメインの場合は、確実に認証ハンドラが存在するデフォルトドメインを返す
    if (isLocal || isWorkstation || isFirebaseStandard) {
      return defaultDomain;
    }
    
    // それ以外の「完全なカスタムドメイン」環境では、現在のホスト名をそのまま authDomain として使用
    // これによりサードパーティ・クッキーの制限を回避し、リダイレクト方式を安定させます
    return host;
  }
  
  return defaultDomain;
};

/**
 * Firebase 設定オブジェクト
 */
export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  "authDomain": getAuthDomain(),
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
