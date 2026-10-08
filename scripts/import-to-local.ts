/**
 * Kamakura Project Exporter - Import to Local Script
 * 
 * 公開されている Cloud Storage の exports/kamakura/index.json (または files.txt) を参照し、
 * 最新の kamakura-project-full-*.zip をローカルの tmp/ にダウンロードします。
 * 
 * また、最新ZIP内の data/*.json を解析して参照されているメディアを割り出し、
 * public/media 内の非参照メディアを tmp/unused に退避した上で展開・配置します。
 * 
 * 実行方法:
 *   npx tsx scripts/import-to-local.ts
 * 
 * オプション:
 *   --force          : 同名ファイルが既にローカルに存在していても強制的に再ダウンロード
 *   --skip-extract   : ダウンロードのみ行い、解凍・配置をスキップ
 */

import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const BASE_URL = "https://storage.googleapis.com/striped-proxy-187410.firebasestorage.app/exports/kamakura";
const INDEX_JSON_URL = `${BASE_URL}/index.json`;
const FILES_TXT_URL = `${BASE_URL}/files.txt`;

const TMP_DIR = path.resolve(process.cwd(), "tmp");
const UNUSED_MEDIA_DIR = path.resolve(TMP_DIR, "unused");
const EXTRACT_TMP_DIR = path.resolve(TMP_DIR, "extraction_temp");
const DEST_DATA_DIR = path.resolve(process.cwd(), "public/data");
const DEST_MEDIA_DIR = path.resolve(process.cwd(), "public/media");

interface ExportIndex {
  updatedAt: string;
  bucket: string;
  prefix: string;
  latest: {
    filename: string;
    sizeMB: number;
    updatedAt: string;
    url: string;
  };
  totalCount: number;
  files: Array<{
    filename: string;
    sizeMB: number;
    updatedAt: string;
    url: string;
  }>;
}

interface TargetFileInfo {
  filename: string;
  url: string;
  sizeMB?: number;
  updatedAt?: string;
}

/**
 * コマンドライン引数の解析
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    force: args.includes("--force"),
    skipExtract: args.includes("--skip-extract"),
  };
}

/**
 * index.json から最新ファイル情報を取得
 */
async function fetchFromIndexJson(): Promise<TargetFileInfo | null> {
  console.log(`[情報] index.json を取得中: ${INDEX_JSON_URL}`);
  try {
    const res = await fetch(INDEX_JSON_URL);
    if (!res.ok) {
      console.warn(`[警告] index.json の取得に失敗しました (HTTP ${res.status} ${res.statusText})`);
      return null;
    }
    const data = (await res.json()) as ExportIndex;
    if (!data.latest || !data.latest.filename) {
      console.warn("[警告] index.json 内に latest.filename が見つかりませんでした。");
      return null;
    }
    return {
      filename: data.latest.filename,
      url: data.latest.url || `${BASE_URL}/${data.latest.filename}`,
      sizeMB: data.latest.sizeMB,
      updatedAt: data.latest.updatedAt,
    };
  } catch (error: any) {
    console.warn(`[警告] index.json の取得/パース中にエラーが発生しました:`, error.message || error);
    return null;
  }
}

/**
 * files.txt から最新ファイル情報を取得（フォールバック用）
 */
async function fetchFromFilesTxt(): Promise<TargetFileInfo | null> {
  console.log(`[情報] files.txt をフォールバック取得中: ${FILES_TXT_URL}`);
  try {
    const res = await fetch(FILES_TXT_URL);
    if (!res.ok) {
      console.error(`[エラー] files.txt の取得に失敗しました (HTTP ${res.status} ${res.statusText})`);
      return null;
    }
    const text = await res.text();
    const filenameMatch = text.match(/Filename:\s*([^\r\n]+)/);
    const urlMatch = text.match(/URL:\s*([^\r\n]+)/);

    if (!filenameMatch || !filenameMatch[1]) {
      console.error("[エラー] files.txt 内から Filename を抽出できませんでした。");
      return null;
    }

    const filename = filenameMatch[1].trim();
    const url = urlMatch && urlMatch[1] ? urlMatch[1].trim() : `${BASE_URL}/${filename}`;

    return {
      filename,
      url,
    };
  } catch (error: any) {
    console.error(`[エラー] files.txt の取得/パース中にエラーが発生しました:`, error.message || error);
    return null;
  }
}

/**
 * curl コマンドを実行して進捗バー付きでダウンロード
 */
