// src/firebase/config.ts

/**
 * Firebase Authentication ドメインの解決
 */
const getAuthDomain = () => {
  const defaultDomain = "studio-3109699954-e195d.firebaseapp.com";
  const customDomain = "firebasejapan.com";

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // 本番ドメインの場合は確定でカスタムドメインを返す
    if (host === customDomain) return customDomain;

    // ローカル環境、開発ワークステーション、または Firebase 標準ドメイン
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
    const isWorkstation = host.includes('cloudworkstations.dev');
    const isFirebaseStandard = host.endsWith('web.app') || host.endsWith('firebaseapp.com');
    
    if (isLocal || isWorkstation || isFirebaseStandard) {
      return defaultDomain;
    }
    
    return host;
  }
  
  return defaultDomain;
};

export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  // 本番ドメインとデフォルトドメインを明示的に指定
  "authDomain": (typeof window !== 'undefined' && window.location.hostname === 'firebasejapan.com') 
    ? 'firebasejapan.com' 
    : 'studio-3109699954-e195d.firebaseapp.com',
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};