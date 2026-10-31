import { describe, expect, it } from "vitest";
import { loadFdcFoods, missingRequiredNutrients, parseCsvLine, similarity } from "../../scripts/lib/fdc";

describe("FDC CSV parsing", () => {
  it("handles quoted commas and escaped quotes", () => {
    expect(parseCsvLine('1,"a, b","say ""hi""",')).toEqual(["1", "a, b", 'say "hi"', ""]);
  });

  it("loads requested foods with nutrients and portions; reports misses with suggestions", async () => {
    const { found, missing } = await loadFdcFoods("tests/fixtures/fdc", [
      "TEST FIXTURE oats, dry",
      'test fixture milk, "whole"',
      "TEST FIXTURE oat, dry",
    ]);
    const oats = found.get("TEST FIXTURE oats, dry")!;
    expect(oats.fdcId).toBe(9000001);
    expect(oats.nutrients).toMatchObject({ kcal: 100, protein_g: 10, fat_g: 5, carbs_g: 60, sodium_mg: 2 });
    expect(oats.portions).toEqual([
      { amount: 1, unit: "cup", description: "cup", gramWeight: 80 },
      { amount: 1, unit: "packet", description: "packet", gramWeight: 28 },
    ]);
    expect(missingRequiredNutrients(found.get('test fixture milk, "whole"')!)).toEqual(["fat_g", "carbs_g"]);
    expect(missing).toHaveLength(1);
    expect(missing[0].suggestions[0]).toBe("TEST FIXTURE oats, dry");
  });

  it("scores token overlap", () => {
    expect(similarity("Rice, white, cooked", "Rice, white, long-grain, cooked")).toBeGreaterThan(0.5);
  });
});
