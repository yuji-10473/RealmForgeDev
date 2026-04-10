// src/firebase/config.ts

/**
 * Firebase 設定オブジェクト
 * 本番ドメイン "firebasejapan.com" の場合はカスタムドメインを優先し、
 * それ以外（開発環境など）ではデフォルトの Firebase ドメインを使用します。
 */
const resolvedAuthDomain = (typeof window !== 'undefined' && window.location.hostname === "firebasejapan.com")
  ? "firebasejapan.com"
  : "studio-3109699954-e195d.firebaseapp.com";

export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  "authDomain": resolvedAuthDomain,
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
