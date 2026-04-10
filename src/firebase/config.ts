// src/firebase/config.ts

/**
 * Firebase 設定オブジェクト
 * authDomain をカスタムドメイン "firebasejapan.com" に固定することで、
 * リダイレクト認証時のサードパーティ・クッキー制限を回避し、安定した動作を確保します。
 */
export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  
  // 以前の設定（firebaseapp.com）を考慮しつつ、カスタムドメインを最優先で指定
  "authDomain": "firebasejapan.com",
  
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
