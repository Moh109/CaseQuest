import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const LINKS = [
  { id: "parts", label: "Findings" },
  { id: "warning", label: "Warning" },
  { id: "prototype", label: "Try it" },
  { id: "options", label: "Options" },
  { id: "rollout", label: "Rollout" },
  { id: "ask", label: "The ask" },
];
const WATCH = ["parts", "stock", "safety", "warning", "prototype", "options", "rollout", "ask"];
const GROUP: Record<string, string> = { parts: "parts", stock: "parts", safety: "parts" };

export default function Nav() {
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(GROUP[e.target.id] ?? e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    WATCH.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  // Collapse the menu first; scrolling while it animates closed gets cancelled.
  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
      history.replaceState(null, "", `#${id}`);
    }, 320);
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* storage blocked */ }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-page/75 backdrop-blur-xl backdrop-saturate-150 border-b border-line/50">
      <nav className="mx-auto max-w-[1080px] h-[52px] px-4 sm:px-6 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-2 font-bold text-[17px] tracking-tight text-ink">
          <RadarMark /> Spares Radar
        </a>
        <ul className="hidden md:flex items-center gap-7 text-[13px]">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className={`transition-colors ${active === l.id ? "text-ink font-semibold" : "text-ink/60 hover:text-ink"}`}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <button onClick={toggleTheme} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="w-9 h-9 grid place-items-center rounded-full text-ink/70 hover:text-ink">
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Sections" className="md:hidden w-9 h-9 grid place-items-center rounded-full text-ink/70">
            <motion.svg width="14" height="14" viewBox="0 0 14 14" animate={{ rotate: open ? 180 : 0 }}>
              <path d="M2 5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden px-4"
          >
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} onClick={(e) => go(e, l.id)} className="block py-3 text-[22px] font-semibold border-b border-line/40 last:border-0">
                  {l.label}
                </a>
              </li>
            ))}
            <li className="h-3" />
          </motion.ul>
        )}
      </AnimatePresence>
    </header>
  );
}

function RadarMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="13" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" />
      <circle cx="16" cy="16" r="4.5" fill="rgb(var(--accent))" />
    </svg>
  );
}
const MoonIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="currentColor" /></svg>
);
const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
      <line key={a} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${a} 12 12)`} />
    ))}
  </svg>
);
