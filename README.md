# yards-bot

Discord bot for the [Fleetyards](https://fleetyards.net) community server.

## Scope

**Single-tenant.** This bot is built for the Fleetyards Discord only. The Discord application has `bot_public: false`, so it cannot be added to other servers, and the config hardcodes Fleetyards-specific guild/channel/message/role IDs anyway.

Anything we want to make available to other Star Citizen servers (slash-command ship lookups, hangar lookups, release announcements via webhook, etc.) belongs in a separate, public, multi-tenant bot — not yet started. yards-bot's scope is verification, role management, and other Fleetyards-only mod/admin work.

## Status

v0.1 — scaffold only. See [`docs/exec-plans/v1.md`](docs/exec-plans/v1.md) for the v1 design and feature scope.

## Stack

- Node 22 LTS, TypeScript (strict)
- [discord.js](https://discord.js.org) v14
- pnpm, Biome, vitest, pino, zod

## Local development

```sh
pnpm install
cp .env.example .env                       # fill in DISCORD_TOKEN
cp config/verifications.example.yaml config/verifications.yaml
pnpm dev
```

## Scripts

| Command          | What it does                            |
| ---------------- | --------------------------------------- |
| `pnpm dev`       | Watch mode with `tsx`                   |
| `pnpm build`     | Compile to `dist/`                      |
| `pnpm start`     | Run compiled output                     |
| `pnpm lint`      | Biome check                             |
| `pnpm typecheck` | `tsc --noEmit`                          |
| `pnpm test`      | vitest                                  |

## Required bot permissions

The bot needs `View Channel`, `Read Message History`, and `Manage Roles` on the target guild. Its top role must sit **above** any role it grants — Discord silently rejects role changes otherwise.

No privileged intents are required. v1 uses `Guilds` + `GuildMessageReactions` and fetches members on demand via REST, so the `Server Members Intent` does not need to be enabled.

## Deployment

Single instance. Do not scale this service horizontally — duplicate gateway connections will produce duplicate role grants. Deploy details land alongside the v1 implementation.

## License

GPL-3.0-or-later — see [`LICENSE`](LICENSE).
