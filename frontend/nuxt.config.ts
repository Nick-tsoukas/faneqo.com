import { readdirSync } from 'node:fs'
import { getRedirectedUrls } from './server/utils/seoRedirects'
import { reservedTopLevelPaths } from './utils/seo/artistSitemap.js'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

//  trigger redeploy

  // Router scroll behavior is configured in app/router.options.ts

  // vue-advanced-chat registers as a web component (chat lab / future Inbox UI only)
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'vue-advanced-chat' || tag === 'emoji-picker',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', 'chartjs-adapter-luxon',    '@tiptap/vue-3',
        '@tiptap/starter-kit',],
      exclude: ['@rive-app/webgl2'],
    },
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'vue-advanced-chat' || tag === 'emoji-picker',
        },
      },
    },
  },
  
  build: {
    transpile: ['chart.js', 'chartjs-adapter-luxon',   '@tiptap/vue-3',
      '@tiptap/starter-kit']
  },
  css: ['@/assets/css/tailwind.css', 'animate.css/animate.min.css', '@fortawesome/fontawesome-free/css/all.css'],

  runtimeConfig: {
     gaPropertyId: process.env.GA_PROPERTY_ID,
    gaServiceAccountJson: process.env.GA_SERVICE_ACCOUNT_JSON,
    // ✅ Corvana SEO Google OAuth (Search Console API)
    corvanaGoogleClientId: process.env.CORVANA_GOOGLE_CLIENT_ID,
    corvanaGoogleClientSecret: process.env.CORVANA_GOOGLE_CLIENT_SECRET,
    corvanaGoogleRedirectUri: process.env.CORVANA_GOOGLE_REDIRECT_URI,
    corvanaGscSiteUrl: process.env.CORVANA_GSC_SITE_URL,
     // ✅ Your Stripe secret config
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeDefaultPriceId: process.env.STRIPE_DEFAULT_PRICE_ID,
    resendKey: process.env.RESEND_API_KEY,
    contactTo: process.env.CONTACT_TO,
    contactFrom: process.env.CONTACT_FROM,
     strapiApiToken: process.env.STRAPI_API_TOKEN,
    // Authenticates the custom Strapi /api/user-admin/* routes. Private only —
    // must never be added to runtimeConfig.public.
    userAdminSecret: process.env.USER_ADMIN_SECRET,
    // Private video worker. Empty until the founder provisions it. Never public.
    studioVideoWorkerUrl: process.env.STUDIO_VIDEO_WORKER_URL || '',
    studioVideoWorkerToken: process.env.STUDIO_VIDEO_WORKER_TOKEN || '',
    // App routes that would shadow an artist slug (/dashboard, /article, …),
    // captured at build time for the artist sitemap.
    sitemapReservedPaths: [...reservedTopLevelPaths(readdirSync('./pages'))],
    public: {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
        baseUrl: process.env.BASE_URL || 'https://faneqo.com',
      // Firebase project id is public (already in the client bundle). Used
      // server-side as the required audience/issuer when verifying ID tokens.
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'musicbizqr-f3261',
      // Lets a private localhost renderer serve the studio frame. Off unless
      // STUDIO_RENDER_INTERNAL=1, and the page still refuses public hostnames.
      studioRenderInternal: process.env.STUDIO_RENDER_INTERNAL === '1',
      // strapiUrl: ' https://finite-fit-queries-kansas.trycloudflare.com',
    
      stripe: {
        key: process.env.STRIPE_PUBLISHABLE_KEY,
        options: {},
      },
    },
    stripe: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {},
    },

  },

  app: {
    head: {
      meta: [
        { name: 'facebook-domain-verification', content: '9wn1gd6ee2cc2c82ks82mmcdllcobc' },
        { name: 'theme-color', content: '#FF00FF' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Faneqo' },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;800&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/icon?family=Material+Icons'
        },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: '/icons/faneqo-favicon-16.png', sizes: '16x16' },
        { rel: 'icon', type: 'image/png', href: '/icons/faneqo-favicon-32.png', sizes: '32x32' },
        { rel: 'icon', type: 'image/x-icon', href: '/faneqo-favicon.ico' },
        { rel: 'apple-touch-icon', href: '/icons/faneqo-apple-touch-icon.png' },
        // iOS Splash Screens
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1242x2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-828x1792.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-750x1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1242x2208.png', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-2048x2732.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1668x2388.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)' },
        { rel: 'apple-touch-startup-image', href: '/splash-faneqo/apple-splash-1536x2048.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)' },
      ],
    },
  },

  devtools: { enabled: true },

  modules: [
    'nuxt-aos',
    'nuxt-headlessui',
    "@nuxtjs/tailwindcss",
    "@nuxtjs/strapi",
    'nuxt-tiptap-editor',
    '@vee-validate/nuxt',
    "@nuxt/image",
    "nuxt-particles",
    "@unlok-co/nuxt-stripe",
    '@nuxtjs/seo',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    'motion-v/nuxt',
  ],

  // Messaging owns motion deliberately. Do not globally animate the app.
  motionV: {
    components: true,
    utilities: true,
    directives: false,
  },

  pwa: {
    // The worker still replaces a stale one immediately (skipWaiting + clientsClaim).
    // registerType stays 'prompt' so @vite-pwa/nuxt does not reload the open page
    // when the worker activates. 'autoUpdate' did that reload itself. An earlier
    // prompt setup got stuck only because the new worker never called skipWaiting.
    registerType: 'prompt',
    manifest: false, // We use our own manifest.webmanifest
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB — allow larger event poster PNGs
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff,woff2}'],
      // public/test-*.html is copied into the build as those filenames, but
      // Workbox lists them as extensionless URLs (/test-simple). Those 404,
      // Workbox throws bad-precaching-response, and the SW never installs.
      globIgnores: [
        '**/node_modules/**/*',
        '**/test-*.html',
      ],
      // Disable the SPA navigation fallback entirely.
      // @vite-pwa/nuxt defaults workbox.navigateFallback to the app baseURL ('/')
      // whenever the key is ABSENT, and Workbox's createHandlerBoundToURL('/')
      // throws `non-precached-url` because this SSR app does not precache '/'
      // (this is also why removing '/offline' did not fix the error).
      // Keeping the key present with an empty string stops the module from
      // re-adding a default, and Workbox skips creating a NavigationRoute, so all
      // page loads (including dynamic /:bandSlug/support/receipt) are normal
      // network navigations. The PWA (precache + runtimeCaching) stays enabled.
      navigateFallback: '',
      // Defensive: if a navigation fallback is ever re-enabled, never serve it for
      // these routes — payments/receipt must always be live network navigations.
      navigateFallbackDenylist: [
        /^\/api/,
        /^\/account/,
        /^\/dashboard/,
        /^\/agency/,
        /^\/internal/,
        /^\/checkout/,
        /^\/directqr/,
        /^\/stripe/,
        /^\/messages/,
        /^\/fan/,
        /^\/updates/,
        /^\/analytics/,
        /^\/event-analytics/,
        /\/support\/receipt/,
      ],
      runtimeCaching: [
        {
          // Exclude api/account/dashboard/agency/internal/checkout/directqr/stripe
          // analytics and receipt routes so logged-in pages stay live network.
          urlPattern: /^https:\/\/(faneqo\.com|musicbizqr\.com)\/(?!api|account|dashboard|agency|internal|checkout|directqr|stripe|messages|fan|updates|analytics|event-analytics)(?!.*\/support\/receipt).*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            networkTimeoutSeconds: 3,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24, // 24 hours
            },
          },
        },
        {
          // Public artist/CDN images only. Gated gallery bytes must never use
          // world-readable URLs — CacheFirst would leak them across users.
          urlPattern: /^(?!.*\/api\/artist-updates).*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        {
          urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      type: 'module',
    },
  },

   image: {
    // Allow your S3 bucket host
    domains: [
      'qrcode101.s3.us-east-1.amazonaws.com',
    ],

    // Optional alias if you want to prefix short names later
    alias: {
      s3: 'https://qrcode101.s3.us-east-1.amazonaws.com',
    },

    // Preset for small dashboard thumbnails
    presets: {
      dashboardThumb: {
        modifiers: {
          width: 100,
          height: 100,
          fit: 'cover',
          format: 'webp',
          quality: 60,
        },
      },
    },
  },

  site: {
    url: process.env.BASE_URL || 'https://faneqo.com',
      name: 'Faneqo',
  description: 'Dynamic QR codes and smart links for bands and musicians.'
  },

  routeRules: {
    '/home-v2': {
      robots: 'noindex, nofollow',
    },
    '/labs': {
      robots: 'noindex, nofollow',
    },
    '/labs/**': {
      robots: 'noindex, nofollow',
    },
    '/ads': {
      robots: 'noindex, nofollow',
    },
    '/ads/**': {
      robots: 'noindex, nofollow',
    },
    '/__dev/**': {
      robots: 'noindex, nofollow',
    },
  },


  sitemap: {
    credits: false,
    xsl: false,
    cacheTime: 0,
    sitemapName: 'sitemap.xml',

    // Only explicit, canonical public URLs belong in the sitemap.
    // This prevents Nuxt page discovery from publishing dashboards, tests, callbacks, and previews.
    excludeAppSources: true,

    // Artist, radio and editorial profiles (B14), read at request time so
    // new artists appear without a deploy. See server/api/sitemap/artists.get.ts.
    sources: ['/api/sitemap/artists'],

    async urls() {
      const base = process.env.STRAPI_URL || 'http://localhost:1337'
      const staticUrls = [
        { loc: '/', changefreq: 'daily', priority: 1.0 },
        { loc: '/article', changefreq: 'weekly', priority: 0.9 },
        { loc: '/contact', changefreq: 'monthly', priority: 0.4 },
        { loc: '/privacypolicy', changefreq: 'yearly', priority: 0.2 },
        { loc: '/termsofservice', changefreq: 'yearly', priority: 0.2 },
      ]

      const normalizeSlug = (value) => {
        if (!value) return ''
        return String(value)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/[.,!?:;/"']+$/g, '')
          .replace(/^-+|-+$/g, '')
      }

      const isValidSlug = (value) => {
        const normalized = normalizeSlug(value)
        return Boolean(
          normalized &&
          normalized !== 'null' &&
          normalized !== 'undefined' &&
          normalized !== 'uncategorized'
        )
      }

      // Redirect sources can contain legacy formatting (for example, a double
      // hyphen). Compare their normalized forms so they never enter the
      // canonical sitemap as broken routes.
      const normalizeRoutePath = (path) =>
        String(path || '')
          .split('/')
          .map((segment) => normalizeSlug(segment))
          .join('/')

      const redirectedUrls = new Set(
        getRedirectedUrls().map((url) => normalizeRoutePath(url))
      )

      try {
        const response = await fetch(`${base}/api/seo-pages?pagination[pageSize]=1000`)
        if (!response.ok) {
          throw new Error(`Strapi sitemap request failed with ${response.status}`)
        }

        const payload = await response.json()
        const pages = Array.isArray(payload?.data) ? payload.data : []
        const urlMap = new Map(staticUrls.map((entry) => [entry.loc, entry]))
        const categories = new Set()

        for (const record of pages) {
          const attributes = record?.attributes || {}
          const category = normalizeSlug(attributes.category)
          const slug = normalizeSlug(attributes.slug)

          if (!isValidSlug(category) || !isValidSlug(slug)) continue

          categories.add(category)
          const loc = `/article/${category}/${slug}`
          if (redirectedUrls.has(loc)) continue

          urlMap.set(loc, {
            loc,
            lastmod: attributes.updatedAt,
            changefreq: 'weekly',
            priority: 0.9,
          })
        }

        for (const category of [...categories].sort()) {
          const loc = `/article/${category}`
          urlMap.set(loc, {
            loc,
            changefreq: 'weekly',
            priority: 0.8,
          })
        }

        return [...urlMap.values()].sort((a, b) => {
          if (a.loc === '/') return -1
          if (b.loc === '/') return 1
          return a.loc.localeCompare(b.loc)
        })
      } catch (error) {
        // Keep the sitemap valid during a temporary CMS outage.
        console.error('[Sitemap] Falling back to static canonical URLs:', error)
        return staticUrls
      }
    },
  },

  aos: {
    // Global settings:
    disable: false, // Disable AOS globally (e.g., for mobile devices)
    startEvent: 'DOMContentLoaded', // Event to initialize AOS
    initClassName: 'aos-init', // Class applied after initialization
    animatedClassName: 'aos-animate', // Class applied on animation
    useClassNames: false, // Add content of `data-aos` as classes on scroll
    disableMutationObserver: false, // Disable automatic mutations' detections
    debounceDelay: 50, // Delay on debounce used while resizing window
    throttleDelay: 99, // Delay on throttle used while scrolling the page

    // Settings that can be overridden on per-element basis:
    offset: 50, // Offset (in px) from the original trigger point - reduced for mobile
    delay: 0, // Delay value from 0 to 3000 (in ms)
    duration: 400, // Duration value from 0 to 3000 (in ms)
    easing: 'ease', // Default easing for AOS animations
    once: true, // Whether animation should happen only once - set true so elements stay visible
    mirror: false, // Whether elements should animate out while scrolling past them
    anchorPlacement: 'top-bottom', // Defines which position of the element regarding to window should trigger the animation
  },

  stripe: {
    server: {
      key: process.env.STRIPE_SECRET_KEY,
      options: {
        // Optional: Additional Stripe configuration options
      },
    },
    client: {
      key: process.env.STRIPE_PUBLIC_KEY,
      manualClientLoad: true,
      options: {
        // Optional: Additional Stripe.js configuration options
      },
    },
  },

  particles: {
    mode: 'full',
    lazy: true
  },

  strapi: {
    url: process.env.STRAPI_URL || 'http://localhost:1337',
    prefix: '/api',
    admin: '/admin',
    version: 'v4',
    cookie: {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,  // 30 days (matches Strapi JWT default)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    },
    cookieName: 'strapi_jwt'
  },

    nitro: {
    externals: { inline: ['geoip-lite'] },
    routeRules: {
     '/home-v2': {
        headers: {
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
     '/**': {
        headers: {
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Content-Security-Policy':
            "frame-src 'self' https:; child-src 'self' https:;",
        }
      },
     '/article/smart-links/smart-links': {
        redirect: { to: '/article/smart-links', statusCode: 301 }
      },

      '/article/qr-code-strategy/qr-code-strategy': {
        redirect: { to: '/article/qr-code-strategy', statusCode: 301 }
      },

      '/article/music-marketing/music-marketing': {
        redirect: { to: '/article/music-marketing', statusCode: 301 }
      },

      '/article/fan-funnels/fan-funnels': {
        redirect: { to: '/article/fan-funnels', statusCode: 301 }
      },

      '/article/touring-events/touring-events': {
        redirect: { to: '/article/touring-events', statusCode: 301 }
      },
    }
  },

  plugins: [
    '~/plugins/chart.js',
    '~/plugins/fontawesome.js',
     '~/plugins/vue-echarts.client.ts'
   
  ],

  compatibilityDate: '2025-04-11',

  hooks: {
    'nitro:config': async (nitroConfig) => {
      if (process.env.NODE_ENV !== 'production') return
  
      const seoApiUrl = `${process.env.STRAPI_URL}/api/seo-pages?populate=category&pagination[pageSize]=1000`
  
      // Helper: normalize slug for SEO-safe URLs
      const normalizeSlug = (str) => {
        if (!str) return ''
        return String(str)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/[.,!?:;/"']+$/g, '')
          .replace(/^-+|-+$/g, '')
      }

      // Helper: validate slug is valid (non-empty, not "null")
      const isValidSlug = (str) => {
        if (!str) return false
        const normalized = normalizeSlug(str)
        if (!normalized) return false
        if (normalized === 'null' || normalized === 'undefined') return false
        return true
      }

      // Use the same redirect source map as the runtime 301 middleware.
      // Normalize both sides because legacy CMS slugs may contain formatting
      // that normalizeSlug intentionally corrects.
      const normalizeRoutePath = (path) =>
        String(path || '')
          .split('/')
          .map((segment) => normalizeSlug(segment))
          .join('/')

      const redirectedUrls = new Set(
        getRedirectedUrls().map((url) => normalizeRoutePath(url))
      )

      try {
        const res = await fetch(seoApiUrl)
        const json = await res.json()
  
        const prerenderRoutes = []
        let skipped = 0
  
        for (const page of json.data) {
          const rawCategory = page.attributes.category
          const rawSlug = page.attributes.slug
          
          const category = normalizeSlug(rawCategory)
          const slug = normalizeSlug(rawSlug)
  
          if (!isValidSlug(category) || !isValidSlug(slug)) {
            console.warn(`⚠️ Skipping SEO page (invalid category or slug): ID ${page.id}, category="${rawCategory}", slug="${rawSlug}"`)
            skipped++
            continue
          }
  
          const route = `/article/${category}/${slug}`
          if (redirectedUrls.has(route)) {
            console.warn(`⚠️ Skipping redirected SEO page during prerender: ${route}`)
            skipped++
            continue
          }

          prerenderRoutes.push(route)
        }

        prerenderRoutes.push('/article')
  
        console.log(`✅ Pre-rendering ${prerenderRoutes.length} routes (${json.data.length - skipped} of ${json.data.length} articles)`)
  
        nitroConfig.prerender = nitroConfig.prerender || {}
        nitroConfig.prerender.routes = [
          ...(nitroConfig.prerender.routes || []),
          ...prerenderRoutes,
        ]
      } catch (e) {
        console.error('❌ Failed to prerender SEO pages:', e)
      }
    }
  }
  
  
  
})