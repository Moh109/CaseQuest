import { createContext, ReactNode, useContext, useMemo, useReducer } from "react";
import { data } from "./data";
import { HAZARD } from "./lib";

export type Role = "tech" | "super" | "hse";
export const ROLE_LABEL: Record<Role, string> = { tech: "Technician", super: "Site supervisor", hse: "HSE supervisor" };
export const CHECKS = [
  { t: "Lock-out / tag-out", d: "Power isolated, locks on, stored energy tested at zero." },
  { t: "H₂S gas test", d: "Air tested at the machine and the reading logged before entry." },
  { t: "Pressure and line of fire", d: "Line pressure bled off, exclusion zone marked." },
];

export type Order = {
  id: string; asset: string; site: string; day: string; reason: string;
  checks: boolean[]; part: "shelf" | "order" | null; status: "open" | "requested" | "approved";
};
export type Entry = { n: number; at: string; day: string; role: Role | "system"; action: string; detail: string };
type State = { role: Role; site: string; day: string; verified: string[]; orders: Order[]; log: Entry[]; active: string | null; tab: Tab };
export type Tab = "board" | "orders" | "safety" | "log";

type Action =
  | { type: "role"; role: Role } | { type: "site"; site: string } | { type: "day"; day: string } | { type: "tab"; tab: Tab }
  | { type: "verify"; id: string } | { type: "open"; asset: string; reason: string } | { type: "select"; id: string }
  | { type: "check"; id: string; i: number } | { type: "part"; id: string; part: "shelf" | "order" }
  | { type: "request"; id: string } | { type: "approve"; id: string } | { type: "reset" };

const sev5 = data.hse.actions.filter((a) => a.severity === 5);
export const holdIds = (site: string, verified: string[]) => sev5.filter((a) => a.site_id === site && !verified.includes(a.id)).map((a) => a.id);

const init: State = { role: "tech", site: "S04", day: "2025-09-19", verified: [], orders: [], log: [], active: null, tab: "board" };

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
      return { ...s, orders: upd(a.id, (x) => ({ ...x, part: a.part })),
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
    case "reset": return { ...init, role: s.role };
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
