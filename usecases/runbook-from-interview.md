---
type: usecase
title: Capture how a colleague does a manual process so you can hand it off
audience: beginner
topics: [process-improvement, documentation, knowledge-sharing]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: Someone on the team is the only person who knows how the month-end reconciliation actually works. They're going on holiday. Interview them on Teams (recorded transcript), then ask Claude to turn that transcript into a step-by-step runbook anyone on the team could follow.
business_unit: process-improvement
time_estimate: "~30 min"
difficulty: beginner
order: 12
outcome: A markdown runbook with numbered steps, named tools at each step, decision points called out explicitly, and a "common errors" section — ready to be reviewed by the original colleague and put in the team SharePoint.
inputs:
  - A Teams recording / transcript of a 30–45 minute interview with the colleague who runs the process
  - Claude Code installed and a terminal open (see Day 1)
---

Every team has a process that lives in one person's head. The month-end reconciliation. The quarterly regulatory return. The customer-segment refresh. The person who runs it isn't hiding it — they've just done it so many times that the steps have fused together, and when you ask *"can you write that down?"* they freeze.

This use case is the workaround: don't ask them to write it down. Ask them to *do* it on a Teams call while they narrate. Claude turns the messy transcript into a runbook a junior could follow.

> **Compliance check before you start.** A process runbook may reference internal systems, account schemas, or operational thresholds. Treat the runbook with the same classification as the underlying process. Avoid pasting actual account numbers or customer IDs into the transcript — when the colleague is demonstrating, ask them to use test data or to mask the screen.

---

## Step 1 — Run the interview as a screen-share + narrate

Schedule 30–45 minutes with the colleague. On the Teams call:

1. **They share their screen.** They open the systems they actually use.
2. **They run the process end-to-end while talking.** *"OK so the first thing I do is open the GL report from yesterday. I go to this menu, then this filter. I always check this number first because if it's zero it usually means the overnight job failed…"*
3. **You interrupt only with clarifying questions.** *"What do you do if it IS zero?"*, *"Why this filter and not that one?"*, *"What does 'usually' mean here — every time, or sometimes?"*
4. **Teams records the call and generates a transcript.** Make sure recording is on at the start.

After the call, in the Teams meeting chat: three-dot menu → "Download transcript" → save as `.docx` or `.vtt`. It lands in your Downloads folder.

This step is the load-bearing part of the use case. The runbook quality is set by how well you interviewed. Don't skip the clarifying questions.

---

## Step 2 — Build the workspace and move the transcript in

**Open the Terminal app.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Type each line:

```
mkdir ~/Desktop/runbook-monthend-recon
cd ~/Desktop/runbook-monthend-recon
mv ~/Downloads/transcript.docx .
claude
```

- `mkdir ~/Desktop/runbook-monthend-recon` — make a folder named after the process.
- `cd ~/Desktop/runbook-monthend-recon` — move into it.
- `mv ~/Downloads/transcript.docx .` — move the transcript file out of Downloads.
- `claude` — start Claude Code.

---

## Step 3 — Let Claude create the context file

Tell Claude:

> Create a file called `context.md` in this folder. Put these 5 lines inside it:
>
> ```
> Process: Month-end GL reconciliation for the SME lending portfolio
> Run by: M. Vassilas (originally); we want to enable anyone on the SME ops team to run it
> Frequency: Last business day of every month
> Tools used in the demo: SAP-FI, the internal "ReconView" Excel macro, a Power BI dashboard
> Reader level: someone who knows banking ops but has never run THIS process before
> ```

Claude asks permission. Say yes.

The "reader level" line matters. A runbook written *"as if for a complete beginner"* is patronising and unreadable; one *"as if for a peer"* skips steps. Pick the level honestly.

---

## Step 4 — Ask Claude for the runbook

Send this to Claude:

> Read `transcript.docx` and `context.md`.
>
> Produce `runbook.md` with this structure:
>
> **1. One-paragraph overview** — what this process does, why it exists, who needs the output. 4 sentences max.
>
> **2. Prerequisites** — bullets. Systems the reader needs access to, files they need to have ready, any timing constraint (e.g. "must run after the overnight GL post completes, usually by 7am").
>
> **3. Steps** — numbered. Each step:
>
> - The action (single concrete verb)
> - The tool / system / file
> - What "done" looks like for this step (a number, a green tick, an exported file)
> - If the colleague mentioned a decision point ("if X, do Y; if not, do Z"), surface it as a labelled sub-bullet — don't bury it in the action sentence.
>
> **4. Common errors and what they mean** — a table with columns: `What you see | What it means | What to do`. Use only errors the colleague mentioned in the transcript — don't invent any.
>
> **5. What to send and to whom** — at the end. The deliverable, the recipient, the deadline.
>
> Hard rules:
>
> - Skip every *"um", "yeah, so", "let me just"*. The runbook reads like a careful person wrote it, not a transcript.
> - If the colleague said *"I usually"* or *"I tend to"* — those are signals of an undocumented decision. Promote them to explicit decision points: *"Decision: if X then Y, else Z. The original runner notes they choose [Y / Z] most of the time when …"*
> - If the colleague said something incomplete *("you check the thing, then it's fine")*, flag it as `[NEEDS VERIFICATION — author was vague]` rather than guessing.

Press Enter. A 30-minute interview transcript takes 60–120 seconds to process.

---

## Step 5 — Have the colleague review the runbook

This is the most important step. Send the colleague:

> Here's the first draft runbook from our session — `runbook.md`. Two asks:
>
> 1. Anywhere you see `[NEEDS VERIFICATION]`, fill in what's missing.
> 2. Anywhere the runbook *doesn't* match what you actually do — even if it's a small thing — tell me. Those small things are usually where the next person trips up.

They send back tweaks. Open the file (it's in `~/Desktop/runbook-monthend-recon/`) and ask Claude to apply them:

> The colleague reviewed the runbook. Apply these corrections:
>
> - Step 3: the threshold is 100,000 not 10,000.
> - Step 7: should be SAP-FI tx FB03, not FB02.
> - Add a new step between 9 and 10: "Email the reconciliation summary PDF to the operations mailbox."

Claude edits `runbook.md`. One more pass with the colleague — usually only one — and the runbook is shippable.

Save it to the team SharePoint or wiki. The next time the colleague is on holiday, someone else runs the process from the runbook. The first time that happens, you'll know whether the runbook is actually good. (It will need one more revision after that first real-world use. That's normal.)

The deeper win: you've now done one process. The pattern works for every other single-person-of-failure process in the team. Once the team sees one runbook land, the second one gets easier to schedule.
