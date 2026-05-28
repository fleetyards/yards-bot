import cron, { type ScheduledTask } from "node-cron";
import type { Config } from "./config.js";
import { logger } from "./logger.js";
import { type DiscordRestLike, runSweep } from "./sweep.js";

export async function sweepAll(cfg: Config, rest: DiscordRestLike): Promise<void> {
  for (const v of cfg.verifications) {
    try {
      const result = await runSweep(rest, v);
      logger.info({ verification: v.name, ...result }, "sweep complete");
    } catch (err) {
      logger.error({ err, verification: v.name }, "sweep failed");
    }
  }
}

export function scheduleSweep(cfg: Config, rest: DiscordRestLike): ScheduledTask {
  return cron.schedule(cfg.sweep.cron, async () => {
    logger.info({ cron: cfg.sweep.cron }, "scheduled sweep starting");
    await sweepAll(cfg, rest);
  });
}
