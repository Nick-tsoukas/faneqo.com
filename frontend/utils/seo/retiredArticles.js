/**
 * Legacy MusicBizQR articles, retired (ART-2, 2026-11-11).
 *
 * `/article`, everything under it, the old `/discover` article list and the
 * old public `/seo` article dashboard answer 410 Gone: no replacement page
 * exists, so search engines should drop them rather than treat them as broken
 * or follow a soft-404 redirect home. The Strapi `seo-pages` records, schema
 * and media are untouched; the content is archived privately.
 *
 * Only these exact paths and their sub-paths match. Look-alikes such as
 * `/articles`, `/discovery`, `/seo-tools` or `/corvana/seo` are not intercepted.
 */
const RETIRED_ROOTS = ['article', 'discover', 'seo']

/** Top-level names that must never be listed or served as artist pages (they answer 410). */
export const RETIRED_TOP_LEVEL_PATHS = [...RETIRED_ROOTS]

export function isRetiredArticlePath(pathname) {
  let path = String(pathname || '')
  try {
    path = decodeURIComponent(path)
  } catch {
    // Malformed escapes: judge the raw path.
  }
  path = path.toLowerCase().replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return RETIRED_ROOTS.some((root) => path === `/${root}` || path.startsWith(`/${root}/`))
}

export const RETIRED_ARTICLE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>This page is no longer available | Faneqo</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #050505; color: #f5f5f6;
         font-family: Poppins, system-ui, -apple-system, "Segoe UI", sans-serif; padding: 24px; box-sizing: border-box; }
  main { max-width: 30rem; text-align: center; }
  h1 { font-size: 1.5rem; line-height: 1.25; margin: 0 0 .75rem; font-weight: 600; }
  p { color: rgba(245,245,246,.68); line-height: 1.55; margin: 0 0 1.75rem; }
  a { display: inline-block; min-height: 48px; box-sizing: border-box; padding: .85rem 1.5rem; border-radius: 999px;
      background: #f5f5f6; color: #050505; text-decoration: none; font-weight: 600; }
  a:hover { background: #fff; }
  a:focus-visible { outline: 2px solid #f5f5f6; outline-offset: 3px; }
</style>
</head>
<body>
<main>
  <h1>This page is no longer available</h1>
  <p>Our old articles have been retired. Faneqo helps artists share their music, shows and updates with fans.</p>
  <a href="/">Go to Faneqo</a>
</main>
</body>
</html>`
