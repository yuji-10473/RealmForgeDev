import type { MetadataRoute } from 'next';

/**
 * robots.txt の静的生成を強制します。
 * これにより Vary ヘッダーから認証関連の指定が排除され、Googlebot が正常にクロールできるようになります。
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/play-test', '/api/'],
    },
    sitemap: 'https://firebasejapan.com/sitemap.xml',
  };
}
