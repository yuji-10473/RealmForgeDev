import { MetadataRoute } from 'next';

/**
 * 物理ファイル public/robots.txt が優先されるため、
 * このファイルはビルドエラーを防ぐための最小限の定義のみを行います。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/play-test', '/api/'],
      },
    ],
    sitemap: 'https://firebasejapan.com/sitemap.xml',
  };
}
