---
type: usecase
title: Generate a personalised first-week checklist for a new joiner
audience: beginner
topics: [hr, onboarding, writing]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: A new joiner starts Monday. HR sends them a generic 40-item checklist that scares everyone. Claude reads the job description, the team's standard onboarding doc, and the new joiner's CV — then produces a tailored 12-item week-one plan they can actually finish.
business_unit: hr
time_estimate: "~20 min"
difficulty: beginner
order: 10
outcome: A markdown checklist with three sections (Day 1 · Days 2–3 · Days 4–5), each item including who to talk to and why it matters. Personalised to the joiner's role and prior experience.
inputs:
  - The job description for the role (PDF or pasted text)
  - The team's existing generic onboarding doc (if it exists; otherwise skip this — Claude works without it)
  - Claude Code installed and a terminal open (see Day 1)
---

Generic onboarding checklists are how new joiners learn that nobody really thought about their first week. Forty items, half of them only relevant to people in the office on Tuesdays, no order, no explanation of *why* anything is on the list.

This use case is a small fix with disproportionate impact: a checklist that looks like it was made for *this* person.

> **Compliance check before you start.** Job descriptions and team onboarding docs are usually internal but non-sensitive. A new joiner's CV is *personal data* under GDPR — handle it with the same posture as any other personal data. For your first run, use your *own* CV or a sanitised sample, not a candidate's. Once you trust the loop, talk to your line manager about how real CVs should flow.

---

## Step 1 — Build the workspace

**Open the Terminal app.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Type each line:

```
mkdir ~/Desktop/onboarding-anna
cd ~/Desktop/onboarding-anna
```

- `mkdir ~/Desktop/onboarding-anna` — make a folder named after the joiner.
- `cd ~/Desktop/onboarding-anna` — move into it.

Move the three input files into this folder. From Downloads:

```
mv ~/Downloads/job-description.pdf .
mv ~/Downloads/team-onboarding.pdf .
mv ~/Downloads/anna-cv.pdf .
```

The `.` means "the current folder". Swap the filenames for the ones you actually have. If you don't have a team onboarding doc, skip that line.

Then start Claude:

```
claude
```

---

## Step 2 — Let Claude create the context file

The checklist quality is set by the context you give Claude. The more specific the context, the more useful the checklist.

Tell Claude:

> Create a file called `context.md` in this folder. Put these 6 lines inside it (with my values):
>
> ```
> Joiner name: Anna Papas
> Role: SME Credit Analyst, NBG retail bank, Athens HQ
> Joining team: SME Credit team (8 people)
> Manager: M. Vassilas (Head of SME Credit)
> Working pattern: 3 days on-site (Mon/Tue/Thu), 2 remote
> Banking experience: 2 years junior analyst at a competitor — knows the basics, new to NBG-specific systems and policies
> ```

Claude asks permission before writing. Say yes.

Two minutes of thought here is what separates "useful checklist" from "another bureaucratic document".

---

## Step 3 — Ask for the personalised checklist

Send this to Claude:

> Read `context.md`, `job-description.pdf`, `team-onboarding.pdf`, and `anna-cv.pdf`.
>
> Produce `week-one-checklist.md` with these three sections, in this order:
>
> **Day 1 (Monday)** — max 4 items. Things that *must* happen before lunch on day 1: laptop pickup, the access requests that take longest to land, manager 1:1, team intro. Each item: who they need to see, where (room or Teams), why it matters in one sentence.
>
> **Days 2–3** — max 5 items. The core systems-and-policies block: which internal systems they need access to, which mandatory training modules apply to a credit analyst, the 2–3 meetings they should attend as observers. Each item: same format.
>
> **Days 4–5** — max 4 items. Their first piece of real work, paired with a buddy. Should be a small, finishable task that lets them feel useful by Friday afternoon. Each item: same format.
>
> Hard rules:
>
> - **Skip** items from `team-onboarding.pdf` that don't apply to a credit analyst (e.g. front-line cash-handling training).
> - **Skip** anything Anna already knows from her CV (don't put "Introduction to credit risk fundamentals" on the list if she has 2 years of credit analysis behind her).
> - **Add** an introduction to one specific NBG policy or system that her prior bank wouldn't have used.
> - Every item needs a *why*. "Mandatory KYC training (Day 2)" is incomplete; "Mandatory KYC training (Day 2) — required by Bank of Greece for anyone handling client files, takes 90 minutes" is the right shape.

Press Enter. Claude reads the files and writes the checklist in 30–90 seconds.

---

## Step 4 — Sanity-check before sending

Ask Claude:

> Show me `week-one-checklist.md`.

Read it twice — once as you, once as Anna. Questions to ask yourself:

- **Is day 1 too crowded?** Four items is the cap. If Claude wrote six, push back: *"Day 1 has too many items — Anna's manager will only have 30 minutes on Monday morning. Cut to four."*
- **Is anything on the list that her CV makes redundant?** *"Introduction to corporate banking" for a 2-year banker is condescending.*
- **Is the Friday task real?** *"Read the team's risk policy"* is not a task. *"Draft a one-page memo on borrower XYZ's covenant compliance for the credit committee — paired with M. Costa"* is.

Iterate. Three of these revisions usually produce a checklist that lands well.

---

## Step 5 — Send it the right way

Don't email it on Friday afternoon as an attachment. Two better options:

1. **Paste into Teams.** Markdown renders natively — checkboxes, bold, headings all work. Send it as a direct message to Anna with a one-liner: *"Looking forward to Monday — this is your first week, designed for you. We'll go through Day 1 together at 10am."*
2. **Print it.** People who get a printed checklist on day 1 keep it on their desk. People who get a PDF lose it in their inbox.

Save the folder. The next joiner's checklist reuses the prompt and the team onboarding doc — only `context.md` and the CV change. Twenty minutes becomes five.

The deeper win: the joiner spends their first week *doing* instead of waiting for someone to tell them what they should be doing. That's worth a lot more than the time you saved.
