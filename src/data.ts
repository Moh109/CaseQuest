import raw from "./data.json";

export const data = raw;
export type Site = (typeof raw.sites)[number];

export const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
export const fmtMoney = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3).toLocaleString("en-US")}K` : `$${Math.round(n)}`;
export const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
/** Exact to the nearest $100 for budget lines: $227.5K, $19.5K, $61K. */
export const fmtK = (n: number) => `$${(Math.round(n / 100) / 10).toLocaleString("en-US")}K`;
