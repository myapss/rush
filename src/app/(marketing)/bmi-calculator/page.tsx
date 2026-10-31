import type { Metadata } from "next";
import { ToolPage } from "@/components/tool-page";

export const metadata: Metadata = {
  title: "BMI Calculator for Adults",
  description: "Calculate your body mass index (BMI) in metric or imperial units, see the WHO category, and learn its limitations.",
  alternates: { canonical: "/bmi-calculator" },
};

export default function Page() {
  return (
    <ToolPage
      mode="bmi"
      title="BMI calculator"
      intro="Body mass index (BMI) compares your weight to your height. It's a quick screening number, not a diagnosis."
    >
      <h2>WHO adult BMI categories</h2>
      <ul>
        <li>Below 18.5: underweight</li>
        <li>18.5–24.9: healthy weight range</li>
        <li>25–29.9: overweight</li>
        <li>30 and above: obesity</li>
      </ul>
      <p>
        Some health organizations use lower cut-offs for people of South Asian, Chinese and other Asian backgrounds, because
        health risks can start at a lower BMI. Ask your doctor which applies to you.
      </p>
      <h2>Limitations of BMI</h2>
      <p>
        BMI doesn&apos;t tell muscle from fat, so muscular people can be classed as overweight. It doesn&apos;t show where fat
        is stored, and it isn&apos;t valid for children, teenagers or during pregnancy. Waist measurement, blood pressure and
        blood tests give a fuller picture, so talk to a healthcare professional about your overall health.
      </p>
    </ToolPage>
  );
}
