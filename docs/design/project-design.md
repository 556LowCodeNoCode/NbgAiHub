# NbgAiHub — Project Design

Single source of truth for **how the project's components are built**: interfaces, contracts, data models, module structure, error-handling strategy, and architecture-level decisions.

Functional contract ("what the components do") lives in `project-functions.md`. Sequencing and verification criteria live in per-feature plan files (`plan-NNN-*.md`).

**Last updated:** 2026-05-18

---

## Conflicts requiring user input

**None.** The refined request (`docs/refined-requests/rss-pipeline.md`), the plan (`docs/design/plan-001-rss-pipeline.md`), and the investigation (`docs/reference/investigation-rss-pipeline.md`) are internally consistent on every load-bearing decision. The seven reconciliations in plan §1 (R-1 through R-7) are accepted as locked-in for this design. The five open questions (OQ1–OQ5) are non-blocking and need no design accommodation.

---

## 1. RSS news pipeline (plan-001-rss-pipeline)

### 1.1 System architecture and component diagram

The pipeline is a single GitHub Action workflow that invokes a Node 22 / ESM / TypeScript program under `pipeline/`. The program is the orchestrator; the workflow YAML is the shell wrapper that performs the git/PR side effects. Five dependency-injection seams isolate the orchestrator from real I/O so every module is testable without network, filesystem, or process access.

```
                       GitHub Actions runner (ubuntu-latest)
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │  ┌─────────────────────────────────────────────────────────────────┐    │
  │  │  cron: 0 6 * * *      OR      workflow_dispatch                 │    │
  │  └────────────────────────────────┬────────────────────────────────┘    │
  │                                   │                                     │
  │                                   v                                     │
  │            .github/workflows/rss-triage.yml                             │
  │   ┌─────────────────────────────────────────────────────────────┐      │
  │   │ 1. actions/checkout@v4    (persists credentials; depth=1)   │      │
  │   │ 2. actions/setup-node@v4  (node-version-file=.nvmrc)        │      │
  │   │ 3. npm ci             working-directory: pipeline           │      │
  │   │ 4. npm run build      working-directory: pipeline           │      │
  │   │ 5. id: pipeline   npm run start                             │      │
  │   │       AZURE_OPENAI_* injected via secrets                   │      │
  │   │       step output: new_items = "true" | "false"             │      │
  │   │ 6. if new_items == "true":                                  │      │
  │   │       git branch / commit / push / gh pr create             │      │
  │   │       --body-file pipeline/pr-body.md                       │      │
  │   └─────────────────────────────┬───────────────────────────────┘      │
  │                                 │                                       │
  │                                 v                                       │
  │   ┌─────────────────────────────────────────────────────────────────┐   │
  │   │  pipeline/dist/index.js     (compiled from pipeline/src/)       │   │
  │   │                                                                 │   │
  │   │   readEnv()  ──[ ★ SEAM: process.env (read-only) ]              │   │
  │   │       │                                                         │   │
  │   │       v                                                         │   │
  │   │   loadConfig(configPath)  ──[ ★ SEAM: fs ]                      │   │
  │   │       │ FeedSource[]                                            │   │
  │   │       v                                                         │   │
  │   │   loadSeenFingerprints(newsRoot)  ──[ ★ SEAM: fs ]              │   │
  │   │       │ Set<string>                                             │   │
  │   │       v                                                         │   │
  │   │   for each enabled feed (Promise.allSettled):                   │   │
  │   │       fetchFeedXml(url)        ──[ ★ SEAM: fetch ]              │   │
  │   │           │ string (raw XML)                                    │   │
  │   │           v                                                     │   │
  │   │       parseFeed(feedName, xml)                                  │   │
  │   │           │ FeedItem[]                                          │   │
  │   │           v                                                     │   │
  │   │       filter by fingerprint not in seen                         │   │
  │   │           │ FeedItem[]                                          │   │
  │   │           v                                                     │   │
  │   │       for each new item:                                        │   │
  │   │           triageItem(client, item)  ──[ ★ SEAM: AzureOpenAI ]   │   │
  │   │               │ TriageResult | null                             │   │
  │   │               v                                                 │   │
  │   │           writeNewsItem(emittedItem, newsRoot, now)             │   │
  │   │                              ──[ ★ SEAM: fs, ★ SEAM: clock ]    │   │
  │   │       │                                                         │   │
  │   │       v                                                         │   │
  │   │   if (newItems.length > 0):                                     │   │
  │   │       buildPrBody(emitted) -> pipeline/pr-body.md               │   │
  │   │       setStepOutput("new_items", "true")                        │   │
  │   │   else:                                                         │   │
  │   │       setStepOutput("new_items", "false")                       │   │
  │   │                                                                 │   │
  │   └─────────────────────────┬───────────────────────────────────────┘   │
  │                             │                                           │
  │                             v                                           │
  │   ┌───────────────────────────────────────────────────────────────┐     │
  │   │  filesystem under repo root:                                  │     │
  │   │      /news/incoming/<YYYY-MM-DD>-<slug>.md  (new files)       │     │
  │   │      /pipeline/pr-body.md                   (transient)       │     │
  │   └───────────────────────────────────────────────────────────────┘     │
  │                             │                                           │
  │                             v                                           │
  │   ┌───────────────────────────────────────────────────────────────┐     │
  │   │  Workflow shell step (gated on new_items=="true"):            │     │
  │   │     git config user.name/email = github-actions[bot]          │     │
  │   │     git checkout -b news-triage/<DATE>-<RUN_ID:0:7>           │     │
  │   │     git add news/incoming                                     │     │
  │   │     git commit -m "News triage <DATE>"                        │     │
  │   │     git push origin <branch>                                  │     │
  │   │     gh pr create --title "News triage <DATE>" \               │     │
  │   │         --body-file pipeline/pr-body.md --base main           │     │
  │   │                ──[ ★ SEAM: execFile (only at unit-test       │     │
  │   │                    level; the YAML calls bare shell here)    │     │
  │   └───────────────────────────────────────────────────────────────┘     │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  External services (over HTTPS, native fetch):
      - Anthropic, GitHub releases, Simon Willison, Reddit, hnrss.org (feeds)
      - Azure OpenAI chat completions endpoint
      - GitHub API (via `gh` CLI; auth via $GITHUB_TOKEN)
```

**Five DI seams** (★ markers above). Each is described in §7.

**Note on `pr.ts` vs the shell step.** The plan (Step 12) split PR creation into a Node-side helper (`pr.ts`, which builds `pr-body.md` and signals `new_items`) and an inline workflow-shell block that actually invokes `git` and `gh`. This design preserves that split. `pr.ts` exports a body-builder + step-output writer that is fully unit-testable; the workflow YAML does the shell-out. A unit-test-only path inside `pr.ts` exercises a mocked `execFile` to verify the seam contract (see §3.7), but in production the YAML's inline commands are what actually run.

### 1.2 Module structure under `pipeline/`

All paths absolute. Every `.ts` file in `src/` has a matching `.test.ts` in `tests/`.

