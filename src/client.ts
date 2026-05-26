import { Client, GatewayIntentBits } from "discord.js";

// Step 3 only needs the `Guilds` intent to log a list of connected guilds on READY.
// Reaction handlers (step 5) will add `GuildMessageReactions` and the privileged
// `GuildMembers` intent (which must be toggled in the Discord Developer Portal),
// along with the `Message`/`Channel`/`Reaction` partials needed for old messages.
export function createClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds],
  });
}
