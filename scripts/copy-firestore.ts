/**
 * Firestore Migration Script
 * コピー元プロジェクトからコピー先プロジェクトへ指定コレクションのドキュメントを複製します。
 * 
 * 設定値は .env.local などの環境変数から読み込みます。
 * 
 * 実行方法:
 *   npx tsx scripts/copy-firestore.ts [コレクション名1...]
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // フォールバック用

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";

// コピー元 Firebase 設定
const srcFirebaseConfig = {
  apiKey: process.env.SRC_FIREBASE_API_KEY,
  authDomain: process.env.SRC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.SRC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.SRC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.SRC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.SRC_FIREBASE_APP_ID,
};

// コピー先 Firebase 設定
const destFirebaseConfig = {
  apiKey: process.env.DEST_FIREBASE_API_KEY,
  authDomain: process.env.DEST_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.DEST_FIREBASE_PROJECT_ID,
  storageBucket: process.env.DEST_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.DEST_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.DEST_FIREBASE_APP_ID,
};

// 必須環境変数のバリデーション
if (!srcFirebaseConfig.apiKey || !srcFirebaseConfig.projectId) {
  console.error("エラー: コピー元の環境変数 (SRC_FIREBASE_*) が設定されていません。.env.local を確認してください。");
  process.exit(1);
}

if (!destFirebaseConfig.apiKey || !destFirebaseConfig.projectId) {
  console.error("エラー: コピー先の環境変数 (DEST_FIREBASE_*) が設定されていません。.env.local を確認してください。");
  process.exit(1);
}

// 各アプリの初期化
const srcApp = initializeApp(srcFirebaseConfig, "sourceApp");
const destApp = initializeApp(destFirebaseConfig, "destApp");

const srcDb = getFirestore(srcApp);
const destDb = getFirestore(destApp);

async function copyCollection(collectionName: string) {
  console.log(`\n========================================`);
  console.log(`[開始] コレクション: "${collectionName}" のコピー`);
  console.log(`========================================`);

  try {
    const srcColRef = collection(srcDb, collectionName);
    const snapshot = await getDocs(srcColRef);

    if (snapshot.empty) {
      console.log(`情報: コレクション "${collectionName}" にドキュメントが存在しませんでした（0件）。`);
      return;
    }

    console.log(`取得件数: ${snapshot.docs.length} 件`);

    // Firestoreのバッチ処理は最大500件まで
    const BATCH_SIZE = 450;
    let batch = writeBatch(destDb);
    let operationCount = 0;
    let totalWritten = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const destDocRef = doc(destDb, collectionName, docSnap.id);

      batch.set(destDocRef, data, { merge: true });
      operationCount++;

      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        totalWritten += operationCount;
        console.log(`進捗: ${totalWritten} / ${snapshot.docs.length} 件 書き込み完了`);
        batch = writeBatch(destDb);
        operationCount = 0;
      }
    }

    if (operationCount > 0) {
      await batch.commit();
      totalWritten += operationCount;
    }

    console.log(`[成功] コレクション "${collectionName}": 全 ${totalWritten} 件のコピーが完了しました！`);
  } catch (error: any) {
    console.error(`[エラー] コレクション "${collectionName}" のコピー中に失敗しました:`, error.message || error);
    if (error.code === "permission-denied") {
      console.error(
        "ヒント: セキュリティルール（Firestore Rules）により読み取りまたは書き込みが拒否されました。\n" +
        "コピー元またはコピー先のセキュリティルールで当該コレクションへのアクセスが許可されているかご確認ください。"
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const collectionsToCopy = args.length > 0 ? args : ["users", "admins", "playtestSaves"];

  console.log(`コピー対象コレクション:`, collectionsToCopy);
  for (const colName of collectionsToCopy) {
    await copyCollection(colName);
  }

  console.log("\nすべての処理が終了しました。");
  process.exit(0);
}

main();
