import { data } from "../data";
import { assetsAt, BOARD_TIME, fmtDay, history, REORDER_POINT, reorderQty, PART, statusOn } from "../lib";
import { holdIds, key, siteName, useStore } from "../store";
import { Btn, Chip, HoldChip, Lock, Spark, StatusChip } from "./bits";

export default function Board() {
  const { s, d } = useStore();
  const site = data.sites.find((x) => x.id === s.site)!;
  const hold = holdIds(s.site, s.verified);

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 lg:justify-between">
        <div role="radiogroup" aria-label="Site" className="flex flex-wrap gap-2">
          {data.sites.map((x) => {
            const on = x.id === s.site;
            const h = holdIds(x.id, s.verified).length > 0;
            return (
              <button key={x.id} role="radio" aria-checked={on} onClick={() => d({ type: "site", site: x.id })}
                className={`h-10 px-4 rounded-full text-[14px] font-semibold inline-flex items-center gap-2 ${on ? "bg-ink text-page" : "bg-ink/[0.07] text-ink/80"}`}>
                {h && <span className="opacity-80" aria-label="on hold"><Lock /></span>}
                {x.name}
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-3 text-[14px] font-semibold">
          Board date
          <input type="date" min="2025-01-01" max="2025-12-31" value={s.day}
            onChange={(e) => e.target.value && d({ type: "day", day: e.target.value })}
            className="h-10 px-3 rounded-full bg-ink/[0.07] text-ink font-semibold tnum" />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h3 className="text-[28px] md:text-[36px] font-bold tracking-tight">{site.name}</h3>
        <HoldChip hold={hold.length > 0} />
        <p className="text-muted text-[15px]">{fmtDay(s.day)}, {BOARD_TIME} · {site.technicians} technicians · stocks {site.spare_fill_pct}% of critical parts</p>
      </div>
      {hold.length > 0 && (
        <div className="mt-4 rounded-[18px] bg-[#1a1a1a] text-white px-5 py-4 text-[15px] leading-snug">
          <b className="inline-flex items-center gap-1.5"><Lock /> Safety hold.</b> {hold.length} critical fix{hold.length > 1 ? "es" : ""} open ({hold.join(", ")}). Work orders can be opened but no repair starts
          until the HSE supervisor verifies {hold.length > 1 ? "them" : "it"}.{" "}
          <button className="font-semibold underline" onClick={() => d({ type: "tab", tab: "safety" })}>Go to Safety</button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {assetsAt(s.site).map((a) => {
          const st = statusOn(a.id, s.day);
          const kit = PART[a.type];
          const onHand = s.shelf[key(a.site, kit)];
          const shelf = onHand > 0;
          const low = onHand < REORDER_POINT;
          const pendingRo = s.reorders.find((r) => r.site === a.site && r.kit === kit && r.status === "requested");
          const open = s.orders.find((o) => o.asset === a.id && o.status !== "approved");
          return (
            <div key={a.id} className={`bg-panel rounded-[24px] p-5 md:p-6 flex flex-col ring-2 ${st.status === "warning" ? "ring-warnbg/80" : st.status === "down" ? "ring-ink/30" : "ring-transparent"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[20px] font-bold">{a.id}</p>
                  <p className="text-[13px] text-muted">{a.type} · {a.criticality} criticality</p>
                </div>
                <StatusChip status={st.status} />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-semibold text-muted">{kit}</p>
                  <Chip tone="muted">Simulated</Chip>
                </div>
                <p className={`mt-1 text-[24px] md:text-[26px] font-bold tracking-tight leading-tight ${shelf ? "text-safe" : "text-warn"}`}>
                  {shelf ? `On the shelf (${onHand})` : "Not on the shelf"}
                </p>
                {shelf && low && <p className="text-[14px] font-semibold text-warn">Below reorder point</p>}
              </div>
              <div className="mt-4 pt-4 border-t border-line/70 flex items-center justify-between gap-3">
                <p className="text-[13px] text-muted leading-snug">
                  {st.status === "down" && st.outage
                    ? <>Why flagged: down, {st.outage.cause.toLowerCase()} ({st.outage.hours} h, {st.outage.wait} h waiting on parts)</>
                    : st.ratio == null ? "No valid reading today"
                    : st.status === "warning" ? `Why flagged: ${st.ratio.toFixed(1)}× normal vibration`
                    : `Vibration ${st.ratio.toFixed(1)}× normal`}
                </p>
                <Spark values={history(a.id, s.day)} />
              </div>
              <div className="mt-4">
                {open ? (
                  <Btn kind="dark" onClick={() => d({ type: "select", id: open.id })}>Open {open.id}</Btn>
                ) : st.status === "warning" || st.status === "down" ? (
                  <Btn onClick={() => d({ type: "open", asset: a.id, reason: st.status === "down" ? `Down: ${st.outage?.cause}` : `Vibration ${st.ratio?.toFixed(1)}× normal` })}>Start work order</Btn>
                ) : low ? (
                  pendingRo ? <p className="text-[14px] font-semibold text-muted h-11 flex items-center">{pendingRo.id}: waiting for supervisor</p> : (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-[14px] font-semibold">Reorder {reorderQty(onHand)} {kit}{reorderQty(onHand) > 1 ? "s" : ""}</p>
                      <Btn kind="ghost" disabled={s.role === "hse"} title={s.role === "hse" ? "Technicians and supervisors reorder" : undefined}
                        onClick={() => d({ type: "reorder", site: a.site, kit })}>Reorder</Btn>
                    </div>
                  )
                ) : (
                  <p className="text-[13px] text-muted h-11 flex items-center">No action needed.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] text-muted leading-snug">
        Status as of the {BOARD_TIME} check. Readings: valid readings taken while running, from the case data. Warning at 1.3× normal. Site stock % is case data; which kit is on the shelf is simulated from it. Uses existing daily readings. No new sensors (we did not choose Option B).
        Showing {siteName(s.site)}.
      </p>
    </div>
  );
}
