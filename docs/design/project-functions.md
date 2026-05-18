# NbgAiHub — Functional contract

Single source of truth for **what the project's components do**, expressed as labelled functional requirements. Implementation, interfaces, and signatures live in `project-design.md` (owned by the Designer). Sequencing and verification criteria live in the per-feature plan files (`plan-NNN-*.md`).

When a new feature is planned, append a new section to this file with its `F<N>` functional contract entries.

**Last updated:** 2026-05-18

---

## RSS news pipeline (plan-001-rss-pipeline)

The pipeline is a daily-scheduled, TypeScript-based GitHub Action that fetches a curated list of RSS/Atom feeds, deduplicates against previously seen items, calls Azure OpenAI for relevance triage and metadata generation, writes each new relevant item as a markdown file under `/news/incoming/`, and opens an editorial pull request. The PR is the editorial gate; merges to `main` are human-only.

### F1 — Scheduled execution

A GitHub Action workflow at `.github/workflows/rss-triage.yml` runs on a daily cron schedule (`0 5 * * *` UTC, which equals 08:00 Europe/Athens during DST and 07:00 in winter; one-line change to swap). The workflow also supports manual triggering via `workflow_dispatch`.

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

---

## Astro Starlight site (plan-002-astro-starlight-site)

The site is a TypeScript-based Astro 6 + Starlight 0.39 static site under `site/` that renders the hub's five pillars (Skills, Tips, News, Journeys, Glossary) plus supporting pages. It reads content via Astro 6's `glob()` loader directly from sibling repo content folders (`../news/published/`, `../skills/`, `../tips/`, `../glossary/`, `../journeys/`), exposes a declarative 9-entry left sidebar, ships built-in search (Pagefind, Starlight default), and runs locally on port 4321. Hosting is deferred; the MVP success criterion is "working dev server with all sidebar entries clickable and the news collection rendered from `/news/published/`."

### F1 — Workspace scaffolding

