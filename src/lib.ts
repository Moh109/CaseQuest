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

/** Outage (planned or not) overlapping the board date, if any. */
export function outageOn(asset: string, day: string) {
  const s = dayStart(day), e = s + 864e5;
  return app.events.find((ev) => ev.asset === asset && ts(ev.start) < e && ts(ev.end) >= s);
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

export const PART: Record<string, string> = {
  "Transfer pump": "Bearing kit",
  "Lift pump": "Seal and bearing kit",
  Compressor: "Valve and bearing kit",
};

/**
 * Per-part shelf stock is SIMULATED: the case only gives each site's fill rate (real data),
 * so each machine's kit is "on the shelf" with that probability, seeded by asset ID so it's stable.
 * A010's kit is set out of stock to match the Sep 21 outage, which waited 25.5 h on parts.
 */
export function partOnShelf(a: Asset) {
  if (a.id === "A010") return false;
  let h = 7;
  for (const c of a.id + a.site) h = (h * 31 + c.charCodeAt(0)) % 1000;
  return h % 100 < siteById[a.site].spare_fill_pct;
}

export const HAZARD: Record<string, string> = {
  "H2S monitoring": "Gas detection (H₂S) check",
  "Energy isolation / LOTO": "Lock-out / tag-out check",
  "Hydrocarbon containment": "Spill containment repair",
};

export const overdueOn = (due: string, day: string) => Math.round((dayStart(day) - dayStart(due)) / 864e5);
