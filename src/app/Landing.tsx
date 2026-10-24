export default function Landing() {
  return (
    <section id="top" className="band-white bg-page text-ink pt-[104px] md:pt-[128px] pb-10 md:pb-14">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <p className="text-accent font-semibold text-[15px] md:text-[17px]">Operation Spirit · Lone Mesa Energy · CaseQuest 2026</p>
        <h1 className="mt-3 font-bold tracking-tightest leading-[1] text-[44px] sm:text-[64px] md:text-[84px] max-w-[980px]">
          Spares Radar <span className="text-muted">— the morning check for Lone Mesa crews.</span>
        </h1>
        <p className="mt-5 text-[19px] md:text-[23px] text-muted font-medium leading-snug max-w-[760px]">
          See which machines are drifting, whether their part is on the shelf, and whether the site is safe to work. Then plan the repair before it breaks.
        </p>
        <p className="mt-3 text-[16px] md:text-[18px] font-semibold text-ink">Uses the daily readings Lone Mesa already collects. No new sensors needed.</p>
        <a href="#app" className="mt-8 inline-flex items-center h-12 px-7 rounded-full bg-accent text-white dark:text-[#1D1D1F] font-semibold text-[17px]">Open the app ↓</a>
      </div>
    </section>
  );
}
