import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountUp, Eyebrow, Headline, Lede, Panel, Reveal, Section } from "../components/ui";
import { data, fmtInt } from "../data";

const h = data.headline;
const spill = data.hse.actions.filter((a) => a.severity < 5).length;
const critical = data.hse.open_sev5;
const siteNames = [...data.sites].sort((a, b) => b.loss_usd - a.loss_usd).map((s) => s.name);

const PHASES = [
  {
    tag: "Month 1",
    title: "Make it safe. Count the shelf.",
    body: `Close the ${critical} critical safety fixes at Arroyo, Mesa and Prairie, each one verified by the site's HSE supervisor. Audit the spare parts at all six sites.`,
    live: [] as string[],
  },
  {
    tag: "Month 2",
    title: "Arroyo and Mesa go live.",
    body: `The two sites that lose the most get stocked shelves and Spares Radar first. Close the ${spill} spill containment fixes.`,
    live: ["Arroyo", "Mesa"],
  },
  {
    tag: "Month 3",
    title: "The other four sites.",
    body: "Prairie, Cedar, Canyon and Juniper come online with what we learned from the first two.",
    live: siteNames,
  },
  {
    tag: "Month 4+",
    title: "Review every month.",
    body: "Check the shelf against what actually broke, restock, and track the four numbers below. Change the part list when the data says so.",
    live: siteNames,
  },
];

export default function Rollout() {
  const [i, setI] = useState(0);
  const ph = PHASES[i];

  return (
    <Section id="rollout" band="gray">
      <Reveal>
        <Eyebrow>Rollout</Eyebrow>
        <Headline>Safety in month one.<br className="hidden sm:block" /> Six sites by month three.</Headline>
        <Lede className="mt-6">No new team, no new hires. Existing crews, about 120 staff hours to set up.</Lede>
      </Reveal>

      <Reveal delay={0.1}>
        <Panel className="mt-12 md:mt-16 p-6 sm:p-8 md:p-12">
          <div role="tablist" aria-label="Rollout phases" className="grid grid-cols-4 gap-2">
            {PHASES.map((p, j) => (
              <button key={p.tag} role="tab" aria-selected={i === j} onClick={() => setI(j)} className="text-left group">
                <span className="block h-[4px] rounded-full bg-ink/10 overflow-hidden">
                  <motion.span className="block h-full rounded-full bg-accent" animate={{ width: j <= i ? "100%" : "0%" }} transition={{ duration: 0.45 }} />
                </span>
                <span className={`mt-3 block text-[13px] sm:text-[15px] font-semibold transition-colors ${i === j ? "text-ink" : "text-muted group-hover:text-ink"}`}>{p.tag}</span>
              </button>
            ))}
          </div>

          <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 md:gap-12 min-h-[230px]">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} aria-live="polite">
                <h3 className="text-[30px] md:text-[44px] font-bold tracking-tighter leading-[1.05]">{ph.title}</h3>
                <p className="mt-4 text-[17px] md:text-[20px] text-muted leading-snug max-w-[560px]">{ph.body}</p>
              </motion.div>
            </AnimatePresence>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-muted">Sites live</p>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {siteNames.map((n) => {
                  const on = ph.live.includes(n);
                  return (
                    <li key={n} className={`flex items-center gap-2 rounded-full px-3 py-2 text-[14px] font-semibold transition-colors duration-500 ${on ? "bg-accent/15 text-ink" : "bg-ink/[0.05] text-muted"}`}>
                      <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${on ? "bg-accent" : "bg-ink/25"}`} />
                      {n}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} className="h-11 px-5 rounded-full font-semibold text-[15px] bg-ink/[0.07] disabled:opacity-30">Back</button>
            <button onClick={() => setI((x) => (x + 1) % PHASES.length)} className="h-11 px-6 rounded-full font-semibold text-[15px] bg-ink text-page">
              {i === PHASES.length - 1 ? "Start over" : "Next month"}
            </button>
          </div>
        </Panel>
      </Reveal>

      <Reveal className="mt-20 md:mt-28">
        <h3 className="text-[28px] md:text-[40px] font-bold tracking-tight">What we'll track.</h3>
        <dl className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          <Kpi label="Open critical safety fixes" from={String(critical)} to={0} />
          <Kpi label="Hours waiting on parts" from={fmtInt(h.parts_wait_h)} to={data.rollout.parts_wait_target_h} unit=" h" />
          <Kpi label="Total downtime" from={fmtInt(h.downtime_h)} to={data.rollout.downtime_target_h} unit=" h" />
          <Kpi label="New hires" to={0} />
        </dl>
        <p className="mt-10 text-[13px] md:text-[14px] text-muted max-w-[720px] leading-snug">
          Targets are the expected case once all six sites are live, a year after launch. Year one will land a little short while sites come online.
        </p>
      </Reveal>
    </Section>
  );
}

function Kpi({ label, from, to, unit = "" }: { label: string; from?: string; to: number; unit?: string }) {
  return (
    <div className="border-t border-line pt-5">
      <dt className="text-[15px] text-muted font-medium">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-2 flex-wrap">
        {from && <span className="text-[20px] md:text-[22px] font-semibold text-muted line-through decoration-1 tnum">{from}</span>}
        {from && <span className="text-muted" aria-hidden>→</span>}
        <span className="text-[44px] md:text-[52px] font-bold tracking-tighter leading-none"><CountUp to={to} suffix={unit} /></span>
      </dd>
    </div>
  );
}
