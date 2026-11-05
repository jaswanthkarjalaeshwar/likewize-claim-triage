import type { Customer } from "./customers";
import { PERIL_OF, PLANS, type ClaimType, type Plan } from "./plans";

/**
 * Eligibility is arithmetic, so it is code. A model that is right 95% of the
 * time about a 60 day window is wrong about it for 1 claim in 20; this is
 * right every time, and a reviewer can read exactly why.
 */
export type Check = {
  id: string;
  label: string;
  status: "pass" | "fail" | "unknown";
  detail: string;
  clause?: string;
};

export type Eligibility = {
  checks: Check[];
  verdict: "eligible" | "ineligible" | "unclear";
  fulfillment: "repair" | "replace" | "reimburse" | "none";
  fee?: { amount: number; label: string; currency: Plan["currency"] };
  documents: string[];
};

const DAY = 86_400_000;
const days = (from: string, to: string) => Math.floor((Date.parse(to) - Date.parse(from)) / DAY);
const money = (n: number, c: Plan["currency"]) => `${c === "CAD" ? "CA$" : "$"}${n.toLocaleString("en-US")}`;

const CLAUSE_FOR: Record<Plan["id"], { coverage: string; window: string; limits: string; fees?: string; start?: string; exclusions?: string }> = {
  "farmers-mobile": { coverage: "FM-1", window: "FM-2", limits: "FM-3", fees: "FM-4", exclusions: "FM-5" },
  "device-care": { coverage: "DC-1", window: "DC-3", limits: "DC-2", fees: "DC-5", start: "DC-4" },
  "mobile-shop": { coverage: "MS-1", window: "MS-1", limits: "MS-1" },
};

export function checkEligibility(input: {
  customer: Customer;
  claimType: ClaimType;
  incidentDate: string | null;
  asOf: string;
}): Eligibility {
  const { customer, claimType, incidentDate, asOf } = input;
  const plan = PLANS[customer.plan];
  const r = plan.rules;
  const cl = CLAUSE_FOR[plan.id];
  const checks: Check[] = [];

  // 1. Is this peril covered at all?
  const covered = r.covered[claimType];
  checks.push({
    id: "coverage",
    label: "Covered peril",
    status: covered === true ? "pass" : covered === false ? "fail" : "unknown",
    detail:
      covered === true
        ? `${claimType.replace(/_/g, " ")} is covered under ${plan.name}`
        : covered === false
          ? `${plan.name} excludes ${claimType.replace(/_/g, " ")}`
          : `The public ${plan.partner} terms do not say whether ${claimType.replace(/_/g, " ")} is covered`,
    clause: covered === false && claimType === "natural_disaster" ? cl.exclusions : cl.coverage,
  });

  // 2. Waiting period for bring-your-own devices.
  if (r.byodWaitDays && customer.byod) {
    const since = days(customer.enrolled, incidentDate ?? asOf);
    checks.push({
      id: "waiting",
      label: "Coverage started",
      status: since >= r.byodWaitDays ? "pass" : "fail",
      detail: `Own device enrolled ${customer.enrolled}; coverage starts after ${r.byodWaitDays} days, incident was day ${since}`,
      clause: cl.start,
    });
  }

  // 3. Reporting window.
  if (!incidentDate) {
    checks.push({ id: "window", label: "Filed in time", status: "unknown", detail: "Incident date not stated", clause: cl.window });
  } else {
    const age = days(incidentDate, asOf);
    checks.push({
      id: "window",
      label: "Filed in time",
      status: age < 0 ? "unknown" : age <= r.reportWithinDays ? "pass" : "fail",
      detail: age < 0 ? "Incident date is in the future" : `Incident ${age} days ago; limit is ${r.reportWithinDays}`,
      clause: cl.window,
    });
  }

  // 4. Claim count in the rolling 12 months.
  const peril = PERIL_OF[claimType];
  const cutoff = new Date(Date.parse(asOf) - 365 * DAY).toISOString().slice(0, 10);
  const recent = customer.priorClaims.filter((c) => c.outcome === "approved" && c.date > cutoff);
  const limitKey = r.claimsPer12Months.any !== undefined ? "any" : peril;
  const limit = limitKey ? r.claimsPer12Months[limitKey] : undefined;
  if (limit !== undefined) {
    const used = limitKey === "any" ? recent.length : recent.filter((c) => PERIL_OF[c.type] === peril).length;
    checks.push({
      id: "limit",
      label: "Claims left this year",
      status: used < limit ? "pass" : "fail",
      detail: `${used} of ${limit} ${limitKey === "any" ? "" : "loss or theft "}claims used in the last 12 months`,
      clause: cl.limits,
    });
  } else {
    checks.push({ id: "limit", label: "Claims left this year", status: "pass", detail: "No annual claim limit for this peril", clause: cl.limits });
  }

  // 5. Value cap.
  checks.push({
    id: "cap",
    label: "Within claim cap",
    status: customer.marketValue <= r.capPerClaim ? "pass" : "fail",
    detail: `Device value ${money(customer.marketValue, plan.currency)} against a ${money(r.capPerClaim, plan.currency)} cap`,
    clause: cl.limits,
  });

  const failed = checks.some((c) => c.status === "fail");
  const unclear = checks.some((c) => c.status === "unknown");
  const verdict = failed ? "ineligible" : unclear ? "unclear" : "eligible";

  let fulfillment: Eligibility["fulfillment"] = "none";
  let fee: Eligibility["fee"];
  if (verdict !== "ineligible" && claimType !== "not_a_claim") {
    if (peril === "loss_theft") fulfillment = "replace";
    else if (claimType === "liquid_damage" && r.liquidReplaceOnly) fulfillment = "replace";
    else fulfillment = "repair";

    if (r.deductibleTiers) {
      const tier = r.deductibleTiers.find((t) => customer.marketValue <= t.upTo) ?? r.deductibleTiers.at(-1)!;
      const amount = peril === "loss_theft" ? tier.lossTheft : claimType === "cracked_glass" ? tier.glass : tier.other;
      fee = { amount, label: "Deductible", currency: plan.currency };
    } else if (r.flatFees) {
      fee =
        fulfillment === "repair" && claimType === "cracked_glass"
          ? { amount: r.flatFees.repairFrom, label: "Screen repair fee from", currency: plan.currency }
          : { amount: r.flatFees.replaceRange[0], label: "Processing fee from", currency: plan.currency };
    }
  }

  return { checks, verdict, fulfillment, fee, documents: r.documents };
}

export const formatMoney = money;
