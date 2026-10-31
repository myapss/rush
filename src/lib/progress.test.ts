import { describe, expect, it } from "vitest";
import { rollingAverage } from "./progress";

describe("rollingAverage", () => {
  it("averages the trailing 7 days", () => {
    const pts = [
      { date: "2026-10-01", kg: 80 },
      { date: "2026-10-03", kg: 82 },
      { date: "2026-10-09", kg: 78 },
    ];
    // 9 Oct averages 3 Oct (82) and 9 Oct (78); 1 Oct is outside the window.
    expect(rollingAverage(pts).map((p) => p.kg)).toEqual([80, 81, 80]);
  });
});
