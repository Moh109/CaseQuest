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
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 py-8 text-[12px] text-center leading-relaxed">
          Student entry for CaseQuest 2026 · Not affiliated with ConocoPhillips · Shelf stock is simulated · Data &amp; code:{" "}
          <a className="underline" href="https://github.com/Moh109/CaseQuest">github.com/Moh109/CaseQuest</a>
        </div>
      </footer>
    </StoreProvider>
  );
}
