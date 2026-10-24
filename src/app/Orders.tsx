import { data } from "../data";
import { PART } from "../lib";
import { CHECKS, holdIds, key, siteName, useStore } from "../store";
import { Btn, Chip, HoldChip, Lock } from "./bits";

export default function Orders() {
  const { s, d } = useStore();
  if (!s.orders.length)
    return (
      <div className="text-center py-16">
        <p className="text-[22px] font-bold">No work orders yet.</p>
        <p className="mt-2 text-muted">Start one from a machine with a warning on the morning board.</p>
        <div className="mt-6"><Btn kind="dark" onClick={() => d({ type: "tab", tab: "board" })}>Go to the board</Btn></div>
      </div>
    );
  const o = s.orders.find((x) => x.id === s.active) ?? s.orders[0];
  const asset = data.app.assets.find((a) => a.id === o.asset)!;
  const hold = holdIds(o.site, s.verified);
  const checksDone = o.checks.every(Boolean);
  const shelf = s.shelf[key(o.site, PART[asset.type])] > 0;
  const canWork = s.role !== "hse";
  const steps = [
    { t: "Safety hold", done: hold.length === 0 },
    { t: "Pre-job checks", done: checksDone },
    { t: "Part", done: o.part !== null },
    { t: "Approval", done: o.status === "approved" },
  ];
  const cur = steps.findIndex((x) => !x.done);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <ul className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar">
        {s.orders.map((x) => (
          <li key={x.id}>
            <button onClick={() => d({ type: "select", id: x.id })}
              className={`w-full text-left rounded-[16px] px-4 py-3 whitespace-nowrap ${x.id === o.id ? "bg-ink text-page" : "bg-panel"}`}>
              <span className="block font-bold text-[15px]">{x.id} · {x.asset}{x.demo && <span className="ml-2 text-[11px] font-semibold opacity-70">Demo data</span>}</span>
              <span className="block text-[12px] opacity-70">{siteName(x.site)} · {x.status === "approved" ? "Approved" : x.status === "requested" ? "Waiting for approval" : "Open"}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="bg-panel rounded-[24px] p-5 md:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[26px] md:text-[32px] font-bold tracking-tight">{o.id} · {o.asset}</h3>
          <HoldChip hold={hold.length > 0} />
          {o.demo && <Chip tone="muted">Demo data</Chip>}
        </div>
        <p className="text-muted text-[15px]">{siteName(o.site)} · {asset.type} · {o.reason} · opened for {o.day}</p>

        <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Progress">
          {steps.map((x, i) => (
            <li key={x.t}>
              <span className={`block h-[4px] rounded-full ${x.done ? "bg-safe" : i === cur ? "bg-ink" : "bg-ink/10"}`} />
              <span className={`mt-2 block text-[12px] md:text-[13px] font-semibold ${i === cur ? "text-ink" : "text-muted"}`}>{i + 1}. {x.t}</span>
            </li>
          ))}
        </ol>

        <Step n={1} title="Safety hold check" done={hold.length === 0}>
          {hold.length ? (
            <p className="text-[15px] leading-snug"><b className="inline-flex items-center gap-1.5 rounded-full bg-[#1a1a1a] text-white px-2.5 py-0.5 text-[13px] mr-1"><Lock /> Blocked.</b> {siteName(o.site)} has open critical fixes ({hold.join(", ")}). Only the HSE supervisor can verify them.{" "}
              <button className="font-semibold underline" onClick={() => d({ type: "tab", tab: "safety" })}>Open Safety</button></p>
          ) : <p className="text-[15px]">No open critical safety fixes at {siteName(o.site)}. Clear to plan.</p>}
        </Step>

        <Step n={2} title="Pre-job checks" done={checksDone} locked={hold.length > 0}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {CHECKS.map((c, i) => (
              <button key={c.t} role="checkbox" aria-checked={o.checks[i]} disabled={hold.length > 0 || !canWork || o.status !== "open"}
                onClick={() => d({ type: "check", id: o.id, i })}
                className={`text-left rounded-[16px] p-4 flex gap-3 disabled:cursor-not-allowed ${o.checks[i] ? "bg-safe/15" : "bg-ink/[0.05]"}`}>
                <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 border-2 grid place-items-center text-[11px] ${o.checks[i] ? "bg-safe border-safe text-white" : "border-ink/25"}`}>{o.checks[i] && "✓"}</span>
                <span><b className="block text-[15px]">{c.t}</b><span className="block text-[13px] text-muted leading-snug">{c.d}</span></span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-muted">Checklist wording is set by qualified site staff. The app enforces the gate, not the procedure.</p>
        </Step>

        <Step n={3} title={`Part: ${PART[asset.type]}`} done={o.part !== null} locked={!checksDone || hold.length > 0}>
          <div className="flex flex-wrap items-center gap-3">
            <p className={`font-bold text-[15px] ${shelf ? "text-safe" : "text-warn"}`}>{shelf ? "On the shelf" : "Not on the shelf"}</p>
            <Chip tone="muted">Simulated stock</Chip>
            {o.part ? <Chip tone="safe">{o.part === "shelf" ? "Reserved from shelf" : "Order requested"}</Chip> : (
              <Btn kind="dark" disabled={!checksDone || hold.length > 0 || !canWork} onClick={() => d({ type: "part", id: o.id, part: shelf ? "shelf" : "order" })}>
                {shelf ? "Reserve from shelf" : "Request order"}
              </Btn>
            )}
          </div>
          {o.asset === "A010" && !shelf && (
            <p className="mt-2 text-[13px] text-muted">On Sep 21, 2025, this exact wait kept A010 down {data.a010.failure.stopped_hours} h. With the kit on site: about {data.a010.failure.without_wait_hours} h.</p>
          )}
        </Step>

        <Step n={4} title="Supervisor approval" done={o.status === "approved"} locked={o.part === null}>
          {o.status === "approved" ? <p className="text-[15px] text-safe font-semibold">Approved. Repair released.</p>
            : o.status === "requested" ? (
              s.role === "super" ? <Btn kind="dark" onClick={() => d({ type: "approve", id: o.id })}>Approve {o.id}</Btn>
                : <p className="text-[15px]">Sent. Waiting for the site supervisor. <span className="text-muted">Switch role to Site supervisor to approve.</span></p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Btn disabled={o.part === null || !canWork} onClick={() => d({ type: "request", id: o.id })}>Send for approval</Btn>
                <p className="text-[13px] text-muted">Technicians request. Only the site supervisor approves.</p>
              </div>
            )}
        </Step>
      </div>
    </div>
  );
}

function Step({ n, title, done, locked, children }: { n: number; title: string; done: boolean; locked?: boolean; children: React.ReactNode }) {
  return (
    <section className={`mt-6 pt-6 border-t border-line/70 ${locked ? "opacity-45" : ""}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`w-7 h-7 rounded-full grid place-items-center text-[13px] font-bold ${done ? "bg-safe text-white dark:text-[#1D1D1F]" : "bg-ink/10"}`}>{done ? "✓" : n}</span>
        <h4 className="text-[18px] font-bold">{title}</h4>
        {locked && <span className="text-[12px] text-muted">Locked until the step above is done</span>}
      </div>
      {children}
    </section>
  );
}
