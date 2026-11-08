/**
 * SEO / Open Graph from the backend public share contract.
 * Never substitute gallery.media for share.image.
 */

import { shareImageUrl, toAbsoluteFrontendUrl } from '../site/faneqoOrigin.js'
import { stripNavFrom } from './artistWorldReturn.js'

export function publicShareHead({ share, origin, type = 'website' } = {}) {
  const title = String(share?.title || '').trim() || 'Faneqo'
  const description = String(share?.description || '').trim()
  const canonical = toAbsoluteFrontendUrl(stripNavFrom(share?.canonicalPath), origin)
  const image = shareImageUrl(share?.image)
  return {
    title,
    description,
    canonical,
    image,
    type,
    twitterCard: image ? 'summary_large_image' : 'summary',
  }
}

export function publicShareHeadTags(head) {
  const meta = [
    { name: 'description', content: head.description },
    { property: 'og:site_name', content: 'Faneqo' },
    { property: 'og:title', content: head.title },
    { property: 'og:description', content: head.description },
    { property: 'og:type', content: head.type || 'website' },
    { property: 'og:url', content: head.canonical },
    { name: 'twitter:card', content: head.twitterCard || 'summary' },
    { name: 'twitter:title', content: head.title },
    { name: 'twitter:description', content: head.description },
  ].filter((row) => row.content)
  if (head.image) {
    meta.push(
      { property: 'og:image', content: head.image },
      { property: 'og:image:secure_url', content: head.image },
      { name: 'twitter:image', content: head.image },
    )
  }
  return {
    title: head.title,
    meta,
    link: head.canonical ? [{ rel: 'canonical', href: head.canonical }] : [],
  }
}
