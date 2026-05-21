import type { Metadata } from "next";
import "./globals.css";

import modules from "@/data/modules.json";

export const metadata: Metadata = {
  title: "AI Dev OS",
  description: "AI Development Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navModules = modules.filter(
    (module) => module.navVisible && module.status === "active"
  );

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#071018",
          color: "#dbe7ff",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <header
            style={{
              position: "sticky",
              top: 0,
              zIndex: 50,
              backdropFilter: "blur(12px)",
              background: "rgba(7,16,24,0.82)",
              borderBottom: "1px solid #13202f",
            }}
          >
            <div
              style={{
                maxWidth: 1400,
                margin: "0 auto",
                padding: "14px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                }}
              >
                AI Dev OS
              </div>

              <nav
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                {navModules.map((module) => (
                  <a
                    key={module.id}
                    href={module.route}
                    style={{
                      color: "#8ba3c7",
                      textDecoration: "none",
                      fontSize: 13,
                      padding: "8px 10px",
                      borderRadius: 8,
                      transition: "0.2s ease",
                    }}
                  >
                    {module.name}
                  </a>
                ))}
              </nav>
            </div>
          </header>

          <main style={{ flex: 1 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}