import { describe, expect, it } from "vitest";
import { parseConfig } from "../src/config.js";

const validYaml = `
verifications:
  - name: rules
    guild_id: "1000000000000000001"
    channel_id: "1000000000000000002"
    message_id: "1000000000000000003"
    emoji: "✅"
    role_id: "1000000000000000004"
    on_remove: revoke
sweep:
  on_startup: true
  cron: "0 */6 * * *"
`;

describe("parseConfig", () => {
  it("parses a valid config", () => {
    const cfg = parseConfig(validYaml);
    expect(cfg.verifications).toHaveLength(1);
    expect(cfg.verifications[0]?.name).toBe("rules");
    expect(cfg.verifications[0]?.on_remove).toBe("revoke");
    expect(cfg.sweep.cron).toBe("0 */6 * * *");
  });

  it("defaults on_remove to 'keep' when omitted", () => {
    const cfg = parseConfig(validYaml.replace("    on_remove: revoke\n", ""));
    expect(cfg.verifications[0]?.on_remove).toBe("keep");
  });

  it("rejects a non-snowflake guild_id", () => {
    expect(() => parseConfig(validYaml.replace("1000000000000000001", "abc"))).toThrow(/snowflake/);
  });

  it("rejects an invalid cron expression", () => {
    expect(() => parseConfig(validYaml.replace("0 */6 * * *", "not a cron"))).toThrow(/cron/);
  });

  it("rejects an empty verifications array", () => {
    const yaml = `verifications: []\nsweep:\n  on_startup: true\n  cron: "0 */6 * * *"\n`;
    expect(() => parseConfig(yaml)).toThrow();
  });

  it("rejects duplicate verification names", () => {
    const yaml = `
verifications:
  - name: dup
    guild_id: "1000000000000000001"
    channel_id: "1000000000000000002"
    message_id: "1000000000000000003"
    emoji: "✅"
    role_id: "1000000000000000004"
  - name: dup
    guild_id: "1000000000000000001"
    channel_id: "1000000000000000002"
    message_id: "1000000000000000005"
    emoji: "❌"
    role_id: "1000000000000000004"
sweep:
  on_startup: true
  cron: "0 */6 * * *"
`;
    expect(() => parseConfig(yaml)).toThrow(/Duplicate/);
  });

  it("rejects unknown top-level fields", () => {
    expect(() => parseConfig(`${validYaml}extra: hello\n`)).toThrow();
  });

  it("rejects unknown verification fields", () => {
    const yaml = validYaml.replace(
      "    on_remove: revoke",
      "    on_remove: revoke\n    unknown_field: true",
    );
    expect(() => parseConfig(yaml)).toThrow();
  });
});
