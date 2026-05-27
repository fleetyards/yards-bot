import { Client, GatewayIntentBits, Partials } from "discord.js";

export function createClient(): Client {
  return new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessageReactions],
    // Partials let the bot receive reaction events on messages older than its uptime.
    // Partials.User is required for MessageReactionRemove on uncached users — the gateway
    // payload only contains user_id, not the full user/member object that the add event ships.
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  });
}
