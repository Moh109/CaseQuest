import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eyebrow, Headline, Lede, Reveal, Section } from "../components/ui";
import { data, fmtMoney, fmtPct } from "../data";

const HAZARD: Record<string, string> = {
  "H2S monitoring": "Gas detection (H₂S) check",
  "Energy isolation / LOTO": "Lock-out / tag-out check",
  "Hydrocarbon containment": "Spill containment repair",
};

const sites = [...data.sites].sort((a, b) => b.loss_usd - a.loss_usd);
const maxLoss = sites[0].loss_usd;
const hse = data.hse;
const o = hse.outcomes as Record<string, number>;

export function StatusPill({ hold }: { hold: boolean }) {
  return hold ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent px-2.5 py-1 text-[13px] font-semibold">
      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><rect x="2.5" y="2" width="2.4" height="8" rx="1" fill="currentColor" /><rect x="7.1" y="2" width="2.4" height="8" rx="1" fill="currentColor" /></svg>
      On hold
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-safe/15 text-safe px-2.5 py-1 text-[13px] font-semibold">
      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Clear
    </span>
  );
}

export default function FindingSafety() {
  const [sel, setSel] = useState(sites[0].id);
  const site = sites.find((s) => s.id === sel)!;
  const actions = hse.actions.filter((a) => a.site_id === sel).sort((a, b) => b.severity - a.severity);

  return (
    <Section id="safety" band="dark">
      <Reveal>
        <Eyebrow>Finding 03</Eyebrow>
        <Headline>The safety gaps sit<br className="hidden sm:block" /> where the losses are.</Headline>
        <Lede className="mt-6">
          Three sites still have critical safety fixes open. The same three lose the most.
          A site with an open critical fix stays on hold until its HSE supervisor verifies the fix.
        </Lede>
      </Reveal>

      <Reveal delay={0.1} className="mt-14 md:mt-20">
        <p className="font-bold tracking-tighter text-[72px] md:text-[112px] leading-none">{fmtPct(data.headline.top3_loss_share)}</p>
        <p className="mt-2 text-[19px] md:text-[21px] text-muted max-w-[520px] leading-snug">
          of 2025's lost profit came from <span className="text-ink font-semibold">Arroyo, Mesa and Prairie</span>, the three sites on hold.
        </p>
      </Reveal>

      <Reveal delay={0.15}>
        <div role="radiogroup" aria-label="Sites" className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {sites.map((s) => {
            const on = s.id === sel;
            return (
              <button
                key={s.id}
                role="radio"
                aria-checked={on}
                onClick={() => setSel(s.id)}
                className={`text-left bg-panel rounded-[22px] md:rounded-panel p-4 sm:p-6 md:p-7 transition-all duration-300 ring-2 ${on ? "ring-ink/70" : "ring-transparent hover:ring-line"}`}
              >
                <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-[19px] md:text-[24px] font-bold tracking-tight">{s.name}</span>
                  <StatusPill hold={s.on_hold} />
                </div>
                <p className="mt-5 md:mt-8 text-[28px] md:text-[40px] font-bold tracking-tighter leading-none tnum">{fmtMoney(s.loss_usd)}</p>
                <p className="mt-1 text-[13px] md:text-[14px] text-muted">lost profit, 2025</p>
                <div className="mt-4 h-[6px] rounded-full bg-ink/10 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${s.on_hold ? "bg-accent" : "bg-ink/40"}`}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(s.loss_usd / maxLoss) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 bg-panel rounded-[22px] md:rounded-panel p-6 sm:p-8 md:p-10 min-h-[220px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-[22px] md:text-[28px] font-bold tracking-tight">{site.name}</h3>
                <StatusPill hold={site.on_hold} />
              </div>
              <p className="mt-2 text-muted text-[16px] md:text-[17px]">
                {site.breakdowns} breakdowns · {Math.round(site.downtime_h).toLocaleString("en-US")} h stopped ·{" "}
                {actions.length === 0 ? "no open safety fixes" : `${actions.length} open safety ${actions.length === 1 ? "fix" : "fixes"}`}
              </p>
              {actions.length === 0 ? (
                <p className="mt-6 text-[17px] md:text-[19px] leading-snug">Nothing open. Repairs here can start once the pre-job checks pass.</p>
              ) : (
                <ul className="mt-6 divide-y divide-line/60">
                  {actions.map((a) => (
                    <li key={a.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[16px] md:text-[18px] font-semibold">{HAZARD[a.hazard] ?? a.hazard}</p>
                        <p className="text-[13px] md:text-[14px] text-muted">
                          {a.id} · {a.severity === 5 ? "Critical (severity 5), blocks work" : `Severity ${a.severity}`}
                        </p>
                      </div>
                      <p className={`shrink-0 text-right text-[15px] md:text-[17px] font-semibold tnum ${a.severity === 5 ? "text-accent" : "text-muted"}`}>
                        {a.days_overdue} days<span className="block text-[12px] md:text-[13px] font-medium text-muted">overdue</span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Reveal>

      <div className="mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <Reveal>
          <p className="text-[28px] md:text-[36px] font-bold tracking-tight leading-[1.1]">
            Every safety incident on record happened during a breakdown repair.
          </p>
          <p className="mt-4 text-[17px] md:text-[19px] text-muted leading-snug">
            {hse.observations} records in 2025: {o["Near miss"]} near misses, {o["Contained spill"]} contained spills and{" "}
            {o["Control observation"]} control gaps. All of them were logged during unplanned repairs. Breakdown repairs are where the risk shows up.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="text-[28px] md:text-[36px] font-bold tracking-tight leading-[1.1]">
            {hse.open} safety fixes are still open. The {hse.open_sev5} critical fixes are {hse.avg_days_overdue_sev5} days overdue on average.
          </p>
          <p className="mt-4 text-[17px] md:text-[19px] text-muted leading-snug">
            Status as of {new Date(data.meta.as_of + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
            Closing all {hse.open} costs ${(hse.setup_usd / 1000).toFixed(1)}K up front and about {hse.person_hours} hours of work. It's in our plan.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
