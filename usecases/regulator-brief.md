---
type: usecase
title: Compress a 60-page regulator PDF into a 1-page brief
audience: beginner
topics: [compliance, summarisation, regulation]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: A new ECB / BoG / EBA paper lands in your inbox. It is 60 pages, half of it is boilerplate, the deadline is Friday. Claude reads it and writes a one-pager — what changed, who's affected, what we need to do, by when — that you can take to your team lead.
business_unit: compliance
time_estimate: "~25 min"
difficulty: beginner
order: 6
outcome: A one-page markdown brief with four labelled sections — What changed · Who's affected · What we need to do · By when — plus a links list back to the source pages for verification.
inputs:
  - The regulatory PDF (download it from the regulator's website to your Downloads folder)
  - Claude Code installed and a terminal open (see Day 1)
---

Regulatory papers are written in a style that protects the regulator from misinterpretation. That makes them precise but unreadable in a single sitting. The team lead asks "is there anything in this we need to act on?" and the honest answer is "give me three hours and I'll tell you" — but the meeting is in twenty minutes.

This use case is the twenty-minute version. The point isn't to replace the careful read — it's to know whether the careful read needs to happen by Friday or by next month.

> **Compliance check before you start.** Public regulator papers (anything published on ECB / BoG / EBA websites) are fine to put in a Claude-readable folder. Internal interpretations, legal memos analysing the paper, or counsel correspondence are not — keep those out of the folder for this use case.

---

## Step 1 — Build the workspace and move the PDF in

**Open the Terminal app first.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Then type each line:

```
mkdir ~/Desktop/reg-brief-eba
cd ~/Desktop/reg-brief-eba
mv ~/Downloads/EBA-2026-05-final.pdf source.pdf
claude
```

Plain-English translation:

- `mkdir ~/Desktop/reg-brief-eba` — make a folder called `reg-brief-eba` on your Desktop.
- `cd ~/Desktop/reg-brief-eba` — move into it.
- `mv ~/Downloads/EBA-2026-05-final.pdf source.pdf` — move the PDF from Downloads into this folder AND rename it `source.pdf` in one step. (Swap `EBA-2026-05-final.pdf` for whatever the regulator's filename actually is.)
- `claude` — start Claude Code here.

Renaming to `source.pdf` is a small trick: every regulator paper you brief uses the same filename, so the prompt below is identical every time. Change one file, reuse the same prompt.

---

## Step 2 — Let Claude create the context file

You don't need to know how to make a file. Tell Claude:

> Create a file called `context.md` in this folder. Put these 5 lines inside it (with my values):
>
> ```
> Reader: a compliance officer at NBG (retail bank, Greece)
> Bank's main exposures relevant here: residential mortgage portfolio, SME unsecured lending, contact-centre operations
> Reader's seniority: knows the regulatory landscape, doesn't have three hours to read 60 pages today
> Goal: a one-pager I can take to the head of compliance tomorrow morning
> Tone: plainspoken, no hedging, no "it depends" without naming the things it depends on
> ```

Claude asks permission before writing the file. Say yes. Two minutes — this is what makes the brief sound like it was written by you, not by a generic summariser.

---

## Step 3 — Ask Claude for the brief

Send this to Claude:

> Read `source.pdf` and `context.md`.
>
> Produce `brief.md` — a single page with these four sections, exactly in this order, each labelled:
>
> **1. What changed** — 3–5 bullets. The substantive changes only. Skip "this paper consolidates earlier guidance" boilerplate. For each bullet, in parentheses cite the section number from the source PDF (e.g. "§3.2.1").
>
> **2. Who's affected** — which parts of the bank, in plain English. Tie this to the exposures named in `context.md`.
>
> **3. What we need to do** — concrete actions. If you can't name a concrete action, write "needs legal interpretation" — don't pad.
>
> **4. By when** — deadlines explicitly named in the paper. If no deadline is stated, write "no deadline stated" — do not invent one.
>
> At the bottom, an "Open questions for legal" list — anything you read where the application to NBG specifically is genuinely ambiguous.
>
> Hard rule: every claim in the brief must be traceable to a section of `source.pdf`. If you find yourself writing something that isn't, delete it.

Press Enter. Larger PDFs (>40 pages) take 1–3 minutes.

---

## Step 4 — Verification pass — pick three claims at random

Ask Claude to show you what it wrote:

> Show me `brief.md`.

Pick three bullets at random. For each one:

1. Note the section number Claude cited.
2. Open the PDF (it's in your `~/Desktop/reg-brief-eba/` folder — double-click `source.pdf`), jump to that section.
3. Confirm the bullet accurately reflects what's there.

If two of three pass, you have a solid brief. If one fails, ask Claude to recheck — naming the bullet that was wrong is enough:

> The "Who's affected" bullet about SME unsecured lending — recheck against §4.1 of `source.pdf`. I don't see that there.

Iterate until your spot-checks pass.

---

## Step 5 — Take it to the team lead

Send `brief.md` (or paste it into Teams — Teams renders markdown natively) with one line: *"My 25-min read of the EBA paper — flagging the SME-lending change as the one that probably needs a real review this week."*

You've shifted from *"I'll read it and get back to you"* to *"here's the picture, here's the priority"*. That's the work the team lead actually wanted.

The full careful read still happens — but now it happens against a hypothesis instead of from a blank page.
