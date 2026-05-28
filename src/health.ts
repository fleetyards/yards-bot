import { type Server, createServer } from "node:http";
import { logger } from "./logger.js";

export interface HealthState {
  gatewayReady: boolean;
}

export function createHealthState(): HealthState {
  return { gatewayReady: false };
}

export function createHealthServer(state: HealthState, port: number): Server {
  const server = createServer((req, res) => {
    if (req.method !== "GET" || req.url !== "/healthz") {
      res.statusCode = 404;
      res.end();
      return;
    }
    const healthy = state.gatewayReady;
    res.statusCode = healthy ? 200 : 503;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: healthy, gatewayReady: state.gatewayReady }));
  });
  server.listen(port, () => {
    logger.info({ port }, "health server listening");
  });
  return server;
}
