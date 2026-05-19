import { PATCH_NOTES } from "@/data/patchNotes";
import type { PatchNote } from "@/types/patchNote";

export default function PatchNotesPage() {
  const notes: PatchNote[] = [...PATCH_NOTES].reverse();

  return (
    <div style={s.page}>

      {/* ── PAGE HEADER ───────────────────────────── */}
      <header style={s.header}>
        <div>
          <h1 style={s.pageTitle}>Changelog</h1>
          <p style={s.pageSubtitle}>Release history for AI Dev OS</p>
        </div>
        <div style={s.releaseBadge}>
          <span style={s.releaseNum}>{notes.length}</span>
          <span style={s.releaseLabel}>{notes.length === 1 ? "release" : "releases"}</span>
        </div>
      </header>

      {/* ── TIMELINE ──────────────────────────────── */}
      {/* ai-card + ai-timeline-entry: ai-timeline-entry overrides border-left only */}
      <section>
        {notes.map((note, i) => (
          <div key={i} className="ai-card ai-timeline-entry" style={s.entry}>

            <div style={s.entryHeader}>
              <div style={s.entryTitleRow}>
                <span style={s.entryVersion}>{note.version}</span>
                {i === 0 && <span style={s.latestBadge}>Latest</span>}
              </div>
              <span style={s.entryDate}>{note.date}</span>
            </div>

            <hr style={s.divider} />

            <ul style={s.changeList}>
              {note.changes.map((change, j) => (
                <li key={j} className="ai-change-item" style={s.changeItem}>
                  {change}
                </li>
              ))}
            </ul>

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
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 32,
    marginBottom: 36,
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
  releaseBadge: {
    display: "flex",
    alignItems: "baseline",
    gap: 5,
    background: "#0c1524",
    border: "1px solid #162030",
    borderRadius: 8,
    padding: "8px 16px",
  },
  releaseNum: {
    fontSize: 22,
    fontWeight: 600,
    color: "#c0cce0",
    fontFamily: "monospace",
  },
  releaseLabel: {
    fontSize: 12,
    color: "#364760",
  },
  /* padding only — background/border/radius/shadow from .ai-card CSS */
  entry: {
    padding: "22px 26px",
    marginBottom: 14,
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  entryTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  entryVersion: {
    fontSize: 18,
    fontWeight: 600,
    color: "#c8d4e8",
    fontFamily: "monospace",
    letterSpacing: "-0.3px",
  },
  latestBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#4f8ef7",
    background: "rgba(79,142,247,0.08)",
    border: "1px solid rgba(79,142,247,0.14)",
    borderRadius: 20,
    padding: "2px 8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  entryDate: {
    fontSize: 12,
    color: "#2d4060",
    fontFamily: "monospace",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #101927",
    margin: "0 0 16px",
  },
  changeList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  changeItem: {
    fontSize: 13,
    color: "#6b7e98",
    lineHeight: 1.5,
    display: "flex",
    alignItems: "flex-start",
  },
};
