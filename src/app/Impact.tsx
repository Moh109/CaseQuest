import { data, fmtK } from "../data";

export default function Impact() {
  const A = data.options.A;
  const e = A.scenarios.expected;
  return (
    <div id="impact" className="scroll-mt-[64px] bg-panel rounded-[28px] p-6 md:p-8">
      <p className="text-accent font-semibold text-[15px]">Impact · stock critical spare parts at all 6 sites</p>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Metric label="Downtime saved" value={`${Math.round(e.hours)}`} unit="h / yr" />
        <Metric label="Year-1 cost" value={`$${Math.round(A.year1_usd / 1000)}K`} />
        <Metric label="Pays back in" value={`~${Math.round(e.payback_months)}`} unit="months" />
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

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[44px] md:text-[48px] font-bold tracking-tighter leading-none tnum">{value}</span>
        {unit && <span className="text-[18px] md:text-[19px] font-medium text-muted tracking-normal">{unit}</span>}
      </dd>
    </div>
  );
}
