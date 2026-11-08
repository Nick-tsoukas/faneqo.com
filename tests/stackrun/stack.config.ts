import { defineStackrunConfig } from "stackrun";
import root from "../../stack.config.ts";

/** Echo every key from a command's env map so check.sh can grep values. */
function echoEnv(env: Record<string, unknown> | undefined): string {
  const keys = Object.keys(env ?? {});
  if (keys.length === 0) return "echo ok";
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
