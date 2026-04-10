// src/firebase/config.ts

/**
 * Firebase Authentication ドメインの解決
 */
const getAuthDomain = () => {
  const defaultDomain = "studio-3109699954-e195d.firebaseapp.com";
  const customDomain = "firebasejapan.com";

  if (typeof window !== 'undefined') {
    // 本番ドメインならカスタムドメインを、それ以外（開発中など）はデフォルトを返して安全性を確保
    return window.location.hostname === customDomain ? customDomain : defaultDomain;
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
