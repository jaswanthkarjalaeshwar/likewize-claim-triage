import type { Metadata } from "next";

export const metadata: Metadata = { title: "How it works · Claim Desk" };

const FLOW = [
  ["Intake classifier", "fast · one request, six questions", "Is this a claim, which of nine claim types, does it try to instruct the system, how specific is the story, is the customer pushing for an outcome. Every answer is a probability, not a sentence."],
  ["Fact extraction", "DeepSeek", "Pulls the incident date and what happened. Dates without a year are then settled in code, because models get years wrong."],
  ["Customer memory", "Mem0", "What this customer told us in earlier conversations. Claim history itself comes from the system of record, not from memory."],
  ["Plan terms retrieval", "BM25, then fast", "A keyword shortlist from that partner's plan, then the classifier grades each passage for this claim."],
  ["Eligibility rules", "code", "Covered peril, waiting period, 60 day window, claims used in the rolling 12 months, value cap, deductible tier. Arithmetic belongs in code."],
  ["Claim write up", "DeepSeek", "Writes the handler summary and the customer reply for an outcome code already chose. It cannot change the outcome."],
  ["Reply verification", "fast", "Every factual sentence in the reply is checked against the clause it cites. One rewrite is allowed. On a denial an unsupported sentence is cut; on an approval it sends the claim to a person."],
  ["Review gate", "code", "Instructions aimed at the system, an unclear claim type, a vague story or stacked risk signals send the claim to a handler."],
  ["Ticket and memory", "code", "Opens the ticket in the right queue and writes a memory note for next time."],
];

export default function How() {
  return (
    <main className="page">
      <h1>Fast judgments, slow reasoning, and rules in between</h1>
      <p className="lede">
        Likewize runs dozens of white label protection plans, each with its own caps, limits, windows and exclusions. A handler has to
        work out which plan a customer is on and what its fine print says before anyone decides anything. This agent does that first pass
        and shows its work.
      </p>

      <div className="prose">
        <h2>The graph</h2>
      </div>
      <ol className="flow">
        {FLOW.map(([name, engine, what], i) => (
          <li key={name}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <span>
              <b>{name}</b>
              <em>{engine}</em>
            </span>
            <span>{what}</span>
          </li>
        ))}
      </ol>

      <div className="prose">
        <h2>Why two kinds of model</h2>
        <p>
          Most of the decisions in a claim are snap judgments: is this theft or loss, is this person trying to game the system, does this
          sentence match that clause. Those want a fast, calibrated classifier that returns a probability my code can put a threshold on.
          That is what <strong>Jev</strong>, TypeSafe&apos;s System One model, is built for, and the intake, retrieval and verification
          nodes speak its question format (choice, score and yes or no questions answered in parallel). Until a TypeSafe key is set, a
          small open model answers the same questions in the same shape, and confidence is computed with Jev&apos;s published formulas,
          so switching over is one environment variable.
        </p>
        <p>
          Writing a clear, correct reply to a customer is slow work, so it goes to <strong>DeepSeek</strong>. Both run through
          OpenRouter with fallbacks, so a provider outage does not stop the desk.
        </p>

        <h2>What a model never decides</h2>
        <p>
          Whether a claim is eligible. Whether a person needs to look. What the deductible is. Those are code, so a reviewer can read
          exactly why a claim went where it went, and the same claim always goes the same way.
        </p>

        <h2>Observability</h2>
        <p>
          Every run streams its steps to the trace panel as they finish, with the engine, time, cost and the probabilities behind each
          judgment. The same run is exported to Langfuse as one trace with a span per node. The evals page replays thirteen claims chosen
          to hit every branch, so a change to a prompt or a threshold shows up as a changed route before it reaches a customer.
        </p>

        <h2>What I would build next</h2>
        <ul>
          <li>Photo intake: Jev&apos;s box questions can locate the crack in a damage photo and check it matches the story.</li>
          <li>Hand off into the Speedperform support flow, so a support chat that turns into a claim lands here already classified.</li>
          <li>Partner plan terms loaded from the policy admin system instead of transcribed, with a diff check when a plan changes.</li>
          <li>Handler feedback on every routed claim, fed back into the eval set.</li>
        </ul>

        <h2>Data</h2>
        <p>
          Plan terms are transcribed from Likewize&apos;s public documents for Farmers Mobile Device Protection, Device Care and The Mobile
          Shop. Customers are fictional. This is an independent prototype, not affiliated with or endorsed by Likewize.
        </p>
      </div>
    </main>
  );
}
