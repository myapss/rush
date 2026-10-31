import "server-only";
import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import type { BillingConfig } from "./config";

let client: Paddle | undefined;

export function paddleClient(config: BillingConfig): Paddle {
  client ??= new Paddle(config.PADDLE_API_KEY, {
    environment: config.PADDLE_ENVIRONMENT === "production" ? Environment.production : Environment.sandbox,
  });
  return client;
}
