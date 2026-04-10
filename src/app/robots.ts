import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // 環境変数から取得するか、実際の運用ドメインをデフォルトにする
  const baseUrl = process.env.APP_URL || 'https://firebasejapan.com'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/play-test', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
