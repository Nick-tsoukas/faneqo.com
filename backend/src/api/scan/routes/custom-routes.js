'use strict';

/**
 * Custom routes for scan
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/scans/track',
      handler: 'scan.track',
      config: {
        auth: false,
        policies: [],
      },
    },
    // POST /scans/backfill was removed: a public bulk write with a caller-chosen limit.
    // Run the backfill from a maintenance script instead.
  ],
};