```
/Users/suzy/ClaudeCode/Projects/NbgAiHub/
├── .github/workflows/
│   └── rss-triage.yml                       (workflow YAML — §6)
├── config/
│   └── rss-sources.json                     (feed list; AC4)
├── news/
│   ├── incoming/.gitkeep                    (folder must exist for dedup walk)
│   └── published/.gitkeep
├── pipeline/
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json                        (strict, ESM, Node 22; "target": "ES2023")
│   ├── vitest.config.ts
│   ├── .eslintrc.cjs
│   ├── .nvmrc                               (contents: 22)
│   ├── .gitignore                           (dist/, node_modules/, pr-body.md, coverage/)
│   ├── README.md                            (editorial workflow + known weak-spots)
│   ├── src/
│   │   ├── index.ts                         (orchestrator)
│   │   ├── env.ts                           (no-fallback env reader)
│   │   ├── config.ts                        (rss-sources.json loader + validator)
│   │   ├── fetch.ts                         (HTTP layer — SEAM)
│   │   ├── parse.ts                         (XML → FeedItem[] via @rowanmanning/feed-parser)
│   │   ├── fingerprint.ts                   (SHA-256 fingerprint, pure)
│   │   ├── dedup.ts                         (walks /news/* for seen fingerprints)
│   │   ├── azure-client.ts                  (AzureOpenAI constructor — SEAM)
│   │   ├── triage.ts                        (relevance + metadata via Azure)
│   │   ├── slug.ts                          (title → kebab-case slug, pure)
│   │   ├── frontmatter.ts                   (builds frontmatter object, pure)
│   │   ├── write.ts                         (emits markdown to /news/incoming/)
│   │   ├── pr.ts                            (PR body builder + step-output + exec seam)
│   │   ├── logger.ts                        (NF6 structured stdout)
│   │   └── types.ts                         (shared type aliases; no runtime code)
│   └── tests/
│       ├── env.test.ts
│       ├── config.test.ts
│       ├── fetch.test.ts
│       ├── parse.test.ts
│       ├── fingerprint.test.ts
│       ├── dedup.test.ts
│       ├── azure-client.test.ts
│       ├── triage.test.ts
│       ├── slug.test.ts
│       ├── frontmatter.test.ts
│       ├── write.test.ts
│       ├── pr.test.ts
│       ├── orchestrator.test.ts
│       ├── smoke.test.ts                    (scaffold sanity check)
│       └── fixtures/
│           ├── rss-2.0.xml                  (Anthropic-style RSS 2.0)
│           ├── atom.xml                     (GitHub releases-style Atom)
│           ├── malformed.xml                (for INVALID_FEED test)
│           ├── rss-sources.valid.json
│           ├── rss-sources.invalid.json
│           ├── triage-response.valid.json
│           ├── triage-response.malformed.json
│           └── existing-news/               (memfs seed for dedup test)
│               ├── incoming/2026-05-17-seen-item.md
│               └── published/2026-04-01-old-item.md
├── SECRETS.md                               (AC15)
├── SCOPE.md
├── DECISIONS.md
├── CLAUDE.md
└── Issues - Pending Items.md
```

**Single-responsibility summary** (one sentence each):

| File | Single responsibility | Pure? |
|---|---|---|
| `types.ts` | Shared TypeScript type aliases used across modules. | n/a |
| `env.ts` | Read four `AZURE_OPENAI_*` env vars; throw `MissingEnvVarError` if any is empty. | No (reads `process.env`) |
| `config.ts` | Read and validate `config/rss-sources.json`; return `FeedSource[]`. | No (fs) |
| `fetch.ts` | Fetch one URL → raw XML string; throw on non-2xx or network error. | No (HTTP, via SEAM) |
| `parse.ts` | Parse XML string → `FeedItem[]` using `@rowanmanning/feed-parser`. | Yes (in-memory only) |
| `fingerprint.ts` | SHA-256-of-(feedName + (guid\|\|link\|\|title)), hex, 16-char trunc. | Yes |
| `dedup.ts` | Walk `/news/incoming/` and `/news/published/`, collect fingerprints from frontmatter. | No (fs) |
| `azure-client.ts` | Construct an `AzureOpenAI` client from env; throw on missing env. | No (env + SDK ctor) |
| `triage.ts` | One Azure chat-completion per item, validate response shape, return `TriageResult \| null`. | No (Azure, via SEAM) |
| `slug.ts` | Title → kebab-case slug + same-day collision suffix. | Yes |
| `frontmatter.ts` | Build the 12-key frontmatter object and serialize to YAML. | Yes |
| `write.ts` | Write `<date>-<slug>.md` under `/news/incoming/` with frontmatter + body. | No (fs) |
| `pr.ts` | Build `pr-body.md` from emitted items; write `$GITHUB_OUTPUT` step output; expose `execFile`-wrapped helper used only in tests. | No (fs + exec seam) |
| `logger.ts` | NF6 structured stdout lines; `::warning::`/`::error::` workflow commands. | No (stdout) |
| `index.ts` | Compose everything; the only file that wires real implementations together. | No |

### 1.3 Naming conventions

| Asset | Convention | Example |
|---|---|---|
| Source files | lowercase-kebab-case `.ts`, one per module | `azure-client.ts` |
| Test files | mirror source file with `.test.ts` suffix | `azure-client.test.ts` |
| Test fixtures | descriptive lowercase, under `tests/fixtures/` | `rss-2.0.xml` |
| Type aliases / interfaces | `PascalCase` | `FeedItem`, `TriageResult`, `FeedSource` |
| Type alias for unions / DTOs | `PascalCase`, no `I` prefix | `EnvConfig`, `EmittedItem` |
| Exception classes | `PascalCase` ending in `Error` | `MissingEnvVarError`, `MalformedTriageResponseError`, `ConfigSchemaError`, `AllFeedsFailedError`, `FeedFetchError`, `FeedParseError` |
| Functions | `camelCase`, verb-first | `loadConfig`, `fetchFeedXml`, `triageItem` |
| Constants | `SCREAMING_SNAKE_CASE` for module-level immutables | `FINGERPRINT_HEX_LENGTH`, `SLUG_MAX_LENGTH` |
| Test names | Sentence-form lowercase, matching the AC verbiage where possible | `it("skips items whose fingerprint exists in incoming or published")` |
| Branch | `news-triage/<YYYY-MM-DD>-<short-run-id>` (A11) | `news-triage/2026-05-18-a1b2c3d` |
| Commit message | `News triage <YYYY-MM-DD>` (matches PR title) | `News triage 2026-05-18` |

---

## 2. Data models

All shared types live in `pipeline/src/types.ts` and are re-exported from `index.ts`. Modules import from `./types.js` (note the `.js` extension — required by Node 22 ESM resolution).

