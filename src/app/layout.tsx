import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/env";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "ChopPlanner: Eat smart, wherever you are", template: "%s | ChopPlanner" },
  description:
    "Free calorie and macro calculators plus personalized meal planning for your goals, food preferences, allergies, cuisine and budget.",
  applicationName: "ChopPlanner",
  openGraph: { type: "website", siteName: "ChopPlanner" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7faf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1612" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
