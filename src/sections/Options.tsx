import { useState } from "react";
import { motion } from "framer-motion";
import { Eyebrow, Headline, Lede, Panel, Reveal, Section, Segmented, Tween } from "../components/ui";
import { data, fmtK, fmtMoney } from "../data";

type Scen = "cautious" | "expected" | "optimistic";
const opts = data.options;
const maxHours = Math.max(opts.A.scenarios.optimistic.hours, opts.B.scenarios.optimistic.hours);

const CARDS = [
  {
    key: "A" as const,
    name: "Stock critical spare parts",
    pick: true,
    how: "Keep the parts that cause the longest waits on each site's shelf, with an audit up front and monthly restocking.",
    pros: [
      "Goes straight at the biggest delay: waiting for parts.",
      "Covers every machine and every kind of breakdown.",
      "Live in one month. No new hires.",
    ],
    cons: [
      "Money sits on the shelf as stock.",
      "Needs a monthly review so the shelf doesn't drift.",
      "Doesn't spot failures earlier on its own.",
    ],
  },
  {
    key: "B" as const,
    name: "Add vibration sensors",
    pick: false,
    how: "Fit condition sensors to all 18 machines, plus the data platform, site cleanup and network upgrades they need.",
    pros: [
      "Spots bearing and seal problems sooner.",
      "Shortens repairs on those two kinds of failure.",
    ],
    cons: [
      "Only helps with 2 kinds of breakdown: bearing wear and seal leaks.",
      "An early warning still waits if the part isn't there.",
      "Needs a platform and network upgrades first. 3 months or more to go live.",
    ],
  },
];

export default function Options() {
  const [scen, setScen] = useState<Scen>("expected");

  return (
    <Section id="options" band="white">
      <Reveal>
        <Eyebrow>Options</Eyebrow>
        <Headline>Two fixes.<br />One clear pick.</Headline>
        <Lede className="mt-6">
          Both plans close all {data.hse.open} open safety fixes first. Then compare what each one saves in a year.
        </Lede>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-10 md:mt-14 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <Segmented
            label="Scenario"
            layoutId="opt-scen"
            value={scen}
            onChange={setScen}
            options={[{ value: "cautious", label: "Cautious" }, { value: "expected", label: "Expected" }, { value: "optimistic", label: "Optimistic" }]}
          />
          <p className="text-muted text-[14px] md:text-[15px]">Uses the case's low, base and high estimates.</p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {CARDS.map((c) => {
            const o = opts[c.key];
            const s = o.scenarios[scen];
            return (
              <Panel key={c.key} className={`relative p-6 sm:p-8 md:p-10 ring-2 ${c.pick ? "ring-accent" : "ring-transparent"}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted font-semibold text-[15px]">Option {c.key}</p>
                  {c.pick && <span className="rounded-full bg-accent text-white dark:text-[#1D1D1F] px-3 py-1 text-[13px] font-bold">Our pick</span>}
                </div>
                <h3 className="mt-2 text-[28px] md:text-[34px] font-bold tracking-tight leading-[1.08]">{c.name}</h3>
                <p className="mt-3 text-[16px] text-muted leading-snug">{c.how}</p>

                <div className="mt-8">
                  <p className="text-[56px] md:text-[72px] font-bold tracking-tighter leading-none">
                    <Tween value={s.hours} /> <span className="text-[22px] md:text-[26px] text-muted font-bold tracking-tight">h / yr</span>
                  </p>
                  <p className="mt-1 text-muted text-[15px]">downtime saved</p>
                  <div className="mt-4 h-[8px] rounded-full bg-ink/10 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${c.pick ? "bg-accent" : "bg-ink/45"}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(s.hours / maxHours) * 100}%` }}
                      animate={{ width: `${(s.hours / maxHours) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>

                <dl className="mt-8 grid grid-cols-3 gap-3">
                  <Fact label="Year-1 cost" value={fmtMoney(o.year1_usd)} />
                  <Fact label="Profit kept / yr" value={s.profit >= 1e6 ? <Tween value={s.profit / 1e6} decimals={2} prefix="$" suffix="M" /> : <Tween value={s.profit / 1000} prefix="$" suffix="K" />} />
                  <Fact label="Pays back in" value={<><Tween value={Math.round(s.payback_months)} /> mo</>} />
                </dl>
                <p className="mt-3 text-[13px] text-muted">
                  {fmtK(o.setup_usd)} up front + {fmtK(o.annual_usd)} a year · {o.staff_hours} staff hours to set up · live in {o.lead_months} {o.lead_months === 1 ? "month" : "months"}
                </p>

                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <List title="Good" items={c.pros} good />
                  <List title="Watch out" items={c.cons} />
                </div>
              </Panel>
            );
          })}
        </div>
        <p className="mt-6 text-[13px] md:text-[14px] text-muted leading-snug max-w-[820px]">
          Hours saved use the case's stage reductions on 2025's {data.headline.breakdowns} breakdowns: Option A cuts waiting for parts on every breakdown;
          Option B cuts spotting and repair time on bearing and seal failures only. Profit kept is each breakdown's lost profit scaled by the hours saved.
          Year-1 cost includes all {data.hse.open} safety fixes ({fmtK(data.hse.setup_usd + data.hse.annual_usd)}) for both options. First-year savings may be lower while things ramp up.
        </p>
      </Reveal>
    </Section>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] md:text-[13px] text-muted font-medium leading-tight">{label}</dt>
      <dd className="mt-1 text-[20px] md:text-[26px] font-bold tracking-tight tnum">{value}</dd>
    </div>
  );
}

function List({ title, items, good }: { title: string; items: string[]; good?: boolean }) {
  return (
    <div>
      <p className="text-[13px] font-bold uppercase tracking-wider text-muted">{title}</p>
      <ul className="mt-3 space-y-2.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2.5 text-[15px] leading-snug">
            <span className={`mt-[3px] shrink-0 w-4 h-4 rounded-full grid place-items-center ${good ? "bg-safe/15 text-safe" : "bg-ink/10 text-ink/60"}`} aria-hidden>
              {good ? (
                <svg width="9" height="9" viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : (
                <svg width="8" height="8" viewBox="0 0 12 12"><path d="M3 6h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
              )}
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
