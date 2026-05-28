---
type: usecase
title: Translate a customer email between Greek and English with cultural notes
audience: beginner
topics: [operations, multilingual, customer-care]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: A complaint arrives in Greek and the case needs to escalate to a non-Greek-speaking senior in Frankfurt. Or the reverse — a London supplier sends an English contract that needs to land in front of Athens legal. Claude translates both ways and flags the phrases that don't carry across.
business_unit: operations
time_estimate: "~15 min"
difficulty: beginner
order: 11
outcome: A markdown file with the original on the left and the translation on the right, plus a "notes" section flagging phrases where Claude is uncertain or where literal translation would mislead.
inputs:
  - The document to translate (paste it in or save as a file)
  - Claude Code installed and a terminal open (see Day 1)
---

NBG operates across borders. Most of the time, a written translation isn't a hard linguistic problem — it's a context problem. Google Translate gives you a word-for-word version that's grammatically fine and tonally wrong. The Athens-Frankfurt case escalation reads as flat or rude in the target language; the London supplier's "by EOB Friday" lands in Greek inboxes as ambiguous.

This use case treats translation as a structured task: original on the left, target on the right, *notes on what didn't carry across* on the bottom. The notes are where the value lives.

> **Compliance check before you start.** Customer correspondence is internal-confidential. If you're translating a complaint, strip the customer's name, IBAN, and any account numbers before pasting into Claude — same posture as the "empathic reply" use case. Translating a *contract* is different: confirm with your line manager whether the document classification permits AI-assisted handling. When in doubt, ask before you paste.

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
mkdir ~/Desktop/translate-complaint
cd ~/Desktop/translate-complaint
claude
```

- `mkdir ~/Desktop/translate-complaint` — make a folder on your Desktop.
- `cd ~/Desktop/translate-complaint` — move into it.
- `claude` — start Claude Code here.

The cursor is now Claude's.

---

## Step 2 — Let Claude create the source file

Tell Claude:

> Create a file called `source.md` in this folder. Paste this customer email into it exactly as I send it next, including line breaks.
>
> *(Then in the next message, paste the Greek email. Customer name, account numbers, IBANs already stripped per the compliance check.)*

Claude asks permission before writing. Say yes. The Greek text now lives in `source.md`.

If the source is a PDF or Word file you already have, you can skip this step — just `mv ~/Downloads/source.pdf .` first and tell Claude to read the PDF directly.

---

## Step 3 — Brief Claude with the *purpose* of the translation

A literal translation is rarely what you want. Tell Claude who reads this, why they're reading it, and what they need to do with it.

> Create a file called `context.md`. Put these 5 lines inside it:
>
> ```
> Source language: Greek
> Target language: English (UK)
> Reader: a non-Greek-speaking senior risk officer in Frankfurt
> Reader's purpose: decide whether to escalate this complaint to legal in the next 24 hours
> Tone needed: formal but warm — must convey the customer's emotional state accurately without sounding sensationalist
> ```

Claude asks permission. Say yes.

The "tone needed" line is the one that separates good translation from mechanical translation. Spend a minute on it.

---

## Step 4 — Ask for the structured translation

Send this to Claude:

> Read `source.md` and `context.md`.
>
> Produce `translation.md` with three sections, exactly in this order:
>
> **Section 1 — Side by side.** A two-column markdown table. Left column: the original Greek paragraph. Right column: the English translation. One row per paragraph in the original.
>
> **Section 2 — Translation notes.** Bullet list of phrases where any of the following applied:
>
> - The literal translation would mislead the reader about tone or intent
> - The Greek used an idiom or formal register that doesn't have a clean English equivalent
> - A word has two plausible English translations and you picked one — say which and why
> - The customer expressed something culturally specific (e.g. addressing the bank as `την Τράπεζα` — capitalised, almost personified — which loses force in English)
>
> Each note: the Greek phrase, the English you chose, one sentence on the trade-off.
>
> **Section 3 — One-line summary in the target language.** Three sentences in English summarising what the customer is unhappy about, what they want, and what the bank's stance currently is — designed to give the Frankfurt risk officer the picture in 30 seconds before they read the full translation.
>
> Do not soften emotional language. If the customer is angry, the translation should read as angry. The Frankfurt reader needs the real signal, not a polite version of it.

Press Enter. Translation + notes for a one-page email takes 30–60 seconds.

---

## Step 5 — Cross-check the notes, then send

Ask Claude to show you what it wrote:

> Show me `translation.md`.

Section 2 — the notes — is where the value is. Read it carefully. For each note:

- Does the trade-off Claude flagged actually match how the Greek read to you?
- Are there idioms or culturally specific phrases Claude *didn't* flag that you would have?

If you spot a missed nuance, tell Claude:

> The phrase "Δεν περιμένα κάτι τέτοιο από σας" — your literal translation "I didn't expect this from you" loses the implication that the customer's relationship with the bank is now damaged, not just disappointed. Flag this in the notes and adjust the English to "I didn't expect this kind of treatment from you" or similar.

Iterate until the notes feel honest.

Then paste the markdown into Teams (which renders the table) or copy `translation.md` into Outlook for the Frankfurt senior. Include the Section 3 summary as the first paragraph of the email — that's what they read first.

The pattern works in either direction (English → Greek or Greek → English) and for any document type — contracts, internal memos, technical specifications. The structure (side-by-side, notes, one-line summary) stays. Only `context.md` changes.

Your reputation as the person who "handles the cross-border cases well" is built on getting the *notes* right — not on getting the translation perfect. Most colleagues won't notice a perfect translation; they'll notice when a nuance got flagged that they would otherwise have missed.
