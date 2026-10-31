import { expect, type Page } from "@playwright/test";

const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export async function signInLink(email: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const { messages } = (await res.json()) as { messages: { ID: string }[] };
    if (messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${messages[0].ID}`)).json()) as { HTML: string };
      const href = msg.HTML.match(/href="([^"]*token_hash=[^"]*)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No sign-in email for ${email}`);
}

export async function signUp(page: Page, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("I am 18 years old or older.").check();
  await page.getByLabel(/I agree to the/).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  const link = new URL(await signInLink(email));
  await page.goto(link.pathname + link.search);
}

/** Complete onboarding with consent and body data so targets can be computed. */
export async function onboard(page: Page, opts: { allergies?: string[]; mealsPerDay?: string } = {}) {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByLabel("Country or region").selectOption("GB");
  await page.getByLabel("Currency for budgets").selectOption("GBP");
  await page.getByLabel("Birth year").fill("1988");
  await page.getByLabel("Height (cm)").fill("172");
  await page.getByLabel("Weight (kg)").fill("74");
  await page.getByLabel(/I consent to NutriPlan AI storing/).check();
  for (const a of opts.allergies ?? []) await page.getByRole("checkbox", { name: a, exact: true }).check();
  if (opts.mealsPerDay) await page.getByLabel("Meals per day").selectOption(opts.mealsPerDay);
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}
