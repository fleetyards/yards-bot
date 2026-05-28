import { describe, expect, it, vi } from "vitest";
import type { Config, Verification } from "../src/config.js";
import { sweepAll } from "../src/scheduler.js";
import type { DiscordRestLike } from "../src/sweep.js";

function verification(name: string, message_id: string): Verification {
  return {
    name,
    guild_id: "1000000000000000001",
    channel_id: "1000000000000000002",
    message_id,
    emoji: "✅",
    role_id: "1000000000000000004",
    on_remove: "keep",
  };
}

function mockRest(overrides: Partial<DiscordRestLike> = {}): DiscordRestLike {
  return {
    listReactors: vi.fn().mockResolvedValue([]),
    getMember: vi.fn().mockResolvedValue(null),
    addMemberRole: vi.fn().mockResolvedValue(undefined),
    removeMemberRole: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function configWith(verifications: Verification[]): Config {
  return {
    verifications,
    sweep: { on_startup: false, cron: "0 */6 * * *" },
  };
}

describe("sweepAll", () => {
  it("runs sweep for each verification", async () => {
    const cfg = configWith([
      verification("a", "1000000000000000003"),
      verification("b", "1000000000000000005"),
    ]);
    const rest = mockRest();
    await sweepAll(cfg, rest);
    expect(rest.listReactors).toHaveBeenCalledTimes(2);
  });

  it("continues to next verification when one throws", async () => {
    const cfg = configWith([
      verification("a", "1000000000000000003"),
      verification("b", "1000000000000000005"),
    ]);
    const rest = mockRest({
      listReactors: vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue([]),
    });
    await sweepAll(cfg, rest);
    expect(rest.listReactors).toHaveBeenCalledTimes(2);
  });

  it("no-ops on an empty-verification config (shouldn't happen, but doesn't crash)", async () => {
    // The zod schema rejects empty arrays at parse time, so this only matters
    // if a future caller constructs Config in-memory; just confirm no throw.
    const cfg: Config = {
      verifications: [],
      sweep: { on_startup: false, cron: "0 */6 * * *" },
    };
    const rest = mockRest();
    await expect(sweepAll(cfg, rest)).resolves.toBeUndefined();
    expect(rest.listReactors).not.toHaveBeenCalled();
  });
});
