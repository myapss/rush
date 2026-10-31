export interface WeightPoint {
  date: string;
  kg: number;
}

/** Trailing 7-day average, which smooths day-to-day water-weight swings. */
export function rollingAverage(points: WeightPoint[], days = 7): WeightPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((p) => {
    const end = new Date(p.date).getTime();
    const window = sorted.filter((q) => {
      const t = new Date(q.date).getTime();
      return t <= end && t > end - days * 86_400_000;
    });
    return { date: p.date, kg: Math.round((window.reduce((s, q) => s + q.kg, 0) / window.length) * 10) / 10 };
  });
}
