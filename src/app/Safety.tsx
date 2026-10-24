import { data } from "../data";
import { fmtDay, HAZARD, overdueOn } from "../lib";
import { holdIds, useStore } from "../store";
import { Btn, Chip, HoldChip } from "./bits";

export default function Safety() {
  const { s, d } = useStore();
  const sites = [...data.sites].sort((a, b) => b.open_actions - a.open_actions);
  return (
    <div>
      <p className="text-[15px] text-muted max-w-[760px] leading-snug">
        Open safety actions from the case's HSE log. A site is on hold while any critical (severity 5) fix is open.
        Only the HSE supervisor can verify a fix. Days overdue are counted as of the board date, {fmtDay(s.day)}. By Oct 1, 2026, the {data.hse.open_sev5} critical fixes were {data.hse.avg_days_overdue_sev5} days overdue on average.
        {s.role !== "hse" && <b className="text-ink"> Switch role to HSE supervisor to verify.</b>}
      </p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site) => {
          const acts = data.hse.actions.filter((a) => a.site_id === site.id).sort((a, b) => b.severity - a.severity);
          const hold = holdIds(site.id, s.verified).length > 0;
          return (
            <div key={site.id} className="bg-panel rounded-[24px] p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[22px] font-bold">{site.name}</h3>
                <HoldChip hold={hold} />
              </div>
              {!hold && acts.some((a) => a.severity === 5) && (
                <p className="mt-2 text-[14px] font-semibold text-safe">Site hold lifted. Each repair still needs its own pre-job checks.</p>
              )}
              {acts.length === 0 ? <p className="mt-3 text-[14px] text-muted">No open safety actions.</p> : (
                <ul className="mt-3 divide-y divide-line/60">
                  {acts.map((a) => {
                    const v = s.verified.includes(a.id);
                    const od = overdueOn(a.due, s.day);
                    return (
                      <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[15px]">{HAZARD[a.hazard] ?? a.hazard}</p>
                          <p className="text-[12px] text-muted">
                            {a.id} · {a.asset_id} · {a.severity === 5 ? <b className="text-ink">critical, blocks work</b> : `severity ${a.severity}`} ·{" "}
                            {od > 0 ? `${od} days overdue as of ${s.day}` : `due ${a.due}`}{a.severity === 5 && ` (${a.days_overdue} days by Oct 1, 2026)`}
                          </p>
                        </div>
                        {v ? <Chip tone="safe">✓ Verified</Chip> : (
                          <Btn kind="dark" disabled={s.role !== "hse"} title={s.role !== "hse" ? "HSE supervisor only" : undefined}
                            onClick={() => d({ type: "verify", id: a.id })}>Verify fix</Btn>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[12px] text-muted">HSE records have no exposure data, so this app makes no claim about injury or incident rates.</p>
    </div>
  );
}
