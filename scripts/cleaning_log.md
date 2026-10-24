# Cleaning log

Source: CaseQuest2026Dataset.xlsx (raw file kept unchanged).

## Steps

- **Assets**: stripped 'bbl/hr' text from 3 capacity values.
- **Events**: normalized 8 asset IDs ('11'->A011, '8'->A008, 'A09'->A009, 'a003'->A003, 'a006'->A006, 'a010'->A010).
- **Events**: dropped 2 exact duplicate rows (E0021, E0141); 387 -> 385 rows.
- **Events**: filled 4 blank stopped_hours from the sum of the 5 stages (E0012, E0072, E0192, E0292).
- **Events**: rebuilt start_utc = opened_utc - detect_hours and end_utc = closed_utc for every row (raw start times mixed formats and some had lost their time of day).
- **Events**: 14 parts invoices pending: parts_usd left as unknown (null), not 0.
- **Events**: loss_usd = lost_oil_bbl * (1 - recoverable_fraction) * (price - variable_cost) for the asset-month of the rebuilt start.
- **Readings**: dropped 6594 exact duplicate rows; 6570 left.
- **Readings**: converted 4 Fahrenheit temperatures to C (142.52 F, 138.38 F, 146.48 F, 143.06 F).
- **Readings**: used the provided asset_id mapping (legacy LEG-xxx tags kept in asset_tag). Missing and Suspect readings kept in the table but excluded from charts.
- **HSE**: dropped 36 exact duplicate rows; 72 -> 36.

## Reproduction checks

| Check | Got | Expected | OK |
|---|---|---|---|
| Unplanned breakdowns | 313 | 313 | yes |
| Downtime h | 6599 | 6599 | yes |
| Loss $M | 5.6 | 5.6 | yes |
| Parts wait h | 1613 | 1613 | yes |
| Parts wait share % | 24 | 24 | yes |
| Avg with wait h | 34.1 | 34.1 | yes |
| Avg without wait h | 15.4 | 15.4 | yes |
| Breakdowns > 24 h | 94 | 94 | yes |
| > 24 h that waited | 91 | 91 | yes |
| Stock vs wait corr | -0.99 | -0.99 | yes |
| Open HSE actions | 11 | 11 | yes |
| Open severity-5 | 6 | 6 | yes |
| Avg days overdue, severity-5 | 572 | 572 | yes |
| Arroyo/Mesa/Prairie loss % | 69 | 69 | yes |
| Option A h/yr | 968 | 968 | yes |
| Option B h/yr | 689 | 689 | yes |
| Option A year-1 $K | 247 | 247 | yes |
| Option B year-1 $K | 566 | 566 | yes |
| Ask (A upfront) $K | 227.5 | 227.5 | yes |
| A010 Sep 21 down h | 46.3 | 46.3 | yes |
| A010 Sep 21 parts wait h | 25.5 | 25.5 | yes |
| A010 without wait h | 20.8 | 20.8 | yes |
| All HSE rows tied to breakdowns | True | True | yes |
