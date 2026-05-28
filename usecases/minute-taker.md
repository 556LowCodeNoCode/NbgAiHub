---
type: usecase
title: Turn a Teams transcript into proper meeting minutes
audience: beginner
topics: [operations, writing, meetings]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: Teams generates a transcript automatically. It is unreadable. Claude turns it into the minutes you actually want — decisions, action items with owners and deadlines, next steps — in your team's template. Five minutes after the call ends.
business_unit: operations
time_estimate: "~15 min"
difficulty: beginner
order: 5
outcome: A markdown file `minutes-YYYY-MM-DD.md` with decisions, action items (owner + deadline), and a short narrative summary — ready to send to the meeting attendees.
inputs:
  - The Teams (or Zoom, Webex, Google Meet) transcript file
  - Claude Code installed and a terminal open (see Day 1)
---

Meeting minutes are unpaid second-shift work. Most teams have someone who does them and most of those someones resent it. Teams transcripts are technically a solution but practically a liability — they're verbatim, full of "uh", "yeah, so", and three people talking over each other, and the action items are scattered through forty pages of "I mean, kind of".

This use case extracts the meeting from the transcript in the time it takes to make coffee.

> **Compliance check before you start.** Transcripts may contain sensitive discussion — pricing, customer names, personnel decisions. Treat the transcript file the same way you'd treat any other internal-confidential document: keep it local, don't paste it into web-based AI chat tools, delete when you're done with the minutes.

---

## Step 1 — Download the transcript

In Teams: open the meeting in the chat tab → click the three-dot menu next to the recording → "Download transcript" → save it. Teams gives you either a `.vtt` or `.docx` file. Both work.

The file lands in your **Downloads** folder by default. Leave it there for now.

---

## Step 2 — Build the workspace and move the transcript in

You'll make a fresh folder on your Desktop, move the transcript into it, and start Claude there.

**Open the Terminal app.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Type each command, press Enter after each:

```
mkdir ~/Desktop/minutes-arch-review
cd ~/Desktop/minutes-arch-review
mv ~/Downloads/transcript.docx .
claude
```

Plain-English translation:

- `mkdir ~/Desktop/minutes-arch-review` — make a folder for this meeting. Replace `arch-review` with whatever names this meeting.
- `cd ~/Desktop/minutes-arch-review` — move into it.
- `mv ~/Downloads/transcript.docx .` — move the transcript file out of Downloads into the current folder. The `.` means "here". Swap `transcript.docx` for the actual filename Teams gave you.
- `claude` — start Claude Code. From now on you're chatting with it.

---

## Step 3 — Let Claude create the context file

The transcript is dialogue. Claude doesn't know who chaired, who the attendees were, what kind of meeting this was, or what style of minutes you want. So we tell it once, in a separate file, so the briefing is reusable next week.

Tell Claude:

> Create a file called `context.md` in this folder. Put these 5 lines inside it (with my values, not the placeholders):
>
> ```
> Meeting: Architecture review — payments team
> Date: 2026-05-28
> Attendees: A. Papas (chair), M. Costa, N. Demetriou, J. Vassilas
> Goal: decide on the payment-routing approach for Q3
> Style of minutes: action-led — decisions and next steps, not a play-by-play
> ```

Claude asks permission before writing the file. Say yes. Three minutes of work — and it saves you ten minutes of correcting the minutes after the fact.

---

## Step 4 — Ask for the minutes

Send this to Claude:

> Read `transcript.docx` and `context.md`.
>
> Produce `minutes-2026-05-28.md` with these sections, in this order:
>
> **1. One-paragraph summary** — what the meeting was about and what it decided. 3–4 sentences max.
>
> **2. Decisions** — bullets. Each bullet: the decision itself, then in parentheses the person whose call it was. Order by significance, not by when it was discussed.
>
> **3. Action items** — table with columns: `What | Owner | Deadline | Notes`. The owner must be a named person from the attendee list. If a deadline wasn't stated explicitly, write "TBD" — don't invent a date.
>
> **4. Discussion notes** — short bullets capturing the substance of any disagreement or open question that didn't reach a decision. Skip the rest of the transcript content.
>
> Skip filler words, side-chats, "let me share my screen" interruptions, and anything purely procedural. The minutes should read like notes a careful person took in real time — not a verbatim record.

Press Enter. Claude writes the file in 30–90 seconds, depending on transcript length.

---

## Step 5 — Sanity-check the action items, then send

Open the minutes file from Finder (it's in your `~/Desktop/minutes-arch-review/` folder), or just ask Claude:

> Show me the action items table from `minutes-2026-05-28.md`.

This is the part that matters and the part most likely to be wrong. For each row:

- **Owner** — did this person actually agree to do this thing, or did Claude pattern-match because their name was nearby? If unsure, change the owner to "TBD" rather than guess.
- **Deadline** — did anyone actually say a date? If you wrote "TBD" in the prompt and Claude still made one up, tell it: *"Action item 3 has no deadline mentioned in the transcript — replace with TBD."*
- **What** — is the action verb clear? *"Discuss routing"* is weak. *"Draft a one-pager comparing route A vs B"* is an action item.

Tighten one or two and the minutes are ready.

Paste the markdown into Teams (which renders it natively), or copy into Outlook (paste as plain text, then bold the section headers manually). Send to attendees.

Save the folder. The pattern is now repeatable: every meeting gets its own dated folder with `transcript` + `context.md` + the minutes. After a quarter you have a searchable archive of what was decided where — which is more than most teams have ever had.
