---
type: usecase
title: Extract data from a stack of PDF invoices into one clean CSV
audience: beginner
topics: [accounting, data, automation]
internal: false
authored: "2026-05-28"
last_reviewed: "2026-05-28"
external_link: null
deeper_link: null
ai_summary: Suppliers send invoices in every format imaginable. You re-type the fields into Excel for hours. Drop the PDFs into a folder, ask Claude for a CSV with supplier, date, amount, VAT, and invoice number — twenty minutes later you import the CSV into your accounting tool.
business_unit: accounting
time_estimate: "~25 min"
difficulty: beginner
order: 9
outcome: A `invoices.csv` file with one row per invoice — supplier name, invoice number, issue date, net amount, VAT amount, gross amount, due date — ready to import into your accounting tool.
inputs:
  - A folder of PDF invoices (one PDF per invoice; download them from your inbox or supplier portal first)
  - Claude Code installed and a terminal open (see Day 1)
---

Re-typing invoices into a spreadsheet is the dictionary definition of work that shouldn't exist. Suppliers send PDFs with totals in seven different places, dates in three formats, and supplier names that don't quite match what's in your accounting system. The accounts-payable clerk does it because nobody else will.

This use case ends that — once you've done one batch by hand to set the format, every future batch is a one-prompt job.

> **Compliance check before you start.** Invoices contain supplier names, bank details, amounts, and sometimes payment terms — internal-confidential. Same posture as policy documents: fine in a Claude-readable folder on your workstation, not for sharing on web-based AI tools. If your suppliers include large counterparties (e.g. infrastructure providers, technology vendors), confirm with your line manager before the first batch.

---

## Step 1 — Build the workspace and move the PDFs in

**Open the Terminal app.** Pick your OS at the top of this page if you haven't already.

<div data-os="mac">

Press ⌘+Space, type "Terminal", and press Enter.

</div>

<div data-os="windows">

Open the Start menu (press the Windows key), type "Ubuntu", and press Enter. If you don't see Ubuntu listed, [install WSL first](/start-here/day-1/#d1).

</div>

Type each line:

```
mkdir ~/Desktop/invoices-may
cd ~/Desktop/invoices-may
mkdir pdfs
```

- `mkdir ~/Desktop/invoices-may` — make a folder called `invoices-may` on your Desktop.
- `cd ~/Desktop/invoices-may` — move into it.
- `mkdir pdfs` — make a sub-folder called `pdfs` inside it. Claude reads from here.

Now get the PDFs into the `pdfs/` subfolder. Easiest way:

**Option A — Finder / File Explorer.** Open `~/Desktop/invoices-may/pdfs` and drag every invoice PDF into it.

**Option B — Terminal, if they're all in Downloads:**

```
mv ~/Downloads/*.pdf pdfs/
```

The `*.pdf` is a wildcard — it matches every PDF file in Downloads at once. They all move to `pdfs/`.

Then start Claude:

```
claude
```

---

## Step 2 — Pick one invoice and let Claude show you what it sees

Different suppliers lay out invoices differently. Before you ask Claude to do all of them, have it look at one so you can confirm it's pulling the right fields.

Tell Claude:

> Pick any one PDF from `pdfs/`. Extract these fields and show them to me as a table:
>
> - Supplier name (the company you're paying)
> - Invoice number
> - Issue date (in YYYY-MM-DD format)
> - Net amount (the amount excluding VAT)
> - VAT amount
> - Gross amount (net + VAT)
> - Due date (in YYYY-MM-DD format)
> - Currency (EUR, USD, etc.)
>
> If any field genuinely isn't on the invoice, mark it as `MISSING`. Don't guess.

Press Enter. Claude reads the PDF and shows you the parsed fields.

This is the most important step. If "supplier name" is coming out as "Ltd Trading Co" (the right-hand side of a name) instead of the full company name, fix the prompt now — for example: *"the supplier name is whatever appears next to 'Bill from:' or in the top-left letterhead, full legal name including 'Ltd' / 'A.E.' etc."*

Iterate on one invoice until the fields are right.

---

## Step 3 — Ask Claude to process all of them

Once one invoice parses correctly, tell Claude:

> Now apply the same extraction to every PDF in `pdfs/`. Write the results to `invoices.csv` with these columns in this order:
>
> `supplier_name,invoice_number,issue_date,net_amount,vat_amount,gross_amount,due_date,currency,source_file`
>
> One row per PDF. The last column `source_file` is just the PDF's filename — so we can trace any row back to the original document if something looks wrong.
>
> Where a field is genuinely missing, write `MISSING` (uppercase, no quotes).
>
> Dates always YYYY-MM-DD. Amounts always with `.` as decimal separator (no thousands separator).

Press Enter. A batch of 30 PDFs takes 2–5 minutes. Claude works through them and writes the CSV.

---

## Step 4 — Spot-check the CSV against the originals

Ask Claude:

> Show me the first 5 rows of `invoices.csv`.

Pick two rows. For each one:

1. Open the matching PDF from `pdfs/` (the filename is in the `source_file` column).
2. Compare the row's net amount, VAT, and gross against what the PDF actually says.
3. Confirm `net + VAT = gross` to the cent.

If a row is wrong, tell Claude which `source_file` mis-parsed and what the right value should be:

> Row for `invoice-PR-2026-0421.pdf` has VAT as 24.00 — the actual invoice shows VAT as 240.00. Re-extract this one PDF and update the CSV row.

Pay special attention to:

- **Decimal vs thousands separators.** European invoices often use `.` for thousands and `,` for decimal (`1.250,00`). Claude may flip them — verify on any line where the amount looks oddly large or small.
- **Multi-currency invoices.** A USD invoice in a batch of EUR ones is easy to miss if the currency column isn't filled.
- **MISSING fields.** Are they genuinely missing, or did Claude not find them? Look at one or two MISSING entries to be sure.

Iterate. Once the spot-checks pass, you trust the file.

---

## Step 5 — Import into your accounting tool

Most accounting tools (SAP, Oracle, smaller ones like Xero / QuickBooks) accept a CSV import. Open your tool → import → point at `~/Desktop/invoices-may/invoices.csv`.

You may need to map the column names to whatever your tool expects (e.g. our `supplier_name` → their `Vendor`). Once mapped, save the mapping — next month's batch reuses it.

The pattern for next month: drop fresh PDFs into a new folder, run the same prompt. Twenty minutes for 30 invoices instead of two hours.

The deeper win: the CSV is also a perfect starting point for spend analysis. *"Group by supplier_name, sum gross_amount, sort descending"* gives you your top vendors of the quarter — a question that used to require a separate request to finance.