```ts
// pipeline/src/types.ts

/**
 * One feed entry as it appears in config/rss-sources.json after JSON.parse.
 * Loader (config.ts) validates this shape and throws ConfigSchemaError on mismatch.
 */
export type FeedSource = {
  name: string;        // human label, e.g. "Anthropic news"
  url: string;         // absolute https URL
  enabled: boolean;    // disabled entries are skipped at the orchestrator level
};

/**
 * Normalized item shape emitted by parse.ts. F3 contract.
 * `guid` / `link` may be absent depending on feed quality — fingerprint.ts
 * walks the fallback chain (guid -> link -> title).
 */
export type FeedItem = {
  feedName: string;            // copied from FeedSource.name
  guid: string | null;         // feed-provided unique id when present
  link: string | null;         // canonical http(s) URL when present
  title: string;               // always present (used as last-resort fingerprint input)
  publishedAt: Date | null;    // null if feed omits the date
  rawContent: string | null;   // raw description/content for the AI prompt
};

/**
 * The four-field JSON object Azure OpenAI must return. F5 contract.
 * Validated by triage.ts before being used. Malformed -> MalformedTriageResponseError
 * (caught by the orchestrator, item dropped, raw payload logged).
 */
export type TriageResult = {
  relevant: boolean;
  audience: "beginner" | "advanced" | "both";
  topics: string[];           // non-empty array of short kebab-case-ish tags
  summary: string;            // two sentences
};

/**
 * The triaged item ready to be written. Combines FeedItem + TriageResult + the
 * run-date the orchestrator chose. write.ts and pr.ts both consume this.
 */
export type EmittedItem = {
  item: FeedItem;
  triage: TriageResult;        // guaranteed relevant === true at this point
  runDateUtc: string;          // YYYY-MM-DD
  fingerprint: string;         // 16 hex chars
  slug: string;                // post collision-resolution; final filename slug
  filename: string;            // <runDateUtc>-<slug>.md
};

/**
 * The 12-key frontmatter object. AC11 asserts EXACTLY these keys, no more, no less.
 * Order is the canonical emission order (matches DECISIONS.md "Shared content shape"
 * with `source` and `fingerprint` appended).
 */
export type NewsFrontmatter = {
  type: "news";
  title: string;
  audience: "beginner" | "advanced" | "both";
  topics: string[];
  internal: false;
  authored: string;            // YYYY-MM-DD
  last_reviewed: string;       // YYYY-MM-DD; equal to authored at emission
  external_link: string | null;
  deeper_link: null;           // always null at emission; humans fill in later
  ai_summary: string;
  source: string;              // feedName
  fingerprint: string;         // 16-char hex
};

/**
 * Aggregate result returned by the orchestrator to its caller (index.ts main()).
 * Drives the step-output and exit code.
 */
export type RunResult = {
  feedsAttempted: number;
  feedsFailed: { name: string; reason: string }[];
  itemsFetched: number;
  itemsDeduped: number;
  itemsJudgedIrrelevant: number;
  itemsWritten: EmittedItem[];
  exitCode: 0 | 1;
};

/**
 * Output of env.ts — the four validated AZURE_OPENAI_* values.
 */
export type EnvConfig = {
  endpoint: string;
  deployment: string;
  apiVersion: string;
  apiKey: string;
};
```

---

## 3. Public interfaces / contracts per module

Function signatures below are the contract Phase 6 Coders must respect. Where a parameter has a default value, that default IS the production wiring; tests override it through the DI seam (§7).

### 3.1 `env.ts`

```ts
import type { EnvConfig } from "./types.js";

export class MissingEnvVarError extends Error {
  constructor(public readonly variableName: string) {
    super(`Required environment variable ${variableName} is missing or empty`);
    this.name = "MissingEnvVarError";
  }
}

/**
 * Reads AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_VERSION,
 * AZURE_OPENAI_API_KEY from the supplied process-env-like object (defaults to
 * `process.env`). Throws MissingEnvVarError on the FIRST missing/empty value
 * — checked in declaration order — with the variable name in the message and
 * on the .variableName property (AC10).
 *
 * No fallbacks, no defaults, no `.env` file lookup.
 */
export function readEnv(env?: NodeJS.ProcessEnv): EnvConfig;
```

### 3.2 `config.ts`

```ts
import type { FeedSource } from "./types.js";

export class ConfigSchemaError extends Error {
  constructor(public readonly path: string, public readonly issue: string) {
    super(`Invalid config at ${path}: ${issue}`);
    this.name = "ConfigSchemaError";
  }
}

/**
 * Loads and validates config/rss-sources.json. Returns the FULL list (both
 * enabled and disabled entries); callers filter on .enabled themselves.
 *
 * Throws ConfigSchemaError if:
 *  - file is missing or not JSON
 *  - root is not an array
 *  - any entry is missing `name` (string), `url` (string), or `enabled` (boolean)
 *  - `url` is not an http(s) URL
 *
 * `fs` is injected for testability (memfs in tests; node:fs/promises in production).
 */
export function loadConfig(
  configPath: string,
  fs?: typeof import("node:fs/promises"),
): Promise<FeedSource[]>;
```

### 3.3 `fetch.ts`

```ts
export class FeedFetchError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number | null,  // null => network/timeout error
    message: string,
  ) {
    super(message);
    this.name = "FeedFetchError";
  }
}

/**
 * Fetches one feed URL over HTTPS. Returns the response body as a string.
 * Throws FeedFetchError on:
 *  - non-2xx status (status set, message includes URL + status code)
 *  - network error / timeout (status = null)
 *
 * Default request timeout: 15 seconds via AbortController.
 * `fetchImpl` defaults to `globalThis.fetch` (Node 22 native); tests inject vi.fn().
 */
export function fetchFeedXml(
  url: string,
  fetchImpl?: typeof globalThis.fetch,
  options?: { timeoutMs?: number },
): Promise<string>;
```

### 3.4 `parse.ts`

```ts
import type { FeedItem } from "./types.js";

export class FeedParseError extends Error {
  constructor(public readonly feedName: string, cause: unknown) {
    super(`Failed to parse feed "${feedName}": ${String(cause)}`);
    this.name = "FeedParseError";
    this.cause = cause;
  }
}

/**
 * Parses one feed's XML into normalized items. Uses @rowanmanning/feed-parser
 * under the hood; that library transparently handles RSS 2.0 and Atom and
 * throws `INVALID_FEED` on garbage — we wrap that in FeedParseError so the
 * orchestrator catches a single typed error per per-feed failure path (AC6).
 *
 * Pure: no I/O, only string-in/array-out.
 */
export function parseFeed(feedName: string, xml: string): FeedItem[];
```

### 3.5 `fingerprint.ts`

```ts
export const FINGERPRINT_HEX_LENGTH = 16;

/**
 * SHA-256 of (`feedName` + "\n" + (guid ?? link ?? title)), hex-encoded,
 * truncated to FINGERPRINT_HEX_LENGTH characters (A5).
 *
 * Deterministic, pure. Same input -> same output across machines/runs.
 * Uses node:crypto.createHash, NOT subtle crypto.
 */
export function computeFingerprint(item: {
  feedName: string;
  guid: string | null;
  link: string | null;
  title: string;
}): string;
```

### 3.6 `dedup.ts`

```ts
/**
 * Walks both folders recursively, reads the YAML frontmatter of every *.md
 * file (via gray-matter), collects the `fingerprint` field. Files without a
 * `fingerprint` field are tolerated (logged at warn, not fatal) — they're
 * pre-pipeline content, not RSS emissions.
 *
 * Missing folders are tolerated and treated as empty (returns Set<string>()
 * without error). This is the path the very first run takes before any
 * news file exists.
 *
 * `fs` is injected for testability (memfs in tests).
 *
 * Returns a SYNC-friendly Set<string> — the orchestrator calls this once
 * up-front and uses .has() in a tight per-item loop.
 */
export function loadSeenFingerprints(
  newsRoot: string,                                 // e.g. "/<repo>/news"
  fs?: typeof import("node:fs/promises"),
): Promise<Set<string>>;

/**
 * Convenience predicate for the orchestrator loop. Pure function over a
 * pre-loaded set — no I/O. Returns true iff the fingerprint should be
 * processed (i.e., NOT yet seen).
 */
export function isUnseen(
  fingerprint: string,
  seen: Set<string>,
): boolean;
```

> **Note on sync vs async.** `loadSeenFingerprints` is async (reads many files). `isUnseen` is sync (set membership). The orchestrator does I/O once, then loops in memory. This matches AC7's "no Azure call for skipped items" performance contract.

