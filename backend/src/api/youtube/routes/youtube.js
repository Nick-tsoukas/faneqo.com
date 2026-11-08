"use strict";

module.exports = {
  // auth: false keeps ctx.state.user optional; every handler verifies the
  // caller itself and requires editBand on the band (analyticsAccess).
  // The /youtube/debug* routes were removed: they ran without login and one
  // returned a band's freshly refreshed Google access token.
  routes: [
    // 1. get google auth url
    {
      method: "GET",
      path: "/youtube/oauth/init",
      handler: "youtube.oauthInit",
      config: {
        auth: false,
      },
    },

    // 2. handle google callback (Nuxt will call this, not Google directly)
    {
      method: "POST",
      path: "/youtube/oauth/callback",
      handler: "youtube.oauthCallback",
      config: {
        auth: false,
      },
    },

    // 3. user had multiple channels, they picked one
    {
      method: "POST",
      path: "/youtube/select-channel",
      handler: "youtube.selectChannel",
      config: {
        auth: false,
      },
    },

    // 4. optional: manual re-sync for a band
    {
      method: "POST",
      path: "/youtube/sync",
      handler: "youtube.sync",
      config: {
        auth: false,
      },
    },
     {
      method: 'GET',
      path: '/youtube/sync',
      handler: 'youtube.sync',
      config: { auth: false },
    },
    {
      method: "POST",
      path: "/youtube/disconnect",
      handler: "youtube.disconnect",
      config: {
        auth: false,
      },
    },
    {
      method: "POST",
      path: "/youtube/purge",
      handler: "youtube.purge",
      config: {
        auth: false,
      },
    },

  ],
};
