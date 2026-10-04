// src/firebase/config.ts

export const firebaseConfig = {
  "projectId": "realmforgeaistd",
  "appId": "1:1004172952749:web:751ebb7a54b62b66a87224",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  // 本番ドメインとデフォルトドメインを明示的に指定（ポップアップ認証の安定化）
  "authDomain": (typeof window !== 'undefined' && window.location.hostname === 'firebasejapan.com') 
    ? 'firebasejapan.com' 
    : 'realmforgeaistd.firebaseapp.com',
  "measurementId": "G-XVGNP55JQJ",
  "messagingSenderId": "1004172952749",
  "storageBucket": "realmforgeaistd.firebasestorage.app"
};