### 3.7 `azure-client.ts`

```ts
import type { AzureOpenAI } from "openai";
import type { EnvConfig } from "./types.js";

/**
 * Constructs an AzureOpenAI client from a validated EnvConfig (or from
 * process.env when called without args — env.ts is invoked internally).
 *
 * MissingEnvVarError is thrown by env.ts before the AzureOpenAI constructor
 * is reached, so AC10 fails cleanly with the variable name in the message.
 *
 * The returned client routes by deployment URL path. Callers MUST still pass
 * `model: <deployment>` to chat.completions.create (R-6 / Investigation §1
 * gotcha 1). See triage.ts.
 */
export function makeAzureClient(env?: EnvConfig): AzureOpenAI;
```

### 3.8 `triage.ts`

```ts
import type { AzureOpenAI } from "openai";
import type { FeedItem, TriageResult } from "./types.js";

export class MalformedTriageResponseError extends Error {
  constructor(public readonly rawPayload: string, public readonly issue: string) {
    super(`Malformed Azure OpenAI triage response: ${issue}`);
    this.name = "MalformedTriageResponseError";
  }
}

/**
 * Calls Azure OpenAI chat completions for one item. Returns:
 *  - TriageResult when the response is well-formed AND relevant === true
 *  - null when the response is well-formed AND relevant === false (drop item, AC9)
 *
 * Throws MalformedTriageResponseError on shape mismatch (AC8 negative path);
 * the orchestrator catches this per-item and continues with the next item.
 *
 * Call-site contract (R-6):
 *   client.chat.completions.create({
 *     model: deployment,                       // deployment name, passed explicitly
 *     messages: [{role:"system", content: SYSTEM_PROMPT}, {role:"user", ...}],
 *     temperature: 0,
 *     response_format: { type: "json_object" },
 *   })
 *
 * SYSTEM_PROMPT MUST contain the literal word "JSON" (Investigation §1 gotcha 2).
 */
export function triageItem(
  client: AzureOpenAI,
  deployment: string,
  item: FeedItem,
): Promise<TriageResult | null>;
```

### 3.9 `slug.ts`

```ts
export const SLUG_MAX_LENGTH = 60;

/**
 * Title -> kebab-case slug:
 *  - lowercase
 *  - strip non-alphanumerics (replace with "-")
 *  - collapse runs of "-"; trim leading/trailing "-"
 *  - truncate to SLUG_MAX_LENGTH at a word boundary (last "-" before the cap)
 *
 * Pure. Does NOT apply collision suffix — that's caller's job.
 */
export function slugify(title: string): string;

/**
 * Given a base slug and the set of slugs already taken on the SAME run-date,
 * returns a unique slug: the base if untaken, else `<base>-2`, `<base>-3`, …
 * (A4 collision rule).
 */
export function resolveSlugCollision(
  baseSlug: string,
  takenSlugsForDate: Set<string>,
): string;
```

### 3.10 `frontmatter.ts`

```ts
import type { EmittedItem, NewsFrontmatter } from "./types.js";

/**
 * Builds the 12-key frontmatter object from an EmittedItem.
 *  - `type` is always "news"
 *  - `internal` is always false
 *  - `deeper_link` is always null
 *  - `last_reviewed` equals `authored` (the run date)
 * AC11 asserts the exact key set; the function MUST produce no extra keys.
 *
 * Pure.
 */
export function buildFrontmatter(emitted: EmittedItem): NewsFrontmatter;

/**
 * Serializes a NewsFrontmatter object to a YAML block (no leading/trailing "---"
 * fence; callers add the fence in the markdown file). Uses gray-matter or
 * js-yaml under the hood; both preserve key order if we pass a plain object
 * with insertion-order keys.
 *
 * Pure.
 */
export function serializeFrontmatter(fm: NewsFrontmatter): string;
```

### 3.11 `write.ts`

```ts
import type { EmittedItem } from "./types.js";

/**
 * Writes <newsRoot>/incoming/<filename> with:
 *
 *   ---
 *   <yaml frontmatter>
 *   ---
 *
 *   <triage.summary>
 *
 *   > Source: [<feedName>](<link>)
 *
 * Creates the incoming/ folder if missing (already enforced via .gitkeep,
 * but mkdir -p is cheap insurance for fresh checkouts).
 *
 * Throws if the file already exists at the target path (slug collision MUST
 * have been resolved upstream by resolveSlugCollision; throwing here is a
 * loud-failure invariant guard).
 *
 * `fs` is injected for testability.
 */
export function writeNewsItem(
  emitted: EmittedItem,
  newsRoot: string,
  fs?: typeof import("node:fs/promises"),
): Promise<string>;   // returns absolute path written
```

### 3.12 `pr.ts`

```ts
import type { EmittedItem } from "./types.js";

/**
 * Builds the markdown body of the editorial PR. Grouped/sorted by source
 * (feed name), with one bullet per item showing: title, source, external_link,
 * ai_summary (R-5).
 *
 * Pure. Output is a single string.
 */
export function buildPrBody(items: EmittedItem[], runDateUtc: string): string;

/**
 * Writes the PR body to <pipelineDir>/pr-body.md so the workflow's
 * shell step can `gh pr create --body-file pipeline/pr-body.md`.
 *
 * Returns the absolute path written.
 */
export function writePrBodyFile(
  body: string,
  pipelineDir: string,
  fs?: typeof import("node:fs/promises"),
): Promise<string>;

/**
 * Appends `<name>=<value>\n` to the file at $GITHUB_OUTPUT (which the
 * GitHub Actions runner provides). When $GITHUB_OUTPUT is unset (e.g.,
 * local dev), prints to stdout with the prefix "::set-output (legacy)::"
 * for visibility but does not throw.
 *
 * `name === "new_items"`, `value === "true" | "false"`.
 */
export function setStepOutput(
  name: string,
  value: string,
  env?: NodeJS.ProcessEnv,
  fs?: typeof import("node:fs/promises"),
): Promise<void>;

/**
 * Test-only helper. The production path is the workflow YAML's inline
 * shell block (Investigation §3); this function exists so pr.test.ts can
 * assert the contract for `gh pr create` invocations against a mocked
 * execFile (R-7 cwd assertion). NOT called by index.ts in production.
 *
 * Default `exec` is a thin wrapper around child_process.execFile that
 * passes `cwd: process.env.GITHUB_WORKSPACE ?? process.cwd()` per R-7.
 */
export function createPullRequest(args: {
  branch: string;
  title: string;
  bodyFilePath: string;
  baseBranch?: string;                 // default "main"
  exec?: (cmd: string, args: string[], opts: { cwd: string }) => Promise<{ stdout: string; stderr: string }>;
  env?: NodeJS.ProcessEnv;
}): Promise<{ prUrl: string }>;
```

### 3.13 `logger.ts`

```ts
/**
 * Structured stdout logging for NF6. Each method emits a single line.
 * `warn` and `error` use GitHub Actions workflow commands (`::warning::`
 * and `::error::`) so they surface in the run summary UI (Investigation §6).
 *
 * All methods accept a free-form object that gets JSON-stringified onto
 * the same line for grep-friendliness.
 */
export type Logger = {
  info: (event: string, fields?: Record<string, unknown>) => void;
  warn: (event: string, fields?: Record<string, unknown>) => void;
  error: (event: string, fields?: Record<string, unknown>) => void;
};

export function makeLogger(stream?: NodeJS.WritableStream): Logger;
```

