import { Segmented } from "../components/ui";
import { ROLE_LABEL, Role, Tab, useStore } from "../store";
import Board from "./Board";
import Log from "./Log";
import Orders from "./Orders";
import Safety from "./Safety";
import Shelf from "./Shelf";

const SHORT: Record<Role, string> = { tech: "Tech", super: "Supervisor", hse: "HSE" };

const TABS: { id: Tab; label: string }[] = [
  { id: "board", label: "Morning board" }, { id: "orders", label: "Work orders" }, { id: "shelf", label: "Parts shelf" }, { id: "safety", label: "Safety" }, { id: "log", label: "Audit log" },
];

export default function AppView() {
  const { s, d } = useStore();
  const count = (t: Tab) => t === "orders" ? s.orders.filter((o) => o.status !== "approved").length : t === "shelf" ? s.reorders.filter((r) => r.status === "requested").length : t === "log" ? s.log.length : 0;
  return (
    <section id="app" className="band-gray bg-band text-ink scroll-mt-[52px] py-10 md:py-16">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="bg-page rounded-[28px] p-4 sm:p-6 md:p-8 shadow-[0_30px_60px_-40px_rgba(0,0,0,0.35)] band-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="text-[13px] font-semibold text-muted">Acting as</p>
            <Segmented label="Role" layoutId="role" value={s.role} onChange={(r: Role) => d({ type: "role", role: r })}
              options={(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ value: r, label: <><span className="sm:hidden">{SHORT[r]}</span><span className="hidden sm:inline">{ROLE_LABEL[r]}</span></> }))} />
          </div>
          <nav role="tablist" aria-label="App sections" className="mt-5 flex gap-1 overflow-x-auto no-scrollbar border-b border-line/70">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={s.tab === t.id} onClick={() => d({ type: "tab", tab: t.id })}
                className={`px-4 py-3 text-[15px] font-semibold whitespace-nowrap border-b-2 -mb-px ${s.tab === t.id ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"}`}>
                {t.label}{count(t.id) > 0 && <span className="ml-1.5 text-[12px] rounded-full bg-ink/10 px-1.5 py-0.5 tnum">{count(t.id)}</span>}
              </button>
            ))}
          </nav>
          <div className="mt-6">
            {s.tab === "board" && <Board />}
            {s.tab === "orders" && <Orders />}
            {s.tab === "shelf" && <Shelf />}
            {s.tab === "safety" && <Safety />}
            {s.tab === "log" && <Log />}
          </div>
        </div>
      </div>
    </section>
  );
}
