
"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useAuth } from "@/firebase/client-provider";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { getPreloadedResources } from "@/lib/character-preload";

// PIXIとSpineの型定義を遅延ロードするために準備
let PIXI: any = null;
let Spine: any = null;

interface AnimationProps {
  characterId: string;
  projectId: string;
  containerWidth?: number;
  containerHeight?: number;
  scale?: number;
  onReady?: () => void;
  className?: string;
  debugMode?: boolean;
}

const CharacterAnimatorClient: React.FC<AnimationProps> = ({
  characterId,
  projectId,
  containerWidth = 300,
  containerHeight = 300,
  scale = 0.3,
  onReady,
  className,
  debugMode = false,
}) => {
  const pixiCanvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const characterRef = useRef<any>(null);
  const [currentAnimation, setCurrentAnimation] = useState("idle"); // Default animation
  const auth = useAuth();
  const userId = auth.currentUser?.uid;
  const [pixiModulesLoaded, setPixiModulesLoaded] = useState(false); // PIXIモジュールのロード状態を管理

  // PIXIとSpineモジュールを動的にインポート
  useEffect(() => {
    async function loadModules() {
      if (typeof window !== "undefined" && !pixiModulesLoaded) {
        PIXI = await import("pixi.js");
        const spineModule = await import("pixi-spine");
        Spine = spineModule.Spine;
        setPixiModulesLoaded(true);
      }
    }
    loadModules();
  }, [pixiModulesLoaded]);


  const characterDocRef = useMemo(() => {
    if (!userId || !projectId || !characterId) return null;
    return doc(
      db,
      "users",
      userId,
      "projects",
      projectId,
      "characters",
      characterId
    );
  }, [userId, projectId, characterId]);

  const [characterData, loading, error] = useDocumentData(characterDocRef);

  const animationsBaseUrl = useMemo(() => {
    if (characterData?.storageBasePath) {
      return characterData.storageBasePath;
    }
    // Fallback for local development or default path
    return `/characters/${characterId}`;
  }, [characterData, characterId]);

  const loadSpineAnimation = useCallback(
    async (
      app: any,
      animationJsonPath: string,
      textureAtlasPath: string,
      imagePath: string,
      preloadedJson?: any,
      preloadedAtlas?: any,
      preloadedImage?: any
    ) => {
      if (!PIXI || !Spine) {
        console.warn("PIXI or Spine not loaded yet for loadSpineAnimation.");
        return;
      }

      try {
        const atlasText = preloadedAtlas
          ? preloadedAtlas.data
          : (await fetch(textureAtlasPath).then((res) => res.text()));
        const skeletonJson = preloadedJson
          ? preloadedJson.data
          : (await fetch(animationJsonPath).then((res) => res.json()));

        const spineAtlas = new (PIXI as any).spine.core.TextureAtlas(atlasText, function(
          line: string,
          callback: any
        ) {
          if (preloadedImage && preloadedImage.texture) {
            callback(preloadedImage.texture);
          } else if (app.loader.resources[imagePath]) {
            callback(app.loader.resources[imagePath].texture);
          } else {
            app.loader.add(imagePath, imagePath, () => {
              callback(app.loader.resources[imagePath].texture);
            });
          }
        });

        const spineAtlasLoader = new (PIXI as any).spine.core.AtlasAttachmentLoader(
          spineAtlas
        );
        const spineJsonParser = new (PIXI as any).spine.core.SkeletonJson(
          spineAtlasLoader
        );
        const skeletonData = spineJsonParser.readSkeletonData(skeletonJson);
        const spineCharacter = new Spine(skeletonData);

        if (characterRef.current) {
          app.stage.removeChild(characterRef.current);
          characterRef.current.destroy({ children: true });
        }

        spineCharacter.x = app.renderer.width / 2;
        spineCharacter.y = app.renderer.height;
        spineCharacter.scale.set(scale);

        app.stage.addChild(spineCharacter);
        characterRef.current = spineCharacter;

        if (spineCharacter.state.hasAnimation(currentAnimation)) {
          spineCharacter.state.setAnimation(0, currentAnimation, true);
        } else if (spineCharacter.state.hasAnimation("animation")) {
          spineCharacter.state.setAnimation(0, "animation", true);
          setCurrentAnimation("animation");
        }

        if (onReady) {
          onReady();
        }
      } catch (e) {
        console.error("Error loading spine animation:", e);
      }
    },
    [scale, characterId, onReady, currentAnimation, pixiModulesLoaded]
  );

  useEffect(() => {
    // PIXIモジュールがロードされるまで待つ
    if (!pixiModulesLoaded || loading || error || !characterData) {
      return;
    }

    if (!pixiCanvasRef.current) return;

    if (!appRef.current) {
      const app = new PIXI.Application({
        width: containerWidth,
        height: containerHeight,
        backgroundColor: 0x00000000,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
      });
      pixiCanvasRef.current.appendChild(app.view as HTMLCanvasElement);
      appRef.current = app;

      if (debugMode) {
        const background = new PIXI.Graphics();
        background.beginFill(0xcccccc, 0.5);
        background.drawRect(0, 0, containerWidth, containerHeight);
        background.endFill();
        app.stage.addChild(background);
      }
    }

    const app = appRef.current;

    const jsonPath = `${animationsBaseUrl}/animations.json`;
    const atlasPath = `${animationsBaseUrl}/animations.atlas`;
    const imagePath = `${animationsBaseUrl}/animations.png`;

    const preloaded = getPreloadedResources(characterId, animationsBaseUrl);

    if (preloaded.json && preloaded.atlas && preloaded.image) {
      loadSpineAnimation(app, jsonPath, atlasPath, imagePath, preloaded.json, preloaded.atlas, preloaded.image);
    } else {
      app.loader.reset();
      app.loader.add(jsonPath, jsonPath);
      app.loader.add(atlasPath, atlasPath);
      app.loader.add(imagePath, imagePath);

      app.loader.load(() => {
        loadSpineAnimation(app, jsonPath, atlasPath, imagePath);
      });
    }

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
    };
  }, [
    characterData,
    characterId,
    loading,
    error,
    containerWidth,
    containerHeight,
    loadSpineAnimation,
    animationsBaseUrl,
    debugMode,
    pixiModulesLoaded,
  ]);

  return (
    <div
      ref={pixiCanvasRef}
      className={`relative flex items-end justify-center overflow-hidden ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <p className="text-foreground">Loading Character...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 text-destructive-foreground">
          <p>Error loading character.</p>
        </div>
      )}
      {!pixiModulesLoaded && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <p className="text-foreground">Initializing graphics...</p>
        </div>
      )}
    </div>
  );
};

export default CharacterAnimatorClient;
