"use strict";

module.exports = {
  routes: [
    {
      method: "POST",
      path: "/bands/:id/payments/onboard",
      handler: "payments.onboard",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
    {
      method: "GET",
      path: "/bands/:id/payments/status",
      handler: "payments.status",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
    {
      method: "GET",
      path: "/bands/:id/payments/summary",
      handler: "payments.summary",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
    {
      method: "GET",
      path: "/bands/:id/payments/report",
      handler: "payments.report",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
    {
      method: "GET",
      path: "/bands/:id/payments/transactions",
      handler: "payments.transactions",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
    {
      method: "GET",
      path: "/bands/:id/payments/export",
      handler: "payments.exportCsv",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
    {
      method: "GET",
      path: "/bands/:id/payments/transactions/:transactionId",
      handler: "payments.transaction",
      config: {
        policies: [
          "plugin::users-permissions.isAuthenticated",
          "api::band.owns-band",
        ],
      },
    },
  ],
};
