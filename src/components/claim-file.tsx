import type { Customer } from "@/agent/customers";
import { PLANS } from "@/agent/plans";
import type { RunState } from "@/lib/use-triage";
import { money, routeHeadline } from "./labels";

const MARK = { pass: "✓", fail: "✕", unknown: "?" } as const;

export function ClaimFile(props: {
  customer: Customer;
  message: string;
  received?: string;
  state: RunState;
  onRunLive?: () => void;
  liveDisabled?: boolean;
}) {
  const { customer, message, state } = props;
  const plan = PLANS[customer.plan];
  const r = state.result;
  const recentClaims = customer.priorClaims.length;

  return (
    <article className="file">
      <div className="file__meta">
        <span>
          Ticket <span className="mono">{r?.ticket ?? "pending"}</span>
        </span>
        {props.received && (
          <span>
            Received <span className="mono">{props.received}</span>
          </span>
        )}
        <span>
          Customer <span className="mono">{customer.id}</span>
        </span>
        {props.onRunLive && (
          <span className="file__actions">
            <button className="btn" onClick={props.onRunLive} disabled={props.liveDisabled || state.status === "running"}>
              {state.status === "running" && state.source === "live" ? "Running live" : "Run again live"}
            </button>
          </span>
        )}
      </div>

      <header className="party">
        <div>
          <h1>{customer.name}</h1>
          <div className="party__sub">
            {plan.name} · {plan.partner} · {plan.region}
          </div>
        </div>
        <dl>
          <dt>Device</dt>
          <dd>{customer.device}</dd>
          <dt>Market value</dt>
          <dd className="num">{money(customer.marketValue, plan.currency)}</dd>
          <dt>Enrolled</dt>
          <dd className="num">
            {customer.enrolled}
            {customer.byod ? " · own device" : ""}
          </dd>
          <dt>Prior claims</dt>
          <dd className="num">{recentClaims ? customer.priorClaims.map((c) => `${c.type.replace(/_/g, " ")} ${c.date.slice(0, 7)}`).join(", ") : "none"}</dd>
        </dl>
      </header>

      <blockquote className="quote">
        {message}
        <cite>Customer message</cite>
      </blockquote>

      {state.status === "error" && (
        <div className="outcome outcome--deny">
          <div>
            <div className="outcome__label">Run failed</div>
            <p className="outcome__why">{state.error}</p>
          </div>
        </div>
      )}

      {state.status === "running" && !r && (
        <div className="outcome outcome--redirect">
          <div>
            <div className="outcome__label">Working</div>
            <h2 className="outcome__head">Reading the claim against the {plan.partner} terms</h2>
          </div>
          <p className="outcome__why">Each step is listed on the right as it finishes.</p>
        </div>
      )}

      {r && (
        <>
          <section className={`outcome outcome--${r.route}`}>
            <div>
              <div className="outcome__label">Outcome</div>
              <h2 className="outcome__head">{routeHeadline(r.route, r.fulfillment)}</h2>
            </div>
            {r.fee ? (
              <div className="outcome__fee">
                <b className="mono">{money(r.fee.amount, r.fee.currency)}</b>
                <span>{r.fee.label.toLowerCase()}</span>
              </div>
            ) : (
              <span />
            )}
            <p className="outcome__why">{r.routeReason}</p>
            {r.summary && <p className="outcome__why" style={{ color: "var(--muted)" }}>{r.summary}</p>}
          </section>

          {r.checks.length > 0 && (
            <section className="section">
              <h3 className="section__title">
                Eligibility checks <small>run as code against the plan terms</small>
              </h3>
              <table className="checks">
                <tbody>
                  {r.checks.map((c) => (
                    <tr key={c.id}>
                      <td className={`mark--${c.status}`}>{MARK[c.status]}</td>
                      <td>{c.label}</td>
                      <td>{c.detail}</td>
                      <td>
                        {c.clause && (
                          <a className="cite" href={`#clause-${c.clause}`}>
                            {c.clause}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="section">
            <h3 className="section__title">
              Drafted reply <small>{r.route === "human_review" ? "held for the handler, not sent" : "ready to send"}</small>
            </h3>
            <div className="letter">{r.reply}</div>
            {r.statements.length > 0 && (
              <ul className="verified">
                {r.statements.map((s, i) => (
                  <li key={i}>
                    <span className="mono">{Math.round(s.support * 100)}%</span>
                    <span>{s.text}</span>
                    <span>
                      {s.clause === "rules" ? (
                        <span className="cite">checks</span>
                      ) : (
                        <a className="cite" href={`#clause-${s.clause}`}>
                          {s.clause}
                        </a>
                      )}
                    </span>
                  </li>
                ))}
                {r.removed?.map((t, i) => (
                  <li key={`x${i}`}>
                    <span className="mono" style={{ color: "var(--deny)" }}>cut</span>
                    <span style={{ textDecoration: "line-through", color: "var(--faint)" }}>{t}</span>
                    <span />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(r.nextSteps.length > 0 || r.documents.length > 0) && (
            <section className="section twocol">
              {r.nextSteps.length > 0 && (
                <div>
                  <h3 className="section__title">Next steps for the customer</h3>
                  <ol className="steps">
                    {r.nextSteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
              {r.documents.length > 0 && (
                <div>
                  <h3 className="section__title">Documents to collect</h3>
                  <ol className="steps">
                    {r.documents.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}

          {r.clauses.length > 0 && (
            <section className="section">
              <h3 className="section__title">
                Plan terms cited <small>{plan.partner} public documents</small>
              </h3>
              <ul className="clauses">
                {r.clauses.map((c) => (
                  <li key={c.id} id={`clause-${c.id}`}>
                    <span className="clauses__id">{c.id}</span>
                    <div>
                      <h3>{c.heading}</h3>
                      <p>{c.text}</p>
                      <a href={c.source} target="_blank" rel="noreferrer">
                        Source document
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </article>
  );
}