`site/` is a sibling workspace to `pipeline/` with its own `package.json` (declaring `astro ^6.x` and `@astrojs/starlight ^0.39.x` as direct deps), `tsconfig.json` (extending Starlight's recommended strict TS config, plus `noUncheckedIndexedAccess: true`), `astro.config.mjs`, `src/content.config.ts`, `src/`, `public/`, and `.nvmrc` pinned to `22`. ESM only (`"type": "module"`). No monorepo tooling; `site/` and `pipeline/` are independent npm workspaces.

### F2 — Content collections

`src/content.config.ts` defines 5 collections via Astro 6's `glob()` loader, each pointing at the corresponding `../<folder>/*.md` path with a strict Zod schema (Zod imported from `astro/zod`, not `astro:content`):

| Collection | Source path | Schema notes |
|---|---|---|
| `news` | `../news/published/*.md` | 12 canonical keys + `source` + `fingerprint` + optional `hero_image`. `generateId` callback strips `^\d{4}-\d{2}-\d{2}-` from filenames so `entry.id` is URL-clean. |
| `skills` | `../skills/*.md` | 12 canonical keys, `type: z.literal('skill')`. |
| `tips` | `../tips/*.md` | 12 canonical keys, `type: z.literal('tip')`. |
| `glossary` | `../glossary/*.md` | 12 canonical keys, `type: z.literal('glossary')`. |
| `journeys` | `../journeys/*.md` | 12 canonical keys, `type: z.literal('journey-step')`. |

Schema is duplicated, not imported, from `pipeline/src/frontmatter.ts` (per refined-request A4 trade-off — drift risk acknowledged for MVP).

### F3 — Declarative sidebar

`astro.config.mjs` configures the Starlight sidebar with 9 entries in this exact order: Home, Start Here (collapsible group containing Day 1 and Week 1), News, Skills, Tips & Tricks, Glossary, Reference, Contribute. Entries use `link:` (not `slug:`) because the targets are `.astro` pages under `src/pages/`, not Markdown under `src/content/docs/`. Trailing slashes preserved on every `link:` value to match Starlight's `trailingSlash: 'always'` default.

### F4 — Homepage (`/`)

`src/content/docs/index.mdx` with `template: splash` (removes sidebar/TOC chrome for a landing-page feel). MDX imports `HomeHero` (title, tagline, two primary CTAs: "Start Here → Day 1" and "Browse Skills") and `NewsPanel` (5 most recent published news items, compact cards), plus an optional row of "featured" cards for Tips, Skills, Glossary. MDX is required (not plain `.md`) because of the component imports; Starlight bundles MDX support, so no separate `@astrojs/mdx` integration is added.

### F5 — `/news` index

`src/pages/news/index.astro` wraps `<StarlightPage>` and renders `NewsList` showing all items in the `news` collection sorted by `data.authored` descending, with `AudienceFilter` and topic filters at the top. Empty-state fallback when `news/published/` is empty: "No items yet. See [Contribute](/contribute) for how to add one."

### F6 — `/news/<slug>` per-item pages

`src/pages/news/[slug].astro` auto-generates one route per news item via `getStaticPaths()` returning `{ params: { slug: item.id }, props: { item } }` (where `item.id` is the clean date-stripped slug from F2's `generateId`). Each page renders title, `AudienceBadge`, topic chips, source name, a "Read on source ↗" link to `external_link`, and the `ai_summary` as body. Rendered via `await render(item)` (Astro 6 idiom — not the legacy `await item.render()`).

### F7 — Catalog pages

`src/pages/skills.astro` and `src/pages/tips.astro` render card grids of their respective collections using `SkillCard` (with empty-state fallback). `src/pages/glossary.astro` renders a single page with one `<section id="<term-slug>">` per glossary term, supporting `/glossary#<term-slug>` anchor links (per DECISIONS.md "Hybrid glossary"). `src/pages/reference.astro` is a hand-authored markdown cheatsheet wrapped in `<StarlightPage>`. `src/pages/contribute.astro` is a hand-authored PR contribution-flow page wrapped in `<StarlightPage>`. All hand-authored content carries the *"what I wish I knew a year ago"* tone — opinionated, plainspoken, no marketing voice.

### F8 — `/start-here/day-1` placeholder

`src/pages/start-here/day-1.astro` renders a page with headings for each of the 6 designed Day 1 steps (install → first session → survival keys → CLAUDE.md → skills & team marketplace → where to go next) plus "coming soon" body content. Real content is captured in SCOPE.md MVP table; this phase only builds the page shell. Optionally `src/pages/start-here/week-1.astro` exists as a deeper-placeholder ("Week 1 — coming soon.") to satisfy the sidebar link.

### F9 — Empty-state fallbacks

When `news/published/`, `skills/`, `tips/`, `glossary/`, or `journeys/` is empty, the corresponding page renders a consistent friendly message: *"No items yet. See [Contribute](/contribute) for how to add one."* No crash, no empty grid, no template gaps. The homepage `NewsPanel` shows the same fallback when news is empty.

### F10 — Beginner/Advanced audience filter

`AudienceFilter.astro` renders three checkboxes (Beginner, Advanced, Both — all checked by default). On any checkbox change, an inline vanilla `<script>` block reads the checked set and toggles a `audience-hidden` CSS class on every `[data-audience]` element whose `data-audience` value is not in the set. State is persisted to `localStorage` under key `nbgaihub.audience` and restored on every page load. Pure client-side DOM toggle — no fetch, no framework, no view-transition complications (Starlight does not enable `<ClientRouter />` by default, so scripts run from scratch on every full-page navigation).

### F11 — Search

Pagefind index is built at `npm run build` time via Starlight's bundled `astro:build:done` hook. The Starlight header search bar is functional in the built/preview output. In `dev` mode the search button shows a "production only" notice — expected behavior. AC17 verifies `dist/pagefind/` exists post-build.

### F12 — Strict frontmatter validation

A markdown file in any source folder that fails its collection's Zod schema causes `astro check` (or `npm run build`) to fail with a clear, named-file-and-field error. No silent skipping. The `npm run check` script is `astro sync && astro check` (sync first to mitigate the known silent-exit wart). The `npm run build` script is `astro check && astro build` to chain validation into the production build. NF8 ("no fallback config") applies — schema violations, missing config files, and missing dependencies all fail loudly.
