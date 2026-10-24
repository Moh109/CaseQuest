"""Clean CaseQuest2026Dataset.xlsx and write src/data.json for the Spares Radar site.

Usage:  python scripts/clean.py
Writes: src/data.json, scripts/cleaning_log.md
Exits non-zero if any headline number fails to reproduce.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "CaseQuest2026Dataset.xlsx"
OUT = ROOT / "src" / "data.json"
LOG = ROOT / "scripts" / "cleaning_log.md"
AS_OF = pd.Timestamp("2026-10-01")
STAGES = ["detect_hours", "dispatch_hours", "parts_wait_hours", "repair_hours", "restart_hours"]

log: list[str] = []


def note(section: str, msg: str) -> None:
    log.append(f"- **{section}**: {msg}")


def norm_asset(v) -> str:
    s = str(v).strip().upper()
    if s.startswith("A"):
        s = s[1:]
    return f"A{int(float(s)):03d}"


raw = pd.read_excel(XLSX, sheet_name=None)

# ---------------- Assets ----------------
assets = raw["Assets"].copy()
cap_raw = assets["modeled_capacity_bbl_hr"].astype(str)
n_units = cap_raw.str.contains("bbl", case=False).sum()
assets["modeled_capacity_bbl_hr"] = cap_raw.str.replace(r"[^0-9.]", "", regex=True).astype(float)
assets["asset_id"] = assets["asset_id"].map(norm_asset)
note("Assets", f"stripped 'bbl/hr' text from {n_units} capacity values.")
sites = (
    assets.groupby(["site_id", "site_name"], as_index=False)
    .first()[["site_id", "site_name", "network_uptime_pct", "technicians", "spare_fill_pct",
              "training_hours_per_person", "edge_setup_usd", "edge_annual_usd", "cleanup_setup_usd",
              "available_project_hours"]]
)

# ---------------- Events ----------------
ev = raw["Events"].copy()
n0 = len(ev)
orig_ids = ev["asset_id"].astype(str)
ev["asset_id"] = ev["asset_id"].map(norm_asset)
changed = sorted(set(f"{a!r}->{b}" for a, b in zip(orig_ids, ev["asset_id"]) if a != b))
note("Events", f"normalized {sum(orig_ids != ev['asset_id'])} asset IDs ({', '.join(changed)}).")

dup_mask = ev.duplicated(keep="first")
dups = ev.loc[dup_mask, "event_id"].tolist()
ev = ev[~dup_mask].copy()
note("Events", f"dropped {len(dups)} exact duplicate rows ({', '.join(dups)}); {n0} -> {len(ev)} rows.")
assert ev["event_id"].is_unique

blank = ev["stopped_hours"].isna()
ev.loc[blank, "stopped_hours"] = ev.loc[blank, STAGES].sum(axis=1).round(2)
note("Events", f"filled {blank.sum()} blank stopped_hours from the sum of the 5 stages "
     f"({', '.join(ev.loc[blank, 'event_id'])}).")

for c in ["opened_utc", "closed_utc"]:
    ev[c] = pd.to_datetime(ev[c])
ev["start_utc"] = (ev["opened_utc"] - pd.to_timedelta(ev["detect_hours"], unit="h")).dt.round("min")
ev["end_utc"] = ev["closed_utc"]
note("Events", "rebuilt start_utc = opened_utc - detect_hours and end_utc = closed_utc for every row "
     "(raw start times mixed formats and some had lost their time of day).")

pending = ev["cost_status"].eq("Parts invoice pending")
note("Events", f"{pending.sum()} parts invoices pending: parts_usd left as unknown (null), not 0.")
ev["known_cost_usd"] = ev["labor_hours"] * ev["labor_rate_usd_hr"] + ev["parts_usd"] + ev["contractor_usd"]

# ---------------- Production + loss ----------------
prod = raw["Production"].copy()
prod["asset_id"] = prod["asset_id"].map(norm_asset)
prod["month"] = pd.to_datetime(prod["month"]).dt.to_period("M")
prod = prod.drop_duplicates(["asset_id", "month"])
prod["margin"] = prod["price_usd_bbl"] - prod["variable_cost_usd_bbl"]
ev["month"] = ev["start_utc"].dt.to_period("M")
ev = ev.merge(prod[["asset_id", "month", "margin"]], on=["asset_id", "month"], how="left")
assert ev["margin"].notna().all(), "event without asset-month price"
ev["loss_usd"] = ev["lost_oil_bbl"] * (1 - ev["recoverable_fraction"]) * ev["margin"]
ev = ev.merge(assets[["asset_id", "site_id", "site_name", "asset_type", "vibration_normal_mm_s"]], on="asset_id")
note("Events", "loss_usd = lost_oil_bbl * (1 - recoverable_fraction) * (price - variable_cost) for the "
     "asset-month of the rebuilt start.")

# ---------------- Readings ----------------
rd = raw["Readings"].copy()
n0 = len(rd)
rd = rd.drop_duplicates()
note("Readings", f"dropped {n0 - len(rd)} exact duplicate rows; {len(rd)} left.")
rd["asset_id"] = rd["asset_id"].map(norm_asset)
t = rd["temperature_c"].astype(str)
f_mask = t.str.contains("F", na=False)
f_vals = t[f_mask].tolist()
rd["temperature_c"] = pd.to_numeric(t.str.replace(r"[^0-9.\-]", "", regex=True), errors="coerce")
rd.loc[f_mask, "temperature_c"] = ((rd.loc[f_mask, "temperature_c"] - 32) * 5 / 9).round(2)
note("Readings", f"converted {f_mask.sum()} Fahrenheit temperatures to C ({', '.join(f_vals)}).")
rd["observed_utc"] = pd.to_datetime(rd["observed_utc"])
rd["vibration_mm_s"] = pd.to_numeric(rd["vibration_mm_s"], errors="coerce")
note("Readings", "used the provided asset_id mapping (legacy LEG-xxx tags kept in asset_tag). "
     "Missing and Suspect readings kept in the table but excluded from charts.")

# ---------------- HSE ----------------
hse = raw["HSE"].copy()
n0 = len(hse)
hse = hse.drop_duplicates()
note("HSE", f"dropped {n0 - len(hse)} exact duplicate rows; {n0} -> {len(hse)}.")
hse["due_date"] = pd.to_datetime(hse["due_date"])
hse["asset_id"] = hse["asset_id"].map(norm_asset)

# =============== Analysis ===============
un = ev[ev["event_type"].eq("Unplanned")].copy()
waited = un["parts_wait_hours"] > 0
down = un["stopped_hours"].sum()
pw = un["parts_wait_hours"].sum()
loss = un["loss_usd"].sum()
over24 = un["stopped_hours"] > 24

by_site = (
    un.groupby(["site_id", "site_name"])
    .agg(breakdowns=("event_id", "size"), downtime=("stopped_hours", "sum"),
         parts_wait=("parts_wait_hours", "sum"), waited=("parts_wait_hours", lambda s: (s > 0).sum()),
         loss=("loss_usd", "sum"))
    .reset_index()
    .merge(sites[["site_id", "spare_fill_pct", "technicians", "network_uptime_pct"]], on="site_id")
)
by_site["waited_share"] = by_site["waited"] / by_site["breakdowns"]
corr = float(np.corrcoef(by_site["spare_fill_pct"], by_site["waited_share"])[0, 1])

open_h = hse[hse["action_status"].eq("Open")].copy()
open_h["days_overdue"] = (AS_OF - open_h["due_date"]).dt.days
sev5 = open_h[open_h["potential_severity"].astype(int).eq(5)]
hold_sites = sorted(sev5["site_id"].unique())
hse_linked = hse.merge(ev[["event_id", "event_type"]], on="event_id", how="left")
all_in_breakdowns = bool(hse_linked["event_type"].eq("Unplanned").all())

top3 = by_site[by_site["site_name"].isin(["Arroyo", "Mesa", "Prairie"])]["loss"].sum() / loss

# ---- options ----
sol = raw["Solutions"].set_index("option_id")


def remaining(df: pd.DataFrame, red: dict) -> pd.Series:
    """Remaining stopped hours after stage reductions (protected repair untouched)."""
    rep = df["protected_repair_hours"] + (df["repair_hours"] - df["protected_repair_hours"]) * (1 - red["repair"])
    return (df["detect_hours"] * (1 - red["detect"]) + df["dispatch_hours"] * (1 - red["dispatch"])
            + df["parts_wait_hours"] * (1 - red["parts_wait"]) + rep + df["restart_hours"] * (1 - red["restart"]))


def option_effect(opt: str, level: str) -> dict:
    r = sol.loc[opt]
    red = {s: float(r[f"{s}_{level}"]) for s in ["detect", "dispatch", "parts_wait", "repair", "restart"]}
    elig = r["eligible_causes"]
    df = un if elig == "All unplanned" else un[un["cause"].isin([c.strip() for c in elig.split(";")])]
    base = remaining(df, {k: 0 for k in red})
    after = remaining(df, red)
    saved = base - after
    kept = (df["loss_usd"] * saved / df["stopped_hours"]).sum()
    return {"hours": round(float(saved.sum()), 1), "profit": round(float(kept), 0),
            "parts_wait_after": round(float(df["parts_wait_hours"].sum() * (1 - red["parts_wait"])), 1)}


hse_setup = float(open_h["action_setup_usd"].astype(float).sum())
hse_annual = float(open_h["action_annual_usd"].astype(float).sum())
hse_hours = float(open_h["action_person_hours"].astype(float).sum())
n_sites, n_assets = len(sites), len(assets)

o4 = sol.loc["O4"]
costA_setup = float(o4["setup_usd"]) * n_sites + hse_setup
costA_annual = float(o4["annual_usd"]) * n_sites + hse_annual

o1, o2, o6 = sol.loc["O1"], sol.loc["O2"], sol.loc["O6"]
edge = sites[sites["network_uptime_pct"] < 97]
costB_setup = (float(o1["setup_usd"]) * n_assets + float(o2["setup_usd"]) + float(o6["setup_usd"]) * n_sites
               + sites["cleanup_setup_usd"].sum() + edge["edge_setup_usd"].sum() + hse_setup)
costB_annual = (float(o1["annual_usd"]) * n_assets + float(o2["annual_usd"]) + float(o6["annual_usd"]) * n_sites
                + edge["edge_annual_usd"].sum() + hse_annual)

# Staff hours to stand each option up (HSE action hours are shared and counted separately)
training_hours = float((sites["technicians"] * sites["training_hours_per_person"]).sum())
hoursA = float(o4["install_person_hours"]) * n_sites
hoursB = float(o1["install_person_hours"]) * n_assets + float(o2["install_person_hours"]) + training_hours

options = {}
for key, opt, setup, annual, staff in [("A", "O4", costA_setup, costA_annual, hoursA),
                                       ("B", "O1", costB_setup, costB_annual, hoursB)]:
    year1 = setup + annual
    scen = {}
    for lvl, name in [("low", "cautious"), ("base", "expected"), ("high", "optimistic")]:
        e = option_effect(opt, lvl)
        e["payback_months"] = round(year1 / e["profit"] * 12, 1)
        scen[name] = e
    options[key] = {"option_id": opt, "setup_usd": setup, "annual_usd": annual, "year1_usd": year1,
                    "staff_hours": staff, "lead_months": int(sol.loc[opt, "lead_months"]), "scenarios": scen}

# ---- A010 story ----
a10 = rd[(rd["asset_id"] == "A010") & rd["quality"].eq("Valid") & rd["operating_state"].eq("Running")
         & rd["observed_utc"].between("2025-08-25", "2025-09-26 23:59")].sort_values("observed_utc")
normal = float(assets.set_index("asset_id").loc["A010", "vibration_normal_mm_s"])
a10_series = [{"t": d.strftime("%Y-%m-%d"), "v": round(v, 2), "ratio": round(v / normal, 3)}
              for d, v in zip(a10["observed_utc"], a10["vibration_mm_s"])]
a10_events = un[(un["asset_id"] == "A010") & un["start_utc"].between("2025-08-25", "2025-09-27")].sort_values("start_utc")
r1 = lambda x: float(f"{x + 1e-9:.1f}")  # round half up (46.25 -> 46.3)


def event_info(e) -> dict:
    lead = [p for p in a10_series if pd.Timestamp(p["t"]) >= e["start_utc"] - pd.Timedelta(days=7)
            and pd.Timestamp(p["t"]) < e["start_utc"]]
    w = next((p for p in lead if p["ratio"] >= 1.3), None)
    return {"event_id": e["event_id"], "start": e["start_utc"].strftime("%Y-%m-%d %H:%M"),
            "end": e["end_utc"].strftime("%Y-%m-%d %H:%M"), "cause": e["cause"],
            "stopped_hours": r1(e["stopped_hours"]), "parts_wait_hours": r1(e["parts_wait_hours"]),
            "without_wait_hours": r1(e["stopped_hours"] - e["parts_wait_hours"]),
            "warning": w, "stages": {s.replace("_hours", ""): round(float(e[s]), 2) for s in STAGES}}


a10_failures = [event_info(e) for _, e in a10_events.iterrows()]
fail_info = next(f for f in a10_failures if f["start"].startswith("2025-09-21"))
warn = fail_info["warning"]
assert warn and warn["t"] == "2025-09-19", warn
a11_warn = rd[(rd["asset_id"] == "A011") & rd["quality"].eq("Valid") & rd["operating_state"].eq("Running")
              & (rd["observed_utc"].dt.strftime("%Y-%m-%d") == "2025-09-19")]
a11_ratio = float(a11_warn["vibration_mm_s"].iloc[0] / 2.7) if len(a11_warn) else None


def stage_avg(df):
    return {s.replace("_hours", ""): round(float(df[s].mean()), 2) for s in STAGES}


# =============== Checks ===============
checks = [
    ("Unplanned breakdowns", len(un), 313, lambda a, b: a == b),
    ("Downtime h", round(down), 6599, lambda a, b: a == b),
    ("Loss $M", round(loss / 1e6, 1), 5.6, lambda a, b: a == b),
    ("Parts wait h", round(pw), 1613, lambda a, b: a == b),
    ("Parts wait share %", round(pw / down * 100), 24, lambda a, b: a == b),
    ("Avg with wait h", round(un.loc[waited, "stopped_hours"].mean(), 1), 34.1, lambda a, b: a == b),
    ("Avg without wait h", round(un.loc[~waited, "stopped_hours"].mean(), 1), 15.4, lambda a, b: a == b),
    ("Breakdowns > 24 h", int(over24.sum()), 94, lambda a, b: a == b),
    ("> 24 h that waited", int((over24 & waited).sum()), 91, lambda a, b: a == b),
    ("Stock vs wait corr", round(corr, 2), -0.99, lambda a, b: a == b),
    ("Open HSE actions", len(open_h), 11, lambda a, b: a == b),
    ("Open severity-5", len(sev5), 6, lambda a, b: a == b),
    ("Avg days overdue, severity-5", round(sev5["days_overdue"].mean()), 572, lambda a, b: a == b),
    ("Arroyo/Mesa/Prairie loss %", round(top3 * 100), 69, lambda a, b: a == b),
    ("Option A h/yr", round(options["A"]["scenarios"]["expected"]["hours"]), 968, lambda a, b: a == b),
    ("Option B h/yr", round(options["B"]["scenarios"]["expected"]["hours"]), 689, lambda a, b: a == b),
    ("Option A year-1 $K", round(costA_setup / 1e3 + costA_annual / 1e3), 247, lambda a, b: a == b),
    ("Option B year-1 $K", round(costB_setup / 1e3 + costB_annual / 1e3), 566, lambda a, b: a == b),
    ("Ask (A upfront) $K", costA_setup / 1e3, 227.5, lambda a, b: a == b),
    ("A010 Sep 21 down h", fail_info["stopped_hours"], 46.3, lambda a, b: a == b),
    ("A010 Sep 21 parts wait h", fail_info["parts_wait_hours"], 25.5, lambda a, b: a == b),
    ("A010 without wait h", fail_info["without_wait_hours"], 20.8, lambda a, b: a == b),
    ("All HSE rows tied to breakdowns", all_in_breakdowns, True, lambda a, b: a == b),
]
fails = []
log.append("\n## Reproduction checks\n\n| Check | Got | Expected | OK |\n|---|---|---|---|")
for name, got, exp, ok in checks:
    good = ok(got, exp)
    log.append(f"| {name} | {got} | {exp} | {'yes' if good else '**NO**'} |")
    if not good:
        fails.append((name, got, exp))

# =============== Output ===============
data = {
    "meta": {"company": "Lone Mesa Energy", "year": 2025, "sites": n_sites, "machines": n_assets,
             "as_of": AS_OF.strftime("%Y-%m-%d")},
    "headline": {
        "breakdowns": len(un), "downtime_h": round(float(down), 1), "loss_usd": round(float(loss), 0),
        "parts_wait_h": round(float(pw), 1), "parts_wait_share": round(float(pw / down), 3),
        "avg_with_wait": round(float(un.loc[waited, "stopped_hours"].mean()), 1),
        "avg_without_wait": round(float(un.loc[~waited, "stopped_hours"].mean()), 1),
        "n_with_wait": int(waited.sum()), "n_without_wait": int((~waited).sum()),
        "over24": int(over24.sum()), "over24_waited": int((over24 & waited).sum()),
        "stages_with_wait": stage_avg(un[waited]), "stages_without_wait": stage_avg(un[~waited]),
        "corr_stock_wait": round(corr, 3), "top3_loss_share": round(float(top3), 3),
    },
    "sites": [
        {"id": r.site_id, "name": r.site_name, "spare_fill_pct": int(r.spare_fill_pct),
         "breakdowns": int(r.breakdowns), "waited": int(r.waited), "waited_share": round(float(r.waited_share), 3),
         "downtime_h": round(float(r.downtime), 1), "parts_wait_h": round(float(r.parts_wait), 1),
         "loss_usd": round(float(r.loss), 0), "technicians": int(r.technicians),
         "on_hold": r.site_id in hold_sites,
         "open_actions": int((open_h["site_id"] == r.site_id).sum()),
         "open_sev5": int((sev5["site_id"] == r.site_id).sum())}
        for r in by_site.itertuples()
    ],
    "hse": {
        "open": len(open_h), "open_sev5": len(sev5), "avg_days_overdue_sev5": round(float(sev5["days_overdue"].mean())),
        "avg_days_overdue_all": round(float(open_h["days_overdue"].mean())),
        "all_linked_to_breakdowns": all_in_breakdowns, "observations": len(hse),
        "outcomes": {k: int(v) for k, v in hse["outcome"].value_counts().items()},
        "setup_usd": hse_setup, "annual_usd": hse_annual, "person_hours": hse_hours,
        "actions": [{"id": r.hse_id, "site_id": r.site_id, "asset_id": r.asset_id, "hazard": r.hazard,
                     "severity": int(r.potential_severity), "due": r.due_date.strftime("%Y-%m-%d"),
                     "days_overdue": int(r.days_overdue), "gap": r.control_gap,
                     "setup_usd": float(r.action_setup_usd), "annual_usd": float(r.action_annual_usd)}
                    for r in open_h.itertuples()],
    },
    "a010": {"normal": normal, "series": a10_series, "warning": warn, "failure": fail_info, "failures": a10_failures,
             "a011_ratio_sep19": round(a11_ratio, 2) if a11_ratio else None},
    "options": options,
    "rollout": {"parts_wait_target_h": round(float(pw) * 0.4), "downtime_target_h": round(float(down - options["A"]["scenarios"]["expected"]["hours"]))},
    "cleaning": [l.lstrip("- ") for l in log if l.startswith("- ")],
}
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps(data, indent=1, default=str))
LOG.write_text("# Cleaning log\n\nSource: CaseQuest2026Dataset.xlsx (raw file kept unchanged).\n\n## Steps\n\n"
               + "\n".join(log) + "\n")

print("\n".join(log))
if fails:
    print("\nMISMATCHES:", fails)
    sys.exit(1)
print(f"\nAll checks pass. Wrote {OUT.relative_to(ROOT)}")
