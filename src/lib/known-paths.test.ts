import { describe, expect, it } from "vitest";
import { isUnknownContentPath } from "./known-paths";

describe("isUnknownContentPath", () => {
  it("flags only unknown recipe and meal-plan slugs", () => {
    expect(isUnknownContentPath("/recipes/moi-moi")).toBe(false);
    expect(isUnknownContentPath("/meal-plans/vegan")).toBe(false);
    expect(isUnknownContentPath("/recipes/not-a-recipe")).toBe(true);
    expect(isUnknownContentPath("/meal-plans/keto")).toBe(true);
    expect(isUnknownContentPath("/recipes")).toBe(false);
    expect(isUnknownContentPath("/dashboard/recipes/123")).toBe(false);
  });
});
