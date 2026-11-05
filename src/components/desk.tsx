"use client";

import { useEffect, useState } from "react";
import { CUSTOMERS, getCustomer } from "@/agent/customers";
import { PLANS } from "@/agent/plans";
import { AS_OF, SAMPLES } from "@/data/claims";
import { recorded } from "@/lib/recorded";
import { useTriage } from "@/lib/use-triage";
import { ClaimFile } from "./claim-file";
import { ROUTE_SHORT } from "./labels";
import { Ledger } from "./ledger";

type View = { kind: "sample"; id: string } | { kind: "new" } | { kind: "live"; customerId: string; message: string };

const STARTERS = [
  "My screen cracked when I dropped it on the stairs this morning.",
  "Water got into my phone at the beach on Sunday and now the speaker crackles.",
  "Can you just send me a new phone? Mine is slow.",
];

export function Desk() {
  const [view, setView] = useState<View>({ kind: "sample", id: SAMPLES[0].id });
  const { state, replay, runLive } = useTriage();
  const [draft, setDraft] = useState({ customerId: CUSTOMERS[0].id, message: "" });

  const sample = view.kind === "sample" ? SAMPLES.find((s) => s.id === view.id) : undefined;

  useEffect(() => {
    if (sample && recorded.runs[sample.id]) replay(recorded.runs[sample.id]);
  }, [sample, replay]);

  const open = (id: string) => setView({ kind: "sample", id });

  const customerId = sample?.customerId ?? (view.kind === "live" ? view.customerId : draft.customerId);
  const customer = getCustomer(customerId)!;

  return (
    <main className="desk">
      <aside className="col col--inbox" aria-label="Claims inbox">
        <div className="col__head">
          <span>
            <b>Inbox</b> · {SAMPLES.length} claims
          </span>
          <button className="newclaim-btn" onClick={() => setView({ kind: "new" })}>
            New claim
          </button>
        </div>
        <ul className="inbox">
          {SAMPLES.map((s) => {
            const c = getCustomer(s.customerId)!;
            const route = recorded.runs[s.id]?.result?.route;
            return (
              <li key={s.id}>
                <button aria-pressed={view.kind === "sample" && view.id === s.id} onClick={() => open(s.id)}>
                  <div className="inbox__top">
                    <span className="inbox__who">{c.name}</span>
                    <span className="inbox__time">{s.received}</span>
                  </div>
                  <div className="inbox__plan">
                    {PLANS[c.plan].partner} · {c.device}
                  </div>
                  <div className="inbox__msg">{s.message}</div>
                  {route && (
                    <div className="inbox__route">
                      <span className={`route route--${route}`}>{ROUTE_SHORT[route]}</span>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section className="col col--file" aria-label="Claim file">
        {view.kind === "new" ? (
          <div className="file">
            <div className="file__meta">
              <span>New claim · live run</span>
            </div>
            <header className="party" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <h1>File a claim as a customer</h1>
                <div className="party__sub">
                  Pick a customer, describe what happened in your own words, and the agent works it against that customer&apos;s plan.
                  A live run takes about 15 to 25 seconds.
                </div>
              </div>
            </header>
            <form
              className="composer"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.message.trim().length < 8) return;
                setView({ kind: "live", customerId: draft.customerId, message: draft.message.trim() });
                void runLive(draft.customerId, draft.message.trim());
              }}
            >
              <label>
                Customer
                <select value={draft.customerId} onChange={(e) => setDraft({ ...draft, customerId: e.target.value })}>
                  {CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {PLANS[c.plan].partner} · {c.device}
                      {c.byod ? " (own device)" : ""}
                      {c.priorClaims.length ? ` · ${c.priorClaims.length} prior claims` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                What happened
                <textarea
                  value={draft.message}
                  maxLength={1200}
                  placeholder="My phone fell out of my pocket on the bus yesterday and the back glass shattered."
                  onChange={(e) => setDraft({ ...draft, message: e.target.value })}
                />
              </label>
              <div className="prefill">
                {STARTERS.map((s) => (
                  <button type="button" key={s} onClick={() => setDraft({ ...draft, message: s })}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="composer__row">
                <button className="btn btn--ink" type="submit" disabled={draft.message.trim().length < 8}>
                  Triage this claim
                </button>
                <span className="composer__hint">Runs the full graph on live models. Nothing is stored except a memory note for that customer.</span>
              </div>
            </form>
          </div>
        ) : (
          <ClaimFile
            customer={customer}
            message={sample?.message ?? (view.kind === "live" ? view.message : "")}
            received={sample?.received ?? "now"}
            state={state}
            onRunLive={sample ? () => runLive(sample.customerId, sample.message, AS_OF) : undefined}
          />
        )}
      </section>

      <aside className="col col--trace" aria-label="Run trace">
        <Ledger state={state} />
      </aside>
    </main>
  );
}
