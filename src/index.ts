import { createClient } from "./client.js";
import { loadConfig } from "./config.js";
import { loadEnv } from "./env.js";
import { registerReady } from "./events/ready.js";
import { logger } from "./logger.js";
import { createDiscordRest } from "./rest.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const cfg = loadConfig(env.CONFIG_PATH);
  logger.info(
    { configPath: env.CONFIG_PATH, verifications: cfg.verifications.length },
    "config loaded",
  );

  const client = createClient();
  const rest = createDiscordRest(client.rest);
  registerReady(client, cfg, rest);

  client.on("error", (err) => {
    logger.error({ err }, "client error");
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "shutting down");
    await client.destroy();
    process.exit(0);
  };
  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err: unknown) => {
  logger.fatal({ err }, "fatal error during startup");
  process.exit(1);
});
