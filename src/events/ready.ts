import { type Client, Events } from "discord.js";
import type { Config } from "../config.js";
import { logger } from "../logger.js";
import { type DiscordRestLike, runSweep } from "../sweep.js";

export function registerReady(client: Client, cfg: Config, rest: DiscordRestLike): void {
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

    if (!cfg.sweep.on_startup) return;

    for (const v of cfg.verifications) {
      try {
        const result = await runSweep(rest, v);
        logger.info({ verification: v.name, ...result }, "sweep complete");
      } catch (err) {
        logger.error({ err, verification: v.name }, "sweep failed");
      }
    }
  });
}
