import { PATCH_NOTES } from "./patchNotes";

export const VERSION =
  PATCH_NOTES?.length > 0 ? PATCH_NOTES[0]?.version ?? "unknown" : "unknown";