# Spares Radar

**The right part, there before the machine breaks. And no repair starts until it's safe.**

The morning check for Lone Mesa crews (Operation Spirit, CaseQuest 2026). A working prototype app
built on the case's fictional company, Lone Mesa Energy (6 sites, 18 machines, 2025 data):

- **Morning board**: pick a site and date. Each machine shows vibration vs normal,
  warning/normal/down status, and whether its part is on the shelf.
- **Work orders**: safety hold check → pre-job checks (LOTO, H₂S gas test, pressure) → part from
  the shelf or ordered → supervisor approval. Technicians request; only the site supervisor approves.
- **Safety**: open HSE actions per site. The HSE supervisor verifies fixes, and a site's hold lifts
  once all its critical fixes are verified.
- **Audit log** of every action, a how-it-works diagram, and an impact panel.

Site stock % is case data. Which kit is on each shelf is simulated from it.

Built with Vite, React, TypeScript, Tailwind CSS and Framer Motion. All charts are hand-built SVG.

> Fictional data supplied by the competition. Not affiliated with or endorsed by ConocoPhillips.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## How the data is cleaned

`CaseQuest2026Dataset.xlsx` is the raw competition file and is never edited.
`scripts/clean.py` reads it and writes `src/data.json`, which is the only data the site uses.

```bash
pip install pandas openpyxl numpy
npm run clean-data        # same as: python3 scripts/clean.py
```

What it does (full details in [`scripts/cleaning_log.md`](scripts/cleaning_log.md)):

- **Events**: normalizes asset IDs (`a003`, `A09`, `8`, `11` become `A003`, `A009`, `A008`,
  `A011`). Drops 2 exact duplicate rows (E0021, E0141). Fills blank `stopped_hours` from the five
  stages. Rebuilds start and end times from `opened_utc - detect_hours` and `closed_utc`. Leaves
  pending parts invoices as unknown, not zero.
- **Assets**: strips the `bbl/hr` text from capacity.
- **Readings**: drops 6,594 exact duplicates (6,570 rows left). Converts 4 Fahrenheit temperatures
  to Celsius. Charts use only readings that are both Valid and Running.
- **HSE**: drops exact duplicates (72 rows become 36).
- **Loss per event** = `lost_oil_bbl × (1 − recoverable_fraction) × (price − variable_cost)` for
  that asset and month.

The script then checks every headline number on the page and exits with an error if any of
them changes. The checks: 313 breakdowns, 6,599 h down, $5.6M lost, 1,613 h waiting on parts,
34.1 h vs 15.4 h, a −0.99 correlation, 11 open safety actions, 968 h vs 689 h, $247K vs $566K,
and so on.

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import **Moh109/CaseQuest**. If it isn't listed, click "Adjust GitHub App Permissions" and
   give Vercel access to the repo.
3. Vercel detects **Vite** on its own. Leave the defaults: build command `npm run build`, output
   directory `dist`, root directory `./`.
4. Click **Deploy**. About a minute later you get a live `*.vercel.app` link.
5. Every push to `main` redeploys automatically. Other branches get their own preview links.
