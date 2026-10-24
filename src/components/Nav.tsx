import { useState } from "react";

export default function Nav() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch { /* storage blocked */ }
  };
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-page/80 backdrop-blur-xl backdrop-saturate-150 border-b border-line/50">
      <nav className="mx-auto max-w-[1180px] h-[52px] px-4 sm:px-6 flex items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-2 min-w-0">
          <svg width="20" height="20" viewBox="0 0 32 32" aria-hidden className="shrink-0"><circle cx="16" cy="16" r="13" fill="none" stroke="rgb(var(--accent))" strokeWidth="3" /><circle cx="16" cy="16" r="4.5" fill="rgb(var(--accent))" /></svg>
          <span className="font-bold text-[17px] tracking-tight whitespace-nowrap">Spares Radar</span>
          <span className="hidden sm:inline text-[13px] text-muted font-semibold whitespace-nowrap">· Operation Spirit</span>
        </a>
        <div className="flex items-center gap-4 sm:gap-6 text-[13px]">
          <a href="#app" className="text-ink/70 hover:text-ink">App</a>
          <a href="#how" className="text-ink/70 hover:text-ink">How it works</a>
          <a href="#impact" className="hidden sm:inline text-ink/70 hover:text-ink">Impact</a>
          <button onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} className="w-8 h-8 grid place-items-center rounded-full text-ink/70 hover:text-ink">
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </nav>
    </header>
  );
}
