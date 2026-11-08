/**
 * GET /api/corvana/seo/articles/inventory
 * 
 * Fetches SEO article inventory from Strapi for Corvana analysis.
 * Normalizes articles with metadata, cluster classification, and best-effort content analysis.
 * 
 * Query params:
 * - category: filter by category (optional)
 * - limit: max articles (default 200)
 */

import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { checkCorvanaAuth } from '../../../../utils/corvanaAuth'

interface StrapiArticle {
  id: number
  attributes: {
    title: string
    slug: string
    category: string | null
    metaTitle: string | null
    metaDescription: string | null
    content?: string
    body?: string
    excerpt?: string
    publishedAt: string
    updatedAt: string
    createdAt?: string
    isPillar?: boolean
    keywords?: string
    ogImage?: any
    author?: any
  }
}

interface NormalizedArticle {
  id: number
  title: string
  slug: string
  category: string
  url: string
  metaTitle: string
  metaDescription: string
  publishedAt: string
  updatedAt: string
  ageDays: number
  cluster: string
  status: 'published' | 'draft' | 'unknown'
  wordCount: number
  hasFaq: boolean
  hasJsonLd: boolean
  isPillar: boolean
  keywords: string[]
  strapiRaw: {
    category: string | null
    hasContentField: boolean
    hasBodyField: boolean
    excerptLength: number
  }
}

// Cluster classification mapping
const CLUSTER_MAP: Record<string, string> = {
  'smart-links': 'smart-links',
  'qr-code-strategy': 'qr-code-strategy',
  'qr-codes': 'qr-code-strategy',
  'qr': 'qr-code-strategy',
  'music-marketing': 'music-marketing',
  'touring-events': 'touring-events',
  'touring': 'touring-events',
  'events': 'touring-events',
  'merch-growth': 'merch-growth',
  'merch': 'merch-growth',
  'merchandise': 'merch-growth',
  'fan-capture': 'fan-capture',
  'email-marketing': 'fan-capture',
  'uncategorized': 'uncategorized'
}

function classifyCluster(category: string | null): string {
  if (!category) return 'uncategorized'
  
  const normalized = category.toLowerCase().trim()
  return CLUSTER_MAP[normalized] || 'unknown'
}

function detectFaq(content: string): boolean {
  if (!content) return false
  const lower = content.toLowerCase()
  return lower.includes('faq') || 
         lower.includes('frequently asked') ||
         lower.includes('frequently asked questions') ||
         /##?\s*q(&|and)?a/i.test(lower) ||
         /##?\s*questions/i.test(lower)
}

function detectJsonLd(content: string): boolean {
  if (!content) return false
  return content.includes('application/ld+json') ||
         content.includes('@type') ||
         content.includes('"@context"')
}

function estimateWordCount(content: string | undefined): number {
  if (!content) return 0
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, ' ')
  // Split by whitespace and count
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  return words.length
}

