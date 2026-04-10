// src/firebase/config.ts

/**
 * Firebase Authentication ドメインの解決
 * 本番サイトではカスタムドメインを、それ以外ではデフォルトドメインを優先します。
 */
const getResolvedAuthDomain = () => {
  const defaultDomain = "studio-3109699954-e195d.firebaseapp.com";
  const customDomain = "firebasejapan.com";

  if (typeof window !== 'undefined') {
    // ブラウザ環境で firebasejapan.com にアクセスしている場合はカスタムドメインを返す
    if (window.location.hostname === customDomain) {
      return customDomain;
    }
  }
  
  // それ以外（サーバーサイドや開発環境）はデフォルトを返す
  return defaultDomain;
};

export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  "authDomain": getResolvedAuthDomain(),
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
