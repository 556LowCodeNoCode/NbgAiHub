---
type: usecase
title: Draft a customer reply that doesn't sound corporate
audience: beginner
topics: [writing, retail, customer-care]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: A frustrated customer emails you. You have three minutes between meetings and a blank reply window. Claude gives you three draft replies in three different tones — you pick the closest one, tweak two sentences, send.
business_unit: retail
time_estimate: "~15 min"
difficulty: beginner
order: 2
outcome: Three reply drafts in three different tones (warm / formal / apologetic) with one short rationale each — pick the closest one and polish in place.
inputs:
  - A customer complaint in plain text (you'll paste it into a file Claude creates)
  - Claude Code installed and a terminal open (see Day 1)
---

Retail branches and customer-care desks send replies all day. The good ones take ten minutes each because every reply is bespoke. The fast ones take ninety seconds because the writer pastes the same paragraph into every email. Neither is great.

This use case lands in the middle: three minutes to a polished, personal-sounding draft you'd actually send.

> **Compliance check before you start.** Strip the customer's real name, account number, and any identifiers before you paste the complaint into Claude. Use "the customer" or a placeholder like `[CUSTOMER NAME]`. The point of this exercise is the *shape* of the reply — you'll fill the real details back in before you send.

---

## Step 1 — Build the workspace

You'll make a folder on your Desktop and let Claude create the files inside it. No text editor required.

**Open the Terminal app.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Type each line and press Enter.

```
mkdir ~/Desktop/replies-today
cd ~/Desktop/replies-today
claude
```

Plain-English translation:

- `mkdir ~/Desktop/replies-today` — make a new folder called `replies-today` on your Desktop.
- `cd ~/Desktop/replies-today` — move the terminal into it.
- `claude` — start Claude Code in this folder. Claude can now read and write files here.

The blinking cursor is now Claude's. You're chatting with it.

---

## Step 2 — Let Claude create the complaint file

You don't need to know how to make a file by hand. Just tell Claude:

> Create a file called `complaint.txt` in this folder. Paste this customer message into it exactly as I send it next.
>
> *(Then in the next message, paste the customer's email — anonymised. Names, account numbers, IBANs stripped.)*

Claude will ask permission before writing the file. Say yes. You'll see `complaint.txt` appear in the folder on your Desktop.

If you'd rather skip the file and paste the complaint directly into your next message to Claude, that works too — files just scale better once you have ten of these on a busy morning.

---

## Step 3 — Brief Claude for the reply

Send this briefing. Treat it as a template — the bracketed bits are the only parts you change per reply.

> You're helping a [retail branch / customer care] specialist at NBG draft a reply to an unhappy customer.
>
> Read `complaint.txt`. The customer is complaining about [one-line summary — e.g. "a duplicate charge on their debit card"].
>
> The known facts on our side are:
>
> - [Fact 1 — e.g. "the duplicate was a Visa authorisation hold, not a real charge"]
> - [Fact 2 — e.g. "the hold released this morning"]
> - [Fact 3 — e.g. "we cannot share the merchant's internal reasoning"]
>
> Produce **three** reply drafts in three different tones:
>
> 1. **Warm and personal** — acknowledges the frustration, leads with empathy
> 2. **Formal and procedural** — leads with what we did, what the customer should do
> 3. **Apologetic and corrective** — explicitly says where the bank could have done better
>
> Each draft is under 150 words, ends with "Kind regards, [Specialist name]", and avoids: "we apologise for any inconvenience", "as per our records", "kindly note that", and any other corporate filler.
>
> Below each draft, one sentence on which kind of customer it suits best.

Press Enter.

---

## Step 4 — Pick the closest one and polish

Read all three. Don't pick the *best* — pick the one *closest* to what you'd send. You'll polish it from there.

In Claude, you can ask:

> Take draft 2 and merge in the empathy from the first paragraph of draft 1. Keep it under 150 words.

That's the move. You're not asking Claude to write your reply — you're directing a junior who's already shown you three options.

Two final passes:

1. **Read it aloud.** If a sentence sounds like a memo, change it. Customers hear the voice in their head.
2. **Check the facts.** Did Claude state anything you didn't tell it? If yes, delete it. *"We've already contacted the merchant"* is the kind of plausible-sounding claim a model invents on its own — don't ship it unless it's true.

Two minutes. Then paste the final into Outlook, fill the real customer name + your signature back in, send.

---

## Step 5 — Save the briefing as your daily template

Once you have a reply you'd send, ask Claude:

> Create a file called `briefing-template.md` in this folder. Put the exact briefing prompt I used inside it, with bracketed `[…]` placeholders where the per-customer facts go.

Claude writes the file. Tomorrow's complaints reuse the template — you only change the bracketed bits. After a week you'll have a library of facts-on-our-side blocks you can lift from yesterday's prompts.

You've turned the worst kind of task — emotionally draining, repeated dozens of times a day, easy to get wrong — into something tractable.
