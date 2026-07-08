import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/admin', '/manage-links', '/qr-codes', '/analytics', '/lrc-sync', '/profile'],
    },
    sitemap: 'https://linknyter.com/sitemap.xml',
  }
}
