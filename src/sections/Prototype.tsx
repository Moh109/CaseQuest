import { ReactNode, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eyebrow, Headline, Lede, Reveal, Section } from "../components/ui";
import { data } from "../data";

const DEMO_DAY = new Date("2025-09-19T00:00:00Z").getTime();
const fail = data.a010.failure;
const warnRatio = data.a010.warning!.ratio;
const a11Ratio = data.a010.a011_ratio_sep19 ?? 1.7;
const holds = data.hse.actions
  .filter((a) => a.site_id === "S04" && a.severity === 5)
  .map((a) => ({ ...a, overdue: Math.round((DEMO_DAY - new Date(a.due + "T00:00:00Z").getTime()) / 864e5) }));
const HOLD_LABEL: Record<string, string> = {
  "H2S monitoring": "Gas detection (H₂S) check",
  "Energy isolation / LOTO": "Lock-out / tag-out check",
};
const CHECKS = [
  { t: "Lock-out / tag-out", d: "Power isolated, locks on, stored energy tested at zero." },
  { t: "H₂S gas test", d: "Air tested at the pump and reading logged before entry." },
  { t: "Pressure and line of fire", d: "Line pressure bled off, exclusion zone marked." },
];
const SUPERVISOR = "D. Reyes";

const STEPS = [
  {
    time: "8:00 AM",
    title: "Two machines start to drift.",
    body: `Friday, Sep 19 at Arroyo. A010's vibration is ${warnRatio.toFixed(1)}× normal and A011's is ${a11Ratio.toFixed(1)}×. The last two times A010 looked like this, it failed two days later.`,
    hint: "Tap “Plan repair” on A010.",
  },
  {
    time: "8:04 AM",
    title: "Blocked. Safety first.",
    body: "Arroyo has two critical safety fixes still open, so Spares Radar won't schedule the job. Only the site's HSE supervisor can verify the fixes and lift the hold.",
    hint: "Verify both fixes as the HSE supervisor.",
  },
  {
    time: "8:40 AM",
    title: "Three checks before any tools come out.",
    body: "The crew confirms lock-out, an H₂S gas test, and pressure released with the line of fire marked off. The work order stays locked until all three are ticked.",
    hint: "Tick all three checks.",
  },
  {
    time: "9:02 AM",
    title: "The part isn't on the shelf.",
    body: `Arroyo has no bearing kit on hand. On Sep 21 that meant ${fail.parts_wait_hours} hours of waiting. Ordering it today, two days early, brings a ${fail.stopped_hours}-hour shutdown down to about ${fail.without_wait_hours}.`,
    hint: "Approve the order.",
  },
  {
    time: "9:05 AM",
    title: "Every step, on the record.",
    body: "Who verified what, and when. Nothing skipped, nothing hidden. That's the whole morning, and the machine hasn't stopped yet.",
    hint: "",
  },
];

