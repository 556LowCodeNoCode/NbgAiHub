# NbgAiHub — Project instructions

A curated Claude Code knowledge hub for bank colleagues, framed around *"what I wish I knew a year ago."* Skills catalog, tips & tricks, curated news, onboarding journeys, glossary — accessible both as a web UI (host TBD) and as a `/hub-*` skill inside Claude Code.

**Repo:** `github.com/chomovazuzana/NbgAiHub` (**private**, personal account, bootstrap mode).
**Constraint:** repo lives on a personal account — bank-confidential content should go through compliance review before being stored here, even though the repo is not world-readable.

## Project state files

@SCOPE.md

- **SCOPE.md** — current MVP scope, deferred items, explicit out-of-scope, open questions. Mutable; always reflects current truth. Auto-imported above.
- **DECISIONS.md** — append-only decision log. Consult before re-opening a settled question.
- **Issues - Pending Items.md** — per global rules.

## Working rules for this project

- **Before any architectural discussion or scope change**, re-read SCOPE.md and check DECISIONS.md for prior calls on the topic.
- **When we converge on a decision**, append a new dated entry to DECISIONS.md. Never edit prior entries — supersede with a new entry instead.
- **When scope changes**, update SCOPE.md (the relevant section + bump *Last updated*) in the same edit.
- **Tone for all content authored under this project:** *"what I wish I knew a year ago"* — opinionated, plainspoken, no AI-slop hedging, no marketing voice. Assume the reader is a smart colleague new to Claude Code.

## Naming

Final name: **NbgAiHub**. Repo: `github.com/chomovazuzana/NbgAiHub`.

## Ports

- Astro Starlight dev server (when added): **4321** (fallback band 4322–4329 per global port rules).
- No other dev servers planned for MVP.
