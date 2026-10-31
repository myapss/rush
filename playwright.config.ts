import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    port,
    timeout: 300_000,
    reuseExistingServer: !process.env.CI,
    // Test-only Paddle settings: webhooks are signed by the tests themselves.
    env: {
      PADDLE_API_KEY: "test_e2e_dummy_key",
      PADDLE_WEBHOOK_SECRET: "pdl_ntfset_e2e_secret",
      PADDLE_ENVIRONMENT: "sandbox",
      PADDLE_PRICE_MONTHLY_ID: "pri_test_monthly",
      PADDLE_PRICE_YEARLY_ID: "pri_test_yearly",
      NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: "test_e2e_client_token",
    },
  },
});
