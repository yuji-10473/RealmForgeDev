import type { MetadataRoute } from 'next';

/**
 * 物理ファイル public/sitemap.xml が優先されるように設定。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://firebasejapan.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
