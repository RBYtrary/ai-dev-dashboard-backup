/**
 * Root layout — Server Component.
 * Navbar is generated dynamically from modules.json.
 * Only modules with navVisible: true and status: "active" appear.
 * Adding a new page to the nav = updating modules.json only.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import modules from "@/data/modules.json";
import type { Module } from "@/types/module";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Dev OS",
  description: "AI Dev OS — experimental self-aware development platform",
};

const navItems = (modules as Module[]).filter(
  (m) => m.navVisible && m.status === "active"
);

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      style={{ background: "#080b12" }}
    >
      <body style={s.body}>
        <nav style={s.nav}>
          <Link href="/dashboard" style={s.brand}>
            AI Dev OS
          </Link>
          <div style={s.links}>
            {navItems.map((m) => (
              <Link key={m.id} href={m.route} style={s.link}>
                {m.name}
              </Link>
            ))}
          </div>
        </nav>
        <main style={s.main}>{children}</main>
      </body>
    </html>
  );
}

const s: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    background: "#080b12",
    color: "#dde3ef",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    minHeight: "100vh",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    height: 52,
    background: "#0a0d15",
    borderBottom: "1px solid #111c2e",
    position: "sticky" as const,
    top: 0,
    zIndex: 50,
  },
  brand: {
    fontSize: 14,
    fontWeight: 500,
    color: "#dde3ef",
    textDecoration: "none",
    letterSpacing: "-0.2px",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },
  link: {
    fontSize: 13,
    color: "#4a5872",
    textDecoration: "none",
    padding: "5px 10px",
    borderRadius: 6,
  },
  main: {
    flex: 1,
  },
};
