import React, { ReactNode, useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

export function Section({ id, band, children, className = "" }: {
  id: string; band: "white" | "gray" | "dark"; children: ReactNode; className?: string;
}) {
  const bg = band === "white" ? "bg-page" : band === "gray" ? "bg-band" : "bg-page";
  return (
    <section id={id} className={`band-${band} ${bg} text-ink py-24 md:py-40 scroll-mt-[52px] ${className}`}>
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6">{children}</div>
    </section>
  );
}

export function Reveal({ children, delay = 0, className = "", y = 32 }: {
  children: ReactNode; delay?: number; className?: string; y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-accent font-semibold text-[15px] md:text-[17px] mb-3 md:mb-4">{children}</p>;
}

export function Headline({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-bold tracking-tightest leading-[1.02] text-[44px] sm:text-[56px] md:text-[80px] ${className}`}>
      {children}
    </h2>
  );
}

export function Lede({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-muted text-[19px] md:text-[24px] leading-snug font-medium max-w-[680px] ${className}`}>{children}</p>;
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-panel rounded-panel ${className}`}>{children}</div>;
}

/** Counts up from 0 the first time it scrolls into view. */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1.6 }: {
  to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setVal(to); return; }
    const c = animate(0, to, { duration, ease, onUpdate: setVal });
    return () => c.stop();
  }, [inView, to, reduce, duration]);
  const text = val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref} className="tnum">{prefix}{text}{suffix}</span>;
}

/** Smoothly tweens a number whenever `value` changes. */
export function Tween({ value, decimals = 0, prefix = "", suffix = "" }: {
  value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (reduce) { setVal(value); prev.current = value; return; }
    const c = animate(prev.current, value, { duration: 0.7, ease, onUpdate: setVal });
    prev.current = value;
    return () => c.stop();
  }, [value, reduce]);
  return (
    <span className="tnum">
      {prefix}{val.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}
    </span>
  );
}

/** Apple-style segmented control. */
export function Segmented<T extends string>({ options, value, onChange, label, layoutId }: {
  options: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; label: string; layoutId: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-1 rounded-full bg-ink/[0.07] max-w-full">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`relative px-4 sm:px-5 py-2 rounded-full text-[14px] sm:text-[15px] font-semibold transition-colors whitespace-nowrap ${on ? "text-page" : "text-ink/70 hover:text-ink"}`}
          >
            {on && (
              <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tracks an element's rendered width so SVG charts can draw at real pixel size. */
export function useWidth<T extends HTMLElement>(fallback = 800) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
