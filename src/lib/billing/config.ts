import "server-only";
import { z } from "zod";

const schema = z.object({
  PADDLE_API_KEY: z.string().min(1),
  PADDLE_WEBHOOK_SECRET: z.string().min(1),
  PADDLE_ENVIRONMENT: z.enum(["sandbox", "production"]).default("sandbox"),
  PADDLE_PRICE_MONTHLY_ID: z.string().startsWith("pri_"),
  PADDLE_PRICE_YEARLY_ID: z.string().startsWith("pri_"),
  NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().min(1),
});

export type BillingConfig = z.infer<typeof schema>;

/** Paddle settings, or null when billing isn't configured (e.g. local dev). */
export function billingConfig(): BillingConfig | null {
  const parsed = schema.safeParse({
    PADDLE_API_KEY: process.env.PADDLE_API_KEY,
    PADDLE_WEBHOOK_SECRET: process.env.PADDLE_WEBHOOK_SECRET,
    PADDLE_ENVIRONMENT: process.env.PADDLE_ENVIRONMENT || undefined,
    PADDLE_PRICE_MONTHLY_ID: process.env.PADDLE_PRICE_MONTHLY_ID,
    PADDLE_PRICE_YEARLY_ID: process.env.PADDLE_PRICE_YEARLY_ID,
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
  });
  return parsed.success ? parsed.data : null;
}
