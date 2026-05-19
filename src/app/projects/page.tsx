import projects from "@/data/projects.json";
import type { Project } from "@/types/project";

export default function ProjectsPage() {
  return (
    <div style={s.page}>

      {/* ── PAGE HEADER ─────────────────────────────── */}
      <header style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Project Registry</h1>
          <p style={s.pageSubtitle}>All registered projects in this system</p>
        </div>
        <div style={s.countBadge}>
          <span style={s.countNum}>{projects.length}</span>
          <span style={s.countLabel}>{projects.length === 1 ? "project" : "projects"}</span>
        </div>
      </header>

      {/* ── PROJECT LIST ────────────────────────────── */}
      <section>
        {(projects as Project[]).map((project, i) => (
          <div key={i} className="ai-card" style={s.projectCard}>

            {/* Card header: name + status */}
            <div style={s.cardHeader}>
              <h2 style={s.projectName}>{project.name}</h2>
              <span style={s.statusBadge}>{project.status}</span>
            </div>

            <hr style={s.divider} />

            {/* Metadata grid */}
            <div style={s.metaGrid}>
              <div style={s.metaCell}>
                <span style={s.metaKey}>Type</span>
                <span style={s.metaValue}>{project.type}</span>
              </div>
              <div style={s.metaCell}>
                <span style={s.metaKey}>Version</span>
                <span style={{ ...s.metaValue, fontFamily: "monospace" }}>{project.version}</span>
              </div>
            </div>

            {/* Repository */}
            <div style={s.repoRow}>
              <span style={s.metaKey}>Repository</span>
              <a
                href={project.repo}
                target="_blank"
                className="ai-ext-link"
                style={s.repoLink}
              >
                {project.repo}
                <span style={s.extIcon}>↗</span>
              </a>
            </div>

          </div>
        ))}
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

  /* Header */
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 32,
    marginBottom: 32,
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
  countBadge: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    background: "#0c1524",
    border: "1px solid #162030",
    borderRadius: 8,
    padding: "8px 16px",
  },
  countNum: {
    fontSize: 22,
    fontWeight: 600,
    color: "#c0cce0",
    fontFamily: "monospace",
  },
  countLabel: {
    fontSize: 12,
    color: "#364760",
  },

  /* Project card */
  projectCard: {
    padding: "22px 26px",
    marginBottom: 12,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#c8d4e8",
    margin: 0,
    letterSpacing: "-0.2px",
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 500,
    color: "#4ade80",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.15)",
    borderRadius: 20,
    padding: "3px 10px",
    textTransform: "capitalize" as const,
  },

  /* Divider */
  divider: {
    border: "none",
    borderTop: "1px solid #101927",
    margin: "0 0 16px",
  },

  /* Metadata grid */
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginBottom: 14,
  },
  metaCell: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 3,
  },
  metaKey: {
    fontSize: 11,
    fontWeight: 500,
    color: "#2d4060",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
  },
  metaValue: {
    fontSize: 13,
    color: "#8a9ab5",
  },

  /* Repository row */
  repoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTop: "1px solid #101927",
  },
  repoLink: {
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  extIcon: {
    fontSize: 10,
    color: "#3a5070",
  },
};
