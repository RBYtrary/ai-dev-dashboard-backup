import { VERSION } from "@/data/version";
import { PATCH_NOTES } from "@/data/patchNotes";
import type { PatchNote } from "@/types/patchNote";

const latest = PATCH_NOTES?.[0] ?? null;
const history: PatchNote[] = [...PATCH_NOTES];

export default function VersionsPage() {
  return (
    <div style={s.page}>

      {/* ── PAGE HEADER ─────────────────────────────── */}
      <header style={s.header}>
        <div>
          <h1 style={s.pageTitle}>System Version</h1>
          <p style={s.pageSubtitle}>Version state and release history</p>
        </div>
      </header>

      {/* ── VERSION HERO ────────────────────────────── */}
      <section style={s.section}>
        <p style={s.overline}>Current Build</p>
        <div className="ai-card" style={s.heroCard}>
          <div style={s.heroTop}>
            <div style={s.heroLeft}>
              <div style={s.liveRow}>
                <span style={s.liveDot} />
                <span style={s.liveLabel}>Live</span>
              </div>
              <p style={s.versionHero}>{VERSION}</p>
              <p style={s.heroSub}>Current deployed version</p>
            </div>
            <div style={s.heroRight}>
              <div style={s.heroMetaCell}>
                <span style={s.heroMetaKey}>Environment</span>
                <span style={s.heroMetaVal}>Vercel Cloud Runtime</span>
              </div>
              <div style={s.heroMetaCell}>
                <span style={s.heroMetaKey}>Status</span>
                <span style={s.activeVal}>Active</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LATEST PATCH SUMMARY ────────────────────── */}
      <section style={s.section}>
        <p style={s.overline}>Latest Patch Summary</p>
        <div className="ai-card" style={s.card}>
          {latest ? (
            <>
              <div style={s.patchHeader}>
                <div style={s.patchTitleRow}>
                  <span style={s.patchVersion}>{latest.version}</span>
                  <span style={s.patchVersionSub}>Most recent</span>
                </div>
                <span style={s.patchDate}>{latest.date}</span>
              </div>
              <hr style={s.divider} />
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
      </section>

      {/* ── VERSION HISTORY ─────────────────────────── */}
      <section style={s.section}>
        <p style={s.overline}>Version History</p>
        {history.length === 0 ? (
          <p style={s.emptyState}>No history entries.</p>
        ) : (
          <div style={s.historyList}>
            {history.map((note, i) => (
              <div key={i} className="ai-card" style={s.historyEntry}>
                <div style={s.historyRow}>
                  <div style={s.historyLeft}>
                    <span style={s.historyVersion}>{note.version}</span>
                    <span style={s.historyDate}>{note.date}</span>
                  </div>
                  <div style={s.historyChanges}>
                    <span style={s.historyCount}>
                      {note.changes.length} {note.changes.length === 1 ? "change" : "changes"}
                    </span>
                  </div>
                </div>
                <ul style={s.historyChangeList}>
                  {note.changes.map((change, j) => (
                    <li key={j} className="ai-change-item" style={s.historyChangeItem}>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
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

  /* Sections */
  section: {
    marginBottom: 36,
  },
  overline: {
    fontSize: 11,
    fontWeight: 600,
    color: "#2e3f58",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    marginBottom: 12,
  },

  /* Hero card */
  heroCard: {
    padding: "28px 30px",
  },
  heroTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 4,
  },
  liveRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#22c55e",
    display: "inline-block",
    boxShadow: "0 0 6px rgba(34,197,94,0.5)",
  },
  liveLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#22c55e",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  versionHero: {
    fontSize: 40,
    fontWeight: 700,
    color: "#c8d4e8",
    fontFamily: "monospace",
    letterSpacing: "-1px",
    margin: 0,
    lineHeight: 1,
  },
  heroSub: {
    fontSize: 13,
    color: "#2d4060",
    marginTop: 6,
  },
  heroRight: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
    alignItems: "flex-end",
  },
  heroMetaCell: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "flex-end",
    gap: 2,
  },
  heroMetaKey: {
    fontSize: 10,
    fontWeight: 600,
    color: "#243040",
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
  },
  heroMetaVal: {
    fontSize: 12,
    color: "#4a6080",
  },
  activeVal: {
    fontSize: 12,
    color: "#4ade80",
  },

  /* Latest patch card */
  card: {
    padding: "20px 24px",
  },
  patchHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  patchTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  patchVersion: {
    fontSize: 16,
    fontWeight: 600,
    color: "#c0cce0",
    fontFamily: "monospace",
  },
  patchVersionSub: {
    fontSize: 11,
    color: "#4f8ef7",
    background: "rgba(79,142,247,0.08)",
    border: "1px solid rgba(79,142,247,0.14)",
    borderRadius: 4,
    padding: "2px 7px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontWeight: 600,
  },
  patchDate: {
    fontSize: 12,
    color: "#2d4060",
    fontFamily: "monospace",
  },
  divider: {
    border: "none",
    borderTop: "1px solid #101927",
    margin: "0 0 14px",
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
  emptyState: {
    fontSize: 13,
    color: "#2a3a52",
  },

  /* History */
  historyList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  historyEntry: {
    padding: "14px 20px",
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyLeft: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  historyVersion: {
    fontSize: 13,
    fontWeight: 600,
    color: "#8a9ab5",
    fontFamily: "monospace",
  },
  historyDate: {
    fontSize: 12,
    color: "#2a3a52",
    fontFamily: "monospace",
  },
  historyChanges: {},
  historyCount: {
    fontSize: 11,
    color: "#2a3a52",
  },
  historyChangeList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: 5,
  },
  historyChangeItem: {
    fontSize: 12,
    color: "#374d68",
    display: "flex",
    alignItems: "flex-start",
  },
};
