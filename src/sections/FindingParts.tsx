import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Eyebrow, Headline, Lede, Panel, Reveal, Section, Segmented, Tween } from "../components/ui";
import { data, fmtInt, fmtPct } from "../data";

const h = data.headline;
type Mode = "waited" | "there";

const STAGES = [
  { key: "detect", label: "Spot the problem", color: "rgb(var(--seg1))" },
  { key: "dispatch", label: "Get a crew there", color: "rgb(var(--seg2))" },
  { key: "parts_wait", label: "Wait for the part", color: "rgb(var(--accent))" },
  { key: "repair", label: "Repair", color: "rgb(var(--seg4))" },
  { key: "restart", label: "Restart", color: "rgb(var(--seg5))" },
] as const;

export default function FindingParts() {
  const [mode, setMode] = useState<Mode>("waited");
  const [hover, setHover] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const stages = mode === "waited" ? h.stages_with_wait : h.stages_without_wait;
  const total = mode === "waited" ? h.avg_with_wait : h.avg_without_wait;
  const max = h.avg_with_wait;

  return (
    <Section id="parts" band="gray">
      <Reveal>
        <Eyebrow>Finding 01</Eyebrow>
        <Headline>34 hours.<br />Or 15.</Headline>
        <Lede className="mt-6">
          Same crews, same kinds of breakdown. The difference is whether the part was on the shelf.
          Waiting for it takes longer than the repair itself.
        </Lede>
      </Reveal>

      <Reveal delay={0.1}>
        <Panel className="mt-12 md:mt-16 p-6 sm:p-10 md:p-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <Segmented
              label="Average breakdown"
              layoutId="f1-toggle"
              value={mode}
              onChange={setMode}
              options={[{ value: "waited", label: "Waited on a part" }, { value: "there", label: "Part was there" }]}
            />
            <p className="text-muted text-[15px] font-medium">
              {mode === "waited" ? h.n_with_wait : h.n_without_wait} of {h.breakdowns} breakdowns
            </p>
          </div>

          <div className="mt-10 md:mt-12">
            <div className="flex items-baseline gap-3">
              <span className="font-bold tracking-tighter text-[72px] md:text-[112px] leading-none">
                <Tween value={total} decimals={1} />
              </span>
              <span className="text-[24px] md:text-[32px] font-bold text-muted">hours</span>
            </div>
            <p className="mt-1 text-muted font-medium text-[15px] md:text-[17px]">average time a machine stayed stopped</p>
          </div>

          <div ref={ref} className="mt-10 h-14 md:h-16 w-full" role="img"
            aria-label={`Stages: ${STAGES.map((s) => `${s.label} ${stages[s.key].toFixed(1)} hours`).join(", ")}`}>
            <div className="flex h-full gap-[2px]">
              {STAGES.map((s, i) => {
                const w = inView ? (stages[s.key] / max) * 100 : 0;
                return (
                  <motion.div
                    key={s.key}
                    onMouseEnter={() => setHover(s.key)}
                    onMouseLeave={() => setHover(null)}
                    className={`h-full ${i === 0 ? "rounded-l-[6px]" : ""} ${i === STAGES.length - 1 ? "rounded-r-[6px]" : ""}`}
                    style={{ background: s.color, opacity: hover && hover !== s.key ? 0.35 : 1 }}
                    initial={{ width: 0 }}
                    animate={{ width: `calc(${w}% - 2px)` }}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: inView ? i * 0.06 : 0 }}
                  />
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between text-[12px] text-muted tnum">
            <span>0 h</span><span>{max} h</span>
          </div>

          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-5 gap-x-4 gap-y-3">
            {STAGES.map((s) => (
              <li
                key={s.key}
                onMouseEnter={() => setHover(s.key)}
                onMouseLeave={() => setHover(null)}
                className={`flex sm:block items-center justify-between transition-opacity ${hover && hover !== s.key ? "opacity-40" : ""}`}
              >
                <span className="flex items-center gap-2 text-[15px] font-medium">
                  <span className="w-3 h-3 rounded-[3px] shrink-0" style={{ background: s.color }} />
                  <span className={s.key === "parts_wait" ? "text-ink font-semibold" : "text-ink/80"}>{s.label}</span>
                </span>
                <span className="sm:mt-1 sm:block text-[17px] sm:text-[22px] font-bold tnum">
                  <Tween value={stages[s.key]} decimals={1} /> h
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </Reveal>

      <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
        <Reveal>
          <p className="font-bold tracking-tighter text-[56px] md:text-[72px] leading-none">
            {h.over24_waited}<span className="text-muted"> of {h.over24}</span>
          </p>
          <p className="mt-3 text-[19px] md:text-[21px] text-muted leading-snug max-w-[420px]">
            breakdowns that ran past a full day had one thing in common. <span className="text-ink font-semibold">They waited on a part.</span>
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="font-bold tracking-tighter text-[56px] md:text-[72px] leading-none">
            {fmtInt(h.parts_wait_h)} h
          </p>
          <p className="mt-3 text-[19px] md:text-[21px] text-muted leading-snug max-w-[420px]">
            spent waiting on parts in 2025. That's <span className="text-ink font-semibold">{fmtPct(h.parts_wait_share)} of all downtime</span>, with nobody able to work.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
