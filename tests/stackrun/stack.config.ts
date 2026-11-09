import { defineStackrunConfig } from "stackrun";
import root from "../../stack.config.ts";

/**
 * Echo inherited ports when command has no env map (ports live in root .env).
 * If a command still sets env keys, echo those instead so regressions show up.
 */
function echoEnv(env: Record<string, unknown> | undefined): string {
  const keys = Object.keys(env ?? {});
  if (keys.length === 0) {
    return 'echo "no-command-env" "STRAPI_PORT=$STRAPI_PORT" "NUXT_PORT=$NUXT_PORT"';
  }
  return `echo ${keys.map((k) => `${k}=$${k}`).join(" ")}`;
}

/**
 * Load root stack.config.ts overlays, drop docker hooks / tunnels / real
 * FE+BE commands. Env selection stays whatever root already computed.
 */
function forTest(config: Record<string, unknown>) {
  const overlays: Record<string, { commands: unknown[] }> = {};
  for (const [key, layer] of Object.entries(config)) {
    if (!key.startsWith("$") || !layer || typeof layer !== "object") continue;
    const commands = (layer as { commands?: unknown[] }).commands;
    if (!Array.isArray(commands)) continue;
    overlays[key] = {
      commands: commands.map((raw) => {
        const cmd = raw as {
          name?: string;
          env?: Record<string, unknown>;
        };
        return {
          name: cmd.name,
          run: echoEnv(cmd.env),
          env: cmd.env ? { ...cmd.env } : undefined,
        };
      }),
    };
  }
  return defineStackrunConfig(overlays);
}

export default forTest(root as Record<string, unknown>);