### 3.14 `index.ts`

```ts
import type { RunResult } from "./types.js";

/**
 * Composition root. Reads env, loads config, walks /news for seen fingerprints,
 * processes each enabled feed with Promise.allSettled (per-feed failure
 * non-fatal — AC6), triages new items, writes markdown, builds PR body,
 * sets step output. Returns a structured RunResult; the CLI entry point
 * (the `main()` IIFE at the bottom of the file) translates exit code 0/1.
 *
 * Failure semantics:
 *  - MissingEnvVarError -> propagates, exit 1 (no orchestrator wrapping)
 *  - ConfigSchemaError -> propagates, exit 1
 *  - "no enabled feeds in config" -> log error, exit 1 (Investigation §6 #2)
 *  - per-feed FeedFetchError / FeedParseError -> log ::warning::, continue
 *  - all feeds failed -> log ::error::, throw AllFeedsFailedError, exit 1
 *  - per-item MalformedTriageResponseError -> log ::warning::, skip item
 *  - per-item writeNewsItem throws -> log ::error::, exit 1
 *    (write failure is a runner-environment problem, not a content problem)
 *
 * All five DI seams (§7) are exposed as parameters with sensible defaults.
 */
export type RunOptions = {
  repoRoot?: string;                   // default: process.cwd() resolved up to nearest git root
  configPath?: string;                 // default: <repoRoot>/config/rss-sources.json
  newsRoot?: string;                   // default: <repoRoot>/news
  pipelineDir?: string;                // default: <repoRoot>/pipeline
  now?: () => Date;                    // default: () => new Date()
  fetchImpl?: typeof globalThis.fetch; // default: globalThis.fetch
  fs?: typeof import("node:fs/promises");
  makeClient?: () => AzureOpenAI;      // default: () => makeAzureClient()
  logger?: Logger;                     // default: makeLogger(process.stdout)
};

export class AllFeedsFailedError extends Error {
  constructor(public readonly failures: { name: string; reason: string }[]) {
    super(`All ${failures.length} feeds failed`);
    this.name = "AllFeedsFailedError";
  }
}

export async function run(options?: RunOptions): Promise<RunResult>;

// CLI bottom of file (no exported symbol):
//   run().then(r => process.exit(r.exitCode)).catch(err => { logger.error(...); process.exit(1) });
```

---

## 4. Error handling strategy

### 4.1 Exception class catalogue

All named exceptions live with the module that owns them (declared above). The full catalogue:

| Class | Thrown by | Caught by | Propagates? |
|---|---|---|---|
| `MissingEnvVarError` | `env.ts` | `index.ts` top-level only | Yes — exit 1 (AC10) |
| `ConfigSchemaError` | `config.ts` | `index.ts` top-level only | Yes — exit 1 |
| `FeedFetchError` | `fetch.ts` | per-feed `try/catch` in `index.ts` | No — logged as `::warning::`, feed counted as failed |
| `FeedParseError` | `parse.ts` | per-feed `try/catch` in `index.ts` | No — logged as `::warning::`, feed counted as failed |
| `MalformedTriageResponseError` | `triage.ts` | per-item `try/catch` in `index.ts` | No — logged as `::warning::`, item dropped |
| `AllFeedsFailedError` | `index.ts` (synthesized when every feed in `Promise.allSettled` rejected AND `feeds.length > 0`) | `index.ts` main()  | Yes — exit 1 (Investigation §6, A14 strict reading) |
| Unknown errors (fs write failures, OS-level) | anywhere | `index.ts` main() catch-all | Yes — `::error::` log, exit 1 |

### 4.2 Decision rules

- **Configuration errors (env, config file) are fatal.** They are programming/operator mistakes, never transient. No retry, no fallback. Exit 1 with a message that names the offender (variable name, file path).
- **Per-feed network/parse errors are NOT fatal.** A14, AC6 — a 429 from Reddit must not block the four other feeds. `Promise.allSettled` is the wrap; each `rejected` result is logged with the feed name and the error message at warn level, then dropped.
- **All feeds failed is fatal.** Distinguished from "zero items emitted after triage" by counting rejections from `Promise.allSettled` against feed count. A14 strict reading.
- **Empty config is fatal.** `config.ts` returns the loaded array; `index.ts` filters to enabled, asserts `enabled.length > 0` before the feed loop, exits 1 if not.
- **Per-item triage errors are NOT fatal.** A malformed Azure response, an Azure 5xx, a network blip mid-call — log at warn level (with the raw payload truncated to 500 chars for diagnosis), drop the item, continue with the next.
- **Filesystem write errors ARE fatal.** If we can't write to `/news/incoming/`, the runner is broken and the whole run is suspect. Exit 1.
- **PR-creation failures are workflow-level, not pipeline-level.** The Node program completes successfully (exit 0) once it has emitted files and set `new_items=true`; if the subsequent `gh pr create` shell step fails, the workflow job goes red but `index.ts` has already finished.

### 4.3 Workflow-level error surface

NF6 dictates the per-run log contents; §3.13 specifies the logger. The orchestrator emits exactly these structured lines on stdout:

```
INFO  pipeline_start            { repo, configPath, newsRoot, runDateUtc }
INFO  feeds_attempted           { count: 5 }
WARN  feed_failed               { name, reason }            ← one per failed feed
INFO  feed_succeeded            { name, itemsFetched }      ← one per OK feed
INFO  items_fetched_total       { count }
INFO  items_deduped             { count }
INFO  items_judged_irrelevant   { count }
INFO  items_written             { count, filenames: [...] }
INFO  pipeline_end              { exitCode, durationMs }
```

`WARN` lines also emit a `::warning file=...,line=...::<msg>` GitHub workflow command to bubble into the run UI; `ERROR` emits `::error::`.

---

## 5. Configuration model

### 5.1 `config/rss-sources.json` schema

JSON, top-level array. TypeScript type (for the parsed-and-validated result):

```ts
type RssSourcesFile = FeedSource[];

// FeedSource defined in §2:
//   { name: string; url: string; enabled: boolean }
```

Validation rules in `config.ts`:

| Rule | On violation |
|---|---|
| File exists and is readable | `ConfigSchemaError("rss-sources.json", "file missing or unreadable")` |
| Parses as JSON | `ConfigSchemaError("rss-sources.json", "invalid JSON: <reason>")` |
| Root is an array | `ConfigSchemaError("rss-sources.json", "root must be an array")` |
| Each entry has `name` (non-empty string) | `ConfigSchemaError("rss-sources.json[<i>].name", "missing or empty")` |
| Each entry has `url` (non-empty string starting with `https://`) | `ConfigSchemaError("rss-sources.json[<i>].url", "must be https URL")` |
| Each entry has `enabled` (boolean) | `ConfigSchemaError("rss-sources.json[<i>].enabled", "must be boolean")` |
| No extra top-level keys per entry | Tolerated (forward-compatible — fields like `tags`, `notes` may be added later without breaking the loader) |
| Array may be empty at parse time, but `enabled.length > 0` check in orchestrator catches it | `index.ts` exits 1 with "no enabled feeds in config" message |

### 5.2 Seed contents (Step 2)

