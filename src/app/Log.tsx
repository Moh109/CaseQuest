import { ROLE_LABEL, useStore } from "../store";
import { Btn } from "./bits";

export default function Log() {
  const { s, d } = useStore();
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] text-muted">Every action, who did it and when. Newest first.</p>
        <Btn kind="ghost" onClick={() => d({ type: "reset" })}>Reset demo</Btn>
      </div>
      {s.log.length === 0 ? <p className="mt-10 text-center text-muted">Nothing yet. Actions on the board, work orders and safety page show up here.</p> : (
        <ol className="mt-5 bg-panel rounded-[24px] divide-y divide-line/60">
          {s.log.map((e) => (
            <li key={e.n} className="px-5 py-3 grid grid-cols-[56px_1fr] sm:grid-cols-[72px_150px_1fr] gap-x-3 gap-y-0.5 text-[14px]">
              <span className="tnum text-muted font-semibold">{e.at}</span>
              <span className="text-muted sm:order-none order-last col-start-2 sm:col-start-auto text-[12px] sm:text-[14px]">{e.role === "system" ? "System" : ROLE_LABEL[e.role]}</span>
              <span><b>{e.action}</b> <span className="text-muted">· {e.detail} · board {e.day}</span>{e.demo && <span className="ml-2 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink/60">Demo data</span>}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
