import { describe, expect, it } from "vitest";
import type { Verification } from "../../src/config.js";
import { emojiToString, findMatchingVerification } from "../../src/events/shared.js";

const baseV: Verification = {
  name: "v1",
  guild_id: "g",
  channel_id: "c",
  message_id: "m",
  emoji: "✅",
  role_id: "r",
  on_remove: "keep",
};

describe("emojiToString", () => {
  it("returns the name for a unicode emoji", () => {
    expect(emojiToString({ name: "✅", id: null })).toBe("✅");
  });

  it("returns 'name:id' for a custom emoji", () => {
    expect(emojiToString({ name: "thumbsup", id: "123" })).toBe("thumbsup:123");
  });

  it("falls back to '_' when a custom emoji has no name", () => {
    expect(emojiToString({ name: null, id: "123" })).toBe("_:123");
  });

  it("returns an empty string when both fields are null", () => {
    expect(emojiToString({ name: null, id: null })).toBe("");
  });
});

describe("findMatchingVerification", () => {
  const resolved = { guildId: "g", channelId: "c", messageId: "m", emoji: "✅" };

  it("returns the verification on an exact match", () => {
    expect(findMatchingVerification([baseV], resolved)).toBe(baseV);
  });

  it("returns undefined when guild differs", () => {
    expect(findMatchingVerification([baseV], { ...resolved, guildId: "other" })).toBeUndefined();
  });

  it("returns undefined when channel differs", () => {
    expect(findMatchingVerification([baseV], { ...resolved, channelId: "other" })).toBeUndefined();
  });

  it("returns undefined when message differs", () => {
    expect(findMatchingVerification([baseV], { ...resolved, messageId: "other" })).toBeUndefined();
  });

  it("returns undefined when emoji differs", () => {
    expect(findMatchingVerification([baseV], { ...resolved, emoji: "❌" })).toBeUndefined();
  });

  it("picks the right one out of several", () => {
    const v2: Verification = { ...baseV, name: "v2", message_id: "m2", emoji: "❌" };
    expect(
      findMatchingVerification([baseV, v2], { ...resolved, messageId: "m2", emoji: "❌" }),
    ).toBe(v2);
  });

  it("returns undefined on an empty list", () => {
    expect(findMatchingVerification([], resolved)).toBeUndefined();
  });
});
