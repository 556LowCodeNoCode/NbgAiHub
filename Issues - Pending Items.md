# Issues - Pending Items

Pending items first (most critical at top). Completed items after. Remove fixed entries.

## Pending

1. **DoD #12 — Live end-to-end run pending operator action (LOW severity, operational).**
   Surfaced by `/Users/suzy/ClaudeCode/Projects/NbgAiHub/docs/reference/integration-verification-rss-pipeline.md`.
   The integration verification confirmed all 18 ACs are MET on code/test/lint evidence, but Definition-of-Done item 12 (a real end-to-end workflow run on a non-`main` branch) requires:
   - Azure resources provisioned (deployment in Azure AI Foundry).
   - Four `AZURE_OPENAI_*` secrets added under `Settings → Secrets and variables → Actions`.
   - Repo-level toggle `Allow GitHub Actions to create and approve pull requests` enabled under `Settings → Actions → General → Workflow permissions`.
   - One `workflow_dispatch` trigger of `rss-triage`, with the resulting PR captured (URL + title `News triage YYYY-MM-DD`).
   Checklist source of truth: `/Users/suzy/ClaudeCode/Projects/NbgAiHub/SECRETS.md` §3 (First-time setup checklist).

2. **DoD #8 — SCOPE.md cross-reference to refined request not verified (LOW severity, documentation).**
   The plan deliverable expected `SCOPE.md` Open Questions section to cross-reference `docs/refined-requests/rss-pipeline.md`. The verifier did not confirm whether this link exists in `SCOPE.md`. Low-risk follow-up — can be added during the next round of Open Questions sign-off (OQ1, OQ2, OQ5).

## Completed

*(none yet)*
