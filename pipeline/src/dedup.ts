// dedup.ts — Walk /news/incoming/ + /news/published/, collect fingerprints
// from frontmatter. Missing folders are tolerated (returns empty set).
// See project-design.md §3.6.

import nodeFs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { Dirent } from "node:fs";

type FsLike = typeof import("node:fs/promises");

const SUBFOLDERS = ["incoming", "published"] as const;

/**
 * Walks both folders recursively, reads the YAML frontmatter of every *.md
 * file (via gray-matter), collects the `fingerprint` field. Files without a
 * `fingerprint` field are tolerated (skipped silently) — they're pre-pipeline
 * content, not RSS emissions.
 *
 * Missing folders are tolerated and treated as empty.
 */
export async function loadSeenFingerprints(
  newsRoot: string,
  fs: FsLike = nodeFs,
): Promise<Set<string>> {
  const seen = new Set<string>();

  for (const sub of SUBFOLDERS) {
    const dir = path.join(newsRoot, sub);
    await collectFromDir(dir, fs, seen);
  }

  return seen;
}

async function collectFromDir(
  dir: string,
  fs: FsLike,
  out: Set<string>,
): Promise<void> {
  let entries: Dirent[];
  try {
    entries = (await fs.readdir(dir, { withFileTypes: true })) as Dirent[];
  } catch {
    // Missing folder is fine: treat as empty.
    return;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFromDir(full, fs, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".md")) continue;

    let raw: string;
    try {
      raw = await fs.readFile(full, "utf8");
    } catch {
      continue;
    }

    let parsed: ReturnType<typeof matter>;
    try {
      parsed = matter(raw);
    } catch {
      continue;
    }

    const data = parsed.data as Record<string, unknown>;
    const fp = data["fingerprint"];
    if (typeof fp === "string" && fp.length > 0) {
      out.add(fp);
    }
  }
}

/**
 * Convenience predicate. Pure — no I/O. Returns true iff the fingerprint
 * should be processed (NOT yet seen).
 */
export function isUnseen(fingerprint: string, seen: Set<string>): boolean {
  return !seen.has(fingerprint);
}
