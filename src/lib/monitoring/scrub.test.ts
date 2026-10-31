import { describe, expect, it } from "vitest";
import { scrubEvent, scrubUrl } from "./scrub";

describe("error report scrubbing", () => {
  it("redacts sign-in tokens and codes from URLs", () => {
    expect(scrubUrl("https://x.test/auth/confirm?token_hash=abc123&type=email&next=%2Fdashboard")).toBe(
      "https://x.test/auth/confirm?token_hash=[redacted]&type=email&next=[redacted]",
    );
    expect(scrubUrl("/auth/confirm?code=xyz")).toBe("/auth/confirm?code=[redacted]");
  });

  it("drops cookies, headers, bodies and personal user fields", () => {
    const e = scrubEvent({
      type: undefined,
      message: "Failed for ada@example.com",
      request: { url: "https://x.test/a?token=1", cookies: { sb: "secret" }, headers: { authorization: "Bearer x" }, data: { weight_kg: 70 }, query_string: "token=1" },
      user: { id: "u1", email: "ada@example.com", ip_address: "1.2.3.4" },
      exception: { values: [{ type: "Error", value: "bad email ada@example.com" }] },
    });
    expect(e.request).toEqual({ url: "https://x.test/a?token=[redacted]", query_string: "[redacted]" });
    expect(e.user).toEqual({ id: "u1" });
    expect(e.message).toBe("Failed for [email]");
    expect(e.exception?.values?.[0].value).toBe("bad email [email]");
  });
});
