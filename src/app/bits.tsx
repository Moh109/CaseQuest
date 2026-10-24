import { ReactNode } from "react";
import type { Status } from "../lib";

export const Lock = () => (
  <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden><rect x="1" y="4.5" width="8" height="6" rx="1.4" fill="currentColor" /><path d="M2.8 4.5V3.2a2.2 2.2 0 0 1 4.4 0v1.3" fill="none" stroke="currentColor" strokeWidth="1.4" /></svg>
);

export function Chip({ tone, children }: { tone: "accent" | "safe" | "ink" | "muted" | "warn" | "hold"; children: ReactNode }) {
  const cls = {
    accent: "bg-accent/15 text-accent", safe: "bg-safe/15 text-safe", ink: "bg-ink text-page", muted: "bg-ink/10 text-ink/60",
    warn: "bg-warnbg/30 text-warn", hold: "bg-[#1a1a1a] text-white ring-1 ring-white/10",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold whitespace-nowrap ${cls}`}>{children}</span>;
}

export function StatusChip({ status }: { status: Status }) {
  if (status === "down") return <Chip tone="muted">■ Down</Chip>;
  if (status === "warning") return <Chip tone="warn">▲ Warning</Chip>;
  if (status === "normal") return <Chip tone="safe">● Normal</Chip>;
  return <Chip tone="muted">No reading</Chip>;
}

export function HoldChip({ hold }: { hold: boolean }) {
  return hold ? <Chip tone="hold"><Lock /> On hold</Chip> : <Chip tone="safe">✓ Clear</Chip>;
}

export function Btn({ children, onClick, disabled, kind = "primary", title }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; kind?: "primary" | "dark" | "ghost"; title?: string;
}) {
  const cls = {
    primary: "bg-accent text-white dark:text-[#1D1D1F]",
    dark: "bg-ink text-page",
    ghost: "bg-ink/[0.07] text-ink",
  }[kind];
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`h-11 px-5 rounded-full font-semibold text-[15px] disabled:opacity-35 disabled:cursor-not-allowed ${cls}`}>
      {children}
    </button>
  );
}

export function Spark({ values }: { values: (number | null)[] }) {
  const W = 120, H = 32, max = 3;
  const x = (i: number) => (i / (values.length - 1)) * W;
  const y = (v: number) => H - (Math.min(v, max) / max) * H;
  const segs: string[][] = [];
  values.forEach((v, i) => {
    if (v == null) { segs.push([]); return; }
    if (!segs.length) segs.push([]);
    segs[segs.length - 1].push(`${x(i)},${y(v)}`);
  });
  return (
    <svg width={W} height={H} aria-hidden className="block overflow-visible">
      <line x1="0" x2={W} y1={y(1.3)} y2={y(1.3)} stroke="rgb(var(--warn))" strokeDasharray="3 3" strokeOpacity="0.7" />
      {segs.filter((s) => s.length).map((s, i) => (
        <polyline key={i} points={s.join(" ")} fill="none" stroke="rgb(var(--ink))" strokeWidth="1.6" strokeLinejoin="round" />
      ))}
    </svg>
  );
}
