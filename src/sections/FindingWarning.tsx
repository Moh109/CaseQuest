import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from "framer-motion";
import { Eyebrow, Headline, Lede, Panel, Reveal, Section, useWidth } from "../components/ui";
import { data } from "../data";

const a = data.a010;
const T0 = new Date("2025-08-25T00:00:00Z").getTime();
const DAYS = 33; // Aug 25 -> Sep 27
const day = (iso: string) => (new Date(iso.replace(" ", "T") + (iso.length <= 10 ? "T06:00:00Z" : ":00Z")).getTime() - T0) / 864e5;
const pts = a.series.map((p) => ({ ...p, d: day(p.t) }));
const WARN = 1.3;
const fails = a.failures.map((f) => ({ ...f, s: day(f.start), e: day(f.end), w: day(f.warning!.t) }));
const focus = fails[fails.length - 1];
const early = fails[0];
const fmtDate = (d: number) => new Date(T0 + d * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// Break the line wherever a day of valid running data is missing.
const segments: (typeof pts)[] = [];
pts.forEach((p, i) => {
  if (i === 0 || p.d - pts[i - 1].d > 1.01) segments.push([]);
  segments[segments.length - 1].push(p);
});

export default function FindingWarning() {
  const [box, W] = useWidth<HTMLDivElement>();
  const H = W < 640 ? 300 : 400;
  const m = { l: W < 640 ? 34 : 44, r: 12, t: 28, b: 34 };
  const x = (d: number) => m.l + (d / DAYS) * (W - m.l - m.r);
  const yMax = 2.8;
  const y = (r: number) => m.t + (1 - r / yMax) * (H - m.t - m.b);

  const reduce = useReducedMotion();
  const [p, setP] = useState(reduce ? DAYS : 0);
  const [playing, setPlaying] = useState(false);
  const ctl = useRef<ReturnType<typeof animate> | null>(null);
  const inView = useInView(box, { once: true, margin: "-25% 0px" });

  const play = (from = p >= DAYS - 0.01 ? 0 : p) => {
    ctl.current?.stop();
    if (reduce) { setP(DAYS); return; }
    setPlaying(true);
    ctl.current = animate(from, DAYS, {
      duration: ((DAYS - from) / DAYS) * 7, ease: "linear", onUpdate: setP, onComplete: () => setPlaying(false),
    });
  };
  const pause = () => { ctl.current?.stop(); setPlaying(false); };
  const scrub = (v: number) => { pause(); setP(Math.max(0, Math.min(DAYS, v))); };
  useEffect(() => { if (inView) play(0); return () => ctl.current?.stop(); }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === "pointermove" && e.buttons !== 1 && e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    scrub(((e.clientX - r.left - m.l) / (W - m.l - m.r)) * DAYS);
  };

  const cur = [...pts].reverse().find((q) => q.d <= p + 0.001);
  const inFail = fails.find((f) => p >= f.s && p <= f.e);
  const status = inFail ? "stopped" : cur && cur.ratio >= WARN && p - cur.d < 1 ? "warning" : "normal";
  const showFocusWarn = p >= focus.w;
  const showFocusFail = p >= focus.s;

  return (
    <Section id="warning" band="white">
      <Reveal>
        <Eyebrow>Finding 04</Eyebrow>
        <Headline>The warning comes<br className="hidden sm:block" /> two days early.</Headline>
        <Lede className="mt-6">
          Arroyo's transfer pump A010 broke down twice in September with a worn bearing.
          Both times, its vibration jumped two days before it failed. That's enough time to get the part.
        </Lede>
      </Reveal>

      <Reveal delay={0.1}>
        <Panel className="mt-12 md:mt-16 p-5 sm:p-8 md:p-12">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
            <div aria-live="polite">
              <p className="text-muted text-[14px] md:text-[15px] font-medium">A010 vibration vs. normal · {fmtDate(Math.min(p, DAYS - 0.01))}</p>
              <p className="mt-1 flex items-baseline gap-3">
                <span className="text-[44px] md:text-[56px] font-bold tracking-tighter leading-none tnum">
                  {status === "stopped" ? "—" : cur ? `${cur.ratio.toFixed(2)}×` : "—"}
                </span>
                <StatusChip status={status} />
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => (playing ? pause() : play())}
                className="h-11 px-5 rounded-full bg-ink text-page font-semibold text-[15px] inline-flex items-center gap-2"
                aria-label={playing ? "Pause" : "Play the month"}
              >
                {playing ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor" /><rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor" /></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M3 1.5v9l7.5-4.5z" fill="currentColor" /></svg>
                )}
                {playing ? "Pause" : p >= DAYS - 0.01 ? "Replay" : "Play"}
              </button>
            </div>
          </div>

          <div ref={box} className="mt-6 w-full select-none">
            <svg
              width={W} height={H} className="block touch-pan-y cursor-ew-resize"
              onPointerDown={onPointer} onPointerMove={onPointer}
              role="img"
              aria-label={`Vibration of A010 relative to normal from Aug 25 to Sep 26, 2025. Crossed the 1.3 times warning line on ${fmtDate(early.w)} and ${fmtDate(focus.w)}; failed on ${fmtDate(early.s)} and ${fmtDate(focus.s)}.`}
            >
              <defs>
                <clipPath id="reveal"><rect x={0} y={0} width={x(p)} height={H} /></clipPath>
              </defs>
              {/* grid */}
              {[0, 1, 2].map((r) => (
                <g key={r}>
                  <line x1={m.l} x2={W - m.r} y1={y(r)} y2={y(r)} stroke="rgb(var(--line))" strokeOpacity={r === 0 ? 1 : 0.6} />
                  <text x={m.l - 8} y={y(r) + 4} textAnchor="end" fontSize="12" fill="rgb(var(--muted))">{r}×</text>
                </g>
              ))}
              {(W < 640 ? [0, 14, 28] : [0, 7, 14, 21, 28]).map((d) => (
                <text key={d} x={x(d)} y={H - 10} textAnchor={d === 0 ? "start" : "middle"} fontSize="12" fill="rgb(var(--muted))">{fmtDate(d)}</text>
              ))}

              {/* failure bands */}
              {fails.map((f) => {
                const isFocus = f === focus;
                return (
                  <g key={f.event_id} opacity={p >= f.s ? 1 : 0} style={{ transition: "opacity .4s" }}>
                    <rect x={x(f.s)} y={m.t} width={Math.max(4, x(f.e) - x(f.s))} height={H - m.t - m.b}
                      fill={isFocus ? "rgb(var(--accent))" : "rgb(var(--ink))"} fillOpacity={isFocus ? 0.14 : 0.06} rx="4" />
                    <text x={x(f.s) + 6} y={m.t + 14} fontSize="12" fontWeight="600" fill={isFocus ? "rgb(var(--accent))" : "rgb(var(--muted))"}>
                      Failed
                    </text>
                  </g>
                );
              })}

              {/* warning line */}
              <line x1={m.l} x2={W - m.r} y1={y(WARN)} y2={y(WARN)} stroke="rgb(var(--accent))" strokeWidth="1.5" strokeDasharray="5 5" />
              <text x={m.l + 4} y={y(WARN) - 7} fontSize="12" fontWeight="600" fill="rgb(var(--accent))">Warning line 1.3×</text>

              {/* data */}
              <g clipPath="url(#reveal)">
                {segments.map((s, i) => (
                  <polyline key={i} points={s.map((q) => `${x(q.d)},${y(q.ratio)}`).join(" ")}
                    fill="none" stroke="rgb(var(--ink))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                ))}
                {pts.map((q) => (
                  <circle key={q.t} cx={x(q.d)} cy={y(q.ratio)} r="2.5" fill="rgb(var(--ink))" />
                ))}
              </g>

              {/* warning dots */}
              {fails.map((f) => {
                const isFocus = f === focus;
                const wp = pts.find((q) => q.t === f.warning!.t)!;
                return p >= f.w ? (
                  <motion.g key={f.event_id + "w"} initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ originX: `${x(wp.d)}px`, originY: `${y(wp.ratio)}px` }}>
                    {isFocus && <circle cx={x(wp.d)} cy={y(wp.ratio)} r="13" fill="rgb(var(--accent))" fillOpacity="0.2" />}
                    <circle cx={x(wp.d)} cy={y(wp.ratio)} r={isFocus ? 7 : 5.5}
                      fill={isFocus ? "rgb(var(--accent))" : "rgb(var(--panel))"} stroke={isFocus ? "rgb(var(--panel))" : "rgb(var(--accent))"} strokeWidth="2" />
                  </motion.g>
                ) : null;
              })}

              {/* playhead */}
              <line x1={x(p)} x2={x(p)} y1={m.t - 8} y2={H - m.b} stroke="rgb(var(--ink))" strokeOpacity="0.35" strokeWidth="1" />
              <circle cx={x(p)} cy={m.t - 8} r="4" fill="rgb(var(--ink))" />
            </svg>
          </div>

          <label className="sr-only" htmlFor="scrub">Scrub through the month</label>
          <input
            id="scrub" type="range" min={0} max={DAYS} step={0.05} value={p}
            onChange={(e) => scrub(+e.target.value)}
            className="mt-4 w-full accent-[rgb(var(--accent))]"
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Callout on={showFocusWarn} tone="accent" title={`${fmtDate(focus.w)}: warning`}>
              Vibration hits {focus.warning!.ratio.toFixed(1)}× normal. Spares Radar flags it and checks the shelf for a bearing kit.
            </Callout>
            <Callout on={showFocusFail} tone="ink" title={`${fmtDate(focus.s)}: failed`}>
              {focus.stopped_hours} h down. {focus.parts_wait_hours} h of that was waiting for the part.
              With the kit already on site: about {focus.without_wait_hours} h.
            </Callout>
          </div>
          <p className="mt-6 text-[13px] md:text-[14px] text-muted leading-snug">
            The same thing happened earlier: a warning on {fmtDate(early.w)}, then a failure on {fmtDate(early.s)} ({early.stopped_hours} h down, {early.parts_wait_hours} h waiting on parts).
            The chart only uses valid readings taken while the pump was running. Gaps are missing, suspect or stopped readings.
          </p>
        </Panel>
      </Reveal>
    </Section>
  );
}

function StatusChip({ status }: { status: "normal" | "warning" | "stopped" }) {
  const map = {
    normal: { label: "Normal", cls: "bg-ink/10 text-ink/70" },
    warning: { label: "Warning", cls: "bg-accent/15 text-accent" },
    stopped: { label: "Stopped", cls: "bg-ink text-page" },
  }[status];
  return <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${map.cls}`}>{map.label}</span>;
}

function Callout({ on, tone, title, children }: { on: boolean; tone: "accent" | "ink"; title: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-[112px] rounded-[20px] border border-line/70 p-5">
      <AnimatePresence>
        {on ? (
          <motion.div key="on" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <p className={`font-bold text-[17px] ${tone === "accent" ? "text-accent" : "text-ink"}`}>{title}</p>
            <p className="mt-1 text-[15px] md:text-[16px] text-muted leading-snug">{children}</p>
          </motion.div>
        ) : (
          <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[15px] text-muted/60">
            {tone === "accent" ? "Play or scrub to Sep 19…" : "…and on to Sep 21."}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
