import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-opus-5-5";

/** USD per million tokens. Used for cost monitoring only. */
const PRICES: Record<string, { input: number; output: number; cacheRead: number; cacheWrite: number }> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01, cacheWrite: 0.125 },
};

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function anthropic() {
  return new Anthropic({ maxRetries: 2, timeout: 90_000 });
}

export interface AiUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
  latencyMs: number;
}

interface UsageLike {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Token counts and estimated cost for one response. */
export function usageFrom(model: string, u: UsageLike, startedAt: number): AiUsage {
  const price = PRICES[model];
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  return {
    model,
    inputTokens: u.input_tokens + cacheRead + cacheWrite,
    outputTokens: u.output_tokens,
    costUsd: price
      ? (u.input_tokens * price.input + cacheRead * price.cacheRead + cacheWrite * price.cacheWrite + u.output_tokens * price.output) / 1_000_000
      : null,
    latencyMs: Date.now() - startedAt,
  };
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly kind: "refusal" | "truncated" | "unparseable" | "api",
    readonly usage?: AiUsage,
  ) {
    super(message);
  }
}
