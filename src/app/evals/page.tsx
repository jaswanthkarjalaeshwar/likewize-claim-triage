import type { Metadata } from "next";
import Link from "next/link";
import { getCustomer } from "@/agent/customers";
import { PLANS } from "@/agent/plans";
import { ROUTE_SHORT } from "@/components/labels";
import { SAMPLES } from "@/data/claims";
import { recorded } from "@/lib/recorded";

export const metadata: Metadata = { title: "Evals · Claim Desk" };

export default function Evals() {
  const rows = SAMPLES.map((s) => ({ s, run: recorded.runs[s.id] }));
  const done = rows.filter((r) => r.run?.result);
  const passed = done.filter((r) => r.run!.result!.route === r.s.expect);
  const toHuman = done.filter((r) => r.run!.result!.route === "human_review");
  const ms = done.map((r) => r.run!.result!.totals.ms).sort((a, b) => a - b);
  const median = ms.length ? ms[Math.floor(ms.length / 2)] : 0;
  const cost = done.reduce((a, r) => a + r.run!.result!.totals.cost, 0) / (done.length || 1);

  return (
    <main className="page">
      <h1>Does it route claims the way a careful handler would?</h1>
      <p className="lede">
        Thirteen claims, each written to exercise one branch of the graph, run end to end on live models. The expected outcome is what
        the public plan terms say should happen. Recorded {recorded.recordedAt.slice(0, 10)}, with today pinned to {recorded.asOf}.
      </p>

      <div className="stats">
        <div>
          <b>
            {passed.length}/{done.length}
          </b>
          <span>routed as expected</span>
        </div>
        <div>
          <b>{toHuman.length}</b>
          <span>sent to a handler</span>
        </div>
        <div>
          <b>{(median / 1000).toFixed(1)}s</b>
          <span>median run time</span>
        </div>
        <div>
          <b>${cost.toFixed(4)}</b>
          <span>average cost per claim</span>
        </div>
        <div>
          <b>0</b>
          <span>eligibility decisions made by a model</span>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Case</th>
            <th>What it tests</th>
            <th>Expected</th>
            <th>Got</th>
            <th className="r">Time</th>
            <th className="r">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ s, run }) => {
            const r = run?.result;
            const c = getCustomer(s.customerId)!;
            const ok = r && r.route === s.expect;
            return (
              <tr key={s.id}>
                <td>
                  <span className="mono">{s.id}</span>
                  <div style={{ color: "var(--muted)", fontSize: 12 }}>{PLANS[c.plan].partner}</div>
                </td>
                <td>
                  {s.tests}
                  {r && !ok && <div style={{ color: "var(--deny)", fontSize: 12, marginTop: 3 }}>{r.routeReason}</div>}
                </td>
                <td>
                  <span className={`route route--${s.expect}`}>{ROUTE_SHORT[s.expect]}</span>
                </td>
                <td>{r ? <span className={`route route--${r.route}`}>{ROUTE_SHORT[r.route]}</span> : <span className="mono">{run?.error ? "error" : "not run"}</span>}</td>
                <td className="mono">{r ? `${(r.totals.ms / 1000).toFixed(1)}s` : ""}</td>
                <td className="mono">{r ? `$${r.totals.cost.toFixed(4)}` : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="prose">
        <h2>How to read this</h2>
        <p>
          A miss in the direction of <strong>sending to a handler</strong> is the safe failure: a person looks at a claim the agent
          could have closed. A miss the other way, approving what should be denied, is the one that costs money and trust, and the
          graph is built so that path needs every rule to pass in code first.
        </p>
        <p>
          The first version ran the fast nodes on a small open model standing in for Jev: 12 of 13 routed as expected, 14.6s median,
          about $0.0014 a claim. The miss was the flood claim, where it split between liquid damage and natural disaster and sent the
          claim to a handler. On Jev the same graph routes all 13, in a fraction of the time.
        </p>
        <p>
          Rerun it with <span className="mono">npm run eval</span>. Each run is saved with its full event stream, which is also what
          the <Link href="/">Desk</Link> replays.
        </p>
      </div>
    </main>
  );
}
