// src/firebase/config.ts

/**
 * 認証ドメインを動的に取得します。
 * ブラウザ環境では現在のホスト名を使用し、リダイレクト認証を「ファーストパーティ」として扱えるようにします。
 * ローカル開発環境やサーバーサイドレンダリング時はデフォルトの Firebase ドメインを返します。
 */
const getAuthDomain = () => {
  const defaultDomain = "studio-3109699954-e195d.firebaseapp.com";
  
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // ローカル環境（localhost や IPアドレス）の場合はデフォルトドメインを返す
    // これにより、ローカル開発時も本番プロジェクトの認証ハンドラを利用可能にします
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.')) {
      return defaultDomain;
    }
    
    // カスタムドメイン環境では、現在のホスト名をそのまま authDomain として使用
    return host;
  }
  
  return defaultDomain;
};

export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  
  // 固定値ではなく動的に割り当て
  "authDomain": getAuthDomain(),
  
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