function downloadFileWithCurl(url: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 一時ファイルに保存して完了後にリネームすることで破損を防ぐ
    const tempOutputPath = `${outputPath}.downloading`;

    // curl -L (リダイレクト追従) -# (プログレスバー表示) -f (HTTPエラー時に失敗) -o <出力先> <URL>
    const curlArgs = ["-L", "-#", "-f", "-o", tempOutputPath, url];

    console.log(`[実行] curl ${curlArgs.join(" ")}`);
    const child = spawn("curl", curlArgs, { stdio: "inherit" });

    child.on("error", (err) => {
      reject(new Error(`curl コマンドの起動に失敗しました: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        try {
          fs.renameSync(tempOutputPath, outputPath);
          resolve();
        } catch (renameErr) {
          reject(renameErr);
        }
      } else {
        if (fs.existsSync(tempOutputPath)) {
          try {
            fs.unlinkSync(tempOutputPath);
          } catch (_) {}
        }
        reject(new Error(`curl が終了コード ${code} で失敗しました。`));
      }
    });
  });
}

/**
 * ディレクトリ内の全ファイルを再帰的に取得
 */
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  }
  return arrayOfFiles;
}

/**
 * ディレクトリを再帰的にコピーする（ファイルを1つずつコピー）
 */
function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * 外部コマンドを実行するPromiseラッパー
 */
function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", (err) => {
      reject(new Error(`${command} コマンドの起動に失敗しました: ${err.message}`));
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} が終了コード ${code} で失敗しました。`));
      }
    });
  });
}

/**
 * data/*.json 内から参照されているメディアファイルパスを抽出する
 */
function extractReferencedMediaFromDataDir(dataDir: string): Set<string> {
  const referenced = new Set<string>();
  const mediaRegex = /["'](?:\/)?((?:media\/[a-zA-Z0-9_\-\/]+|[a-zA-Z0-9_\-\/]+)\.(?:png|jpg|jpeg|wav|mp3|mp4|webm|gif|ogg|aac))["']/gi;

  const files = getAllFiles(dataDir).filter((file) => file.endsWith(".json"));

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, "utf-8");
      let match: RegExpExecArray | null;
      while ((match = mediaRegex.exec(content)) !== null) {
        let matchedPath = match[1].replace(/^\//, "");
        // 先頭が media/ で始まっていない場合は付与を考慮
        if (!matchedPath.startsWith("media/")) {
          // 例: "images/xxx.png" -> "media/images/xxx.png", "audios/xxx.wav" -> "media/audios/xxx.wav"
          if (matchedPath.startsWith("images/") || matchedPath.startsWith("audios/") || matchedPath.startsWith("videos/")) {
            matchedPath = `media/${matchedPath}`;
          }
        }
        referenced.add(matchedPath);
      }
    } catch (e: any) {
      console.warn(`[警告] ファイル読み込み失敗: ${file} (${e.message})`);
    }
  }

  return referenced;
}

/**
 * public/media 内の不要なメディアファイルを tmp/unused に退避する
 */
function archiveUnusedMedia(referencedMedia: Set<string>): number {
  if (!fs.existsSync(DEST_MEDIA_DIR)) {
    return 0;
  }

  const existingMediaFiles = getAllFiles(DEST_MEDIA_DIR);
  let archivedCount = 0;
  let savedBytes = 0;

  for (const file of existingMediaFiles) {
    // public/ からの相対パス (例: media/images/file_xxx.png)
    const relativeToPublic = path.relative(path.resolve(process.cwd(), "public"), file);

    // 参照セットに含まれていない場合
    if (!referencedMedia.has(relativeToPublic)) {
      const stat = fs.statSync(file);
      savedBytes += stat.size;

      // tmp/unused/<relativeToPublic> に移動
      const targetPath = path.join(UNUSED_MEDIA_DIR, relativeToPublic);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.renameSync(file, targetPath);
      archivedCount++;
    }
  }

  if (archivedCount > 0) {
    const savedMB = (savedBytes / 1024 / 1024).toFixed(2);
    console.log(`[退避完了] ${archivedCount} 件 (${savedMB} MB) の未使用ファイルを ${UNUSED_MEDIA_DIR} へ退避しました。`);
  } else {
    console.log(`[情報] 未使用のメディアファイルはありませんでした。`);
  }

  return archivedCount;
}

/**
 * ZIP ファイルから data/ と media/ を抽出し、不要メディアを退避した上で配置する
 */
