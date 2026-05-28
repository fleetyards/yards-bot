import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type HealthState, createHealthServer, createHealthState } from "../src/health.js";

let state: HealthState;
let server: ReturnType<typeof createHealthServer>;
let baseUrl: string;

beforeEach(async () => {
  state = createHealthState();
  server = createHealthServer(state, 0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("health server", () => {
  it("returns 503 when the gateway is not ready", async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { ok: boolean; gatewayReady: boolean };
    expect(body).toEqual({ ok: false, gatewayReady: false });
  });

  it("returns 200 once gatewayReady flips true", async () => {
    state.gatewayReady = true;
    const res = await fetch(`${baseUrl}/healthz`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; gatewayReady: boolean };
    expect(body).toEqual({ ok: true, gatewayReady: true });
  });

  it("returns 404 for unknown paths", async () => {
    const res = await fetch(`${baseUrl}/other`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for non-GET requests on /healthz", async () => {
    const res = await fetch(`${baseUrl}/healthz`, { method: "POST" });
    expect(res.status).toBe(404);
  });
});
