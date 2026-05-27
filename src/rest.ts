import { DiscordAPIError, type REST, Routes } from "discord.js";
import type { DiscordRestLike, MemberInfo, Reactor } from "./sweep.js";

const UNKNOWN_MEMBER = 10007;

export function createDiscordRest(rest: REST): DiscordRestLike {
  return {
    async listReactors({ channelId, messageId, emoji, after, limit = 100 }) {
      const query = new URLSearchParams({ limit: String(limit) });
      if (after) query.set("after", after);
      const data = (await rest.get(
        Routes.channelMessageReaction(channelId, messageId, encodeURIComponent(emoji)),
        { query },
      )) as Array<{ id: string; username: string }>;
      return data.map<Reactor>((u) => ({ id: u.id, username: u.username }));
    },

    async getMember({ guildId, userId }) {
      try {
        const data = (await rest.get(Routes.guildMember(guildId, userId))) as {
          user: { id: string };
          roles: string[];
        };
        const member: MemberInfo = { id: data.user.id, roles: data.roles };
        return member;
      } catch (err) {
        if (err instanceof DiscordAPIError && err.code === UNKNOWN_MEMBER) return null;
        throw err;
      }
    },

    async addMemberRole({ guildId, userId, roleId }) {
      await rest.put(Routes.guildMemberRole(guildId, userId, roleId));
    },

    async removeMemberRole({ guildId, userId, roleId }) {
      await rest.delete(Routes.guildMemberRole(guildId, userId, roleId));
    },
  };
}
