/**
 * Shared homepage FAQ + SEO for production `/`.
 * Keep visible FAQ copy and JSON-LD in sync.
 */

export const HOMEPAGE_FAQS = [
  {
    q: 'Is Faneqo just another Linktree?',
    a: 'No. Faneqo can bring your music, video, socials, shows and support into one artist page. The bigger difference: fans join your Fan List, you can see who they are, reach them again, and they can write back.',
  },
  {
    q: 'Can I keep my existing website and links?',
    a: 'Yes. Add Spotify, Apple Music, YouTube, socials, merch, tickets, and your website. Fans get one place. You keep the relationship.',
  },
  {
    q: 'What happens when someone joins my Fan List?',
    a: 'They become someone you can see and reach again. You get a name, a city, and how they found you — not just another email in a spreadsheet. You can export your list.',
  },
  {
    q: 'Can I actually message the fans I collect?',
    a: 'Yes. Message one fan, or the people who were actually at the show. Direct — not a blast into the void.',
  },
  {
    q: 'Can fans message me?',
    a: 'Yes. You can write to fans, and they can write back. Real conversations after the night ends.',
  },
  {
    q: 'How does Faneqo work at live shows?',
    a: 'Fans scan your QR and check in. They can join your Fan List from the room, and you can reach the people who showed up.',
  },
  {
    q: 'What does Faneqo cost?',
    a: 'Faneqo Pro is $12 per month after the current trial period. Current billing terms are shown during signup.',
  },
]

const orgId = 'https://faneqo.com/#organization'
const appId = 'https://faneqo.com/#software'
const siteId = 'https://faneqo.com/#website'
const ogImage = 'https://faneqo.com/api/og/site.png?v=20260801'

export const homepageWebSiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': siteId,
  url: 'https://faneqo.com',
  name: 'Faneqo',
  description: 'Create an artist headquarters with music links, QR codes, fan capture, messaging, support buttons, and analytics built for musicians.',
  publisher: { '@id': orgId },
}

export const homepageOrgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': orgId,
  name: 'Faneqo',
  url: 'https://faneqo.com',
  logo: 'https://faneqo.com/faneqo-logo.png',
}

export const homepageAppLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': appId,
  name: 'Faneqo',
  url: 'https://faneqo.com',
  applicationCategory: 'MarketingApplication',
  applicationSubCategory: 'MusicMarketing',
  operatingSystem: 'Web',
  image: ogImage,
  description: 'Music smart link, QR code, fan relationship, messaging, and analytics platform for artists. Share your page and QR, then grow fans you can reach again.',
  publisher: { '@id': orgId },
  offers: {
    '@type': 'Offer',
    url: 'https://faneqo.com/signup',
    price: '12.00',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    category: 'subscription',
  },
  isAccessibleForFree: false,
}

export function homepageFaqLd(faqs = HOMEPAGE_FAQS) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

export function applyHomepageSeo(faqs = HOMEPAGE_FAQS) {
  useHead({
    title: 'Faneqo | Music Smart Links, QR Codes & Fan Growth for Artists',
    // The title already leads with the brand; don't let the site template append "| Faneqo" again.
    titleTemplate: '%s',
    htmlAttrs: {
      class: 'home-v2-route',
    },
    bodyAttrs: {
      class: 'home-v2-route',
    },
    meta: [
      { name: 'description', content: 'Create an artist headquarters with music links, QR codes, fan capture, messaging, support buttons, and analytics. Faneqo helps bands turn scans, clicks, and shows into fans they can reach again.' },
      { name: 'keywords', content: 'QR code for musicians, artist smart link, dynamic QR code, music QR, Faneqo, band artist page, music link tree alternative, streaming links, music marketing tool, fan list for bands, live show QR code' },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:title', content: 'Faneqo | Smart Links, QR Codes & Fan Growth for Artists' },
      { property: 'og:description', content: 'An artist headquarters, fan list, QR code, messaging, and analytics built for music. Turn every scan, click, and show into a fan you can reach again.' },
      { property: 'og:image', content: ogImage },
      { property: 'og:image:secure_url', content: ogImage },
      { property: 'og:image:type', content: 'image/png' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'Faneqo — bands need fans they can reach again' },
      { property: 'og:url', content: 'https://faneqo.com' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Faneqo' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Faneqo | Smart Links, QR Codes & Fan Growth for Artists' },
      { name: 'twitter:description', content: 'Music smart link and QR code platform for bands and artists, with fan capture, messaging, analytics, and show-ready growth tools.' },
      { name: 'twitter:image', content: ogImage },
    ],
    link: [
      { rel: 'canonical', href: 'https://faneqo.com' },
    ],
    script: [
      { type: 'application/ld+json', innerHTML: JSON.stringify(homepageWebSiteLd), key: 'ld-website' },
      { type: 'application/ld+json', innerHTML: JSON.stringify(homepageFaqLd(faqs)), key: 'ld-faq' },
      { type: 'application/ld+json', innerHTML: JSON.stringify(homepageOrgLd), key: 'ld-org' },
      { type: 'application/ld+json', innerHTML: JSON.stringify(homepageAppLd), key: 'ld-app' },
    ],
    noscript: [
      { innerHTML: '<style>.home-phrase-inner,.home-type-reveal,.v2-hero__thought,.v2-hero__support,.v2-hero__cta,.v2-hero-stage,.v2-hero__signal{transform:none!important;opacity:1!important}</style>' },
    ],
    __dangerouslyDisableSanitizersByTagID: {
      'ld-website': ['innerHTML'],
      'ld-org': ['innerHTML'],
      'ld-app': ['innerHTML'],
      'ld-faq': ['innerHTML'],
    },
  })
}
