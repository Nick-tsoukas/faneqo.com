import { readdirSync } from 'node:fs'
import { reservedTopLevelPaths } from './utils/seo/artistSitemap.js'
import { RETIRED_TOP_LEVEL_PATHS } from './utils/seo/retiredArticles.js'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

//  trigger redeploy

  // Router scroll behavior is configured in app/router.options.ts

  // emoji-picker-element registers as a web component (messaging composer)
  vue: {
    compilerOptions: {
      isCustomElement: (tag) => tag === 'emoji-picker',
    },
  },

  vite: {
    optimizeDeps: {
      include: ['chart.js', '@tiptap/vue-3',
        '@tiptap/starter-kit',],
      exclude: ['@rive-app/webgl2'],
    },
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'emoji-picker',
        },
      },
    },
  },
  
  build: {
    transpile: ['chart.js', '@tiptap/vue-3',
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
    // App routes that would shadow an artist slug (/dashboard, …) plus the
    // retired article paths (/article, /discover, /seo answer 410), captured at
    // build time for the artist sitemap.
    sitemapReservedPaths: [...reservedTopLevelPaths(readdirSync('./pages')), ...RETIRED_TOP_LEVEL_PATHS],
    public: {
      strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
        baseUrl: process.env.BASE_URL || 'https://faneqo.com',
      // Firebase project id is public (already in the client bundle). Used
      // server-side as the required audience/issuer when verifying ID tokens.
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || 'musicbizqr-f3261',
      // Lets a private localhost renderer serve the studio frame. Off unless
      // STUDIO_RENDER_INTERNAL=1, and the page still refuses public hostnames.
      studioRenderInternal: process.env.STUDIO_RENDER_INTERNAL === '1',
      // Mirrors the backend's FANEQO_PAYMENTS_REQUIRE_PAID. Only Create Artist
      // reads it (no band yet to ask the server); the editor uses the server's
      // own `enforced` answer. 'enforce' shows the Start Pro panel on create.
      paymentsRequirePaid: process.env.NUXT_PUBLIC_PAYMENTS_REQUIRE_PAID || '',
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
    "@nuxtjs/tailwindcss",
    "@nuxtjs/strapi",
    '@vee-validate/nuxt',
    "@nuxt/image",
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

    // Static pages only. The legacy articles were retired (ART-2, 2026-11-11):
    // they answer 410, and the sitemap makes no CMS request.
    urls: [
      { loc: '/', changefreq: 'daily', priority: 1.0 },
      { loc: '/contact', changefreq: 'monthly', priority: 0.4 },
      { loc: '/privacypolicy', changefreq: 'yearly', priority: 0.2 },
      { loc: '/termsofservice', changefreq: 'yearly', priority: 0.2 },
    ],
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
    }
  },

  plugins: [
    '~/plugins/chart.js',
  ],

  compatibilityDate: '2025-04-11',

  // No build hook fetches CMS content: the article prerender hook was removed
  // in ART-1 and the article pages were retired (410) in ART-2, 2026-11-11.
  
  
  
})