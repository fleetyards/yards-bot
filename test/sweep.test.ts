import { describe, expect, it, vi } from "vitest";
import type { Verification } from "../src/config.js";
import { type DiscordRestLike, type Reactor, runSweep } from "../src/sweep.js";

const verification: Verification = {
  name: "test",
  guild_id: "1000000000000000001",
  channel_id: "1000000000000000002",
  message_id: "1000000000000000003",
  emoji: "✅",
  role_id: "1000000000000000004",
  on_remove: "keep",
};

function reactor(id: string): Reactor {
  return { id, username: `user${id}` };
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

describe("runSweep", () => {
  it("returns zeroed counts when no reactors", async () => {
    const result = await runSweep(mockRest(), verification);
    expect(result).toEqual({
      reactors: 0,
      granted: 0,
      alreadyHadRole: 0,
      notInGuild: 0,
      errors: 0,
    });
  });

  it("grants role to a reactor who doesn't have it", async () => {
    const rest = mockRest({
      listReactors: vi
        .fn()
        .mockResolvedValueOnce([reactor("1")])
        .mockResolvedValueOnce([]),
      getMember: vi.fn().mockResolvedValue({ id: "1", roles: [] }),
    });
    const result = await runSweep(rest, verification);
    expect(result.granted).toBe(1);
    expect(result.reactors).toBe(1);
    expect(rest.addMemberRole).toHaveBeenCalledWith({
      guildId: verification.guild_id,
      userId: "1",
      roleId: verification.role_id,
    });
  });

  it("skips a reactor who already has the role", async () => {
    const rest = mockRest({
      listReactors: vi
        .fn()
        .mockResolvedValueOnce([reactor("1")])
        .mockResolvedValueOnce([]),
      getMember: vi.fn().mockResolvedValue({ id: "1", roles: [verification.role_id] }),
    });
    const result = await runSweep(rest, verification);
    expect(result.alreadyHadRole).toBe(1);
    expect(result.granted).toBe(0);
    expect(rest.addMemberRole).not.toHaveBeenCalled();
  });

  it("counts reactors who left the guild", async () => {
    const rest = mockRest({
      listReactors: vi
        .fn()
        .mockResolvedValueOnce([reactor("1")])
        .mockResolvedValueOnce([]),
      getMember: vi.fn().mockResolvedValue(null),
    });
    const result = await runSweep(rest, verification);
    expect(result.notInGuild).toBe(1);
    expect(rest.addMemberRole).not.toHaveBeenCalled();
  });

  it("paginates through multiple pages", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => reactor(String(i + 1)));
    const page2 = [reactor("101"), reactor("102")];
    const listReactors = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2);
    const rest = mockRest({
      listReactors,
      getMember: vi.fn().mockResolvedValue({ id: "x", roles: [] }),
    });
    const result = await runSweep(rest, verification);
    expect(result.reactors).toBe(102);
    expect(result.granted).toBe(102);
    expect(listReactors).toHaveBeenCalledTimes(2);
    expect(listReactors.mock.calls[1]?.[0]).toMatchObject({ after: "100" });
  });

  it("stops paginating when an exact-multiple page is followed by an empty page", async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => reactor(String(i + 1)));
    const listReactors = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce([]);
    const rest = mockRest({
      listReactors,
      getMember: vi.fn().mockResolvedValue({ id: "x", roles: [verification.role_id] }),
    });
    const result = await runSweep(rest, verification);
    expect(result.reactors).toBe(100);
    expect(listReactors).toHaveBeenCalledTimes(2);
  });

  it("counts errors when getMember throws", async () => {
    const rest = mockRest({
      listReactors: vi
        .fn()
        .mockResolvedValueOnce([reactor("1")])
        .mockResolvedValueOnce([]),
      getMember: vi.fn().mockRejectedValue(new Error("boom")),
    });
    const result = await runSweep(rest, verification);
    expect(result.errors).toBe(1);
    expect(result.granted).toBe(0);
  });

  it("counts errors when addMemberRole throws", async () => {
    const rest = mockRest({
      listReactors: vi
        .fn()
        .mockResolvedValueOnce([reactor("1")])
        .mockResolvedValueOnce([]),
      getMember: vi.fn().mockResolvedValue({ id: "1", roles: [] }),
      addMemberRole: vi.fn().mockRejectedValue(new Error("forbidden")),
    });
    const result = await runSweep(rest, verification);
    expect(result.errors).toBe(1);
    expect(result.granted).toBe(0);
  });

  it("mixes outcomes across many reactors correctly", async () => {
    const reactors = [reactor("1"), reactor("2"), reactor("3"), reactor("4")];
    const rest = mockRest({
      listReactors: vi.fn().mockResolvedValueOnce(reactors).mockResolvedValueOnce([]),
      getMember: vi
        .fn()
        .mockResolvedValueOnce({ id: "1", roles: [] }) // grant
        .mockResolvedValueOnce({ id: "2", roles: [verification.role_id] }) // already
        .mockResolvedValueOnce(null) // not in guild
        .mockRejectedValueOnce(new Error("boom")), // error
    });
    const result = await runSweep(rest, verification);
    expect(result).toEqual({
      reactors: 4,
      granted: 1,
      alreadyHadRole: 1,
      notInGuild: 1,
      errors: 1,
    });
  });
});
