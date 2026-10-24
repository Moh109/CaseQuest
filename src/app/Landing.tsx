export default function Landing() {
  return (
    <section id="top" className="hero-dark pt-[104px] md:pt-[128px] pb-12 md:pb-16">
      <Motif />
      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <p className="text-[#ff8a7f] font-semibold text-[15px] md:text-[17px]">Operation Spirit · Lone Mesa Energy · CaseQuest 2026</p>
        <h1 className="mt-3 font-bold tracking-tightest leading-[1] text-[44px] sm:text-[64px] md:text-[84px] max-w-[980px]">
          Spares Radar <span className="text-[#c8c8cc]">— the morning check for Lone Mesa crews.</span>
        </h1>
        <p className="mt-5 text-[19px] md:text-[23px] text-[#c8c8cc] font-medium leading-snug max-w-[760px]">
          See which machines are drifting, whether their part is on the shelf, and whether the site is safe to work. Then plan the repair before it breaks.
        </p>
        <p className="mt-3 text-[16px] md:text-[18px] font-semibold text-white">Uses the daily readings Lone Mesa already collects. No new sensors needed.</p>
        <a href="#app" className="mt-8 inline-flex items-center h-12 px-7 rounded-full bg-accent text-white font-semibold text-[17px]">Open the app ↓</a>
      </div>
    </section>
  );
}

/** Faint line-art oilfield: pumpjacks, tank and pipeline. Decorative only. */
function Motif() {
  return (
    <svg aria-hidden className="absolute inset-x-0 bottom-0 w-full h-[78%] pointer-events-none" viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice"
      fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
      <path d="M0 330 H1200" />
      {[[760, 1], [1010, 0.8]].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 330) scale(${s})`}>
          <path d="M-70 0 L0 -150 L70 0" /><path d="M-40 0 L0 -150 L40 0" />
          <path d="M-150 -170 L140 -140" strokeWidth="6" />
          <path d="M140 -140 q40 20 30 70 q-10 30 -40 30" /><path d="M132 -100 V0" />
          <circle cx="-110" cy="-100" r="34" /><path d="M-110 -100 L-150 -170" /><path d="M-130 0 h50 v-30 h-50 z" />
        </g>
      ))}
      <path d="M380 330 V250 a60 20 0 0 1 120 0 V330" /><path d="M380 250 a60 20 0 0 0 120 0" /><path d="M380 290 H500" />
      <path d="M500 300 H600 V270 H700" /><path d="M0 300 H260 V280 H380" />
      <path d="M120 330 V200 L150 180 L180 200 V330" /><path d="M120 240 H180" /><path d="M120 280 H180" />
      <path d="M1100 330 V230 H1160 V330" /><path d="M1100 260 H1160" />
    </svg>
  );
}
