---
type: usecase
title: Spot what actually changed between two versions of a policy
audience: beginner
topics: [compliance, documents, review]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: Compliance hands you v3 of a policy and asks "what's different from v2?" Word's track-changes is gone, the diff highlighter shows every comma. Claude reads both, groups the changes by significance, and tells you which two paragraphs you actually need to take to the committee.
business_unit: compliance
time_estimate: "~20 min"
difficulty: beginner
order: 3
outcome: A markdown brief that classifies every change between v1 and v2 as MATERIAL or COSMETIC, with a one-sentence "what this means" line per material change.
inputs:
  - Two versions of a policy document (you have v1 and v2 as Word, PDF, or text)
  - Claude Code installed and a terminal open (see Day 1)
---

Policy reviews are the part of compliance work that eats afternoons. Track-changes is rarely intact by the time it reaches you, Word's diff view flags every formatting change, and the two-page summary the author was supposed to attach is never attached.

This use case is the version where you don't burn the afternoon.

> **Compliance check before you start.** Policy documents are usually internal-only. Confirm the document classification before you put it in a folder that Claude reads — *Internal* is fine for this private repo / your workstation; *Confidential* needs a conversation with your line manager first. When in doubt, redact section numbers and stakeholder names.

---

## Step 1 — Build the workspace and move both versions in

Two versions, one folder. Claude reads them both.

**Open the Terminal app first.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Then type each line:

```
mkdir ~/Desktop/policy-review
cd ~/Desktop/policy-review
```

Plain-English translation:

- `mkdir ~/Desktop/policy-review` — make a new folder called `policy-review` on your Desktop.
- `cd ~/Desktop/policy-review` — move into it.

Now get both policy versions into the folder. The easiest way for non-developers:

**Option A — Use Finder / File Explorer.** Open the folder on your Desktop, drag `policy-v1.docx` and `policy-v2.docx` into it.

**Option B — Use the terminal.** If they're sitting in Downloads:

```
mv ~/Downloads/policy-v1.docx .
mv ~/Downloads/policy-v2.docx .
```

Claude reads Word documents natively. PDFs work too. Plain text (`.txt` or `.md`) is even faster — if you can copy-paste the body of the doc into a text file, do that.

---

## Step 2 — Start Claude Code in the folder

Back in the terminal, run:

```
claude
```

Claude takes over the prompt. From here you're chatting with it.

---

## Step 3 — Ask for the structured diff

Send this prompt:

> Read `policy-v1.docx` and `policy-v2.docx`. They are two versions of the same internal policy.
>
> Produce a markdown brief, `policy-diff.md`, structured as follows:
>
> **Section 1 — Material changes** (substantive: new obligations, removed obligations, changed thresholds, changed approval authorities, new exceptions). For each one:
>
> - The exact paragraph reference (e.g. "§4.2.1")
> - The before text (one or two sentences)
> - The after text (one or two sentences)
> - One sentence: "what this means in practice"
>
> **Section 2 — Cosmetic changes** (typos, formatting, reordering of bullets without semantic change). Just a count and a short list.
>
> If there is any change you cannot classify with confidence, put it under Section 1 with "[UNCERTAIN — please verify]" appended.

Press Enter. Claude asks permission before writing `policy-diff.md`. Say yes. Long documents take a minute or two.

---

## Step 4 — Cross-check every "material" entry

Open `policy-diff.md` from Finder (it's in your `~/Desktop/policy-review/` folder), or ask Claude:

> Show me what you wrote in `policy-diff.md`.

For each material change, do the two-finger test:

1. Open v1 at the cited paragraph. Confirm Claude's "before" quote matches what's actually there.
2. Open v2 at the same paragraph. Confirm the "after" matches.

If both pass, the change is real. If the quote doesn't match — Claude paraphrased — tell it:

> The "before" quote for §4.2.1 doesn't match v1. Re-extract the verbatim text from the source document.

Repeat for any quote that doesn't pass.

---

## Step 5 — Sanity-check the "what this means" lines, then ship

Claude is good at spotting that a word changed. It is less good at understanding the operational consequence.

> Old: "The risk committee shall approve…"
> New: "The risk committee or its delegate shall approve…"

The "what this means" Claude wrote might be *"Adds delegation flexibility."* The accurate one is *"Materially loosens the approval bar — needs treasury sign-off before it goes live."* You'd know that. Claude wouldn't.

For every material change: read Claude's "what this means", and if you'd phrase it differently, rewrite that one line. The structure stays; the judgment is yours.

Then email `policy-diff.md` to the policy author and the committee secretary. (If you prefer PDF, ask Claude: *"Save the same brief as `policy-diff.pdf` too."* — it can do that.) The author gets a structured starting point. The committee gets a one-pager instead of redlines.

The whole loop, including cross-checks, takes 15–25 minutes for a typical 30-page policy. Doing the same review by hand takes most of an afternoon.
