import type { RunState } from "@/lib/use-triage";
import { NODES } from "./labels";

const fmtMs = (ms?: number) => (ms === undefined ? "" : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

export function Ledger({ state }: { state: RunState }) {
  const r = state.result;
  return (
    <>
      <div className="col__head">
        <span>
          <b>Run</b>
          {state.source && <> · {state.source === "live" ? "live" : "recorded"}</>}
        </span>
        <span className="mono">{state.status === "running" ? "in progress" : r ? fmtMs(r.totals.ms) : ""}</span>
      </div>

      {r && (
        <div className="totals">
          <div>
            <b>{(r.totals.ms / 1000).toFixed(1)}s</b>
            <span>wall time</span>
          </div>
          <div>
            <b>${r.totals.cost.toFixed(4)}</b>
            <span>model cost</span>
          </div>
          <div>
            <b>{(r.totals.tokens / 1000).toFixed(1)}k</b>
            <span>tokens</span>
          </div>
        </div>
      )}

      <ol className="ledger">
        {NODES.map((n, i) => {
          const ev = state.nodes[n.id];
          const status = ev?.status ?? "pending";
          return (
            <li key={n.id} data-status={status}>
              <span className="ledger__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="ledger__name">
                {n.label} <span className="ledger__kind">{n.kind}</span>
              </span>
              <span className="ledger__ms">{status === "skipped" ? "skipped" : fmtMs(ev?.ms)}</span>
              {ev?.engine && <span className="ledger__engine">{ev.engine}</span>}
              {ev?.detail && status !== "running" && <span className="ledger__detail">{ev.detail}</span>}
              {ev?.readouts && status === "done" && (
                <ul className="readouts">
                  {ev.readouts.map((ro, k) => (
                    <li key={k}>
                      <span>{ro.question}</span>
                      <span className="mono">{ro.dist ? "" : ro.value}</span>
                      {ro.dist && (
                        <div className="dist">
                          {ro.dist.map((d) => (
                            <div key={d.label}>
                              <span>{d.label.replace(/_/g, " ")}</span>
                              <i style={{ "--p": `${Math.round(d.p * 100)}%` } as React.CSSProperties} />
                              <span>{Math.round(d.p * 100)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <div className="trace-note">
        <p>
          <b>fast</b> nodes are typed judgments with probabilities. They run on Jev&apos;s question format; until a TypeSafe key is
          set, a small open model answers in the same shape. <b>reason</b> nodes run on DeepSeek. <b>code</b> nodes are plain
          functions, so eligibility and routing never depend on a model.
        </p>
        <p>Every run is also exported as a trace to Langfuse, one span per node with tokens, cost and latency.</p>
      </div>
    </>
  );
}
