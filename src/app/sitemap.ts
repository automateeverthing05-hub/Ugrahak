import type { MetadataRoute } from 'next'

const baseUrl = 'https://ugrahak.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '',
    '/pricing',
    '/terms',
    '/privacy-policy',
    '/refund-policy',
    '/contact',
    '/login',
    '/signup',
  ]

  return pages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
  }))
}