```json
[
  { "name": "Anthropic news",            "url": "https://www.anthropic.com/rss.xml",                                                          "enabled": true },
  { "name": "Claude Code releases",      "url": "https://github.com/anthropics/claude-code/releases.atom",                                    "enabled": true },
  { "name": "Simon Willison",            "url": "https://simonwillison.net/atom/everything/",                                                  "enabled": true },
  { "name": "r/ClaudeAI",                "url": "https://www.reddit.com/r/ClaudeAI/.rss",                                                      "enabled": true },
  { "name": "Hacker News (Claude/Anthropic)", "url": "https://hnrss.org/frontpage?q=Claude+OR+%22Claude+Code%22+OR+Anthropic",                "enabled": true }
]
```

### 5.3 Environment variable enumeration

| Variable | Owner | Type | On missing |
|---|---|---|---|
| `AZURE_OPENAI_ENDPOINT` | env.ts | string (https URL) | `MissingEnvVarError("AZURE_OPENAI_ENDPOINT")` |
| `AZURE_OPENAI_DEPLOYMENT` | env.ts | string (deployment name) | `MissingEnvVarError("AZURE_OPENAI_DEPLOYMENT")` |
| `AZURE_OPENAI_API_VERSION` | env.ts | string (e.g., `2024-10-21`) | `MissingEnvVarError("AZURE_OPENAI_API_VERSION")` |
| `AZURE_OPENAI_API_KEY` | env.ts | string (Azure key, treated as opaque) | `MissingEnvVarError("AZURE_OPENAI_API_KEY")` |
| `GITHUB_WORKSPACE` | pr.ts (R-7) | string (absolute path) | Falls back to `process.cwd()` — this is the ONE permitted fallback in the codebase, narrowly scoped to `cwd` for `execFile` and documented inline. Not a configuration value. |
| `GITHUB_OUTPUT` | pr.ts | string (absolute path to step-output file) | Treated as "we're not in CI" — `setStepOutput` logs to stdout instead of throwing |
| `GITHUB_RUN_ID` | workflow YAML (not Node) | string | Workflow uses `${GITHUB_RUN_ID:0:7}` for branch suffix |
| `GH_TOKEN` | workflow YAML | string | `gh pr create` fails if absent; workflow YAML sets it from `secrets.GITHUB_TOKEN` |

### 5.4 Where defaults live (or don't)

**Configuration: nowhere.** No `||` fallbacks in any source file for `AZURE_OPENAI_*`. No `.env` file lookup. Per the global rule, missing = throw.

**Operational defaults** (not configuration) live as named constants at the top of their owning module:

- `FINGERPRINT_HEX_LENGTH = 16` in `fingerprint.ts`
- `SLUG_MAX_LENGTH = 60` in `slug.ts`
- `DEFAULT_FETCH_TIMEOUT_MS = 15_000` in `fetch.ts`
- `DEFAULT_TRIAGE_TEMPERATURE = 0` in `triage.ts`
- `DEFAULT_TRIAGE_MAX_TOKENS = 400` in `triage.ts` (room for the four-field JSON plus a 200-char summary)
- Branch-prefix `"news-triage/"` in pr.ts and in the workflow YAML's inline shell (must match)

These are code constants, not configuration. Changing them requires a code change; that's intentional.

---

## 6. Workflow YAML structure

File: `/Users/suzy/ClaudeCode/Projects/NbgAiHub/.github/workflows/rss-triage.yml`

```yaml
name: rss-triage

on:
  schedule:
    - cron: "0 6 * * *"        # A2 placeholder — daily 06:00 UTC
  workflow_dispatch: {}

permissions:
  contents: write              # to push the news-triage/... branch
  pull-requests: write         # to open the PR

concurrency:
  group: rss-triage            # fixed; cron is default-branch-only (R-2)
  cancel-in-progress: false    # finish a running pipeline rather than killing mid-PR

jobs:
  triage:
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - uses: actions/checkout@v4
        # NOTE: default persist-credentials=true is load-bearing for `git push` below.
        # Do not set persist-credentials: false without re-wiring auth.

      - uses: actions/setup-node@v4
        with:
          node-version-file: pipeline/.nvmrc
          cache: npm
          cache-dependency-path: pipeline/package-lock.json

      - run: npm ci
        working-directory: pipeline

      - run: npm run build
        working-directory: pipeline

      - id: pipeline
        run: npm run start
        working-directory: pipeline
        env:
          AZURE_OPENAI_ENDPOINT:    ${{ secrets.AZURE_OPENAI_ENDPOINT }}
          AZURE_OPENAI_DEPLOYMENT:  ${{ secrets.AZURE_OPENAI_DEPLOYMENT }}
          AZURE_OPENAI_API_VERSION: ${{ secrets.AZURE_OPENAI_API_VERSION }}
          AZURE_OPENAI_API_KEY:     ${{ secrets.AZURE_OPENAI_API_KEY }}

      - name: Open editorial PR
        if: steps.pipeline.outputs.new_items == 'true'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -euo pipefail
          DATE_UTC=$(date -u +%F)
          BRANCH="news-triage/${DATE_UTC}-${GITHUB_RUN_ID:0:7}"
          git config user.name  "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git checkout -b "$BRANCH"
          git add news/incoming
          git commit -m "News triage ${DATE_UTC}"
          git push origin "$BRANCH"
          gh pr create \
            --base main \
            --head "$BRANCH" \
            --title "News triage ${DATE_UTC}" \
            --body-file pipeline/pr-body.md
```

**AC18 compliance:** the `permissions:` block contains exactly two entries and nothing else.

**AC1 compliance:** schedule + workflow_dispatch triggers; permissions present; four `AZURE_OPENAI_*` secrets referenced by name.

**R-2 compliance:** concurrency block present with fixed group and `cancel-in-progress: false`.

**Pipeline ↔ workflow contract:** the Node program sets `new_items=true|false` via `$GITHUB_OUTPUT`; the workflow gates the PR step on `steps.pipeline.outputs.new_items == 'true'`. This is the single load-bearing inter-step contract.

---

## 7. Dependency-injection seams

Five seams, all parameterized through optional function arguments with production defaults. No DI container, no class hierarchies — just function parameters. This is the minimum that lets every test substitute mocks without monkey-patching globals.

