import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://realmforge.web.app'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/play-test', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
