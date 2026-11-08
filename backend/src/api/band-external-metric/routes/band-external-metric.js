'use strict';

/**
 * RETIRED — this HTTP surface is permanently unregistered.
 *
 * Every route here was `auth: false`, so anyone could read, poison, or delete
 * any band's external platform metrics:
 *
 *   GET    /band-external-metrics/latest
 *   POST   /band-external-metrics/upsert
 *   GET    /band-external-metrics
 *   GET    /band-external-metrics/:id
 *   POST   /band-external-metrics
 *   PUT    /band-external-metrics/:id
 *   DELETE /band-external-metrics/:id
 *
 * `upsert` in particular accepted `{ bandId, provider, date, normalizedData }`
 * from an anonymous body and wrote it straight onto that band, which let an
 * outsider fabricate the numbers an artist sees in Muse/external intelligence.
 *
 * Nothing calls these over HTTP. The producers are server-side
 * (`src/api/youtube/**`, `src/api/muse/**`) and use `strapi.entityService`
 * against `api::band-external-metric.band-external-metric` directly.
 *
 * The `upsert` and `latest` handlers were kept (they hold real logic) but now
 * require an authenticated caller with band access, so re-registering a route
 * cannot silently reopen the hole. Any restored read route must also be
 * band-scoped — generic core `find` spans all bands.
 */
module.exports = {
  routes: [],
};
