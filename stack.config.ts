import { defineStackrunConfig } from "stackrun";

// Port remaps only fed command env / tunnels. Both commented — children inherit
// STRAPI_PORT / NUXT_PORT from root .env (stackrun loads it). Restore with tunnels.
// const stagingStrapiPort =
//   process.env.STAGING_STRAPI_PORT ||
//   process.env.STRAPI_PORT ||
//   "1337";
// const stagingNuxtPort =
//   process.env.STAGING_NUXT_PORT || process.env.NUXT_PORT || "3000";

// Host dual Node (Task 3.9): FE/BE → NODE_VERSION via shell expansion from .env.
// Compose image tags use the same env vars (Architecture H / G). No command env wrappers.
const hostFrontendNode =
  "node@${FRONTEND_NODE_VERSION:-${NODE_VERSION}}";
const hostBackendNode =
  "node@${BACKEND_NODE_VERSION:-${NODE_VERSION}}";

export default defineStackrunConfig({
  // No global before/after — overlays own compose lifecycle (Architecture G).
  $development: {
    before: ["docker compose up -d postgres"],
    after: ["docker compose down postgres"],
    commands: [
      {
        name: "backend",
        // Host Node: BACKEND_NODE_VERSION → NODE_VERSION (Strapi engines ≤20.x).
        run: `mise exec ${hostBackendNode} -- sh -c 'npm install && npm run develop'`,
        cwd: "backend",
        color: "green",
        // Redundant: root .env STRAPI_PORT inherited by children.
        // env: { STRAPI_PORT: process.env.STRAPI_PORT || "1337" },
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.STRAPI_PORT || "1337"}`,
        //   public: process.env.API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        // Host Node: FRONTEND_NODE_VERSION → NODE_VERSION.
        run: `mise exec ${hostFrontendNode} -- sh -c 'npm install && npm run dev'`,
        cwd: "frontend",
        color: "blue",
        // Redundant: root .env NUXT_PORT inherited by children.
        // env: { NUXT_PORT: process.env.NUXT_PORT || "3000" },
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.NUXT_PORT || "3000"}`,
        //   public: process.env.WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
  $staging: {
    // Build on host with per-app Node, then stock-Node containers (all compose services).
    before: [
      `cd backend && mise exec ${hostBackendNode} -- npm install`,
      `cd frontend && mise exec ${hostFrontendNode} -- npm install`,
      `mise exec ${hostBackendNode} -- npm run build --prefix backend`,
      `mise exec ${hostFrontendNode} -- npm run build --prefix frontend`,
      "docker compose up -d",
    ],
    after: ["docker compose down"],
    commands: [
      {
        name: "backend",
        run: "docker compose logs -f backend",
        color: "green",
        // Redundant: root .env inheritance; STAGING_* ports belong to compose, not command env.
        // env: { STRAPI_PORT: stagingStrapiPort },
        // tunnel: {
        //   local: `http://127.0.0.1:${stagingStrapiPort}`,
        //   public: process.env.STAGING_API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        run: "docker compose logs -f frontend",
        color: "blue",
        // Redundant: root .env inheritance; STAGING_* ports belong to compose, not command env.
        // env: { NUXT_PORT: stagingNuxtPort },
        // tunnel: {
        //   local: `http://127.0.0.1:${stagingNuxtPort}`,
        //   public: process.env.STAGING_WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
});
