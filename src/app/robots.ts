/**
 * このファイルは不要になりました。
 * public/robots.txt が優先的に使用されます。
 */
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://firebasejapan.com/sitemap.xml',
  };
}
