import type { Verification } from "./config.js";
import { logger } from "./logger.js";

export interface SweepResult {
  reactors: number;
  granted: number;
  alreadyHadRole: number;
  notInGuild: number;
  errors: number;
}

export interface Reactor {
  id: string;
  username: string;
}

export interface MemberInfo {
  id: string;
  roles: readonly string[];
}

export interface DiscordRestLike {
  listReactors(opts: {
    channelId: string;
    messageId: string;
    emoji: string;
    after?: string;
    limit?: number;
  }): Promise<Reactor[]>;
  // Returns null when the user is not a member of the guild.
  getMember(opts: { guildId: string; userId: string }): Promise<MemberInfo | null>;
  addMemberRole(opts: { guildId: string; userId: string; roleId: string }): Promise<void>;
  removeMemberRole(opts: { guildId: string; userId: string; roleId: string }): Promise<void>;
}

const PAGE_SIZE = 100;

export async function runSweep(rest: DiscordRestLike, v: Verification): Promise<SweepResult> {
  const result: SweepResult = {
    reactors: 0,
    granted: 0,
    alreadyHadRole: 0,
    notInGuild: 0,
    errors: 0,
  };

  const reactors = await collectReactors(rest, v);
  result.reactors = reactors.length;

  for (const reactor of reactors) {
    const outcome = await processReactor(rest, v, reactor);
    if (outcome === "granted") result.granted += 1;
    else if (outcome === "already") result.alreadyHadRole += 1;
    else if (outcome === "notInGuild") result.notInGuild += 1;
    else result.errors += 1;
  }

  return result;
}

async function collectReactors(rest: DiscordRestLike, v: Verification): Promise<Reactor[]> {
  const all: Reactor[] = [];
  let after: string | undefined;
  let done = false;
  while (!done) {
    const page = await rest.listReactors({
      channelId: v.channel_id,
      messageId: v.message_id,
      emoji: v.emoji,
      ...(after === undefined ? {} : { after }),
      limit: PAGE_SIZE,
    });
    all.push(...page);
    if (page.length < PAGE_SIZE) {
      done = true;
    } else {
      after = page[page.length - 1]?.id;
    }
  }
  return all;
}

type Outcome = "granted" | "already" | "notInGuild" | "error";

async function processReactor(
  rest: DiscordRestLike,
  v: Verification,
  reactor: Reactor,
): Promise<Outcome> {
  let member: MemberInfo | null;
  try {
    member = await rest.getMember({ guildId: v.guild_id, userId: reactor.id });
  } catch (err) {
    logger.error(
      { err, verification: v.name, userId: reactor.id, username: reactor.username },
      "sweep: failed to fetch member",
    );
    return "error";
  }
  if (!member) return "notInGuild";
  if (member.roles.includes(v.role_id)) return "already";

  try {
    await rest.addMemberRole({
      guildId: v.guild_id,
      userId: reactor.id,
      roleId: v.role_id,
    });
    logger.info(
      {
        verification: v.name,
        userId: reactor.id,
        username: reactor.username,
        roleId: v.role_id,
      },
      "sweep: granted role",
    );
    return "granted";
  } catch (err) {
    logger.error(
      { err, verification: v.name, userId: reactor.id, username: reactor.username },
      "sweep: failed to add role",
    );
    return "error";
  }
}
