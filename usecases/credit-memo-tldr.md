---
type: usecase
title: Compress a 15-page SME credit memo into a 3-bullet summary
audience: beginner
topics: [risk, credit, summarisation]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: A relationship manager hands you a fifteen-page credit memo and the committee meets in an hour. Claude reads it and produces a three-bullet exec summary plus a risk-flag list — the structured starting point your senior credit officer actually wants, not a paraphrase of the whole memo.
business_unit: risk
time_estimate: "~20 min"
difficulty: beginner
order: 7
outcome: A one-page markdown brief — 3-bullet exec summary, top 5 risk flags with severity (HIGH/MED/LOW), and an "open questions for the RM" list.
inputs:
  - The credit memo as a PDF or Word document
  - Claude Code installed and a terminal open (see Day 1)
---

Credit committees run on density. The deck wants a one-pager, the memo from the relationship manager is fifteen. Junior risk analysts spend a Tuesday morning condensing it; senior officers re-read the whole thing because they don't trust the condensed version.

This use case is the version where the condensed version is trustworthy because the prompt itself names what "trustworthy" means.

> **Compliance check before you start.** Credit memos contain client-confidential financials, security details, and sometimes director-level information. Confirm the classification with your line manager before putting a real memo into a Claude-readable folder. For your first run, use a sanitised or training-deck memo — same shape, no real client data. The point is to learn the loop; you can graduate to real memos once you trust the output.

---

## Step 1 — Build the workspace and move the memo in

**Open the Terminal app first.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Then:

```
mkdir ~/Desktop/credit-memo-review
cd ~/Desktop/credit-memo-review
mv ~/Downloads/memo.pdf source.pdf
claude
```

Plain-English translation:

- `mkdir ~/Desktop/credit-memo-review` — make a fresh folder on your Desktop.
- `cd ~/Desktop/credit-memo-review` — move into it.
- `mv ~/Downloads/memo.pdf source.pdf` — move the memo from Downloads into this folder and rename it `source.pdf` in one go. Swap `memo.pdf` for whatever the actual filename is.
- `claude` — start Claude Code here.

Renaming to `source.pdf` keeps the prompt identical for the next memo too. Change one file, reuse the prompt.

---

## Step 2 — Let Claude create the context file

Risk summaries are worthless without judgement about *what kind of risk matters to whom*. Tell Claude:

> Create a file called `context.md` in this folder. Put these 5 lines inside it:
>
> ```
> Reader: senior credit officer at NBG
> Portfolio: Greek SME secured + unsecured lending
> Reader's seniority: knows the sector, doesn't want the memo paraphrased — wants a triage
> Goal: a one-page brief before the credit committee in an hour
> What counts as a "risk flag": concentration > 20% of revenue, customer churn rising, covenant headroom < 15%, refinancing risk inside 18 months, declining gross margin > 200bp YoY, owner-manager succession unclear
> ```

Claude asks permission before writing. Say yes.

The "what counts as a risk flag" line is the load-bearing one. Without it Claude flags everything ("interest rates may rise") and useful signal drowns. Spend two minutes tailoring this line to what your committee actually argues about.

---

## Step 3 — Ask Claude for the brief

Send this to Claude:

> Read `source.pdf` and `context.md`.
>
> Produce `brief.md` with these four sections, exactly in this order:
>
> **1. Exec summary** — three bullets. Lead with the headline (size + sector + ask). Bullet two: the single strongest reason to approve. Bullet three: the single strongest reason to push back. Nothing else.
>
> **2. Risk flags** — table with columns: `Flag | Severity (HIGH/MED/LOW) | Evidence (page + quote) | What this means`. Only use the flag categories defined in `context.md` — don't invent new ones. Order by severity, highest first.
>
> **3. Numbers I would double-check** — bullets. Any figure in the memo where the source (audited financials / management accounts / projections) is unclear or the year-over-year delta is suspicious. Cite the page.
>
> **4. Open questions for the RM** — bullets. The things you'd ask the relationship manager before voting. Phrased as actual questions, not statements.
>
> Hard rule: every claim must cite a page or section of `source.pdf`. If you can't cite it, don't write it.

Press Enter. A 15-page memo takes 60–120 seconds.

---

## Step 4 — Verify three citations before you trust the brief

Ask Claude to show you the brief:

> Show me `brief.md`.

Pick three risk flags or numbers at random. For each one:

1. Open `source.pdf` (double-click it in `~/Desktop/credit-memo-review/`).
2. Jump to the cited page.
3. Confirm the evidence quote actually appears there.

If any citation doesn't match, tell Claude:

> Risk flag 2's evidence quote doesn't appear on page 7 of `source.pdf`. Re-extract the verbatim text, or downgrade the severity if you can't substantiate it.

Iterate until all three spot-checks pass. The brief is now a starting point your senior officer can trust enough to argue with.

---

## Step 5 — Add a one-line recommendation and ship

The brief is structured triage, not a recommendation. The recommendation is your call — but Claude can shape it once you've decided.

Tell Claude:

> Based on `brief.md` and `source.pdf`, draft three one-line recommendations:
>
> 1. Approve, with conditions
> 2. Decline
> 3. Defer pending [specific information]
>
> Each one in the form: "Recommendation: [verdict]. Conditions/reasons: [one sentence]."

Pick the one that matches your read. Paste it at the top of `brief.md`. Send to your senior officer.

You've turned a Tuesday morning of condensing into twenty minutes of triage. The senior officer reads three bullets, scans the risk flags, asks you the open questions — that's exactly the conversation you wanted.
