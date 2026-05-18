# NbgAiHub — Scope

**Last updated:** 2026-05-18

## Vision

A curated Claude Code knowledge hub for bank colleagues — a one-stop shop combining skills catalog, tips & tricks, curated news, onboarding journeys, and a shared vocabulary. Tone: *"what I wish I knew a year ago."* The hub compresses newcomers' time-to-confidence, leveraging the ~6 months of head start the AI unit has over the rest of the organization on Claude Code.

## Audience

- **Primary:** Bank colleagues new to Claude Code (joining over the next 6–12 months)
- **Secondary:** Existing intermediate users hunting for tips, news, or new skills

## Repo & hosting

- **Repo:** `github.com/chomovazuzana/NbgAiHub` (personal account, bootstrap mode)
- **Visibility:** **private** (per user override; supersedes prior public decision — see DECISIONS.md)
- **Hosting:** **OPEN QUESTION** — private Pages on personal account requires GitHub Pro ($4/mo). Alternatives: Vercel free, Netlify free, Cloudflare Pages free (all support private GitHub repos as source). Or defer hosting until MVP content exists.
- **Content rule:** since repo is private, team-internal content is permissible — but the repo lives under a *personal* account, not bank-managed infrastructure. Bank-confidential material should still go through compliance review before being stored here.
- **Migration path:** transfer to team org and switch to GitHub Team if the project graduates from personal bootstrap.

## The hub at a glance

**Five user-facing pillars** (each consumed differently; all share one content shape):

| # | Pillar | What it offers | Consumption pattern |
|---|---|---|---|
| 1 | **Skills catalog** | Discovery layer over installable plugins (internal + external) | Browse → install via plugin marketplace |
| 2 | **Tips & Tricks** | Patterns, prompts, gotchas, workflow recipes | Read & apply manually |
| 3 | **News** | Curated tech news, AI-triaged from RSS feeds at build-time | Skim weekly |
| 4 | **Curated journeys** | Day 1, Week 1, by-role onboarding paths | Follow step-by-step |
| 5 | **Glossary + Reference** | Term definitions (hybrid page + anchor links) + cheatsheet | Lookup as needed |

**Cross-cutting substrate** (the same plumbing serves all five pillars):

- **GitHub repo as CMS** — markdown + frontmatter, PR workflow for everything
- **Astro Starlight web UI** — static site, fast, polished, looks like dev docs (not AI slop)
- **Hub-as-skill plugin** — one command installs the hub into Claude Code; exposes `/hub-*` commands
- **Shared content shape** — single frontmatter schema across all pillars (type, audience, topics, internal flag, deeper_link, etc.)
- **AI strategy** — build-time RSS triage via Azure OpenAI; runtime AI lives in the user's Claude session via the skill; **no AI on the website**
- **Complementary to the Onboarding guide** at `556lowcodenocode.github.io/Onboarding` — the hub deep-links into it, does not duplicate it

## MVP scope — IN

- **One curated Day 1 journey** — 6-step path: install → first session → survival keys (incl. `Esc Esc` to stop & edit) → CLAUDE.md (global + project) → skills & team marketplace → where to go next *(designed; content TBD)*
- **~10 Tips & Tricks entries** — workflow recipes, prompt patterns, gotchas
- **~5 Skills catalog entries** — internal + external, with description + install link
- **~10 Glossary terms** — CLAUDE.md, MCP, skill, plugin, agent, hook, GSD, build-time vs runtime, etc.
- **RSS curation pipeline** — daily GitHub Action: fetch feeds → Azure OpenAI triage (filter, tag, summarize) → write to `/news/incoming` → PR → editorial review → promote to `/news/published`
- **Astro Starlight static site** with beginner/advanced filter, deployed to GitHub Pages
- **Hub-as-skill plugin** — `/hub`, `/hub-search`, `/hub-news`, `/hub-tips`, `/hub-skills`, `/hub-onboard <journey>`
- **Hybrid glossary** — canonical `/glossary` page + inline anchor links across other pages
- **Public/private gating** — via `internal: true|false` frontmatter (for team-internal, not bank-confidential)

## Deferred — LATER

- Week 1 / by-role curated journeys (backend dev, data scientist, ML engineer, etc.)
- Full-text or semantic search across content
- Greek-language content
- Authentication / SSO for gated content
- Community contributions (PRs from outside the team)
- Analytics on what newcomers click
- Expanded news sources beyond the initial RSS set
- War stories / post-mortem pillar (6th pillar candidate)
- Migration to team org if/when bank-specific gated content becomes needed

## Out of scope — NO

- Live chat or forum
- Per-user personalization or bookmarking
- Hosting user-generated content
- Marketing-style branding
- Live chatbot widget on the website (the Claude skill IS the chatbot)
- Client-side embeddings or semantic search backend
- Bank-confidential content in this repo (ever; structural constraint of public-on-personal)

## Open questions

- **Hosting:** GitHub Pages via Pro, Vercel/Netlify/Cloudflare free tier, or defer hosting until MVP content exists?
- **Proof-of-life user:** which specific newcomer joining in the next 4–8 weeks anchors the MVP deadline?
- **Skill distribution:** standalone marketplace at `chomovazuzana/NbgAiHub` or also list in `556LowCodeNoCode/Skills`?
- **RSS starter list — candidates pending sign-off:**
  1. Anthropic news — `https://www.anthropic.com/rss.xml`
  2. Claude Code GitHub releases — `https://github.com/anthropics/claude-code/releases.atom`
  3. Simon Willison's blog — `https://simonwillison.net/atom/everything/`
  4. r/ClaudeAI — `https://www.reddit.com/r/ClaudeAI/.rss`
  5. Hacker News filtered — `https://hnrss.org/frontpage?q=Claude+OR+%22Claude+Code%22+OR+Anthropic`
- **Editorial cadence:** daily Action + weekly PR review? Daily PR review? Other?

## Demo-ability checklist (manager review)

- [ ] Day 1 journey page browsable on the web UI, with all 6 steps and deep-links into the Onboarding guide
- [ ] At least 1 skill entry, 1 tip, 1 news item, 5 glossary terms visible
- [ ] Beginner/Advanced filter works across the site
- [ ] `/hub` commands work from a fresh Claude Code install
- [ ] One full end-to-end RSS pipeline run completed (Action → PR → published news item)
- [ ] Hub installable as a plugin (`/plugin marketplace add chomovazuzana/NbgAiHub`) in one command
- [ ] SCOPE.md + DECISIONS.md tell the story of how we got here
