import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CountUp } from "../components/ui";
import { data } from "../data";

const h = data.headline;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, reduce ? 1 : 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, reduce ? 1 : 0]);

  return (
    <section id="top" ref={ref} className="band-white bg-page text-ink scroll-mt-[52px] pt-[120px] md:pt-[150px] pb-24 md:pb-36 overflow-hidden">
      <motion.div style={{ scale, opacity }} className="mx-auto max-w-[1080px] px-4 sm:px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="text-muted font-semibold text-[15px] md:text-[17px]"
        >
          Lone Mesa Energy · CaseQuest 2026
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-3 font-bold tracking-tightest leading-[0.95] text-[64px] sm:text-[96px] md:text-[132px]"
        >
          Spares Radar.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 md:mt-8 mx-auto max-w-[760px] text-[22px] sm:text-[26px] md:text-[32px] leading-[1.18] font-semibold tracking-tight"
        >
          The right part, there before the machine breaks.{" "}
          <span className="text-muted">And no repair starts until it's safe.</span>
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.4, delay: 0.5 }} className="mt-12 md:mt-16">
          <RadarArt />
        </motion.div>

        <dl className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 max-w-[880px] mx-auto">
          <Stat value={<CountUp to={h.breakdowns} />} label="unplanned breakdowns in 2025" />
          <Stat value={<CountUp to={Math.round(h.downtime_h)} suffix=" h" />} label="of machines stopped" />
          <Stat value={<CountUp to={h.loss_usd / 1e6} decimals={1} prefix="$" suffix="M" />} label="in profit lost" />
        </dl>
        <p className="mt-12 md:mt-16 text-[19px] md:text-[21px] text-muted max-w-[560px] mx-auto leading-snug">
          Across 6 sites and 18 machines. And for a quarter of those hours, nobody was fixing anything.{" "}
          <span className="text-ink font-semibold">They were waiting for a part.</span>
        </p>
      </motion.div>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="font-bold tracking-tighter text-[52px] md:text-[64px] leading-none">{value}</dd>
      <dd className="mt-2 text-muted text-[16px] md:text-[17px] font-medium">{label}</dd>
    </div>
  );
}

/** 18 machines on a radar; the sweep passes, the three at-risk ones glow. */
function RadarArt() {
  const reduce = useReducedMotion();
  const dots = Array.from({ length: 18 }, (_, i) => {
    const site = Math.floor(i / 3);
    const a = (site / 6) * Math.PI * 2 - Math.PI / 2 + ((i % 3) - 1) * 0.22;
    const r = 70 + ((i * 37) % 3) * 38 + (i % 2) * 12;
    return { x: 200 + Math.cos(a) * r, y: 200 + Math.sin(a) * r, hot: site === 3 && i % 3 !== 2 };
  });
  return (
    <svg viewBox="0 0 400 400" className="mx-auto w-[260px] sm:w-[320px] md:w-[380px] h-auto" role="img" aria-label="Radar showing 18 machines, two flagged early">
      <defs>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgb(var(--accent))" stopOpacity="0" />
          <stop offset="1" stopColor="rgb(var(--accent))" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {[60, 110, 160, 190].map((r) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="rgb(var(--line))" strokeWidth="1" />
      ))}
      <line x1="10" y1="200" x2="390" y2="200" stroke="rgb(var(--line))" strokeWidth="1" />
      <line x1="200" y1="10" x2="200" y2="390" stroke="rgb(var(--line))" strokeWidth="1" />
      <motion.g
        style={{ originX: "200px", originY: "200px" }}
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <path d="M200 200 L390 200 A190 190 0 0 0 334 66 Z" fill="url(#sweep)" />
        <line x1="200" y1="200" x2="390" y2="200" stroke="rgb(var(--accent))" strokeWidth="2" strokeOpacity="0.7" />
      </motion.g>
      {dots.map((d, i) =>
        d.hot ? (
          <g key={i}>
            <motion.circle
              cx={d.x} cy={d.y} r="9" fill="rgb(var(--accent))" fillOpacity="0.25"
              animate={reduce ? undefined : { r: [9, 20, 9], fillOpacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.2 }}
            />
            <circle cx={d.x} cy={d.y} r="7" fill="rgb(var(--accent))" stroke="rgb(var(--page))" strokeWidth="2" />
          </g>
        ) : (
          <circle key={i} cx={d.x} cy={d.y} r="5.5" fill="rgb(var(--ink))" fillOpacity="0.28" />
        ),
      )}
      <circle cx="200" cy="200" r="5" fill="rgb(var(--ink))" />
    </svg>
  );
}
