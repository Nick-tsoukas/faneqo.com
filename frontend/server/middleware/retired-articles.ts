/**
 * Retired legacy articles answer 410 Gone (see utils/seo/retiredArticles.js).
 *
 * Runs before the Nuxt renderer, so these paths can never fall through to the
 * dynamic [bandSlug] artist page. Nitro runs server middleware in file-name
 * order: domain-migration (musicbizqr.com → faneqo.com 301) comes first, so
 * old-domain links make one hop, then land here. No route rule redirects
 * these paths any more.
 */
import { defineEventHandler, getRequestURL, setResponseHeader, setResponseStatus } from 'h3'
import { RETIRED_ARTICLE_HTML, isRetiredArticlePath } from '~/utils/seo/retiredArticles.js'

export default defineEventHandler((event) => {
  if (!isRetiredArticlePath(getRequestURL(event).pathname)) return
  setResponseStatus(event, 410, 'Gone')
  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  setResponseHeader(event, 'X-Robots-Tag', 'noindex')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
  return RETIRED_ARTICLE_HTML
})
