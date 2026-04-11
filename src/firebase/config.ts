// src/firebase/config.ts

export const firebaseConfig = {
  "projectId": "studio-3109699954-e195d",
  "appId": "1:1059483388102:web:c0d49ba1bee5b8118defc7",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  // 本番ドメインとデフォルトドメインを明示的に指定（ポップアップ認証の安定化）
  "authDomain": (typeof window !== 'undefined' && window.location.hostname === 'firebasejapan.com') 
    ? 'firebasejapan.com' 
    : 'studio-3109699954-e195d.firebaseapp.com',
  "measurementId": "",
  "messagingSenderId": "1059483388102"
};
