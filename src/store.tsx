import { createContext, ReactNode, useContext, useMemo, useReducer } from "react";
import { data } from "./data";
import { HAZARD, initialStock, Kit, KITS, PART, TARGET } from "./lib";

export type Role = "tech" | "super" | "hse";
export const ROLE_LABEL: Record<Role, string> = { tech: "Technician", super: "Site supervisor", hse: "HSE supervisor" };
export const CHECKS = [
  { t: "Lock-out / tag-out", d: "Power isolated, locks on, stored energy tested at zero." },
  { t: "H₂S gas test", d: "Air tested at the machine and the reading logged before entry." },
  { t: "Pressure and line of fire", d: "Line pressure bled off, exclusion zone marked." },
];

export type Order = {
  id: string; asset: string; site: string; day: string; reason: string;
  checks: boolean[]; part: "shelf" | "order" | null; status: "open" | "requested" | "approved"; demo?: boolean;
};
export type Entry = { n: number; at: string; day: string; role: Role | "system"; action: string; detail: string; demo?: boolean };
export type Reorder = { id: string; site: string; kit: Kit; qty: number; status: "requested" | "approved" };
type State = { role: Role; site: string; day: string; verified: string[]; orders: Order[]; log: Entry[]; active: string | null; tab: Tab;
  shelf: Record<string, number>; reorders: Reorder[] };
export type Tab = "board" | "orders" | "shelf" | "safety" | "log";

type Action =
  | { type: "role"; role: Role } | { type: "site"; site: string } | { type: "day"; day: string } | { type: "tab"; tab: Tab }
  | { type: "verify"; id: string } | { type: "open"; asset: string; reason: string } | { type: "select"; id: string }
  | { type: "check"; id: string; i: number } | { type: "part"; id: string; part: "shelf" | "order" }
  | { type: "request"; id: string } | { type: "approve"; id: string } | { type: "reset" }
  | { type: "reorder"; site: string; kit: Kit } | { type: "approveReorder"; id: string };

const sev5 = data.hse.actions.filter((a) => a.severity === 5);
export const holdIds = (site: string, verified: string[]) => sev5.filter((a) => a.site_id === site && !verified.includes(a.id)).map((a) => a.id);

export const key = (site: string, kit: Kit) => `${site}:${kit}`;
const shelf0 = Object.fromEntries(data.sites.flatMap((x) => KITS.map((k) => [key(x.id, k), initialStock(x.id, k)])));
/**
 * Demo data: two example work orders so the lists aren't empty at the start.
 * Mesa's two critical fixes are pre-verified so its order can legitimately sit at "Waiting for approval";
 * Arroyo stays on hold for the live walkthrough.
 */
function demoState() {
  const shelf = { ...shelf0 };
  const cedarKit = key("S01", "Bearing kit");
  shelf[cedarKit] = Math.max(0, shelf[cedarKit] - 1);
  const mesaKit = key("S02", "Bearing kit");
  const mesaPart: Order["part"] = shelf[mesaKit] > 0 ? "shelf" : "order";
  if (mesaPart === "shelf") shelf[mesaKit] -= 1;
  const orders: Order[] = [
    { id: "WO-002", asset: "A004", site: "S02", day: "2025-09-19", reason: "Demo data", checks: [true, true, true], part: mesaPart, status: "requested", demo: true },
    { id: "WO-001", asset: "A001", site: "S01", day: "2025-09-19", reason: "Demo data", checks: [true, true, true], part: "shelf", status: "approved", demo: true },
  ];
  const rows: [string, Entry["role"], string, string][] = [
    ["6:40 AM", "tech", "WO-001 opened", "A001 · Cedar"],
    ["6:44 AM", "tech", "WO-001 pre-job checks 3 of 3", "LOTO, H₂S test, pressure"],
    ["6:45 AM", "tech", "WO-001 part reserved", "Bearing kit taken from Cedar shelf"],
    ["6:46 AM", "tech", "WO-001 sent for approval", "Checks done, part sorted"],
    ["6:58 AM", "super", "WO-001 approved", "Repair released"],
    ["7:05 AM", "hse", "H007 verified closed", "Gas detection (H₂S) check at Mesa"],
    ["7:09 AM", "hse", "H008 verified closed", "Lock-out / tag-out check at Mesa"],
    ["7:09 AM", "hse", "Site hold lifted", "Mesa: all critical fixes verified"],
    ["7:20 AM", "tech", "WO-002 opened", "A004 · Mesa"],
    ["7:26 AM", "tech", "WO-002 pre-job checks 3 of 3", "LOTO, H₂S test, pressure"],
    ["7:27 AM", "tech", mesaPart === "shelf" ? "WO-002 part reserved" : "WO-002 part order requested", mesaPart === "shelf" ? "Bearing kit taken from Mesa shelf" : "Needs supervisor approval"],
    ["7:28 AM", "tech", "WO-002 sent for approval", "Waiting for the site supervisor"],
  ];
  const log: Entry[] = rows.map(([at, role, action, detail], i) => ({ n: i + 1, at, day: "2025-09-19", role, action, detail, demo: true })).reverse();
  return { verified: ["H007", "H008"], orders, log, shelf };
}
const init: State = { role: "tech", site: "S04", day: "2025-09-19", active: null, tab: "board", reorders: [], ...demoState() };

