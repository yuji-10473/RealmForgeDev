// src/firebase/config.ts

/**
 * Firebase Authentication ドメインの解決
 * 本番サイトでは firebasejapan.com を優先し、それ以外では動的取得ロジックを使用します。
 */
const getAuthDomain = () => {
  const defaultDomain = "studio-3109699954-e195d.firebaseapp.com";
  const customDomain = "firebasejapan.com";

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // 本番ドメインの場合は確定でカスタムドメインを返す
    if (host === customDomain) return customDomain;

    // ローカル環境（localhost や IPアドレス）
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
    
    // 開発用ワークステーション（Firebase Studio など）
    const isWorkstation = host.includes('cloudworkstations.dev');

    // Firebase 標準ドメイン
    const isFirebaseStandard = host.endsWith('web.app') || host.endsWith('firebaseapp.com');
    
    // 開発環境や標準ドメインの場合は、確実に認証ハンドラが存在するデフォルトドメインを返す
    if (isLocal || isWorkstation || isFirebaseStandard) {
      return defaultDomain;
    }
    
    // それ以外のカスタムドメイン環境では、ホスト名をそのまま使用（リダイレクト安定化のため）
    return host;
  }
  
  return defaultDomain;
};

export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  "authDomain": getAuthDomain(),
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
