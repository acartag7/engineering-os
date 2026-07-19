// Single source of the freeze boundary (Decision A): a FIXED basename predicate,
// not a configurable glob. Imported by check.mjs, generate-manifest.mjs, and the
// vendored plugin copy so guard and generator can never disagree on what is frozen.
// No glob, no regex, no parser over untrusted filenames.

export const SUFFIXES = [
  ".test.mjs",
  ".test.js",
  ".test.cjs",
  ".test.ts",
  ".test.mts",
  ".test.cts",
  ".test.jsx",
  ".test.tsx",
  ".spec.mjs",
  ".spec.js",
  ".spec.cjs",
  ".spec.ts",
  ".spec.mts",
  ".spec.cts",
  ".spec.jsx",
  ".spec.tsx",
];

// Frozen iff nfc(basename) ends with one of the fixed suffixes. Subdir-agnostic
// (basename only), not PR-configurable.
export function isFrozenBasename(name) {
  const normalized = String(name).normalize("NFC");
  return SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

// One canonical POSIX-relative routine (A4) for PG_ACCEPTANCE_DIR — single-sourced
// so the guard and the generator can never disagree on what path is safe to write
// under or enumerate. Rejects empty, `.`/`..` segments, duplicate `//`, non-NFC,
// backslash, absolute. Trailing slashes are normalized away (a trailing separator is
// not an escape); everything else fails closed. Returns the canonical dir or null.
export function canonicalRelDir(raw) {
  if (typeof raw !== "string") return null;
  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed.length === 0) return null;
  if (trimmed.includes("\\")) return null;
  if (trimmed.startsWith("/")) return null;
  if (trimmed.normalize("NFC") !== trimmed) return null;
  for (const seg of trimmed.split("/")) {
    if (seg.length === 0 || seg === "." || seg === "..") return null;
  }
  return trimmed;
}
