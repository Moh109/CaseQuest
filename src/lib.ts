import { data } from "./data";

export const app = data.app;
export type Asset = (typeof app.assets)[number];
export type Status = "down" | "warning" | "normal" | "nodata";
export const WARN = 1.3;

export const siteById = Object.fromEntries(data.sites.map((s) => [s.id, s]));
export const assetsAt = (site: string) => app.assets.filter((a) => a.site === site);
const readingIndex: Record<string, Record<string, [string, number | null, string]>> = {};
for (const [aid, rows] of Object.entries(app.readings)) {
  readingIndex[aid] = Object.fromEntries((rows as [string, number | null, string][]).map((r) => [r[0], r]));
}

const dayStart = (d: string) => new Date(d + "T00:00:00Z").getTime();
const ts = (s: string) => new Date(s.replace(" ", "T") + ":00Z").getTime();
export const addDays = (d: string, n: number) => new Date(dayStart(d) + n * 864e5).toISOString().slice(0, 10);
export const fmtDay = (d: string) =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** The board is the 6:30 AM morning check. */
export const BOARD_HOUR = 6.5;
export const BOARD_TIME = "6:30 AM";

/** Outage (planned or not) in progress at the board time, if any. */
export function outageOn(asset: string, day: string) {
  const t = dayStart(day) + BOARD_HOUR * 36e5;
  return app.events.find((ev) => ev.asset === asset && ts(ev.start) <= t && ts(ev.end) > t);
}

export function readingOn(asset: string, day: string) {
  const r = readingIndex[asset]?.[day];
  return { ratio: r ? r[1] : null, state: r ? r[2] : "X" };
}

export function statusOn(asset: string, day: string): { status: Status; ratio: number | null; outage?: ReturnType<typeof outageOn> } {
  const outage = outageOn(asset, day);
  const { ratio } = readingOn(asset, day);
  if (outage) return { status: "down", ratio, outage };
  if (ratio == null) return { status: "nodata", ratio };
  return { status: ratio >= WARN ? "warning" : "normal", ratio };
}

export const history = (asset: string, day: string, n = 14) =>
  Array.from({ length: n }, (_, i) => readingOn(asset, addDays(day, i - n + 1)).ratio);

/** Critical kits each site keeps, and which machine type uses which kit. */
export const KITS = ["Bearing kit", "Seal kit", "Electrical kit"] as const;
export type Kit = (typeof KITS)[number];
export const PART: Record<string, Kit> = { "Transfer pump": "Bearing kit", "Lift pump": "Seal kit", Compressor: "Electrical kit" };
export const TARGET = 4;
export const REORDER_POINT = 2;
/** Reorders bring a kit back up to target. Shared by the board and Parts readiness. */
export const reorderQty = (onHand: number) => Math.max(1, TARGET - onHand);

/**
 * Per-kit shelf stock is SIMULATED. The case gives each site's spare_fill_pct (real data), so each
 * kit starts at about TARGET × fill, with a small stable jitter per site and kit.
 * Arroyo's bearing kit starts at 0 to match A010's Sep 21 outage, which waited 25.5 h on parts.
 */
export function initialStock(site: string, kit: Kit) {
  if (site === "S04" && kit === "Bearing kit") return 0;
  let h = 7;
  for (const c of site + kit) h = (h * 31 + c.charCodeAt(0)) % 997;
  const fill = siteById[site].spare_fill_pct / 100;
  return Math.max(site === "S04" ? 1 : 0, Math.round(TARGET * fill - (h % 3) * 0.4));
}

export const HAZARD: Record<string, string> = {
  "H2S monitoring": "Gas detection (H₂S) check",
  "Energy isolation / LOTO": "Lock-out / tag-out check",
  "Hydrocarbon containment": "Spill containment repair",
};

export const overdueOn = (due: string, day: string) => Math.round((dayStart(day) - dayStart(due)) / 864e5);
