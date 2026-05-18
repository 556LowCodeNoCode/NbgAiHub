import { describe, it, expect, vi } from "vitest";
import { Volume, createFsFromVolume } from "memfs";
import { loadSeenFingerprints, isUnseen } from "../src/dedup.js";

type FsLike = typeof import("node:fs/promises");

function memFs(tree: Record<string, string>): FsLike {
  const vol = Volume.fromJSON(tree);
  const fs = createFsFromVolume(vol).promises as unknown as FsLike;
  return fs;
}

const FILE_WITH_FP_INCOMING = `---
type: news
title: Existing in incoming
fingerprint: aaaaaaaaaaaaaaaa
---

Body.
`;

const FILE_WITH_FP_PUBLISHED = `---
type: news
title: Existing in published
fingerprint: bbbbbbbbbbbbbbbb
---

Body.
`;

const FILE_WITHOUT_FP = `---
type: tip
title: A handcrafted tip
---

Body.
`;

describe("dedup.loadSeenFingerprints", () => {
  it("returns fingerprints from both incoming and published folders", async () => {
    const fs = memFs({
      "/news/incoming/2026-05-17-seen.md": FILE_WITH_FP_INCOMING,
      "/news/published/2026-04-01-old.md": FILE_WITH_FP_PUBLISHED,
    });
    const seen = await loadSeenFingerprints("/news", fs);
    expect(seen.has("aaaaaaaaaaaaaaaa")).toBe(true);
    expect(seen.has("bbbbbbbbbbbbbbbb")).toBe(true);
    expect(seen.size).toBe(2);
  });

  it("tolerates files without a fingerprint field", async () => {
    const fs = memFs({
      "/news/incoming/handcrafted.md": FILE_WITHOUT_FP,
      "/news/incoming/2026-05-17-seen.md": FILE_WITH_FP_INCOMING,
    });
    const seen = await loadSeenFingerprints("/news", fs);
    expect(seen.size).toBe(1);
  });

  it("handles empty incoming and published folders (returns empty set)", async () => {
    const fs = memFs({});
    const seen = await loadSeenFingerprints("/news", fs);
    expect(seen.size).toBe(0);
  });
});

describe("dedup.isUnseen (AC7 — no Azure call for seen items)", () => {
  it("returns false for a fingerprint already in the seen set", () => {
    const seen = new Set(["aaaaaaaaaaaaaaaa"]);
    expect(isUnseen("aaaaaaaaaaaaaaaa", seen)).toBe(false);
  });

  it("returns true for a fingerprint not yet in the seen set", () => {
    const seen = new Set(["aaaaaaaaaaaaaaaa"]);
    expect(isUnseen("ccccccccccccccccc", seen)).toBe(true);
  });

  it("skips items whose fingerprint exists in incoming or published BEFORE any Azure call", async () => {
    // This is the orchestrator-level shape simulated locally: callers filter
    // candidates against the seen set without consulting Azure. We model the
    // "Azure mock" as a vi.fn that should never be called when items are
    // already seen.
    const seenSet = new Set(["seen-fp-1", "seen-fp-2"]);
    const azureCall = vi.fn();

    const candidates = [
      { fingerprint: "seen-fp-1", title: "Already in incoming" },
      { fingerprint: "seen-fp-2", title: "Already in published" },
    ];

    for (const c of candidates) {
      if (isUnseen(c.fingerprint, seenSet)) {
        azureCall(c);
      }
    }
    expect(azureCall).not.toHaveBeenCalled();
  });
});
