/// <reference types="node" />
import { defineStackrunConfig, type StackrunConfig } from "stackrun";

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

// Runtime supports NODE_ENV overlays (`$development`, `$staging`, …).
// Published StackrunConfig only types a single layer — widen for file configs.
type StackrunFileConfig = StackrunConfig & {
  $development?: StackrunConfig;
  $staging?: StackrunConfig;
};

const config: StackrunFileConfig = {
  // Architecture G: compose is staging-only. Dev = host hot reload + SQLite (no Docker).
  $development: {
    commands: [
      {
        name: "backend",
        // Host Node: BACKEND_NODE_VERSION → NODE_VERSION (Strapi engines ≤20.x).
        run: `mise exec ${hostBackendNode} -- sh -c 'npm run develop'`,
        cwd: "backend",
        color: "green",
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.STRAPI_PORT || "1337"}`,
        //   public: process.env.API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        // Host Node: FRONTEND_NODE_VERSION → NODE_VERSION.
        run: `mise exec ${hostFrontendNode} -- sh -c 'npm run dev'`,
        cwd: "frontend",
        color: "blue",
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.NUXT_PORT || "3000"}`,
        //   public: process.env.WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
  $staging: {
    before: [
      `sh -c 'mise exec ${hostBackendNode} -- npm install --prefix backend'`,
      `sh -c 'mise exec ${hostBackendNode} -- npm run build --prefix backend'`,
      `sh -c 'mise exec ${hostFrontendNode} -- npm install --prefix frontend'`,
      `sh -c 'mise exec ${hostFrontendNode} -- npm run build --prefix frontend'`
    ],
    commands: [
      {
        name: "postgress",
        run: `docker compose up postgres --no-log-prefix`,
        color: "green",
      },
      {
        name: "backend",
        run: `docker compose up backend --no-log-prefix`,
        color: "green",
      },
      {
        name: "frontend",
        run: `docker compose up frontend --no-log-prefix`,
        color: "blue",
      },
    ],
  },
};

export default defineStackrunConfig(config);
