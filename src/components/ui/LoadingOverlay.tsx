'use client';

import React, { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { LOADING_TIPS, LoadingTip } from "@/lib/loading-tips";

export interface LoadingOverlayProps {
  progress: number; // 0 ~ 100
  currentTask?: string;
  onComplete?: () => void;
  backgroundImageUrl?: string;
  requireTapToStart?: boolean;
}

export function LoadingOverlay({
  progress,
  currentTask = "リソースを読み込み中...",
  onComplete,
  backgroundImageUrl,
  requireTapToStart = false,
}: LoadingOverlayProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // 初期TIPSをランダムで決定 & 5秒ごとに次のTIPSへ切り替え
  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * LOADING_TIPS.length));
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // 100%に到達したときの完了判定
  useEffect(() => {
    if (progress >= 100) {
      if (!requireTapToStart && onComplete) {
        const timer = setTimeout(onComplete, 400);
        return () => clearTimeout(timer);
      } else {
        setIsReady(true);
      }
    }
  }, [progress, requireTapToStart, onComplete]);

  const currentTip = LOADING_TIPS[tipIndex] || LOADING_TIPS[0];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 text-foreground overflow-hidden select-none animate-in fade-in duration-300">
      {/* 1. 背景画像（指定時） */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay filter blur-sm transition-opacity duration-1000"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        />
      )}

      {/* 2. 背景グラデーション・ビネット効果 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black pointer-events-none" />

      {/* 上部: タイトル & パーセンテージ表示 */}
      <div className="z-10 p-6 flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span className="tracking-widest uppercase">LOADING REALM...</span>
        <span className="text-primary font-bold">{Math.round(progress)}%</span>
      </div>

      {/* 中央: TIPS / フレーバーテキスト表示エリア */}
      <div className="z-10 max-w-lg mx-auto px-6 text-center space-y-4">
        <div className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wider transition-all duration-300">
          {currentTip.title}
        </div>
        <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans min-h-[4.5rem] transition-opacity duration-300">
          {currentTip.description}
        </p>
      </div>

      {/* 下部: プログレスバー & 進行ステータス */}
      <div className="z-10 p-6 md:p-10 max-w-2xl w-full mx-auto space-y-3">
        <div className="flex justify-between items-end text-xs text-zinc-400 font-mono tracking-tight">
          <span className="truncate max-w-[80%]">{currentTask}</span>
          <span>{Math.round(progress)} / 100</span>
        </div>

        {/* プログレスバー */}
        <Progress value={progress} className="h-2 bg-zinc-800" />

        {/* 100%完了時の「TAP TO START」ボタン (requireTapToStart有効時) */}
        {isReady && requireTapToStart && (
          <div className="pt-4 text-center animate-pulse">
            <button
              type="button"
              onClick={onComplete}
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm tracking-wider"
            >
              TAP TO START
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
