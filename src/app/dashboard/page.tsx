import Link from "next/link";
import { VERSION } from "@/data/version";
import { PATCH_NOTES } from "@/data/patchNotes";
import projects from "@/data/projects.json";

export default function DashboardPage() {
  const latest = PATCH_NOTES?.[0] ?? null;

  return (
    <div style={s.page}>

      {/* ── PAGE HEADER ───────────────────────────── */}
      <header style={s.header}>
        <div>
          <h1 style={s.pageTitle}>AI Dev OS</h1>
          <p style={s.pageSubtitle}>Control Center</p>
        </div>
        <div style={s.headerMeta}>
          <div style={s.envRow}>
            <span style={s.activeDot} />
            <span style={s.envLabel}>Active · Vercel Cloud Runtime</span>
          </div>
          <div style={s.versionPill}>
            <span style={s.versionPillText}>{VERSION}</span>
          </div>
        </div>
      </header>

      {/* ── MODULES ───────────────────────────────── */}
      <section style={s.section}>
        <p style={s.overline}>Modules</p>
        <div style={s.moduleGrid}>

          <Link href="/versions" className="ai-page-link">
            <div className="ai-card-interactive" style={s.moduleCard}>
              <div style={s.moduleCardTop}>
                <span style={s.moduleLabel}>System Version</span>
                <span className="ai-nav-arrow" style={s.moduleArrow}>→</span>
              </div>
              <p style={s.moduleValue}>{VERSION}</p>
              <p style={s.moduleMeta}>Deployed version</p>
            </div>
          </Link>

          <Link href="/projects" className="ai-page-link">
            <div className="ai-card-interactive" style={s.moduleCard}>
              <div style={s.moduleCardTop}>
                <span style={s.moduleLabel}>Projects</span>
                <span className="ai-nav-arrow" style={s.moduleArrow}>→</span>
              </div>
              <p style={s.moduleValue}>{projects.length}</p>
              <p style={s.moduleMeta}>Registered</p>
            </div>
          </Link>

          <Link href="/patch-notes" className="ai-page-link">
            <div className="ai-card-interactive" style={s.moduleCard}>
              <div style={s.moduleCardTop}>
                <span style={s.moduleLabel}>Latest Release</span>
                <span className="ai-nav-arrow" style={s.moduleArrow}>→</span>
              </div>
              <p style={s.moduleValue}>{latest?.version ?? "—"}</p>
              <p style={s.moduleMeta}>{latest?.date ?? "No entries"}</p>
            </div>
          </Link>

        </div>
      </section>

      {/* ── PROJECT REGISTRY ──────────────────────── */}
      {/* Card is NOT wrapped in Link — contains external <a> repo links */}
      <section style={s.section}>
        <div style={s.sectionHeaderRow}>
          <p style={s.overline}>Project Registry</p>
          <Link href="/projects" className="ai-section-link">View registry →</Link>
        </div>
        <div className="ai-card" style={s.card}>
          <div>
            {projects.map((project, i) => (
              <div key={i} style={s.projectRow}>
                <div style={s.projectLeft}>
                  <span style={s.projectName}>{project.name}</span>
                  <span style={s.typePill}>{project.type}</span>
                </div>
                <span style={s.statusPill}>{project.status}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            {projects.map((project, i) => (
              <p key={i} style={s.repoLine}>
                <span style={s.repoLineLabel}>Repo</span>
                <a href={project.repo} target="_blank" className="ai-ext-link">
                  {project.repo}
                </a>
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST CHANGES ────────────────────────── */}
      <section style={s.section}>
        <p style={s.overline}>Latest Changes</p>
        <Link href="/patch-notes" className="ai-page-link">
          <div className="ai-card-interactive" style={s.card}>
            <div style={s.cardHeaderRow}>
              <div style={s.patchTitleRow}>
                <span style={s.cardTitle}>🧾 Patch Notes</span>
                {latest && <span style={s.versionTag}>{latest.version}</span>}
              </div>
              <span className="ai-nav-arrow" style={s.cardArrow}>View all →</span>
            </div>
            {latest ? (
              <>
                <p style={s.patchDate}>{latest.date}</p>
                <ul style={s.changeList}>
                  {latest.changes.map((change, i) => (
                    <li key={i} className="ai-change-item" style={s.changeItem}>
                      {change}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p style={s.emptyState}>No patch notes available.</p>
            )}
          </div>
        </Link>
      </section>

      {/* ── SYSTEM ────────────────────────────────── */}
      <section style={s.section}>
        <p style={s.overline}>System</p>
        <div style={s.twoCol}>

          <div className="ai-card" style={s.card}>
            <p style={s.cardTitle}>🧠 System Context</p>
            <p style={s.bodyText}>
              This dashboard is the live control center of your AI Dev OS.
              It reflects GitHub-driven system state deployed via Vercel.
            </p>
          </div>

          <div className="ai-card" style={s.card}>
            <div style={s.cardHeaderRow}>
              <p style={s.cardTitle}>⚠️ Error Logs</p>
              <span style={s.okPill}>No issues</span>
            </div>
            <p style={s.bodyText}>No error logging system connected yet.</p>
          </div>

        </div>
      </section>

    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: "44px 44px 80px",
    maxWidth: 900,
    margin: "0 auto",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 32,
    marginBottom: 44,
    borderBottom: "1px solid #111c2e",
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 600,
    color: "#dde3ef",
    letterSpacing: "-0.4px",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: 13,
    color: "#364760",
    marginTop: 4,
  },
  headerMeta: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 8,
  },
  envRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
    boxShadow: "0 0 6px rgba(34,197,94,0.5)",
  },
  envLabel: {
    fontSize: 11,
    color: "#374d68",
    letterSpacing: "0.02em",
  },
  versionPill: {
    background: "#0c1a30",
    border: "1px solid #162340",
    borderRadius: 6,
    padding: "3px 10px",
  },
  versionPillText: {
    fontSize: 12,
    color: "#4f8ef7",
    fontFamily: "monospace",
    fontWeight: 500,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  overline: {
    fontSize: 11,
    fontWeight: 600,
    color: "#2e3f58",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    margin: 0,
  },
  moduleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  moduleCard: {
    padding: "18px 20px 16px",
  },
  moduleCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: 500,
    color: "#3a5070",
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
  },
  moduleArrow: {
    fontSize: 13,
    color: "#4f8ef7",
  },
  moduleValue: {
    fontSize: 22,
    fontWeight: 600,
    color: "#c8d4e8",
    fontFamily: "monospace",
    letterSpacing: "-0.5px",
    margin: "0 0 4px",
  },
  moduleMeta: {
    fontSize: 12,
    color: "#2d4060",
    margin: 0,
  },
  card: {
    padding: "20px 24px",
  },
  cardHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: "#8a9ab5",
    margin: 0,
  },
  cardArrow: {
    fontSize: 12,
    color: "#4f8ef7",
  },
  projectRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderTop: "1px solid #101927",
  },
  projectLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  projectName: {
    fontSize: 14,
    fontWeight: 500,
    color: "#c0cce0",
  },
  typePill: {
    fontSize: 11,
    color: "#2d4060",
    background: "#0c1524",
    border: "1px solid #162030",
    borderRadius: 4,
    padding: "2px 7px",
  },
  statusPill: {
    fontSize: 11,
    fontWeight: 500,
    color: "#4ade80",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.14)",
    borderRadius: 4,
    padding: "2px 8px",
  },
  repoLine: {
    fontSize: 12,
    color: "#2a3a52",
    marginTop: 6,
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  repoLineLabel: {
    fontSize: 11,
    color: "#243040",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    minWidth: 34,
  },
  patchTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  versionTag: {
    fontSize: 11,
    fontWeight: 500,
    color: "#4f8ef7",
    background: "rgba(79,142,247,0.08)",
    border: "1px solid rgba(79,142,247,0.14)",
    borderRadius: 4,
    padding: "2px 8px",
    fontFamily: "monospace",
  },
  patchDate: {
    fontSize: 12,
    color: "#2d4060",
    margin: "4px 0 14px",
    fontFamily: "monospace",
  },
  changeList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 6,
  },
  changeItem: {
    fontSize: 13,
    color: "#6b7e98",
    display: "flex",
    alignItems: "flex-start",
  },
  emptyState: {
    fontSize: 13,
    color: "#2a3a52",
    marginTop: 8,
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  bodyText: {
    fontSize: 13,
    color: "#3a5070",
    lineHeight: 1.65,
    marginTop: 8,
  },
  okPill: {
    fontSize: 11,
    color: "#4ade80",
    background: "rgba(34,197,94,0.07)",
    border: "1px solid rgba(34,197,94,0.12)",
    borderRadius: 4,
    padding: "2px 8px",
  },
};
