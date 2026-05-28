---
type: usecase
title: Turn a stack of customer complaints into a one-page heatmap
audience: beginner
topics: [analysis, contact-center, reporting]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: You drop a CSV of contact-center complaints into a folder on your Desktop. Forty-five minutes later you have a one-page markdown report showing the top five themes, how often each appears, and one verbatim quote per theme. Repeatable every Monday.
business_unit: contact-center
time_estimate: "~25 min"
difficulty: beginner
order: 1
outcome: A one-page markdown report — top 5 complaint themes, counts, and one verbatim quote per theme — ready to paste into Teams or email.
inputs:
  - A CSV or Excel file of complaints with a free-text column (export it from the system that holds them)
  - Claude Code installed and a terminal open (see Day 1)
---

The contact centre collects thousands of complaints a month. Nobody reads them all. The leadership briefing wants "top themes this week" and the team lead spends two hours skim-reading rows in Excel.

This use case is the two-hour version compressed to twenty-five minutes — and it gets faster every time you run it because the prompt becomes a template you reuse.

> **Compliance check before you start.** Use a *synthetic* or *fully anonymised* extract for your first run. No customer names, no IBANs, no phone numbers in the file. Once you've done it once on safe data you'll know exactly what the prompt asks Claude to do — that's the right moment to talk to your line manager about which real data sources are cleared.

---

## Step 1 — Get the complaints out of the source system

Open the system that holds the complaints (Genesys, a CRM, a SharePoint list, whatever) and export the last week's complaints as a CSV. Aim for 200–500 rows for your first run. A small file makes the loop fast.

Keep two columns at minimum:

- `date` — when the complaint came in
- `text` — what the customer actually said

If you have categories already attached, that's fine — leave them in. Claude can tell you whether those existing categories match the themes it finds.

The file will land in your **Downloads** folder by default. Leave it there for now — we'll move it in Step 2.

---

## Step 2 — Build your workspace on the Desktop

You're going to make a folder on your Desktop, move the CSV into it, and start Claude Code there. Three commands.

**Open the Terminal app first.** Pick your OS at the top of this page if you haven't already — the boxes below switch to match.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter. (Or open Finder → Applications → Utilities → Terminal.)

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1) — it's a 10-minute one-time setup.

</div>

You'll see a prompt — the blinking cursor is waiting for you. Type each line below and press Enter after each one.

```
mkdir ~/Desktop/complaint-heatmap
cd ~/Desktop/complaint-heatmap
mv ~/Downloads/complaints.csv .
```

Plain-English translation, line by line:

- `mkdir ~/Desktop/complaint-heatmap` — **m**a**k**e a new **dir**ectory (folder) called `complaint-heatmap` on your Desktop. You'll see it appear in Finder / File Explorer.
- `cd ~/Desktop/complaint-heatmap` — **c**hange **d**irectory: move the terminal *into* that folder, so any command you type next runs there.
- `mv ~/Downloads/complaints.csv .` — **m**o**v**e the CSV from your Downloads folder into the current folder (the `.` means "here"). If your exported file is called something else, swap `complaints.csv` for the actual name.

Now start Claude Code in this folder:

```
claude
```

You'll see Claude's prompt take over the terminal. Claude can now read every file in this folder — including the CSV you just moved in.

---

## Step 3 — Ask Claude for the heatmap

Paste this prompt verbatim the first time. Tweak it next week once you know what your team actually wants to see.

> Read `complaints.csv`. The `text` column holds the verbatim complaint.
>
> Cluster the complaints into 5–7 themes by what the customer is unhappy about (not by product line). For each theme give me:
>
> 1. A short label (2–4 words)
> 2. The count and percentage of complaints in that theme
> 3. One verbatim quote that's most representative
> 4. One sentence on what would resolve most of them
>
> Output a markdown file `heatmap-report.md` formatted as a one-pager I can paste into Teams. Lead with the headline number: "X complaints across Y themes this week." Order themes by count, highest first.

Press Enter. Claude reads the file, does the clustering, and asks for permission before it writes anything. When it asks "Create `heatmap-report.md`?" — say yes. It takes 30–90 seconds.

---

## Step 4 — Review what you got back

Open `heatmap-report.md` from Finder / File Explorer (it's sitting in the same folder on your Desktop) or just ask Claude:

> Open `heatmap-report.md` and show me what you wrote.

Three things to check:

1. **Do the themes make sense?** If "Card declined at till" is split across three different themes, the clustering is too granular — tell Claude *"merge themes that share the same root cause"* and let it rewrite the file.
2. **Are the counts plausible?** If one theme has 80% of the volume and the rest are tiny, the prompt may have under-clustered — ask Claude to break the dominant theme into sub-themes.
3. **Are the verbatim quotes actually verbatim?** Cross-check one or two against the CSV. If Claude is paraphrasing, tell it *"quotes must be exact strings copied from the `text` column"* and rerun.

This review *is* the work. Five minutes here saves you from sending a wrong-looking briefing.

---

## Step 5 — Save the prompt as your Monday template

Once you're happy, tell Claude:

> Create a file called `prompt.md` in this folder and put the exact prompt you just used inside it — including any tweaks I asked for. Add a one-line comment at the top so I remember it's the Monday-heatmap template.

Claude writes the file. Now next Monday's workflow is:

1. Export a fresh CSV from the source system.
2. Make a new dated folder: `mkdir ~/Desktop/heatmap-2026-06-04 && cd ~/Desktop/heatmap-2026-06-04`
3. Copy your template over: `cp ~/Desktop/complaint-heatmap/prompt.md .` and move the new CSV in.
4. Start Claude: `claude` — then say *"use prompt.md on complaints.csv"*.

Five minutes. The heatmap is on your screen before your coffee cools.

You've just turned a recurring two-hour task into a five-minute one — and the report is more consistent than the version you used to write by hand, because the rules live in the prompt.
