import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/env.js";

describe("loadEnv", () => {
  it("parses a valid env", () => {
    const env = loadEnv({ DISCORD_TOKEN: "tok", LOG_LEVEL: "debug", CONFIG_PATH: "x.yaml" });
    expect(env.DISCORD_TOKEN).toBe("tok");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.CONFIG_PATH).toBe("x.yaml");
  });

  it("defaults LOG_LEVEL and CONFIG_PATH", () => {
    const env = loadEnv({ DISCORD_TOKEN: "tok" });
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.CONFIG_PATH).toBe("config/verifications.yaml");
  });

  it("rejects a missing DISCORD_TOKEN", () => {
    expect(() => loadEnv({})).toThrow(/DISCORD_TOKEN/);
  });

  it("rejects an invalid LOG_LEVEL", () => {
    expect(() => loadEnv({ DISCORD_TOKEN: "tok", LOG_LEVEL: "verbose" })).toThrow();
  });
});