| # | Seam | Production wiring | Test substitution |
|---|---|---|---|
| 1 | **HTTP** (`fetch.ts`) | `fetchImpl = globalThis.fetch` | `vi.fn()` returning a `Response`-shaped object; or a hand-rolled fake that throws to exercise the FeedFetchError path. |
| 2 | **Filesystem** (`config.ts`, `dedup.ts`, `write.ts`, `pr.ts`) | `fs = node:fs/promises` | `memfs.promises` — investigated and approved (Investigation §4 point 3). Pass into each function call. The orchestrator (`index.ts`) accepts a single `fs` option and threads it through. |
| 3 | **AzureOpenAI client** (`azure-client.ts` + `triage.ts`) | `makeClient = () => makeAzureClient()` returning `new AzureOpenAI(...)` | The `vi.hoisted` pattern from Investigation §4 point 1. `vi.mock("openai", () => ({ AzureOpenAI: vi.fn().mockImplementation(() => ({ chat: { completions: { create: mocks.create } } })) }))`. Tests assert `mocks.create.mock.calls[0]` to verify R-6's model parameter and the system prompt content. |
| 4 | **exec / `gh` CLI** (`pr.ts.createPullRequest` only — production path is the YAML's inline shell) | `exec = (cmd, args, opts) => util.promisify(execFile)(cmd, args, opts)` with `cwd: GITHUB_WORKSPACE ?? cwd` per R-7 | `vi.fn(async (cmd, args, opts) => ({ stdout: "...", stderr: "" }))`. Tests assert the call shape: command was `gh`, args contain `["pr","create","--title","News triage 2026-05-18", ...]`, `opts.cwd` equals `GITHUB_WORKSPACE` when set. |
| 5 | **Clock** (`index.ts`) | `now = () => new Date()` | `now = () => new Date("2026-05-18T06:00:00Z")` — fixes the run date that flows into filename, frontmatter `authored`/`last_reviewed`, PR title, branch name. |

**Wiring pattern.** Each seam is the LAST parameter of the function (or the LAST property of an options object) with a default. Tests pass an override; production code passes nothing. Example:

```ts
// production:    await fetchFeedXml(url);
// test:          await fetchFeedXml(url, fakeFetch);
```

The orchestrator (`index.ts`) accepts a single `RunOptions` object exposing all five seams. `tests/orchestrator.test.ts` constructs a fully-mocked options bundle and runs the end-to-end flow in-memory with no real network/fs/Azure.

**Explicit non-seams.** Logger, crypto (for fingerprint), YAML serializer, and the feed parser library itself are NOT seams. They are deterministic, side-effect-free or stdout-only, and have no testability problem requiring substitution.

---

## 8. Integration points

### 8.1 GitHub Action runner ↔ pipeline

- Runner invokes `npm run start` (defined in `pipeline/package.json` as `node dist/index.js`).
- Working directory is `pipeline/`; the runner has already `actions/checkout`-ed the repo, so the parent directory is the repo root.
- The pipeline locates the repo root by walking up from `pipeline/` (one level — `path.resolve(import.meta.url, "..", "..")`). `index.ts` resolves `configPath`, `newsRoot`, and `pipelineDir` from that root unless overridden.
- Exit code: 0 = success (with or without new items); 1 = any fatal error per §4.2.
- Step output `new_items` is set on `$GITHUB_OUTPUT` via the standard `<name>=<value>\n` append protocol.

### 8.2 Pipeline ↔ filesystem

- **Read** `<repoRoot>/config/rss-sources.json` (one read per run, sync to the orchestrator).
- **Read** every `.md` under `<repoRoot>/news/incoming/` and `<repoRoot>/news/published/` (recursive, frontmatter only — body parsed but discarded). One pass per run.
- **Write** `<repoRoot>/news/incoming/<YYYY-MM-DD>-<slug>.md` per emitted item.
- **Write** `<repoRoot>/pipeline/pr-body.md` once per run if any item was emitted.
- **Write** `$GITHUB_OUTPUT` (append) once per run.

The pipeline never deletes, never reads outside these locations, never writes outside these locations.

### 8.3 Pipeline ↔ Azure OpenAI

- One `chat.completions.create` call per new, non-duplicate item. Call shape per R-6 / §3.8.
- Auth: `api-key` header injected by the SDK from the constructor's `apiKey`.
- Timeouts: rely on the SDK's defaults (60s). No custom retry on top — per-item failures are caught and logged; one transient blip means one dropped item, not a stalled run.
- Cost estimate (Investigation): ~5 feeds × ~20 items × ~500 input tokens × `gpt-4o-mini` rates ≈ $0.10/day. Documented in `SECRETS.md`.

### 8.4 Pipeline ↔ `gh` CLI

- **Production path:** the workflow YAML's inline shell step is the actual integration. The Node program only WRITES `pr-body.md` and signals `new_items=true`; the shell does branch/commit/push/`gh pr create`.
- **Test-only path:** `pr.ts.createPullRequest` exists so `pr.test.ts` can assert the call shape that the YAML emits. The function is exported but not called from `index.ts`.
- `gh` finds its auth via `GH_TOKEN` (env var; workflow sets it to `secrets.GITHUB_TOKEN`).
- `cwd` for any `execFile` call is `process.env.GITHUB_WORKSPACE ?? process.cwd()` — R-7. Asserted in `pr.test.ts`.

---

## 9. Parallel implementation unit assignments

This is the Phase 6 Coder contract. **Confirms the plan §3 parallelization map.** Each unit owns a set of files, depends on a set of barriers, and respects a contract surface (the type aliases, function signatures, and exception classes from §3 above). **No two units write to the same file.**

### Unit A — Pure modules (one Coder)
**Plan steps:** 3a, 3b, 3c.
**Files owned (writes):**
- `pipeline/src/fingerprint.ts`
- `pipeline/src/slug.ts`
- `pipeline/src/frontmatter.ts`
- `pipeline/tests/fingerprint.test.ts`
- `pipeline/tests/slug.test.ts`
- `pipeline/tests/frontmatter.test.ts`

**Depends on:** Unit "Scaffold" (Step 1) — must be complete before this unit starts. Also reads `pipeline/src/types.ts` (created as part of scaffold; if not, this unit creates it).

**Contract surface (must respect):**
- Function signatures in §3.5, §3.9, §3.10 exactly.
- `FINGERPRINT_HEX_LENGTH = 16`, `SLUG_MAX_LENGTH = 60` exported.
- `buildFrontmatter` returns exactly the 12 keys in §2's `NewsFrontmatter` order.

**Must not touch:** any other `src/` or `tests/` file.

---

### Unit B — Env + Azure client (one Coder)
**Plan step:** 4.
**Files owned (writes):**
- `pipeline/src/env.ts`
- `pipeline/src/azure-client.ts`
- `pipeline/tests/env.test.ts`
- `pipeline/tests/azure-client.test.ts`

**Depends on:** Scaffold; reads `pipeline/src/types.ts` for `EnvConfig`.

**Contract surface:**
- Function signatures in §3.1, §3.7 exactly.
- `MissingEnvVarError` exported with `variableName` public readonly field.
- `readEnv()` checks env vars in the declaration order `ENDPOINT, DEPLOYMENT, API_VERSION, API_KEY` and throws on the FIRST missing — required so AC10's four sibling tests can assert deterministic ordering.

**Must not touch:** any other file.

---

### Unit C — Config + parser + fetcher (one Coder)
**Plan steps:** 5, 6, 7.
**Files owned (writes):**
- `pipeline/src/config.ts`
- `pipeline/src/parse.ts`
- `pipeline/src/fetch.ts`
- `pipeline/tests/config.test.ts`
- `pipeline/tests/parse.test.ts`
- `pipeline/tests/fetch.test.ts`
- `pipeline/tests/fixtures/rss-sources.valid.json`
- `pipeline/tests/fixtures/rss-sources.invalid.json`
- `pipeline/tests/fixtures/rss-2.0.xml`
- `pipeline/tests/fixtures/atom.xml`
- `pipeline/tests/fixtures/malformed.xml`

**Depends on:** Scaffold; reads `pipeline/src/types.ts` for `FeedSource`, `FeedItem`.

**Contract surface:**
- Function signatures in §3.2, §3.3, §3.4 exactly.
- `ConfigSchemaError`, `FeedFetchError`, `FeedParseError` exported with the fields declared in §3.
- `parseFeed` returns `FeedItem[]` matching §2 (guid/link nullable, publishedAt nullable, rawContent nullable).

**Must not touch:** any other file. (`config/rss-sources.json` is owned by the "Seed" unit below.)

---

### Unit Seed — Seed config (can be done by Unit C's Coder or any other; trivial)
**Plan step:** 2.
**Files owned (writes):**
- `/Users/suzy/ClaudeCode/Projects/NbgAiHub/config/rss-sources.json` (the five seed feeds per §5.2)

**Depends on:** nothing.

---

### ── Barrier 1 ──

After Units A, B, C, Seed: types are stable, env reading is testable, parser produces `FeedItem[]`, fetch is mockable.

---

### Unit D — Dedup + triage + write (three parallel Coders — D1, D2, D3)
**Plan steps:** 8, 9, 10.

**Unit D1 — dedup**
- Writes: `pipeline/src/dedup.ts`, `pipeline/tests/dedup.test.ts`, `pipeline/tests/fixtures/existing-news/*`
- Also writes the `.gitkeep` files: `/Users/suzy/ClaudeCode/Projects/NbgAiHub/news/incoming/.gitkeep`, `/Users/suzy/ClaudeCode/Projects/NbgAiHub/news/published/.gitkeep`
- Depends on Unit A (`fingerprint.ts` for typing only).
- Contract: §3.6 exactly. `loadSeenFingerprints` is async; `isUnseen` is sync.

**Unit D2 — triage**
- Writes: `pipeline/src/triage.ts`, `pipeline/tests/triage.test.ts`, `pipeline/tests/fixtures/triage-response.valid.json`, `pipeline/tests/fixtures/triage-response.malformed.json`
- Depends on Unit B (`AzureOpenAI` client type; the client is injected).
- Contract: §3.8 exactly. `MalformedTriageResponseError` exported. System prompt MUST contain literal "JSON". Call site MUST pass `model: deployment`, `temperature: 0`, `response_format: { type: "json_object" }` — all three asserted in tests.

**Unit D3 — write**
- Writes: `pipeline/src/write.ts`, `pipeline/tests/write.test.ts`
- Depends on Unit A (`slug.ts`, `frontmatter.ts`).
- Contract: §3.11 exactly. Throws if target file already exists (slug-collision invariant guard). Returns the absolute path written.

**No two D-units write to the same file.** All three can ship in parallel after Barrier 1.

---

### ── Barrier 2 ──

After Unit D: all building blocks exist. Only orchestration and the PR helper remain.

---

### Unit E — Orchestrator + PR helper (two parallel Coders — E1, E2)

**Unit E1 — orchestrator + logger**
- Writes: `pipeline/src/logger.ts`, `pipeline/src/index.ts`, `pipeline/tests/orchestrator.test.ts`
- Depends on ALL prior `src/` modules.
- Contract: §3.13, §3.14 exactly. Exposes the five-seam `RunOptions`. Exits 0 on success, 1 on fatal. Emits the eight NF6 log lines from §4.3.

**Unit E2 — pr.ts**
- Writes: `pipeline/src/pr.ts`, `pipeline/tests/pr.test.ts`
- Depends on Unit A (`EmittedItem` type), Unit D3 conceptually (consumes the items it emits).
- Contract: §3.12 exactly. `buildPrBody` is pure and groups by source. `setStepOutput` writes to `$GITHUB_OUTPUT`. `createPullRequest` is test-only (production path is YAML shell) but exists so the seam contract is asserted.

**E1 and E2 do not share files.** E1's `index.ts` imports from `pr.ts` (Unit E2) by name only — the import works as soon as E2's file exists at compile time.

---

### ── Barrier 3 ──

After Unit E: the Node program is complete and tests pass.

---

### Unit F — Workflow YAML + docs (two parallel Coders — F1, F2)

**Unit F1 — workflow YAML**
- Writes: `/Users/suzy/ClaudeCode/Projects/NbgAiHub/.github/workflows/rss-triage.yml`
- Contract: §6 exactly. AC1 + AC18 + R-2 + R-7 references explicit.

**Unit F2 — docs**
- Writes: `/Users/suzy/ClaudeCode/Projects/NbgAiHub/SECRETS.md`, `/Users/suzy/ClaudeCode/Projects/NbgAiHub/pipeline/README.md`
- Per plan Step 14: documents the four secrets, the repo-level "Allow GitHub Actions to create and approve pull requests" toggle (A15), the Reddit 429 known weak-spot (R-3), the deployment-vs-model gotcha, the cost estimate, and the editorial workflow (F10).

**Project-design.md updates (Phase 5, this file)** and **project-functions.md** are already authored — they live in `docs/design/` and are owned by the Designer + planner.

---

### Critical path

`Scaffold → Unit B → Unit D2 (triage) → Unit E1 (orchestrator) → Unit F1 (workflow) → Phase 9 (live demo run)`.

Six serial gates. Every other unit can ship in parallel within its barrier window.

### File-ownership invariant

No two units write to the same path. Each file in §1.2 is owned by exactly one unit. The Designer (this document) does not touch source files; Phase 6 Coders do not touch design docs. This is the contract that makes parallel Coder execution safe.

---

## 10. Cross-cutting design rules

1. **ESM-only.** Every import path includes the `.js` extension (Node 22 ESM resolution requirement). `package.json` has `"type": "module"`.
2. **TypeScript strict.** `tsconfig.json` sets `"strict": true`, `"noUncheckedIndexedAccess": true`, `"exactOptionalPropertyTypes": true`. No `any`.
3. **No fallback for required config.** Enforced at code-review time by §4.2; tested by AC10's four-sibling test.
4. **No mutation of `process.env`** in any test. Use `vi.stubEnv` + `vi.unstubAllEnvs` in `afterEach` (Investigation §4 point 2).
5. **`memfs` for filesystem tests.** No real fs writes in unit tests. The orchestrator test uses `memfs` + injected `now` + mocked `fetch` + mocked AzureOpenAI for a fully hermetic end-to-end run.
6. **No `--no-verify`** on commits, no `--force` pushes, no rebases — the workflow YAML's shell does plain `commit`/`push` only.
7. **`last_reviewed` semantics** (Investigation §8e): at emission, equal to `authored` (the run date UTC). When a human editor moves the file from `/incoming/` to `/published/`, they MUST bump `last_reviewed` to their date. This is documented in `pipeline/README.md` (Unit F2) and in project-functions.md F10.
8. **No premature abstraction.** No interfaces for single implementations. No generic "FeedSourceAdapter" — all feeds are RSS/Atom parsed by one library. If Reddit-OAuth or a JSON-API feed is ever added, refactor then.

---

## 11. Verification checklist for this design

The design is correct iff every row below holds. The Phase 6 Coder spec is exactly this table + §9.

| Requirement | Where in this doc |
|---|---|
| 18 ACs from refined-request §Acceptance Criteria mapped to modules | §3 + §6 (per-AC mapping in plan §4 is unchanged) |
| F1–F10 functional contract honored | §1.1, §2, §3, §6 |
| 5 DI seams from Investigation §5 | §7 |
| No-fallback-config rule (global CLAUDE.md) | §4.1, §4.2, §5.4 |
| Shared content shape (DECISIONS.md) for frontmatter | §2 (`NewsFrontmatter`) — 10 canonical keys + `source` + `fingerprint` |
| `concurrency` block (R-2) | §6 |
| `cwd: GITHUB_WORKSPACE ?? cwd` (R-7) | §3.12, §7 row 4 |
| Node 22 + ESM (R-4) | §1.2, §10 |
| `model: deployment` at chat.completions.create (R-6) | §3.8 |
| `@rowanmanning/feed-parser` (R-1) | §1.2, §3.4 |
| PR body content shape (R-5) | §3.12 (`buildPrBody`) |
| File-ownership / parallel-unit map | §9 |

---

*End of project-design.md, version 1 — RSS news pipeline. Subsequent features append new top-level sections (`## 2. <feature> …`).*
