import type { MetadataRoute } from 'next';

/**
 * 物理ファイル public/robots.txt が優先されるように設定。
 * Next.js 15 のビルドエラーを回避するために最小限の静的構成を維持します。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://firebasejapan.com/sitemap.xml',
  };
}
