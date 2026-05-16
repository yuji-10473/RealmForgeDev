
let PIXI: any = null;
let Spine: any = null;

// プリロード専用のPIXI.Applicationインスタンス
let preloadApp: any = null;

/**
 * PIXIとSpineモジュールを動的にインポートし、利用可能にします。
 * この関数はブラウザ環境でのみ実行されることを前提とします。
 */
async function loadPixiModules() {
  if (typeof window !== "undefined" && PIXI === null) {
    PIXI = await import("pixi.js");
    const spineModule = await import("pixi-spine");
    Spine = spineModule.Spine;
  }
}

/**
 * プリロード専用の共有PIXI.Applicationインスタンスを取得します。
 * このインスタンスはDOMには追加されず、リソースのロードとキャッシュにのみ使用されます。
 * @returns 共有PIXI.Applicationインスタンス
 */
function getPreloadPixiApp(): any {
  if (typeof window === "undefined") {
    throw new Error("getPreloadPixiApp should only be called in a browser environment.");
  }
  if (!preloadApp && PIXI) {
    preloadApp = new PIXI.Application({
      width: 1, // プリロード用なので最小限のサイズ
      height: 1, // プリロード用なので最小限のサイズ
      backgroundColor: 0x00000000, // 透明な背景
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });
  }
  return preloadApp;
}

/**
 * 指定されたキャラクターのアニメーションリソース（JSON, ATLAS, PNG）をプリロードします。
 * ロードされたリソースは内部のPIXI.Loaderにキャッシュされます。
 * @param characterId プリロードするキャラクターのID
 * @param storageBasePath オプション：キャラクターデータが保存されているベースURL
 * @returns リソースのロードが完了したPromise
 */
export async function preloadCharacterAnimation(
  characterId: string,
  storageBasePath?: string
): Promise<void> {
  if (typeof window === "undefined") {
    // サーバーサイドではプリロードを実行しない
    console.log(`Skipping preload for ${characterId} on server side.`);
    return;
  }
  await loadPixiModules(); // PIXIとSpineをロード

  const app = getPreloadPixiApp();
  if (!app || !app.loader) {
    console.warn("PIXI loader is not available for preloading.");
    return;
  }

  // アニメーションリソースのパスを構築
  const animationsBaseUrl = storageBasePath || `/characters/${characterId}`;
  const jsonPath = `${animationsBaseUrl}/animations.json`;
  const atlasPath = `${animationsBaseUrl}/animations.atlas`;
  const imagePath = `${animationsBaseUrl}/animations.png`;

  // 既にpreloadAppのローダーにロード済みか確認
  if (
    app.loader.resources[jsonPath] &&
    app.loader.resources[atlasPath] &&
    app.loader.resources[imagePath]
  ) {
    return;
  }

  return new Promise((resolve, reject) => {
    // 既存のリソースがあればスキップして、必要なリソースのみをロードキューに追加
    const resourcesToLoad = [];
    if (!app.loader.resources[jsonPath])
      resourcesToLoad.push({ name: jsonPath, url: jsonPath });
    if (!app.loader.resources[atlasPath])
      resourcesToLoad.push({ name: atlasPath, url: atlasPath });
    if (!app.loader.resources[imagePath])
      resourcesToLoad.push({ name: imagePath, url: imagePath });

    if (resourcesToLoad.length === 0) {
      resolve();
      return;
    }

    // リソースをロードキューに追加
    app.loader.add(resourcesToLoad);

    // ロード完了時の処理
    app.loader.load((loader: any, resources: any) => {
      if (
        resources[jsonPath] &&
        resources[atlasPath] &&
        resources[imagePath]
      ) {
        console.log(`Successfully preloaded: ${characterId}`);
        resolve();
      } else {
        reject(new Error(`Failed to preload resources for ${characterId}`));
      }
    });

    // エラーハンドリング
    app.loader.onError.add((error: any) => {
      console.error(`Error during preload for ${characterId}:`, error);
      reject(error);
    });
  });
}

/**
 * プリロードされたキャラクターアニメーションのリソースを返します。
 * CharacterAnimatorClientがプリロードされたデータを利用するために使用します。
 * @param characterId 取得するキャラクターのID
 * @param storageBasePath オプション：キャラクターデータが保存されているベースURL
 * @returns プリロードされたリソースを含むオブジェクト
 */
export function getPreloadedResources(
  characterId: string,
  storageBasePath?: string
) {
  if (typeof window === "undefined" || !preloadApp || !preloadApp.loader) {
    // サーバーサイドまたは初期化前はリソースは存在しない
    return { json: undefined, atlas: undefined, image: undefined };
  }
  const animationsBaseUrl = storageBasePath || `/characters/${characterId}`;
  const jsonPath = `${animationsBaseUrl}/animations.json`;
  const atlasPath = `${animationsBaseUrl}/animations.atlas`;
  const imagePath = `${animationsBaseUrl}/animations.png`;

  return {
    json: preloadApp.loader.resources[jsonPath],
    atlas: preloadApp.loader.resources[atlasPath],
    image: preloadApp.loader.resources[imagePath],
  };
}
