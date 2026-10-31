import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProgressForm } from "@/components/progress-form";
import { deleteProgressEntry } from "@/lib/actions/progress";
import { requireUser } from "@/lib/auth";
import { getProfileAndPreferences } from "@/lib/data/profile";
import { rollingAverage, type WeightPoint } from "@/lib/progress";
import { createClient } from "@/lib/supabase/server";
import { lbFromKg } from "@/lib/units";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <div className="grid max-w-4xl gap-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Progress />
      </Suspense>
    </div>
  );
}

function WeightChart({ points, imperial }: { points: WeightPoint[]; imperial: boolean }) {
  const conv = (kg: number) => (imperial ? lbFromKg(kg) : kg);
  const avg = rollingAverage(points);
  const values = points.map((p) => conv(p.kg));
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);
  const t0 = new Date(points[0].date).getTime();
  const t1 = Math.max(new Date(points.at(-1)!.date).getTime(), t0 + 86_400_000);
  const W = 640, H = 220, P = 36;
  const x = (d: string) => P + ((new Date(d).getTime() - t0) / (t1 - t0)) * (W - 2 * P);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
  const line = avg.map((p, i) => `${i ? "L" : "M"}${x(p.date).toFixed(1)},${y(conv(p.kg)).toFixed(1)}`).join(" ");
  const unit = imperial ? "lb" : "kg";
  return (
    <figure className="card">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Weight over time, from ${values[0].toFixed(1)} to ${values.at(-1)!.toFixed(1)} ${unit}`}>
        <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="var(--border)" />
        {[min, (min + max) / 2, max].map((v) => (
          <g key={v}>
            <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 4" />
            <text x={4} y={y(v) + 4} fontSize="11" fill="var(--muted)">
              {v.toFixed(0)}
            </text>
          </g>
        ))}
        {points.map((p) => (
          <circle key={p.date} cx={x(p.date)} cy={y(conv(p.kg))} r={3} fill="var(--muted)" opacity={0.6} />
        ))}
        <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2.5} />
        <text x={P} y={H - 10} fontSize="11" fill="var(--muted)">
          {new Date(points[0].date).toLocaleDateString("en", { day: "numeric", month: "short" })}
        </text>
        <text x={W - P} y={H - 10} fontSize="11" fill="var(--muted)" textAnchor="end">
          {new Date(points.at(-1)!.date).toLocaleDateString("en", { day: "numeric", month: "short" })}
        </text>
      </svg>
      <figcaption className="mt-2 text-sm text-muted">
        Dots are daily entries ({unit}); the line is your 7-day average. Weight naturally moves up and down by 1–2 kg (2–4 lb) from
        day to day because of water, food and salt, so the trend over several weeks is what matters.
      </figcaption>
    </figure>
  );
}

async function Progress() {
  const user = await requireUser("/dashboard/progress");
  const { profile } = await getProfileAndPreferences(user.id);
  if (!profile.health_data_consent_at) {
    return (
      <p className="card text-muted">
        Progress tracking stores health information, so it needs your consent first. You can give consent in{" "}
        <Link href="/dashboard/settings" className="font-semibold text-brand underline">
          Settings
        </Link>
        . Tracking is completely optional.
      </p>
    );
  }
  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("progress_entries")
    .select("id, entry_date, weight_kg, waist_cm, adherence_pct, notes")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false })
    .limit(120);
  const imperial = profile.measurement_unit === "imperial";
  const weights = (entries ?? []).filter((e) => e.weight_kg !== null).map((e) => ({ date: e.entry_date, kg: Number(e.weight_kg) }));

  return (
    <>
      <section aria-labelledby="add-h" className="card">
        <h2 id="add-h" className="mb-3 font-bold">
          Add an entry
        </h2>
        <ProgressForm units={profile.measurement_unit} today={new Date().toISOString().slice(0, 10)} />
      </section>
      {weights.length >= 2 ? (
        <WeightChart points={[...weights].reverse()} imperial={imperial} />
      ) : (
        <p className="card text-muted">Add weight on at least two days to see your trend chart.</p>
      )}
      {entries && entries.length > 0 && (
        <section aria-labelledby="history-h" className="card overflow-x-auto">
          <h2 id="history-h" className="mb-2 font-bold">
            History
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-1 pr-3 font-medium">Date</th>
                <th className="py-1 pr-3 font-medium">Weight</th>
                <th className="py-1 pr-3 font-medium">Waist</th>
                <th className="py-1 pr-3 font-medium">Plan followed</th>
                <th className="py-1 pr-3 font-medium">Notes</th>
                <th className="sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-border align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(`${e.entry_date}T12:00:00`).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="py-2 pr-3 tabular-nums">{e.weight_kg === null ? "–" : imperial ? `${lbFromKg(Number(e.weight_kg)).toFixed(1)} lb` : `${e.weight_kg} kg`}</td>
                  <td className="py-2 pr-3 tabular-nums">{e.waist_cm === null ? "–" : imperial ? `${(Number(e.waist_cm) / 2.54).toFixed(1)} in` : `${e.waist_cm} cm`}</td>
                  <td className="py-2 pr-3">{e.adherence_pct === null ? "–" : `${e.adherence_pct}%`}</td>
                  <td className="py-2 pr-3 text-muted">{e.notes}</td>
                  <td className="py-2">
                    <form action={deleteProgressEntry}>
                      <input type="hidden" name="entryId" value={e.id} />
                      <button type="submit" className="text-sm text-muted hover:text-danger" aria-label={`Delete entry for ${e.entry_date}`}>
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-muted">To edit an entry, save a new one for the same date.</p>
        </section>
      )}
    </>
  );
}
