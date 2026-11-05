import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { TopBar } from "@/components/top-bar";
import "./globals.css";

const sans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const mono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "Claim Desk",
  description:
    "A triage agent for device protection claims, built on Likewize's public plan terms. Fast typed judgments, rules in code, reasoning only where it is needed. By Jaswanth Karjala Eshwar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <TopBar />
        {children}
      </body>
    </html>
  );
}
