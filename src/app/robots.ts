import type { MetadataRoute } from 'next';

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
