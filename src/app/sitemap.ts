/**
 * このファイルは不要になりました。
 * public/sitemap.xml が優先的に使用されます。
 */
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://firebasejapan.com',
      lastModified: new Date(),
    },
  ];
}
