# NbgAiHub — Functional contract

Single source of truth for **what the project's components do**, expressed as labelled functional requirements. Implementation, interfaces, and signatures live in `project-design.md` (owned by the Designer). Sequencing and verification criteria live in the per-feature plan files (`plan-NNN-*.md`).

When a new feature is planned, append a new section to this file with its `F<N>` functional contract entries.

**Last updated:** 2026-05-18

---

## RSS news pipeline (plan-001-rss-pipeline)

The pipeline is a daily-scheduled, TypeScript-based GitHub Action that fetches a curated list of RSS/Atom feeds, deduplicates against previously seen items, calls Azure OpenAI for relevance triage and metadata generation, writes each new relevant item as a markdown file under `/news/incoming/`, and opens an editorial pull request. The PR is the editorial gate; merges to `main` are human-only.

### F1 — Scheduled execution

A GitHub Action workflow at `.github/workflows/rss-triage.yml` runs on a daily cron schedule (placeholder `0 6 * * *` UTC; one-line change to swap). The workflow also supports manual triggering via `workflow_dispatch`.

### F2 — Configurable feed list

Feeds are read from `config/rss-sources.json` at runtime. Each entry exposes at minimum: `name` (human label), `url`, `enabled` (boolean). The five candidate URLs from `SCOPE.md` (Anthropic, Claude Code GitHub releases, Simon Willison, r/ClaudeAI, Hacker News filtered) ship as the initial seed list with `enabled: true`. Adding or removing a feed is a JSON edit, not a code change.

### F3 — Feed fetching and parsing

The pipeline fetches all enabled feeds over HTTPS, parses RSS 2.0 and Atom transparently, and yields a normalized item shape: `{ feedName, guid, link, title, publishedAt, rawContent }`. Network or parse failure on an individual feed is logged and skipped; remaining feeds proceed. If all feeds fail, the run exits non-zero (no silent zero-item runs).

### F4 — Deduplication

For each fetched item, the pipeline computes a stable fingerprint (SHA-256 of `feedName + (guid || link || title)`, hex-truncated to 16 chars) and skips items whose fingerprint already appears in any `.md` file under `/news/incoming/` or `/news/published/`. No item is sent to Azure OpenAI twice across runs. The markdown files are the source of truth — no separate state file.

### F5 — Azure OpenAI triage call

For each new, non-duplicate item, the pipeline calls Azure OpenAI chat completions with a single prompt that returns a JSON object:

```json
{
  "relevant": true,
  "audience": "beginner" | "advanced" | "both",
  "topics": ["setup", "workflow", "..."],
  "summary": "Two sentences."
}
```

If `relevant === false`, the item is dropped (no markdown file emitted). Malformed responses are rejected and logged with the raw payload.

### F6 — No fallback config

On invocation, the pipeline reads `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_API_KEY` from `process.env`. If any is missing or empty, the pipeline throws an explicit, named exception identifying the missing variable, and the Action step fails. No silent defaults. No `||` fallbacks. No `.env` file lookup in production runs.

### F7 — Markdown file emission

Each relevant item is written to `/news/incoming/<YYYY-MM-DD>-<slug>.md`. Date is the run date (UTC). Slug is lowercase kebab-case of the item title, truncated to 60 characters at a word boundary, non-alphanumerics stripped. Same-day collisions get a `-2`, `-3`, … suffix.

### F8 — Frontmatter conformance

Each emitted file's frontmatter conforms to the canonical "Shared content shape" from `DECISIONS.md`:

```yaml
---
type: news
title: "<item title>"
audience: beginner | advanced | both
topics: [...]
internal: false
authored: <YYYY-MM-DD run date>
last_reviewed: <YYYY-MM-DD run date>
external_link: <item link>
deeper_link: null
ai_summary: "<two-sentence summary>"
source: "<feed name>"
fingerprint: "<dedup key>"
---
```

The body is the two-sentence summary followed by a `> Source: [<feed name>](<link>)` line.

### F9 — Pull request creation

After all items are written, if at least one new file exists, the workflow commits the changes on a new branch named `news-triage/YYYY-MM-DD-<short-run-id>` (where `<short-run-id>` is the first 7 chars of `GITHUB_RUN_ID`) and opens a PR with title `News triage YYYY-MM-DD` (literal, UTC date). The PR body lists each new item: `title`, `source`, `external_link`, `ai_summary`. If no new items are emitted, no PR is opened (idempotent no-op).

### F10 — Editorial workflow (documented, not coded)

Editors review the PR, optionally delete or edit files in `/news/incoming/`, **move** approved files to `/news/published/` (either by editing the PR before merge or in a follow-up PR), then merge. The pipeline does not enforce this — it is the human editorial gate by design (per `DECISIONS.md` "Curated RSS, not auto-aggregated"). The pipeline does not auto-prune stale items in `/news/incoming/`; backlog management is the editor's job. The `last_reviewed` frontmatter field is set to the run date at emission; an editor moving the file to `/published/` should bump `last_reviewed` to their date.
