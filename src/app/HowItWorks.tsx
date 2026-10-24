const STEPS = [
  { t: "Sensor reading", d: "Daily vibration vs normal" },
  { t: "Warning", d: "Flags at 1.3× normal" },
  { t: "Safety gate", d: "Open critical fix = hold" },
  { t: "Parts check", d: "On the shelf, or order it" },
  { t: "Approval", d: "Site supervisor signs off" },
  { t: "Log", d: "Every action recorded" },
];

export default function HowItWorks() {
  return (
    <div id="how" className="scroll-mt-[64px]">
      <h2 className="text-[30px] md:text-[40px] font-bold tracking-tight">How it works</h2>
      <ol className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" aria-label="Workflow">
        {STEPS.map((s, i) => (
          <li key={s.t} className="relative bg-panel rounded-[20px] p-4">
            <span className={`w-7 h-7 rounded-full grid place-items-center text-[13px] font-bold ${"bg-ink text-page"}`}>{i + 1}</span>
            <p className="mt-3 font-bold text-[16px] leading-tight">{s.t}</p>
            <p className="mt-1 text-[13px] text-muted leading-snug">{s.d}</p>
            {i < STEPS.length - 1 && <span aria-hidden className="hidden lg:block absolute -right-[11px] top-1/2 -translate-y-1/2 text-muted text-[14px] z-10">→</span>}
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[13px] text-muted">No repair skips the safety gate. Nothing skips the log.</p>
      <p className="mt-2 text-[14px] font-semibold text-ink">Read-only data · role-based approvals · every action logged · never controls equipment.</p>
    </div>
  );
}