function reducer(s: State, a: Action): State {
  const clock = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const add = (role: Entry["role"], action: string, detail: string, log = s.log): Entry[] =>
    [{ n: log.length + 1, at: clock, day: s.day, role, action, detail }, ...log];
  const upd = (id: string, f: (o: Order) => Order) => s.orders.map((o) => (o.id === id ? f(o) : o));
  const ord = (id: string) => s.orders.find((o) => o.id === id)!;
  switch (a.type) {
    case "role": return { ...s, role: a.role, log: add("system", "Role switched", `Now acting as ${ROLE_LABEL[a.role]}`) };
    case "site": return { ...s, site: a.site };
    case "day": return { ...s, day: a.day };
    case "tab": return { ...s, tab: a.tab };
    case "select": return { ...s, active: a.id, tab: "orders" };
    case "verify": {
      if (s.role !== "hse" || s.verified.includes(a.id)) return s;
      const act = data.hse.actions.find((x) => x.id === a.id)!;
      const verified = [...s.verified, a.id];
      let log = add("hse", `${a.id} verified closed`, `${HAZARD[act.hazard] ?? act.hazard} at ${siteName(act.site_id)}`);
      if (act.severity === 5 && holdIds(act.site_id, s.verified).length > 0 && holdIds(act.site_id, verified).length === 0)
        log = add("hse", "Site hold lifted", `${siteName(act.site_id)}: all critical fixes verified`, log);
      return { ...s, verified, log };
    }
    case "open": {
      const existing = s.orders.find((o) => o.asset === a.asset && o.status !== "approved");
      if (existing) return { ...s, active: existing.id, tab: "orders" };
      const site = data.app.assets.find((x) => x.id === a.asset)!.site;
      const o: Order = { id: `WO-${String(s.orders.length + 1).padStart(3, "0")}`, asset: a.asset, site, day: s.day, reason: a.reason, checks: [false, false, false], part: null, status: "open" };
      let log = add(s.role, `${o.id} opened`, `${a.asset} · ${a.reason}`);
      const hold = holdIds(site, s.verified);
      if (hold.length) log = add("system", `${o.id} blocked by safety hold`, `${siteName(site)}: ${hold.join(", ")} open`, log);
      return { ...s, orders: [o, ...s.orders], active: o.id, tab: "orders", log };
    }
    case "check": {
      if (s.role === "hse") return s;
      const o = ord(a.id);
      if (holdIds(o.site, s.verified).length || o.status !== "open") return s;
      const on = !o.checks[a.i];
      return { ...s, orders: upd(a.id, (x) => ({ ...x, checks: x.checks.map((c, j) => (j === a.i ? on : c)) })),
        log: add(s.role, `${a.id} check ${on ? "done" : "undone"}`, CHECKS[a.i].t) };
    }
    case "part": {
      if (s.role === "hse") return s;
      const o = ord(a.id);
      const k = key(o.site, PART[data.app.assets.find((x) => x.id === o.asset)!.type]);
      if (a.part === "shelf" && !(s.shelf[k] > 0)) return s;
      const shelf = a.part === "shelf" ? { ...s.shelf, [k]: s.shelf[k] - 1 } : s.shelf;
      return { ...s, shelf, orders: upd(a.id, (x) => ({ ...x, part: a.part })),
        log: add(s.role, a.part === "shelf" ? `${a.id} part reserved` : `${a.id} part order requested`, a.part === "shelf" ? "Taken from site shelf" : "Needs supervisor approval") };
    }
    case "request": {
      if (s.role === "hse") return s;
      return { ...s, orders: upd(a.id, (x) => ({ ...x, status: "requested" })), log: add(s.role, `${a.id} sent for approval`, "Checks done, part sorted") };
    }
    case "approve": {
      if (s.role !== "super") return s;
      const o = ord(a.id);
      return { ...s, orders: upd(a.id, (x) => ({ ...x, status: "approved" })),
        log: add("super", `${a.id} approved`, o.part === "order" ? "Repair released, part order placed" : "Repair released") };
    }
    case "reorder": {
      if (s.role === "hse" || s.reorders.some((r) => r.site === a.site && r.kit === a.kit && r.status === "requested")) return s;
      const qty = Math.max(1, TARGET - s.shelf[key(a.site, a.kit)]);
      const r: Reorder = { id: `RO-${String(s.reorders.length + 1).padStart(3, "0")}`, site: a.site, kit: a.kit, qty, status: "requested" };
      return { ...s, reorders: [r, ...s.reorders], log: add(s.role, `${r.id} reorder requested`, `${qty} × ${a.kit} for ${siteName(a.site)} · needs supervisor approval`) };
    }
    case "approveReorder": {
      if (s.role !== "super") return s;
      const r = s.reorders.find((x) => x.id === a.id)!;
      const k = key(r.site, r.kit);
      return { ...s, shelf: { ...s.shelf, [k]: s.shelf[k] + r.qty },
        reorders: s.reorders.map((x) => (x.id === a.id ? { ...x, status: "approved" } : x)),
        log: add("super", `${r.id} approved`, `${r.qty} × ${r.kit} restocked at ${siteName(r.site)} (simulated delivery)`) };
    }
    case "reset": return init;
  }
}

export const siteName = (id: string) => data.sites.find((x) => x.id === id)!.name;

const Ctx = createContext<{ s: State; d: (a: Action) => void } | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, d] = useReducer(reducer, init);
  const v = useMemo(() => ({ s, d }), [s]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}
export const useStore = () => useContext(Ctx)!;
