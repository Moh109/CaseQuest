import Nav from "./components/Nav";
import AppView from "./app/AppView";
import HowItWorks from "./app/HowItWorks";
import Impact from "./app/Impact";
import Landing from "./app/Landing";
import { StoreProvider } from "./store";

export default function App() {
  return (
    <StoreProvider>
      <Nav />
      <main>
        <Landing />
        <AppView />
        <section className="band-white bg-soft-white text-ink py-14 md:py-20">
          <div className="mx-auto max-w-[1180px] px-4 sm:px-6 grid grid-cols-1 gap-12">
            <HowItWorks />
            <Impact />
          </div>
        </section>
      </main>
      <footer className="bg-page text-muted border-t border-line/60">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-8 text-[12px] leading-relaxed space-y-2">
          <p>Data: CaseQuest 2026 dataset, fictional Lone Mesa Energy, 2025, cleaned with scripts/clean.py (IDs normalized, duplicates removed, Fahrenheit converted, times rebuilt; see the cleaning log in the repo).
            Site stock percentages are case data; which kit is on each shelf is simulated. Safety records have no exposure data, so this app makes no injury or incident claims.</p>
          <p>Student case competition entry. Not affiliated with or endorsed by ConocoPhillips. Source: <a className="underline" href="https://github.com/Moh109/CaseQuest">github.com/Moh109/CaseQuest</a></p>
        </div>
      </footer>
    </StoreProvider>
  );
}
