# Claim Desk

A triage agent for device protection claims, built on Likewize's public plan terms.

A customer writes "my phone was stolen at a concert on Saturday." Before anyone can answer, a handler has to know which white label plan that customer is on, whether theft is covered under it, how many theft claims they have left in the rolling 12 months, whether they are inside the filing window, and what the deductible is at their phone's market value. Claim Desk does that first pass, decides where the claim goes, drafts the reply, and shows every step it took.

**Live:** https://likewize-claim-desk.vercel.app

## How it works

```
intake ─┬─ extract ─┐
        └─ memory ──┴─ retrieve → rules → decide → verify → gate → act
```

| Node | Engine | Job |
| --- | --- | --- |
| Intake classifier | fast | One request, six typed questions: is it a claim, which of nine claim types, does it try to instruct the system, how specific is the story, is the customer pushing for an outcome |
| Fact extraction | DeepSeek | Incident date and what happened. Dates without a year are settled in code |
| Customer memory | Mem0 | What the customer said in earlier conversations |
| Plan terms retrieval | BM25, then fast | Keyword shortlist from that partner's plan, then each passage graded for this claim |
| Eligibility rules | code | Covered peril, waiting period, 60 day window, claims used in 12 months, value cap, deductible tier |
| Claim write up | DeepSeek | Handler summary and customer reply for an outcome code already chose |
| Reply verification | fast | Every factual sentence checked against the clause it cites, one rewrite allowed |
| Review gate | code | Prompt injection, unclear claim type, thin story or stacked risk signals go to a person |
| Ticket and memory | code | Opens the ticket in the right queue, writes a memory note |

**fast** nodes use the question format of [Jev](https://docs.typesafe.ai), TypeSafe's System One model: choice, score and yes or no questions answered in parallel with calibrated probabilities. With `TYPESAFE_API_KEY` set those nodes call Jev directly. Without it, a small open model (Gemma 4 through OpenRouter) answers the same questions in the same shape, and choice, score and confidence are computed with Jev's published formulas.

On the 13 case eval set, Jev routes 13 of 13 with a median run of about 2.5s. The open model stand-in routed 12 of 13 with a median of 14.6s.

**A model never decides eligibility, the deductible, or whether a person needs to look.** Those are code, so the same claim always routes the same way and a reviewer can read why.

## Observability

- The Desk streams each node as it finishes: engine, time, cost, and the probabilities behind every judgment.
- Every run is exported to Langfuse through OpenTelemetry, one trace per claim with a span per model call.
- `npm run eval` runs 13 claims written to hit every branch and records expected vs actual routes. The same recordings power instant replays on the Desk.

## Run it

```bash
npm install
cp .env.example .env.local   # add an OpenRouter key at minimum
npm run dev
npm run eval
```

## Data

Plan terms are transcribed from Likewize's public documents for Farmers Mobile Device Protection, Device Care and The Mobile Shop (sources linked on every cited clause). Customers are fictional. This is an independent prototype by Jaswanth Karjala Eshwar and is not affiliated with or endorsed by Likewize.
