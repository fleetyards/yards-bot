import {
  type Client,
  Events,
  type MessageReaction,
  type PartialMessageReaction,
  type PartialUser,
  type User,
} from "discord.js";
import type { Config } from "../config.js";
import { logger } from "../logger.js";
import type { DiscordRestLike } from "../sweep.js";
import { emojiToString, findMatchingVerification } from "./shared.js";

export function registerReactionAdd(client: Client, cfg: Config, rest: DiscordRestLike): void {
  client.on(Events.MessageReactionAdd, (reaction, user) => {
    void handleReactionAdd(cfg, rest, reaction, user);
  });
}

async function handleReactionAdd(
  cfg: Config,
  rest: DiscordRestLike,
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser,
): Promise<void> {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();
  } catch (err) {
    logger.error({ err }, "reactionAdd: failed to fetch reaction");
    return;
  }

  const { message } = reaction;
  const guildId = message.guildId;
  if (!guildId) return;

  const verification = findMatchingVerification(cfg.verifications, {
    guildId,
    channelId: message.channelId,
    messageId: message.id,
    emoji: emojiToString(reaction.emoji),
  });
  if (!verification) return;

  logger.debug(
    { verification: verification.name, userId: user.id, username: user.username ?? null },
    "reactionAdd: matched",
  );

  try {
    const member = await rest.getMember({ guildId, userId: user.id });
    if (!member) {
      logger.warn(
        { verification: verification.name, userId: user.id },
        "reactionAdd: user not in guild",
      );
      return;
    }
    if (member.roles.includes(verification.role_id)) {
      logger.debug(
        { verification: verification.name, userId: user.id },
        "reactionAdd: already has role",
      );
      return;
    }
    await rest.addMemberRole({ guildId, userId: user.id, roleId: verification.role_id });
    logger.info(
      { verification: verification.name, userId: user.id, username: user.username ?? null },
      "reactionAdd: granted role",
    );
  } catch (err) {
    logger.error(
      { err, verification: verification.name, userId: user.id },
      "reactionAdd: failed to grant role",
    );
  }
}
