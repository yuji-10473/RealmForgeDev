// src/components/client/character-animator-client.tsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as PIXI from "pixi.js";
import { Spine } from "@pixi-spine/runtime-4.1";

interface CharacterAnimatorClientProps {
  characterId: string;
  projectId: string;
  expressionName?: string; // 新しく追加
  containerWidth?: number;
  containerHeight?: number;
  scale?: number;
  className?: string;
}

const CharacterAnimatorClient: React.FC<CharacterAnimatorClientProps> = ({
  characterId,
  projectId,
  expressionName = "normal", // デフォルト値を設定
  containerWidth = 300,
  containerHeight = 300,
  scale = 0.2,
  className,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const characterRef = useRef<Spine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCharacter = useCallback(async () => {
    if (!canvasRef.current) return;

    if (appRef.current) {
      appRef.current.destroy(true);
      appRef.current = null;
    }

    setLoading(true);
    setError(null);

    try {
      const app = new PIXI.Application({
        width: containerWidth,
        height: containerHeight,
        backgroundAlpha: 0,
        antialias: true,
      });
      canvasRef.current.appendChild(app.view as HTMLCanvasElement);
      appRef.current = app;

      const animationsPath = `/public/characters/${characterId}/animations.json`;
      const skeletonPath = `/public/characters/${characterId}/skeleton.json`; // 必要に応じて

      // PIXIローダーにSpineパーサーを追加
      PIXI.Assets.addBundle("character", {
        spineData: animationsPath,
      });

      const resource = await PIXI.Assets.loadBundle("character");
      
      const spine = new Spine(resource.spineData);

      spine.scale.set(scale);
      spine.x = app.screen.width / 2;
      spine.y = app.screen.height; // 足元が中央になるように調整

      app.stage.addChild(spine);
      characterRef.current = spine;

      // アニメーション設定 (もしデフォルトアニメーションがあれば)
      if (spine.state.hasAnimation("idle")) {
        spine.state.setAnimation(0, "idle", true);
      } else if (spine.data.animations.length > 0) {
        spine.state.setAnimation(0, spine.data.animations[0].name, true);
      }

      // 表情の設定
      if (spine.skeleton.findSkin(expressionName)) {
        spine.skeleton.setSkinByName(expressionName);
      } else {
        console.warn(`Expression skin "${expressionName}" not found for character "${characterId}".`);
      }


      setLoading(false);
    } catch (e: any) {
      console.error(`Error loading character ${characterId}:`, e);
      setError(`キャラクター '${characterId}' のロードに失敗しました: ${e.message}`);
      setLoading(false);
    }
  }, [characterId, projectId, containerWidth, containerHeight, scale, expressionName]);

  useEffect(() => {
    loadCharacter();

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [loadCharacter]);

  // expressionNameが変更されたときにスキンを更新
  useEffect(() => {
    if (characterRef.current && characterRef.current.skeleton && expressionName) {
      if (characterRef.current.skeleton.findSkin(expressionName)) {
        characterRef.current.skeleton.setSkinByName(expressionName);
      } else {
        console.warn(`Expression skin "${expressionName}" not found for character "${characterId}".`);
      }
    }
  }, [expressionName, characterId]);


  return (
    <div
      ref={canvasRef}
      className={`character-animator-container flex justify-center items-center ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
    >
      {loading && <div className="text-gray-500">キャラクターをロード中...</div>}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
};

export { CharacterAnimatorClient };
