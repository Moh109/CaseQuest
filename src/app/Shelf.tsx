import { data } from "../data";
import { assetsAt, KITS, PART, REORDER_POINT, TARGET } from "../lib";
import { key, siteName, useStore } from "../store";
import { Btn, Chip } from "./bits";

export default function Shelf() {
  const { s, d } = useStore();
  const site = data.sites.find((x) => x.id === s.site)!;
  const pending = s.reorders.filter((r) => r.status === "requested");
  return (
    <div>
      <p className="text-accent font-semibold text-[15px]">Option A in action: audit, reorder points, a stocked shelf.</p>
      <SitePriority />
      <div className="mt-10" />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h3 className="text-[28px] md:text-[36px] font-bold tracking-tight">{site.name} parts shelf</h3>
        <Chip tone="muted">Simulated stock</Chip>
      </div>
      <p className="mt-1 text-[14px] text-muted max-w-[760px] leading-snug">
        {site.name} stocks {site.spare_fill_pct}% of requested critical parts (case data). Kit counts below are simulated from that rate.
        Target {TARGET} of each kit, reorder at {REORDER_POINT}.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {KITS.map((kit) => {
          const n = s.shelf[key(s.site, kit)];
          const low = n < REORDER_POINT;
          const req = pending.find((r) => r.site === s.site && r.kit === kit);
          const users = assetsAt(s.site).filter((a) => PART[a.type] === kit).map((a) => a.id).join(", ");
          return (
            <div key={kit} className={`bg-panel rounded-[24px] p-5 md:p-6 ring-2 ${low ? "ring-warnbg/80" : "ring-transparent"}`}>
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-[19px] font-bold">{kit}</p><p className="text-[13px] text-muted">Used by {users}</p></div>
                {low ? <Chip tone="warn">Below reorder point</Chip> : <Chip tone="safe">Stocked</Chip>}
              </div>
              <p className="mt-5 text-[44px] font-bold tracking-tighter leading-none tnum">{n}<span className="ml-1.5 text-[16px] text-muted font-semibold tracking-normal">on hand</span></p>
              <p className="mt-1 text-[13px] text-muted">Reorder point {REORDER_POINT} · target {TARGET}</p>
              <div className="mt-3 h-[8px] rounded-full bg-ink/10 overflow-hidden relative">
                <div className={`h-full rounded-full ${low ? "bg-warnbg" : "bg-safe"}`} style={{ width: `${Math.min(100, (n / TARGET) * 100)}%` }} />
                <div className="absolute top-0 h-full w-[2px] bg-ink/60" style={{ left: `${(REORDER_POINT / TARGET) * 100}%` }} />
              </div>
              <div className="mt-5">
                {req ? <p className="text-[14px] font-semibold text-muted h-11 flex items-center">{req.id}: waiting for supervisor</p> : (
                  <Btn kind={low ? "primary" : "ghost"} disabled={s.role === "hse"} title={s.role === "hse" ? "Technicians and supervisors reorder" : undefined}
                    onClick={() => d({ type: "reorder", site: s.site, kit })}>Reorder</Btn>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h4 className="mt-10 text-[20px] font-bold">Reorders waiting for approval</h4>
      {pending.length === 0 ? <p className="mt-2 text-[14px] text-muted">None.</p> : (
        <ul className="mt-3 bg-panel rounded-[20px] divide-y divide-line/60">
          {pending.map((r) => (
            <li key={r.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[15px]"><b>{r.id}</b> · {r.qty} × {r.kit} · {siteName(r.site)}</span>
              {s.role === "super" ? <Btn kind="dark" onClick={() => d({ type: "approveReorder", id: r.id })}>Approve</Btn>
                : <span className="text-[13px] text-muted">Only the site supervisor approves. Switch role to approve.</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** All six sites ranked by 2025 loss (ties: share of breakdowns that waited on parts). Case data from data.json. */
function SitePriority() {
  const { s, d } = useStore();
  const ranked = [...data.sites].sort((a, b) => b.loss_usd - a.loss_usd || b.waited_share - a.waited_share);
  return (
    <div className="mt-4">
      <h3 className="text-[22px] md:text-[26px] font-bold tracking-tight">Site priority</h3>
      <div role="radiogroup" aria-label="Site priority" className="mt-3 bg-panel rounded-[20px] overflow-hidden">
        <div className="hidden md:grid grid-cols-[40px_1.2fr_1fr_1.4fr_1fr_1.2fr] gap-3 px-5 py-2.5 text-[12px] font-semibold text-muted border-b border-line/60">
          <span>#</span><span>Site</span><span>Critical parts stocked</span><span>Breakdowns that waited on parts</span><span>Est. loss, 2025</span><span>Kits below reorder point</span>
        </div>
        {ranked.map((x, i) => {
          const on = x.id === s.site;
          const below = KITS.filter((k) => s.shelf[key(x.id, k)] < REORDER_POINT).length;
          return (
            <button key={x.id} role="radio" aria-checked={on} onClick={() => d({ type: "site", site: x.id })}
              className={`w-full text-left grid grid-cols-[28px_1fr_auto] md:grid-cols-[40px_1.2fr_1fr_1.4fr_1fr_1.2fr] gap-x-3 gap-y-1 px-5 py-3 border-b last:border-b-0 border-line/60 transition-colors ${on ? "bg-ink text-page" : "hover:bg-ink/[0.04]"}`}>
              <span className="font-bold tnum">{i + 1}</span>
              <span className="font-bold text-[16px]">{x.name}</span>
              <span className="md:hidden text-right font-bold tnum">${(x.loss_usd / 1e6).toFixed(1)}M</span>
              <span className="col-start-2 col-span-2 md:col-auto text-[13px] md:text-[15px] tnum"><span className="md:hidden opacity-70">Stocked </span>{x.spare_fill_pct}%</span>
              <span className="col-start-2 col-span-2 md:col-auto text-[13px] md:text-[15px] tnum"><span className="md:hidden opacity-70">Waited on parts </span>{Math.round(x.waited_share * 100)}% ({x.waited} of {x.breakdowns})</span>
              <span className="hidden md:block text-[15px] font-bold tnum">${(x.loss_usd / 1e6).toFixed(1)}M</span>
              <span className={`col-start-2 col-span-2 md:col-auto text-[13px] md:text-[15px] tnum ${below && !on ? "text-warn font-semibold" : ""}`}>
                <span className="md:hidden opacity-70">Below reorder point </span>{below} of {KITS.length}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted">Stock % is case data. Individual kit counts are simulated.</p>
    </div>
  );
}
