import { type Client, Events } from "discord.js";
import type { Config } from "../config.js";
import { logger } from "../logger.js";

export function registerReady(client: Client, cfg: Config): void {
  client.once(Events.ClientReady, (readyClient) => {
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
  });
}
