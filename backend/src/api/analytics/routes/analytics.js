"use strict";

/**
 * Analytics routes.
 *
 * `PRIVATE` = an artist's own performance data (visitor geography, page views,
 * link clicks, scans, follows, momentum). These require an authenticated caller
 * who holds `viewAnalytics` on the band that owns the entity being asked about.
 * The id in the query string selects the subject; it never grants access.
 * Authorization lives in the controller via src/api/analytics/services/analyticsAccess.js.
 *
 * No GET here may mutate state. `pulse` used to write a `pulse-snapshot` row
 * and create `notification` rows as a side effect; that work moved to
 * src/api/analytics/services/pulseSnapshot.js and runs on the daily cron.
 *
 * `PUBLIC` — the complete reviewed list. Every entry is either anonymous
 * tracking ingestion or a non-sensitive asset helper. Adding to this list is a
 * security decision; scripts/test-public-route-lockdown.js pins the exact set.
 *
 *   POST /pulse/shareables/track
 *     Ingestion. A fan sharing from a public band page has no session, so the
 *     write must accept anonymous callers. Records only share telemetry
 *     (card type, placement, visitorId) against a bandId. Returns no artist
 *     data. Spoofable share counts are an accepted tradeoff for anonymous
 *     attribution; it exposes nothing.
 *
 *   GET /image-proxy
 *     Non-sensitive helper. Proxies a remote image so share cards can be
 *     rendered on a canvas without CORS failures, including on public band
 *     pages. Returns image bytes only, no database access.
 *
 *   POST /push/opt-in, GET /push/opt-in/status
 *     Fan-facing, and already self-authenticating: both handlers require
 *     `ctx.state.user` and act only on the caller's own record. Left off the
 *     `auth: false` list so the session is populated.
 */

const AUTHENTICATED = {
  policies: ["plugin::users-permissions.isAuthenticated"],
};

module.exports = {
  routes: [
    // Dashboard performance glance (authenticated: includes fan counts)
    {
      method: "GET",
      path: "/analytics/dashboard-glance",
      handler: "analytics.dashboardGlance",
      config: AUTHENTICATED,
    },
    // Band analytics — PRIVATE
    {
      method: "GET",
      path: "/analytics/rollups",
      handler: "analytics.rollups",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/geo",
      handler: "analytics.geo",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/transitions",
      handler: "analytics.transitions",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/follows",
      handler: "analytics.follows",
      config: AUTHENTICATED,
    },
    // Event analytics — PRIVATE (band resolved from the event)
    {
      method: "GET",
      path: "/analytics/event-rollups",
      handler: "analytics.eventRollups",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/event-geo",
      handler: "analytics.eventGeo",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/event-sources",
      handler: "analytics.eventSources",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/event-devices",
      handler: "analytics.eventDevices",
      config: AUTHENTICATED,
    },
    // QR analytics — PRIVATE (band resolved from the QR, legacy QR owner allowed)
    {
      method: "GET",
      path: "/analytics/qr-rollups",
      handler: "analytics.qrRollups",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/qr-geo",
      handler: "analytics.qrGeo",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/qr-sources",
      handler: "analytics.qrSources",
      config: AUTHENTICATED,
    },
    {
      method: "GET",
      path: "/analytics/qr-devices",
      handler: "analytics.qrDevices",
      config: AUTHENTICATED,
    },
    // MBQ Pulse — PRIVATE
    {
      method: "GET",
      path: "/analytics/pulse",
      handler: "analytics.pulse",
      config: AUTHENTICATED,
    },
    // Push dry-run (dev/debug) — PRIVATE
    {
      method: "GET",
      path: "/analytics/push/dry-run",
      handler: "analytics.pushDryRun",
      config: AUTHENTICATED,
    },
    // Push opt-in — PUBLIC (fan-facing)
    {
      method: "POST",
      path: "/push/opt-in",
      handler: "analytics.pushOptIn",
      config: { policies: [], middlewares: [] },
    },
    {
      method: "GET",
      path: "/push/opt-in/status",
      handler: "analytics.pushOptInStatus",
      config: { policies: [], middlewares: [] },
    },
    // Geo States (USA Heat Map) — PRIVATE
    {
      method: "GET",
      path: "/analytics/geo-states",
      handler: "analytics.geoStates",
      config: AUTHENTICATED,
    },
    // What's Hot / Momentum Prompts — PRIVATE (artist momentum data)
    {
      method: "GET",
      path: "/pulse/whats-hot",
      handler: "analytics.whatsHot",
      config: AUTHENTICATED,
    },
    // Shareables v1 - Unified Evaluator — PRIVATE (derived from artist momentum)
    {
      method: "GET",
      path: "/pulse/shareables",
      handler: "shareables.getShareables",
      config: AUTHENTICATED,
    },
    // Shareables v1 - Share Tracking — PUBLIC ingestion (anonymous fan shares)
    {
      method: "POST",
      path: "/pulse/shareables/track",
      handler: "shareables.trackShare",
      config: { auth: false },
    },
    // Image proxy for CORS-restricted images (S3, etc.) — PUBLIC
    {
      method: "GET",
      path: "/image-proxy",
      handler: "analytics.imageProxy",
      config: { auth: false },
    },
  ],
};
