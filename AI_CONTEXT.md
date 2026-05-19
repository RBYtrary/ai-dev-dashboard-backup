# AI DEV OS — SYSTEM MEMORY

## CURRENT STATE
AI Dev OS Dashboard is live and functional at v0.1.0.

## ACTIVE FEATURES
- /dashboard — central hub, links to all sections
- /projects — project registry from src/data/projects.json
- /patch-notes — full patch history from src/data/patchNotes.ts
- /versions — version display + patch summary from version.ts + patchNotes.ts

## DATA SOURCES (single source of truth)
- src/data/patchNotes.ts — version authority + patch history
- src/data/projects.json — project registry
- src/data/version.ts — re-exports PATCH_NOTES[0].version (derived, not hardcoded)

## TYPES
- src/types/project.ts — Project type (matches projects.json)
- src/types/patchNote.ts — PatchNote type (matches patchNotes.ts)

## ARCHITECTURE
- Next.js App Router only (no Pages Router)
- All data imported statically from src/data/
- No API routes
- No external dependencies beyond next/react/tailwind

## NEXT BUILD TARGETS
- add logging system when log data source is defined
- expand project registry with more entries
- add version history entries to patchNotes.ts as project evolves

## RULE
This file must be updated whenever system changes.