function calculateAgeDays(publishedAt: string): number {
  const published = new Date(publishedAt)
  const now = new Date()
  const diffMs = now.getTime() - published.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export default defineEventHandler(async (event) => {
  // Check auth
  const auth = checkCorvanaAuth(event)
  if (!auth.authorized) {
    setResponseStatus(event, 401)
    return auth.error
  }
  
  const runtimeConfig = useRuntimeConfig()
  const query = getQuery(event)
  
  // Check Strapi config
  const strapiUrl = runtimeConfig.public?.strapiUrl || process.env.STRAPI_URL
  if (!strapiUrl) {
    setResponseStatus(event, 500)
    return {
      error: 'Strapi URL not configured',
      help: 'Set STRAPI_URL in environment or public.strapiUrl in runtimeConfig'
    }
  }
  
  const limit = Math.min(parseInt(query.limit as string) || 200, 500)
  const categoryFilter = query.category as string | undefined
  
  try {
    // Build Strapi API URL
    const params = new URLSearchParams()
    params.set('pagination[pageSize]', limit.toString())
    params.set('populate', '*')
    params.set('sort', 'publishedAt:desc')
    
    if (categoryFilter) {
      params.set('filters[category][$eq]', categoryFilter)
    }
    
    const apiUrl = `${strapiUrl}/api/seo-pages?${params.toString()}`
    
    console.log('[Corvana] Fetching article inventory from Strapi:', strapiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[Corvana] Strapi API error:', response.status, errorText.substring(0, 200))
      
      setResponseStatus(event, response.status)
      return {
        error: 'Failed to fetch articles from Strapi',
        status: response.status,
        help: 'Check Strapi is running and public permissions are enabled for seo-page collection'
      }
    }
    
    const data = await response.json()
    const articles: StrapiArticle[] = data.data || []
    
    console.log(`[Corvana] Fetched ${articles.length} articles from Strapi`)
    
    // Normalize articles
    const normalized: NormalizedArticle[] = articles.map((article) => {
      const attrs = article.attributes
      
      // Get content from various possible fields
      const content = attrs.content || attrs.body || attrs.excerpt || ''
      
      // Build URL
      const category = (attrs.category || 'uncategorized').toLowerCase().trim()
      const slug = attrs.slug || ''
      const url = `https://musicbizqr.com/article/${category}/${slug}`
      
      // Parse keywords
      const keywords = (attrs.keywords || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
      
      return {
        id: article.id,
        title: attrs.title || '',
        slug: slug,
        category: category,
        url: url,
        metaTitle: attrs.metaTitle || attrs.title || '',
        metaDescription: attrs.metaDescription || '',
        publishedAt: attrs.publishedAt || attrs.createdAt || new Date().toISOString(),
        updatedAt: attrs.updatedAt || attrs.publishedAt || new Date().toISOString(),
        ageDays: calculateAgeDays(attrs.publishedAt || new Date().toISOString()),
        cluster: classifyCluster(attrs.category),
        status: attrs.publishedAt ? 'published' : 'draft',
        wordCount: estimateWordCount(content),
        hasFaq: detectFaq(content),
        hasJsonLd: detectJsonLd(content),
        isPillar: attrs.isPillar || false,
        keywords: keywords,
        strapiRaw: {
          category: attrs.category,
          hasContentField: !!attrs.content,
          hasBodyField: !!attrs.body,
          excerptLength: (attrs.excerpt || '').length
        }
      }
    })
    
    // Group by cluster
    const byCluster: Record<string, NormalizedArticle[]> = {}
    for (const article of normalized) {
      if (!byCluster[article.cluster]) {
        byCluster[article.cluster] = []
      }
      byCluster[article.cluster].push(article)
    }
    
    // Calculate cluster stats
    const clusterStats = Object.entries(byCluster).map(([cluster, articles]) => ({
      cluster,
      count: articles.length,
      avgAgeDays: Math.round(articles.reduce((s, a) => s + a.ageDays, 0) / articles.length),
      avgWordCount: Math.round(articles.reduce((s, a) => s + a.wordCount, 0) / articles.length),
      pillarCount: articles.filter(a => a.isPillar).length,
      withFaq: articles.filter(a => a.hasFaq).length,
      withJsonLd: articles.filter(a => a.hasJsonLd).length,
      oldArticles: articles.filter(a => a.ageDays > 90).length
    }))
    
    return {
      site: 'musicbizqr.com',
      generatedAt: new Date().toISOString(),
      
      summary: {
        totalArticles: normalized.length,
        totalClusters: Object.keys(byCluster).length,
        publishedArticles: normalized.filter(a => a.status === 'published').length,
        draftArticles: normalized.filter(a => a.status === 'draft').length,
        articlesOver90Days: normalized.filter(a => a.ageDays > 90).length,
        withFaq: normalized.filter(a => a.hasFaq).length,
        withJsonLd: normalized.filter(a => a.hasJsonLd).length,
        pillarArticles: normalized.filter(a => a.isPillar).length
      },
      
      clusters: clusterStats,
      
      articles: normalized,
      
      byCluster,
      
      exportMeta: {
        version: '1.0',
        tool: 'Corvana SEO',
        source: 'Strapi seo-pages',
        notes: [
          'Word count is estimated from content/body/excerpt fields',
          'FAQ detection looks for "FAQ", "Frequently Asked", or Q&A patterns',
          'JSON-LD detection looks for @type or application/ld+json',
          'Cluster classification is based on category field'
        ]
      }
    }
    
  } catch (error: any) {
    console.error('[Corvana] Article inventory failed:', error.message)
    
    setResponseStatus(event, 500)
    return {
      error: 'Failed to fetch article inventory',
      message: error.message,
      help: 'Ensure Strapi is running and accessible from this server'
    }
  }
})
