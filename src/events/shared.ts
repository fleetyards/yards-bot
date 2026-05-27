import type { Verification } from "../config.js";

export interface ResolvedReaction {
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string;
}

export function emojiToString(emoji: { name: string | null; id: string | null }): string {
  // Custom emoji: "name:id"; unicode: the character itself.
  if (emoji.id) return `${emoji.name ?? "_"}:${emoji.id}`;
  return emoji.name ?? "";
}

export function findMatchingVerification(
  verifications: readonly Verification[],
  resolved: ResolvedReaction,
): Verification | undefined {
  return verifications.find(
    (v) =>
      v.guild_id === resolved.guildId &&
      v.channel_id === resolved.channelId &&
      v.message_id === resolved.messageId &&
      v.emoji === resolved.emoji,
  );
}
