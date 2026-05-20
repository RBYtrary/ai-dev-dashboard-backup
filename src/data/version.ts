import { PATCH_NOTES } from "./patchNotes";

export const VERSION =
  PATCH_NOTES?.[0]?.version ?? "unknown";