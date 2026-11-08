'use strict';

// Merch Concierge (physical pickup) is discontinued. Its public checkout is
// not routed: it was an anonymous payment path on connected accounts with
// none of the band checkout's card-testing limits, and its `enabled` flag is
// band-controlled. Production had 0 enabled bands and 0 orders (2026-11-03).
// The controller and order records stay for history; do not re-route.
module.exports = {
  routes: [],
};
