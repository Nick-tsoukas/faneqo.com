'use strict';

/**
 * No routes. `GET /api/image-proxy` is owned by `analytics.imageProxy`
 * (src/api/analytics/routes/analytics.js), which validates the destination,
 * bounds the upstream response, and revalidates every redirect.
 *
 * This API used to register a second, duplicate `GET /image-proxy` bound to
 * `image-proxy.proxy`. That handler matched hosts with `includes()`, allowed
 * localhost, followed redirects implicitly, and had no timeout or byte cap.
 * The route is unregistered so only the hardened handler is reachable; the
 * controller and content type remain on disk but are dead HTTP surface.
 *
 * Do not re-add a route here. scripts/test-image-proxy-guard.js asserts that
 * exactly one GET /image-proxy exists and that it maps to analytics.imageProxy.
 */

module.exports = {
  routes: [],
};
