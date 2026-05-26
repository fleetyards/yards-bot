import { loadConfig } from "./config.js";

function main(): void {
  const path = process.env.CONFIG_PATH ?? "config/verifications.yaml";
  const cfg = loadConfig(path);
  console.log(`Loaded config from ${path}`);
  console.log(`  ${cfg.verifications.length} verification(s):`);
  for (const v of cfg.verifications) {
    console.log(
      `    - ${v.name}: guild=${v.guild_id} message=${v.message_id} emoji=${v.emoji} role=${v.role_id} on_remove=${v.on_remove}`,
    );
  }
  console.log(`  sweep: on_startup=${cfg.sweep.on_startup} cron='${cfg.sweep.cron}'`);
}

main();
