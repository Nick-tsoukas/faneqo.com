'use strict';

/**
 * Which artist pages go in the public sitemap. Every public artist, radio and
 * editorial profile is listed: no content minimum and nothing to do with
 * payments. Only bands whose owner account is blocked (the existing signal
 * for accounts identified as abusive) are left out. Pure, so it's testable.
 */
function sitemapEntries(bands) {
  const seen = new Set();
  const entries = [];
  for (const band of bands || []) {
    const slug = typeof band?.slug === 'string' ? band.slug.trim() : '';
    if (!slug || seen.has(slug)) continue;
    if (band.users_permissions_user?.blocked === true) continue;
    seen.add(slug);
    entries.push({ slug, updatedAt: band.updatedAt || null });
  }
  return entries;
}

module.exports = { sitemapEntries };
