import { describe, expect, it } from "vitest";
import { cmFromFeetInches, feetInchesFromCm, kgFromLb, lbFromKg } from "./units";

describe("units", () => {
  it("converts height", () => {
    expect(cmFromFeetInches(5, 10)).toBeCloseTo(177.8);
    expect(feetInchesFromCm(177.8)).toEqual({ feet: 5, inches: 10 });
    expect(feetInchesFromCm(182.5)).toEqual({ feet: 6, inches: 0 });
  });

  it("converts weight", () => {
    expect(kgFromLb(154)).toBeCloseTo(69.85, 2);
    expect(lbFromKg(kgFromLb(200))).toBeCloseTo(200);
  });
});
