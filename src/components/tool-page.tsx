import type { ReactNode } from "react";
import { Calculator, type CalculatorMode } from "@/components/calculator";

export function ToolPage({
  mode,
  title,
  intro,
  children,
}: {
  mode: CalculatorMode;
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-10 sm:py-14">
      <header className="mb-8 max-w-3xl">
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="text-lg text-muted">{intro}</p>
      </header>
      <Calculator mode={mode} />
      <article className="prose-page mt-12 max-w-3xl">{children}</article>
    </div>
  );
}
