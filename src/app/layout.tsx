import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

// next/font downloads the font at build time and serves it from our own site (faster, more private).
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], weight: ["400", "600", "800"] });

export const metadata: Metadata = {
  title: "Barakat",
  description: "Weekly dinners planned around shared ingredients and last week's leftovers.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={bricolage.className}>{children}</body>
    </html>
  );
}
