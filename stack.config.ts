import { defineStackrunConfig } from "stackrun";

export default defineStackrunConfig({
  before: ["docker compose up -d"],
  after: ["docker compose stop"],
  $development: {
    commands: [
      {
        name: "backend",
        run: "npm install && npm run develop",
        cwd: "backend",
        color: "green",
        env: { STRAPI_PORT: process.env.STRAPI_PORT ?? "1337" },
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.STRAPI_PORT ?? "1337"}`,
        //   public: process.env.API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        run: "npm install && npm run dev",
        cwd: "frontend",
        color: "blue",
        env: { NUXT_PORT: process.env.NUXT_PORT ?? "3000" },
        // tunnel: {
        //   local: `http://127.0.0.1:${process.env.NUXT_PORT ?? "3000"}`,
        //   public: process.env.WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
  $staging: {
    commands: [
      {
        name: "backend",
        run: "npm run develop",
        cwd: "backend",
        color: "green",
        env: {
          STRAPI_PORT:
            process.env.STAGING_STRAPI_PORT ??
            process.env.STRAPI_PORT ??
            "1337",
        },
        // tunnel: {
        //   local: `http://127.0.0.1:${
        //     process.env.STAGING_STRAPI_PORT ??
        //     process.env.STRAPI_PORT ??
        //     "1337"
        //   }`,
        //   public: process.env.STAGING_API_PUBLIC ?? undefined,
        // },
      },
      {
        name: "frontend",
        run: "npm run dev",
        cwd: "frontend",
        color: "blue",
        env: {
          NUXT_PORT:
            process.env.STAGING_NUXT_PORT ?? process.env.NUXT_PORT ?? "3000",
        },
        // tunnel: {
        //   local: `http://127.0.0.1:${
        //     process.env.STAGING_NUXT_PORT ?? process.env.NUXT_PORT ?? "3000"
        //   }`,
        //   public: process.env.STAGING_WEB_PUBLIC ?? undefined,
        // },
      },
    ],
  },
});
