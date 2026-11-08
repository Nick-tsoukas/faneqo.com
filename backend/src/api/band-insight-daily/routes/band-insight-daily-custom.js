"use strict";

module.exports = {
  // auth: false keeps ctx.state.user optional; each handler requires viewAnalytics
  // on the band (analyticsAccess). The query-echo /band-insights-daily/debug was removed.
  routes: [
    {
      method: "GET",
      path: "/band-insights-daily/compute",
      handler: "band-insight-daily.compute",
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: "GET",
      path: "/muse",
      handler: "band-insight-daily.muse",
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: "GET",
      path: "/muse/backfill",
      handler: "band-insight-daily.backfill",
      config: { auth: false },
    },
    {
      method: "GET",
      path: "/muse/insights",
      handler: "band-insight-daily.insightsV2",
      config: { auth: false },
    },
  ],
};
