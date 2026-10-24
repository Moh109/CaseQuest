import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eyebrow, Headline, Lede, Panel, Reveal, Section, useWidth } from "../components/ui";
import { data, fmtInt, fmtMoney, fmtPct } from "../data";
import { StatusPill } from "./FindingSafety";

const sites = data.sites;
const n = sites.length;
const mx = sites.reduce((s, d) => s + d.spare_fill_pct, 0) / n;
const my = sites.reduce((s, d) => s + d.waited_share, 0) / n;
const slope =
  sites.reduce((s, d) => s + (d.spare_fill_pct - mx) * (d.waited_share - my), 0) /
  sites.reduce((s, d) => s + (d.spare_fill_pct - mx) ** 2, 0);
const fit = (x: number) => my + slope * (x - mx);
// Label placement keeps names off the trend line and inside the plot.
const LABEL_POS: Record<string, "left" | "below"> = { Cedar: "left", Juniper: "below" };

export default function FindingStock() {
  const [box, W] = useWidth<HTMLDivElement>();
  const [sel, setSel] = useState("S04");
  const site = sites.find((s) => s.id === sel)!;
  const H = W < 640 ? 300 : 380;
  const m = { l: W < 640 ? 40 : 48, r: 16, t: 16, b: 44 };
  const X0 = 35, X1 = 100, Y1 = 0.6;
  const x = (v: number) => m.l + ((v - X0) / (X1 - X0)) * (W - m.l - m.r);
  const y = (v: number) => m.t + (1 - v / Y1) * (H - m.t - m.b);
  const lo = sites.reduce((a, b) => (a.spare_fill_pct < b.spare_fill_pct ? a : b));
  const hi = sites.reduce((a, b) => (a.spare_fill_pct > b.spare_fill_pct ? a : b));

  return (
    <Section id="stock" band="white">
      <Reveal>
        <Eyebrow>Finding 02</Eyebrow>
        <Headline>Less on the shelf.<br />More waiting.</Headline>
        <Lede className="mt-6">
          {lo.name} keeps {lo.spare_fill_pct}% of its critical parts on hand and waited on {fmtPct(lo.waited_share)} of its breakdowns.{" "}
          {hi.name} keeps {hi.spare_fill_pct}% and waited on {fmtPct(hi.waited_share)}. The other four sites fall right in between.
        </Lede>
      </Reveal>

      <Reveal delay={0.1}>
        <Panel className="mt-12 md:mt-16 p-5 sm:p-8 md:p-12">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[15px] font-semibold">Share of breakdowns that waited for a part</p>
            <p className="text-[13px] text-muted">Tap a site</p>
          </div>
          <div ref={box} className="mt-4 w-full">
            <svg width={W} height={H} className="block" role="img"
              aria-label={`Scatter of six sites: critical parts on the shelf versus share of breakdowns that waited for a part. ${sites.map((s) => `${s.name} ${s.spare_fill_pct}% stocked, ${fmtPct(s.waited_share)} waited`).join("; ")}.`}>
              {[0, 0.2, 0.4, 0.6].map((v) => (
                <g key={v}>
                  <line x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} stroke="rgb(var(--line))" strokeOpacity={v === 0 ? 1 : 0.6} />
                  <text x={m.l - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="rgb(var(--muted))">{Math.round(v * 100)}%</text>
                </g>
              ))}
              {[40, 60, 80, 100].map((v) => (
                <text key={v} x={x(v)} y={H - m.b + 20} textAnchor={v === 100 ? "end" : "middle"} fontSize="12" fill="rgb(var(--muted))">{v}%</text>
              ))}
              <text x={W - m.r} y={H - 4} textAnchor="end" fontSize="12" fontWeight="600" fill="rgb(var(--muted))">
                Critical parts on the local shelf (simulated) →
              </text>
              <motion.line
                x1={x(38)} y1={y(fit(38))} x2={x(96)} y2={y(fit(96))}
                stroke="rgb(var(--accent))" strokeWidth="1.5" strokeOpacity="0.45"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4 }}
              />
              {sites.map((s, i) => {
                const on = s.id === sel;
                const cx = x(s.spare_fill_pct), cy = y(s.waited_share);
                const pos = LABEL_POS[s.name];
                const lx = pos === "left" ? cx - 14 : pos === "below" ? cx + 8 : cx + 12;
                const ly = pos === "left" ? cy + 4 : pos === "below" ? cy + 24 : cy - 9;
                return (
                  <motion.g key={s.id} onClick={() => setSel(s.id)} className="cursor-pointer"
                    initial={{ opacity: 0, scale: 0.4 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ originX: `${cx}px`, originY: `${cy}px` }}>
                    <circle cx={cx} cy={cy} r="20" fill="transparent" />
                    {on && <circle cx={cx} cy={cy} r="15" fill="rgb(var(--accent))" fillOpacity="0.18" />}
                    <circle cx={cx} cy={cy} r={on ? 8 : 6.5} fill={on ? "rgb(var(--accent))" : "rgb(var(--ink))"} stroke="rgb(var(--panel))" strokeWidth="2" />
                    <text x={lx} y={ly} textAnchor={pos ? "end" : "start"} fontSize="13" fontWeight={on ? 700 : 500}
                      fill={on ? "rgb(var(--ink))" : "rgb(var(--muted))"}>{s.name}</text>
                  </motion.g>
                );
              })}
            </svg>
          </div>

          <div role="radiogroup" aria-label="Sites" className="mt-4 flex flex-wrap gap-2">
            {[...sites].sort((a, b) => a.spare_fill_pct - b.spare_fill_pct).map((s) => (
              <button key={s.id} role="radio" aria-checked={s.id === sel} onClick={() => setSel(s.id)}
                className={`h-9 px-4 rounded-full text-[14px] font-semibold transition-colors ${s.id === sel ? "bg-ink text-page" : "bg-ink/[0.07] text-ink/70 hover:text-ink"}`}>
                {s.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="mt-8 pt-8 border-t border-line/70" aria-live="polite">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-[24px] md:text-[30px] font-bold tracking-tight">{site.name}</h3>
                <StatusPill hold={site.on_hold} />
              </div>
              <dl className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
                <Stat label="Parts on the shelf" sub="simulated" value={`${site.spare_fill_pct}%`} />
                <Stat label="Breakdowns that waited" sub={`${site.waited} of ${site.breakdowns}`} value={fmtPct(site.waited_share)} />
                <Stat label="Hours waiting on parts" sub="2025" value={`${fmtInt(site.parts_wait_h)} h`} />
                <Stat label="Lost profit" sub="2025" value={fmtMoney(site.loss_usd)} />
              </dl>
            </motion.div>
          </AnimatePresence>
          <p className="mt-8 text-[13px] text-muted leading-snug">
            Correlation across the six sites: {data.headline.corr_stock_wait.toFixed(2)}. Six sites is a small sample, but the pattern is hard to miss.
            Shelf levels are the case's planning assumption, not a measured count.
          </p>
        </Panel>
      </Reveal>
    </Section>
  );
}

function Stat({ label, sub, value }: { label: string; sub: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] md:text-[14px] text-muted font-medium leading-tight">{label}</dt>
      <dd className="mt-1 text-[30px] md:text-[40px] font-bold tracking-tighter leading-none tnum">{value}</dd>
      <dd className="mt-1 text-[12px] md:text-[13px] text-muted">{sub}</dd>
    </div>
  );
}
