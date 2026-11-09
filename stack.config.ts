import { defineStackrunConfig } from "stackrun";

const stagingStrapiPort =
  process.env.STAGING_STRAPI_PORT ||
  process.env.STRAPI_PORT ||
  "1337";
const stagingNuxtPort =
  process.env.STAGING_NUXT_PORT || process.env.NUXT_PORT || "3000";

export default defineStackrunConfig({
  // No global before/after — overlays own compose lifecycle (Architecture G).
  $development: {
    before: ["docker compose up -d postgres"],
    after: ["docker compose stop"],
    commands: [
      {
        name: "backend",
        // Host Node from root mise (.env NODE_VERSION); stackrun already passes env into commands.
        run: "npm install && npm run develop",
        cwd: "backend",
        color: "green",
        env: { STRAPI_PORT: process.env.STRAPI_PORT || "1337" },
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.STRAPI_PORT || "1337"}`,
        //   public: process.env.API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        run: "npm install && npm run dev",
        cwd: "frontend",
        color: "blue",
        env: { NUXT_PORT: process.env.NUXT_PORT || "3000" },
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.NUXT_PORT || "3000"}`,
        //   public: process.env.WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
  $staging: {
    // Build on host, then stock-Node containers mount artifacts (--profile staging).
    before: [
      "npm install --prefix backend && npm install --prefix frontend && npm run build",
      "docker compose --profile staging up -d",
    ],
    after: ["docker compose --profile staging stop"],
    commands: [
      {
        name: "backend",
        run: "docker compose --profile staging logs -f backend",
        color: "green",
        env: { STRAPI_PORT: stagingStrapiPort },
        // tunnel: {
        //   local: `http://127.0.0.1:${stagingStrapiPort}`,
        //   public: process.env.STAGING_API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        run: "docker compose --profile staging logs -f frontend",
        color: "blue",
        env: { NUXT_PORT: stagingNuxtPort },
        // tunnel: {
        //   local: `http://127.0.0.1:${stagingNuxtPort}`,
        //   public: process.env.STAGING_WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
});
