"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { generateMealPlan, swapPlannedMeal } from "@/lib/planner/engine";
import { rateLimit } from "@/lib/rate-limit";

export type PlanActionState = { status: "idle" } | { status: "error"; message: string };

export async function generatePlanAction(_prev: PlanActionState, _fd: FormData): Promise<PlanActionState> {
  const user = await requireUser("/dashboard/my-meals");
  if (!(await rateLimit(`plan:${user.id}`, 10, 3600))) {
    return { status: "error", message: "Too many requests. Please wait a few minutes and try again." };
  }
  const result = await generateMealPlan(user.id);
  if (!result.ok) return { status: "error", message: result.message };
  redirect("/dashboard/my-meals");
}

export async function swapMealAction(_prev: PlanActionState, fd: FormData): Promise<PlanActionState> {
  const user = await requireUser("/dashboard/my-meals");
  const id = z.uuid().safeParse(fd.get("plannedMealId"));
  if (!id.success) return { status: "error", message: "Invalid meal." };
  if (!(await rateLimit(`swap:${user.id}`, 30, 3600))) {
    return { status: "error", message: "Too many requests. Please wait a few minutes and try again." };
  }
  const result = await swapPlannedMeal(user.id, id.data);
  if (!result.ok) return { status: "error", message: result.message };
  refresh();
  return { status: "idle" };
}
