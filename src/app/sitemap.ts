import { MetadataRoute } from 'next';

/**
 * 物理ファイル public/sitemap.xml が優先されるため、
 * このファイルはビルドエラーを防ぐための最小限の定義のみを行います。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://firebasejapan.com',
      lastModified: new Date(),
    },
  ];
}
