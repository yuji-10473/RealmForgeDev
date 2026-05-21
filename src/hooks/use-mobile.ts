'use client';

import { useState, useEffect } from 'react';

const getIsMobile = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  // タッチ対応と画面サイズでモバイルデバイスを判定
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  // 一般的なモバイルデバイスの画面幅を考慮
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
  return hasTouch && isSmallScreen;
};

/**
 * 画面サイズとタッチ可否に基づいてモバイルデバイスかどうかを判定するフック
 * @returns {boolean} モバイルデバイスであれば `true`
 */
export const useMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(getIsMobile());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(getIsMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
};