export default function Prototype() {
  const [step, setStep] = useState(0);
  const [verified, setVerified] = useState<string[]>([]);
  const [checks, setChecks] = useState([false, false, false]);
  const [ordered, setOrdered] = useState(false);

  const complete = (s: number) => {
    if (s === 1) setVerified(holds.map((h) => h.id));
    if (s === 2) setChecks([true, true, true]);
    if (s === 3) setOrdered(true);
  };
  const next = () => { complete(step); setStep((s) => Math.min(4, s + 1)); };
  const reset = () => { setStep(0); setVerified([]); setChecks([false, false, false]); setOrdered(false); };
  const s = STEPS[step];

  return (
    <Section id="prototype" band="gray">
      <Reveal>
        <Eyebrow>Prototype</Eyebrow>
        <Headline>Try one morning.</Headline>
        <Lede className="mt-6">Sep 19, 2025, at Arroyo. Five steps, from the first warning to a part on order. Tap through it in the app or use Next.</Lede>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-16 items-center">
          {/* Narration */}
          <div className="order-2 lg:order-1">
            <ol className="flex gap-2 mb-8" aria-label="Steps">
              {STEPS.map((_, i) => (
                <li key={i} className="flex-1">
                  <button
                    onClick={() => i < step && setStep(i)}
                    disabled={i > step}
                    aria-label={`Step ${i + 1}`}
                    aria-current={i === step ? "step" : undefined}
                    className="block w-full py-2"
                  >
                    <span className="block h-[4px] rounded-full bg-ink/10 overflow-hidden">
                      <motion.span className="block h-full bg-accent rounded-full" animate={{ width: i <= step ? "100%" : "0%" }} transition={{ duration: 0.5 }} />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="min-h-[300px] sm:min-h-[260px]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                  <p className="text-muted font-semibold text-[15px] tnum">Step {step + 1} of 5 · {s.time}</p>
                  <h3 className="mt-3 text-[32px] sm:text-[40px] md:text-[48px] font-bold tracking-tighter leading-[1.05]">{s.title}</h3>
                  <p className="mt-4 text-[18px] md:text-[21px] text-muted leading-snug max-w-[520px]">{s.body}</p>
                  {s.hint && <p className="mt-5 text-[15px] font-semibold text-accent">{s.hint}</p>}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}
                className="h-12 px-6 rounded-full font-semibold text-[16px] bg-ink/[0.07] disabled:opacity-30">Back</button>
              {step < 4 ? (
                <button onClick={next} className="h-12 px-7 rounded-full font-semibold text-[16px] bg-ink text-page">Next</button>
              ) : (
                <button onClick={reset} className="h-12 px-7 rounded-full font-semibold text-[16px] bg-accent text-white dark:text-[#1D1D1F]">Run it again</button>
              )}
            </div>
          </div>

          {/* Device */}
          <div className="order-1 lg:order-2 mx-auto w-full max-w-[360px]">
            <Device>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={step} className="absolute inset-0 flex flex-col"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                  {step === 0 && <Board onPlan={() => setStep(1)} />}
                  {step === 1 && <Hold verified={verified} onVerify={(id) => setVerified((v) => v.includes(id) ? v : [...v, id])} onLift={() => setStep(2)} />}
                  {step === 2 && <Checks checks={checks} onToggle={(i) => setChecks((c) => c.map((x, j) => (j === i ? !x : x)))} onRelease={() => setStep(3)} />}
                  {step === 3 && <Parts ordered={ordered} onOrder={() => setOrdered(true)} onDone={() => setStep(4)} />}
                  {step === 4 && <Audit onReset={reset} />}
                </motion.div>
              </AnimatePresence>
            </Device>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* ---------------- device + app chrome ---------------- */

function Device({ children }: { children: ReactNode }) {
  return (
    <div className="relative rounded-[52px] p-[10px] bg-[#1D1D1F] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.45)] ring-1 ring-black/10 dark:ring-white/20">
      <div className="relative h-[660px] sm:h-[700px] rounded-[42px] overflow-hidden bg-page band-white">
        <div className="absolute top-0 inset-x-0 h-11 flex items-center justify-between px-7 text-[13px] font-semibold z-10">
          <span className="tnum">9:41</span>
          <span className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[92px] h-[26px] rounded-full bg-[#1D1D1F]" />
          <span className="flex items-center gap-1" aria-hidden>
            <svg width="16" height="10" viewBox="0 0 16 10"><rect x="0" y="6" width="3" height="4" rx="1" fill="currentColor" /><rect x="4.3" y="4" width="3" height="6" rx="1" fill="currentColor" /><rect x="8.6" y="2" width="3" height="8" rx="1" fill="currentColor" /><rect x="12.9" y="0" width="3" height="10" rx="1" fill="currentColor" /></svg>
            <svg width="22" height="11" viewBox="0 0 22 11"><rect x="0.5" y="0.5" width="19" height="10" rx="3" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="14" height="7" rx="1.6" fill="currentColor" /></svg>
          </span>
        </div>
        <div className="absolute inset-0 pt-11">
          <div className="relative h-full">{children}</div>
        </div>
      </div>
    </div>
  );
}

function AppHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-5 pt-3 pb-4">
      <p className="text-[12px] font-semibold text-accent flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 32 32" aria-hidden><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="4" /><circle cx="16" cy="16" r="5" fill="currentColor" /></svg>
        Spares Radar · Arroyo
      </p>
      <h4 className="mt-1 text-[24px] font-bold tracking-tight leading-tight">{title}</h4>
      <p className="text-[13px] text-muted">{sub}</p>
    </div>
  );
}

function Cta({ children, onClick, disabled, pulse }: { children: ReactNode; onClick: () => void; disabled?: boolean; pulse?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="relative w-full h-12 rounded-[14px] bg-accent text-white dark:text-[#1D1D1F] font-semibold text-[15px] disabled:bg-ink/15 disabled:text-ink/40 transition-colors">
      {pulse && !disabled && (
        <motion.span className="absolute inset-0 rounded-[14px] ring-2 ring-accent" animate={{ scale: [1, 1.06], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />
      )}
      {children}
    </button>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-panel rounded-[18px] p-4 ${className}`}>{children}</div>;
}

const Tag = ({ children, tone }: { children: ReactNode; tone: "accent" | "safe" | "muted" }) => (
  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone === "accent" ? "bg-accent/15 text-accent" : tone === "safe" ? "bg-safe/15 text-safe" : "bg-ink/10 text-ink/60"}`}>{children}</span>
);

/* ---------------- screens ---------------- */

function Board({ onPlan }: { onPlan: () => void }) {
  const rows = [
    { id: "A010", type: "Transfer pump", ratio: warnRatio, warn: true },
    { id: "A011", type: "Lift pump", ratio: a11Ratio, warn: true },
    { id: "A012", type: "Compressor", ratio: 0.9, warn: false },
  ];
  return (
    <>
      <AppHeader title="Morning board" sub="Fri, Sep 19 · 8:00 AM" />
      <div className="px-4 space-y-3 overflow-hidden">
        {rows.map((r) => (
          <Card key={r.id} className={r.id === "A010" ? "ring-2 ring-accent/60" : ""}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-[16px]">{r.id} <span className="font-medium text-muted text-[13px]">{r.type}</span></p>
                <p className="text-[13px] text-muted">Vibration <span className={`font-bold tnum ${r.warn ? "text-accent" : "text-ink"}`}>{r.ratio.toFixed(1)}×</span> normal</p>
              </div>
              <Tag tone={r.warn ? "accent" : "safe"}>{r.warn ? "Warning" : "Normal"}</Tag>
            </div>
            {r.id === "A010" && (
              <>
                <p className="mt-3 text-[13px] leading-snug">Looks like bearing wear. Its last two failures came <b>2 days</b> after a jump like this.</p>
                <div className="mt-3"><Cta onClick={onPlan} pulse>Plan repair</Cta></div>
              </>
            )}
            {r.id === "A011" && <p className="mt-2 text-[12px] text-muted">Watching. Re-check at noon.</p>}
          </Card>
        ))}
      </div>
    </>
  );
}

function Hold({ verified, onVerify, onLift }: { verified: string[]; onVerify: (id: string) => void; onLift: () => void }) {
  const all = holds.every((h) => verified.includes(h.id));
  return (
    <>
      <AppHeader title="Repair A010" sub="Bearing kit swap · est. 21 h" />
      <div className="px-4 flex-1 flex flex-col gap-3">
        <motion.div layout className={`rounded-[18px] p-4 ${all ? "bg-safe/15" : "bg-accent/15"}`}>
          <p className={`font-bold text-[15px] ${all ? "text-safe" : "text-accent"}`}>{all ? "Both fixes verified" : "Site on safety hold"}</p>
          <p className="text-[13px] leading-snug mt-1">
            {all ? `Verified on site by ${SUPERVISOR}, HSE supervisor. Ready to lift the hold.` : "2 critical fixes are open. No repair can be scheduled until the HSE supervisor verifies them."}
          </p>
        </motion.div>
        <p className="text-[12px] font-semibold text-muted mt-1">Signed in as {SUPERVISOR} · Site HSE supervisor</p>
        {holds.map((h) => {
          const on = verified.includes(h.id);
          return (
            <Card key={h.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-[15px]">{HOLD_LABEL[h.hazard] ?? h.hazard}</p>
                  <p className="text-[12px] text-muted">{h.id} · severity 5 · {h.overdue} days overdue</p>
                </div>
                <button onClick={() => onVerify(h.id)} disabled={on} aria-pressed={on}
                  className={`shrink-0 h-9 px-3 rounded-full text-[13px] font-semibold ${on ? "bg-safe text-white dark:text-[#1D1D1F]" : "bg-ink text-page"}`}>
                  {on ? "✓ Verified" : "Verify"}
                </button>
              </div>
            </Card>
          );
        })}
        <div className="mt-auto pb-6"><Cta onClick={onLift} disabled={!all} pulse>Lift hold and continue</Cta></div>
      </div>
    </>
  );
}

function Checks({ checks, onToggle, onRelease }: { checks: boolean[]; onToggle: (i: number) => void; onRelease: () => void }) {
  const done = checks.filter(Boolean).length;
  return (
    <>
      <AppHeader title="Pre-job checks" sub={`Crew lead · ${done} of 3 done`} />
      <div className="px-4 flex-1 flex flex-col gap-3">
        {CHECKS.map((c, i) => (
          <button key={c.t} onClick={() => onToggle(i)} role="checkbox" aria-checked={checks[i]}
            className={`text-left rounded-[18px] p-4 flex gap-3 items-start transition-colors ${checks[i] ? "bg-safe/15" : "bg-panel"}`}>
            <span className={`mt-0.5 w-6 h-6 rounded-full grid place-items-center shrink-0 border-2 ${checks[i] ? "bg-safe border-safe text-white" : "border-ink/25"}`}>
              {checks[i] && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </span>
            <span>
              <span className="block font-bold text-[15px]">{c.t}</span>
              <span className="block text-[13px] text-muted leading-snug">{c.d}</span>
            </span>
          </button>
        ))}
        <p className="text-[11px] text-muted leading-snug px-1">Checklist wording is set by qualified site staff. This demo shows the gate, not the procedure.</p>
        <div className="mt-auto pb-6"><Cta onClick={onRelease} disabled={done < 3} pulse>{done < 3 ? "Work order locked" : "Release work order"}</Cta></div>
      </div>
    </>
  );
}

function Parts({ ordered, onOrder, onDone }: { ordered: boolean; onOrder: () => void; onDone: () => void }) {
  const max = fail.stopped_hours;
  return (
    <>
      <AppHeader title="Parts for A010" sub="Bearing kit, transfer pump" />
      <div className="px-4 flex-1 flex flex-col gap-3">
        <Card>
          <div className="flex items-center justify-between">
            <p className="font-bold text-[15px]">On Arroyo's shelf</p>
            <Tag tone="muted">Simulated stock</Tag>
          </div>
          <p className="mt-1 text-[32px] font-bold tracking-tight leading-none tnum">0 <span className="text-[14px] font-medium text-muted">kits</span></p>
          <p className="mt-1 text-[12px] text-muted">{ordered ? "Order placed · arrives Sat, Sep 20" : "Nearest kit: regional warehouse"}</p>
        </Card>
        <Card>
          <p className="font-bold text-[15px]">If it fails on Sep 21</p>
          {[
            { l: "Kit not here (what happened)", h: fail.stopped_hours, c: "bg-ink/40" },
            { l: "Kit on site", h: fail.without_wait_hours, c: "bg-accent" },
          ].map((b) => (
            <div key={b.l} className="mt-3">
              <div className="flex justify-between text-[12px]"><span className="text-muted">{b.l}</span><span className="font-bold tnum">{b.h} h</span></div>
              <div className="mt-1 h-[10px] rounded-full bg-ink/10 overflow-hidden">
                <motion.div className={`h-full rounded-full ${b.c}`} initial={{ width: 0 }} animate={{ width: `${(b.h / max) * 100}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
              </div>
            </div>
          ))}
          <p className="mt-3 text-[12px] text-muted">{fail.parts_wait_hours} h of waiting avoided.</p>
        </Card>
        <div className="mt-auto pb-6">
          {ordered ? <Cta onClick={onDone} pulse>View the record</Cta> : <Cta onClick={onOrder} pulse>Approve order</Cta>}
        </div>
      </div>
    </>
  );
}

function Audit({ onReset }: { onReset: () => void }) {
  const log = [
    ["8:00", "Warning raised", `A010 ${warnRatio.toFixed(1)}×, A011 ${a11Ratio.toFixed(1)}×`, "System"],
    ["8:04", "Repair blocked", "Site on hold: H019, H020 open", "System"],
    ["8:31", "H019 verified closed", "Gas detection check", `${SUPERVISOR}, HSE`],
    ["8:36", "H020 verified closed", "Lock-out / tag-out check", `${SUPERVISOR}, HSE`],
    ["8:37", "Hold lifted", "Arroyo cleared for A010 work", `${SUPERVISOR}, HSE`],
    ["8:58", "Pre-job checks 3 of 3", "LOTO, H₂S test, pressure", "Crew lead"],
    ["9:05", "Bearing kit ordered", "Arrives Sep 20", "Maint. planner"],
  ];
  return (
    <>
      <AppHeader title="Audit log" sub="A010 · Fri, Sep 19" />
      <div className="px-4 flex-1 flex flex-col">
        <ol className="relative ml-2 border-l-2 border-line/70 space-y-3">
          {log.map(([t, a, d, who], i) => (
            <motion.li key={t + a} className="pl-4 relative" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-page ${i === 1 ? "bg-accent" : "bg-ink/50"}`} />
              <p className="text-[13px] font-bold leading-tight"><span className="tnum text-muted font-semibold mr-1.5">{t}</span>{a}</p>
              <p className="text-[12px] text-muted leading-snug">{d} · {who}</p>
            </motion.li>
          ))}
        </ol>
        <div className="mt-auto pb-6"><Cta onClick={onReset}>Run it again</Cta></div>
      </div>
    </>
  );
}
