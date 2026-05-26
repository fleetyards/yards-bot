import { readFileSync } from "node:fs";
import { validate as validateCron } from "node-cron";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const snowflake = z.string().regex(/^\d{17,20}$/, {
  message: "Must be a Discord snowflake ID (17-20 digits)",
});

const verification = z
  .object({
    name: z.string().min(1),
    guild_id: snowflake,
    channel_id: snowflake,
    message_id: snowflake,
    emoji: z.string().trim().min(1),
    role_id: snowflake,
    on_remove: z.enum(["revoke", "keep"]).default("keep"),
  })
  .strict();

const sweep = z
  .object({
    on_startup: z.boolean(),
    cron: z.string().refine((s) => validateCron(s), {
      message: "Must be a valid cron expression",
    }),
  })
  .strict();

export const configSchema = z
  .object({
    verifications: z.array(verification).min(1),
    sweep,
  })
  .strict()
  .superRefine((cfg, ctx) => {
    const seen = new Set<string>();
    for (const [i, v] of cfg.verifications.entries()) {
      if (seen.has(v.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["verifications", i, "name"],
          message: `Duplicate verification name "${v.name}"`,
        });
      }
      seen.add(v.name);
    }
  });

export type Config = z.infer<typeof configSchema>;
export type Verification = z.infer<typeof verification>;

export function parseConfig(input: string): Config {
  const data = parseYaml(input);
  return configSchema.parse(data);
}

export function loadConfig(path: string): Config {
  return parseConfig(readFileSync(path, "utf8"));
}
