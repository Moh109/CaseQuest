import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "../components/ui";
import { data, fmtK } from "../data";

const A = data.options.A;
const partsSetup = A.setup_usd - data.hse.setup_usd;

export default function Close() {
  const [approved, setApproved] = useState(false);
  return (
    <section id="ask" className="band-white bg-page text-ink scroll-mt-[52px] pt-28 md:pt-44 pb-16">
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 text-center">
        <Reveal>
          <h2 className="font-bold tracking-tightest leading-[0.98] text-[56px] sm:text-[80px] md:text-[112px]">
            Safe first.<br /><span className="text-accent">Then running.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-12 md:mt-16 text-muted font-semibold text-[17px] md:text-[19px]">Our ask</p>
          <p className="mt-2 text-[40px] sm:text-[56px] md:text-[72px] font-bold tracking-tighter leading-none">Approve {fmtK(A.setup_usd)}.</p>
          <p className="mt-6 mx-auto max-w-[620px] text-[18px] md:text-[21px] text-muted leading-snug">
            {fmtK(partsSetup)} to stock critical spare parts at all six sites, audit included, and {fmtK(data.hse.setup_usd)} to close all {data.hse.open} open safety fixes.
            Then {fmtK(A.annual_usd)} a year. It pays for itself in about {Math.round(A.scenarios.expected.payback_months)} months.
          </p>

          <div className="mt-10 h-14 flex justify-center">
            <AnimatePresence mode="wait">
              {!approved ? (
                <motion.button key="btn" onClick={() => setApproved(true)} exit={{ opacity: 0, scale: 0.95 }}
                  className="h-14 px-9 rounded-full bg-accent text-white dark:text-[#1D1D1F] font-semibold text-[17px]">
                  Approve {fmtK(A.setup_usd)}
                </motion.button>
              ) : (
                <motion.p key="ok" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status"
                  className="h-14 inline-flex items-center gap-3 px-6 rounded-full bg-safe/15 text-safe font-semibold text-[16px] md:text-[17px]">
                  <svg width="18" height="18" viewBox="0 0 12 12" aria-hidden><path d="M2.5 6.3l2.3 2.3 4.7-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Thank you. Month 1 starts with the safety fixes.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <p className="mt-6"><a href="#prototype" className="text-accent font-semibold text-[16px] hover:underline">Try the prototype again →</a></p>
        </Reveal>

        <footer className="mt-28 md:mt-40 pt-8 border-t border-line text-left text-[12px] md:text-[13px] text-muted leading-relaxed space-y-3">
          <p>
            <b className="text-ink/80">About the data.</b> CaseQuest 2026 dataset for the fictional Lone Mesa Energy: 6 sites, 18 machines, full year 2025.
            Cleaned with <code>scripts/clean.py</code>: asset IDs normalized (a003, A09, 8, 11 to A003, A009, A008, A011); 2 duplicate events dropped (E0021, E0141);
            4 blank downtimes filled from the five stages; start and end times rebuilt from the work orders; 14 pending parts invoices left unknown, not zero;
            "bbl/hr" stripped from capacity; 6,594 duplicate sensor readings dropped (6,570 left) and 4 Fahrenheit temperatures converted;
            36 duplicate safety rows dropped (72 to 36). Lost profit per breakdown = lost barrels × (1 − recoverable share) × (price − variable cost) for that machine and month.
            Every headline number is re-checked by the script.
          </p>
          <p>
            Spare stock in the prototype is simulated. Names in the prototype are fictional. Safety records cover observations and actions only, with no exposure data,
            so this page makes no claim about injury or incident rates. Safety procedures must be set by qualified site staff.
          </p>
          <p>Spares Radar is a student case competition entry. Not affiliated with or endorsed by ConocoPhillips. Source: <a className="underline" href="https://github.com/Moh109/CaseQuest">github.com/Moh109/CaseQuest</a>.</p>
        </footer>
      </div>
    </section>
  );
}
