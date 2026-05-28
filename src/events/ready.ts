import { type Client, Events } from "discord.js";
import type { Config } from "../config.js";
import type { HealthState } from "../health.js";
import { logger } from "../logger.js";
import { scheduleSweep, sweepAll } from "../scheduler.js";
import type { DiscordRestLike } from "../sweep.js";

export function registerReady(
  client: Client,
  cfg: Config,
  rest: DiscordRestLike,
  health: HealthState,
): void {
  client.once(Events.ClientReady, async (readyClient) => {
    const guilds = readyClient.guilds.cache.map((g) => ({ id: g.id, name: g.name }));
    logger.info(
      {
        bot: readyClient.user.tag,
        guildCount: guilds.length,
        guilds,
        verificationsConfigured: cfg.verifications.length,
      },
      "ready",
    );

    health.gatewayReady = true;

    if (cfg.sweep.on_startup) {
      await sweepAll(cfg, rest);
    }

    scheduleSweep(cfg, rest);
    logger.info({ cron: cfg.sweep.cron }, "cron sweep scheduled");
  });
}