async function extractAndDeploy(zipFilePath: string): Promise<void> {
  console.log("\n==========================================");
  console.log("  アーカイブの展開と配置処理を開始します");
  console.log("==========================================");

  // 1. 一時ディレクトリの初期化
  if (fs.existsSync(EXTRACT_TMP_DIR)) {
    fs.rmSync(EXTRACT_TMP_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(EXTRACT_TMP_DIR, { recursive: true });
  fs.mkdirSync(DEST_DATA_DIR, { recursive: true });
  fs.mkdirSync(DEST_MEDIA_DIR, { recursive: true });

  try {
    // 2. 先に data/ ディレクトリのみを一時解凍
    console.log(`[解凍中: step 1] ZIP から data/ を展開しています...`);
    await runCommand("unzip", ["-o", "-q", zipFilePath, "data/*", "-d", EXTRACT_TMP_DIR]);

    const extractedData = path.join(EXTRACT_TMP_DIR, "data");

    // 3. 最新 data/*.json から参照されているメディアを解析
    console.log(`[解析中] 最新の data/*.json から参照されているメディアパスをスキャン中...`);
    const referencedMedia = extractReferencedMediaFromDataDir(extractedData);
    console.log(`[情報] 参照されているメディア件数: ${referencedMedia.size} 件`);

    // 4. public/media から未参照のメディアを tmp/unused へ退避（ここで空きディスク容量を確保）
    console.log(`[クリーンアップ] public/media 内の未参照ファイルを tmp/unused に退避中...`);
    archiveUnusedMedia(referencedMedia);

    // 5. data/ を public/data/ にコピーし、一時 data/ を削除して容量節約
    console.log(`[配置中] データファイルをコピー: ${DEST_DATA_DIR}`);
    copyDirSync(extractedData, DEST_DATA_DIR);
    fs.rmSync(extractedData, { recursive: true, force: true });

    // 6. media/ ディレクトリを展開して public/ に直接解凍（一時フォルダを介さず容量を抑える）
    console.log(`[解凍中: step 2] ZIP から media/ を public/ に直接展開しています...`);
    // アーカイブ内の media/ は public/ 直下に解凍すると public/media/ に展開される
    await runCommand("unzip", ["-o", "-q", zipFilePath, "media/*", "-d", path.resolve(process.cwd(), "public")]);

    // 7. その他のルートファイル（manifest.json, diner_menus.md 等）があれば必要に応じて処理
    console.log("[後片付け] 一時ファイルを削除中...");
    fs.rmSync(EXTRACT_TMP_DIR, { recursive: true, force: true });

    console.log("[完了] public/data と public/media の更新が完了しました！");
  } catch (err) {
    if (fs.existsSync(EXTRACT_TMP_DIR)) {
      fs.rmSync(EXTRACT_TMP_DIR, { recursive: true, force: true });
    }
    throw err;
  }
}

async function main() {
  const { force, skipExtract } = parseArgs();

  console.log("==================================================");
  console.log("  Kamakura Project: 最新エクスポート取得 & 配置スクリプト");
  console.log("==================================================");

  // 1. tmp ディレクトリの準備
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
    console.log(`[情報] 保存先ディレクトリを作成しました: ${TMP_DIR}`);
  }

  // 2. 最新ファイル情報の取得 (index.json -> files.txt の順で試行)
  let target = await fetchFromIndexJson();
  if (!target) {
    target = await fetchFromFilesTxt();
  }

  if (!target) {
    console.error("[致命的エラー] 最新エクスポートファイルの情報を取得できませんでした。処理を中断します。");
    process.exit(1);
  }

  console.log("\n[最新ファイル情報]");
  console.log(`- ファイル名 : ${target.filename}`);
  if (target.sizeMB !== undefined) {
    console.log(`- サイズ     : ${target.sizeMB} MB`);
  }
  if (target.updatedAt) {
    console.log(`- 更新日時   : ${target.updatedAt}`);
  }
  console.log(`- ダウンロードURL: ${target.url}`);

  const localFilePath = path.join(TMP_DIR, target.filename);

  // 3. ローカル重複チェック
  const alreadyExists = fs.existsSync(localFilePath);
  if (alreadyExists && !force) {
    const stats = fs.statSync(localFilePath);
    console.log(`\n[スキップ] 既にローカルにファイルが存在します: ${localFilePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log("再ダウンロードする場合は --force オプションを指定して実行してください。");
  } else {
    // 4. ダウンロード実行
    console.log(`\n[ダウンロード開始] -> ${localFilePath}`);
    try {
      await downloadFileWithCurl(target.url, localFilePath);
      console.log(`\n[成功] ダウンロードが完了しました: ${localFilePath}`);
    } catch (error: any) {
      console.error(`\n[エラー] ダウンロードに失敗しました:`, error.message || error);
      process.exit(1);
    }
  }

  // 5. 解凍・展開・退避・配置処理
  if (!skipExtract) {
    try {
      await extractAndDeploy(localFilePath);
    } catch (error: any) {
      console.error(`\n[エラー] アーカイブの展開・配置に失敗しました:`, error.message || error);
      process.exit(1);
    }
  } else {
    console.log("\n[情報] --skip-extract が指定されたため、解凍・配置処理をスキップしました。");
  }

  console.log("\nすべての処理が正常に終了しました。");
}

main();
