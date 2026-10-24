import { data, fmtK } from "../data";

export default function Impact() {
  const A = data.options.A;
  const e = A.scenarios.expected;
  return (
    <div id="impact" className="scroll-mt-[64px] bg-panel rounded-[28px] p-6 md:p-8">
      <p className="text-accent font-semibold text-[15px]">Impact · stock critical spare parts at all 6 sites</p>
      <dl className="mt-4 grid grid-cols-3 gap-4">
        <div><dt className="text-[13px] text-muted">Downtime saved</dt><dd className="text-[34px] md:text-[48px] font-bold tracking-tighter leading-none mt-1 tnum">{Math.round(e.hours)} h<span className="text-[15px] text-muted font-semibold"> /yr</span></dd></div>
        <div><dt className="text-[13px] text-muted">Year-1 cost</dt><dd className="text-[34px] md:text-[48px] font-bold tracking-tighter leading-none mt-1 tnum">${Math.round(A.year1_usd / 1000)}K</dd></div>
        <div><dt className="text-[13px] text-muted">Pays back in</dt><dd className="text-[34px] md:text-[48px] font-bold tracking-tighter leading-none mt-1 tnum">~{Math.round(e.payback_months)}<span className="text-[15px] text-muted font-semibold"> months</span></dd></div>
      </dl>
      <p className="mt-4 text-[13px] text-muted leading-snug">
        Expected case. Year 1 = {fmtK(A.setup_usd)} up front (parts program plus all {data.hse.open} open safety fixes) + {fmtK(A.annual_usd)} a year.
      </p>
      <p className="mt-2 text-[13px] text-muted leading-snug">
        The prototype runs on data Lone Mesa already exports. A live connection to their systems is phase 2 (case option O2: $40K setup + $18K/yr), not included in $227.5K.
      </p>
    </div>
  );
}
