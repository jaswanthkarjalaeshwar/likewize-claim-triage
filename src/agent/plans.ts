/**
 * Plan terms, transcribed from Likewize's public plan documents. Two layers:
 * `clauses` is the text the agent retrieves and cites; `rules` is the same
 * terms as data, so eligibility math runs in code and never in a model.
 * Where a document is silent, the rule is `undefined` and the case goes to a
 * person instead of being guessed.
 */

export type ClaimType =
  | "cracked_glass"
  | "accidental_damage"
  | "liquid_damage"
  | "mechanical_breakdown"
  | "loss"
  | "theft"
  | "cosmetic"
  | "natural_disaster"
  | "not_a_claim";

export const CLAIM_TYPES: Record<ClaimType, string> = {
  cracked_glass: "Cracked or shattered front or back glass, device otherwise works",
  accidental_damage: "Physical damage from a drop, impact or handling, other than glass only",
  liquid_damage: "Water, coffee or other liquid got into the device",
  mechanical_breakdown: "Stopped working on its own: battery, charging port, buttons, overheating, software failure",
  loss: "Device was lost or misplaced",
  theft: "Device was stolen",
  cosmetic: "Scratches, dents or scuffs that do not affect how the device works",
  natural_disaster: "Damage from flood, fire, storm, hurricane or another natural event",
  not_a_claim: "Not a damage or loss report: billing, account, how to questions",
};

export type Peril = "handling" | "breakdown" | "loss_theft";
export const PERIL_OF: Partial<Record<ClaimType, Peril>> = {
  cracked_glass: "handling",
  accidental_damage: "handling",
  liquid_damage: "handling",
  mechanical_breakdown: "breakdown",
  loss: "loss_theft",
  theft: "loss_theft",
};

export type Clause = { id: string; plan: PlanId; heading: string; text: string; source: string };

export type PlanId = "farmers-mobile" | "device-care" | "mobile-shop";

type Tier = { upTo: number; glass: number; other: number; lossTheft: number };

export type Plan = {
  id: PlanId;
  name: string;
  partner: string;
  region: string;
  currency: "USD" | "CAD";
  source: string;
  rules: {
    covered: Partial<Record<ClaimType, boolean>>;
    reportWithinDays: number;
    /** Per peril, rolling 12 months. undefined means unlimited. */
    claimsPer12Months: Partial<Record<Peril | "any", number>>;
    capPerClaim: number;
    byodWaitDays?: number;
    deductibleTiers?: Tier[];
    flatFees?: { repairFrom: number; replaceRange: [number, number] };
    liquidReplaceOnly?: boolean;
    documents: string[];
  };
};

const FARMERS = "https://protect.likewize.com/farmers/wp-content/themes/farmers/resources/2026/04/Coverage%20Overview.pdf";
const DEVICE_CARE = "https://protect.likewize.com/devicecare/";
const MOBILE_SHOP =
  "https://protect.likewize.com/themobileshop/wp-content/themes/themobileshop/resources/2025/10/Device%20Protection%20Plan%20Program%20(For%20Customers%20enrolled%20on%20or%20after%20October%2030,%202025).pdf";

export const PLANS: Record<PlanId, Plan> = {
  "farmers-mobile": {
    id: "farmers-mobile",
    name: "Farmers Mobile Device Protection",
    partner: "Farmers",
    region: "United States",
    currency: "USD",
    source: FARMERS,
    rules: {
      covered: {
        cracked_glass: true,
        accidental_damage: true,
        liquid_damage: true,
        mechanical_breakdown: true,
        loss: true,
        theft: true,
        cosmetic: undefined,
        natural_disaster: false,
      },
      reportWithinDays: 60,
      claimsPer12Months: { loss_theft: 2 },
      capPerClaim: 2500,
      deductibleTiers: [
        { upTo: 249.99, glass: 29, other: 29, lossTheft: 39 },
        { upTo: 499.99, glass: 29, other: 49, lossTheft: 59 },
        { upTo: 999.99, glass: 29, other: 99, lossTheft: 150 },
        { upTo: 1499.99, glass: 29, other: 199, lossTheft: 250 },
        { upTo: 2500, glass: 29, other: 199, lossTheft: 300 },
      ],
      documents: ["Photos of the damage, or a police report for theft", "Device IMEI or serial number"],
    },
  },
  "device-care": {
    id: "device-care",
    name: "Device Care",
    partner: "Likewize Device Care",
    region: "Canada",
    currency: "CAD",
    source: DEVICE_CARE,
    rules: {
      covered: {
        cracked_glass: true,
        accidental_damage: true,
        liquid_damage: true,
        mechanical_breakdown: true,
        loss: false,
        theft: false,
        cosmetic: false,
        natural_disaster: undefined,
      },
      reportWithinDays: 60,
      claimsPer12Months: { any: 2 },
      capPerClaim: 3000,
      byodWaitDays: 31,
      flatFees: { repairFrom: 39, replaceRange: [99, 399] },
      documents: ["Proof of purchase", "Photos of the damage"],
    },
  },
  "mobile-shop": {
    id: "mobile-shop",
    name: "Device Protection Plan",
    partner: "The Mobile Shop",
    region: "Canada",
    currency: "CAD",
    source: MOBILE_SHOP,
    rules: {
      covered: {
        cracked_glass: true,
        accidental_damage: true,
        liquid_damage: true,
        mechanical_breakdown: true,
      },
      reportWithinDays: 60,
      claimsPer12Months: { any: 2 },
      capPerClaim: 3500,
      liquidReplaceOnly: true,
      documents: ["Photos of the damage", "Device IMEI or serial number"],
    },
  },
};

export const CLAUSES: Clause[] = [
  // Farmers
  {
    id: "FM-1",
    plan: "farmers-mobile",
    heading: "What is covered",
    text: "Mobile phones are repaired, replaced or reimbursed at market value for Accidental Damage from Handling and for Mechanical or Electrical Breakdown, and are also reimbursed or replaced due to Loss and Theft. Up to 4 mobile phones per household.",
    source: FARMERS,
  },
  {
    id: "FM-2",
    plan: "farmers-mobile",
    heading: "Claim details",
    text: "Claims can be filed immediately after enrollment and must be reported within 60 days of the incident. Customers have 30 days from opening a claim to provide all necessary documentation, otherwise the claim will be closed. A non-refundable deductible is required for all claims.",
    source: FARMERS,
  },
  {
    id: "FM-3",
    plan: "farmers-mobile",
    heading: "Claim limits",
    text: "Accidental Damage from Handling and Mechanical and Electrical Breakdowns: unlimited claims with a cap of $2,500 per approved claim. Loss and Theft: 2 approved claims with a cap of $2,500 per approved claim in any rolling 12-month period.",
    source: FARMERS,
  },
  {
    id: "FM-4",
    plan: "farmers-mobile",
    heading: "Mobile phone deductibles",
    text: "Deductibles depend on the market value of the phone. Front or back glass: $29 in every tier. Other damage: $29 / $49 / $99 / $199 / $199. Loss and theft: $39 / $59 / $150 / $250 / $300, for market value tiers $0 to $249.99, $250 to $499.99, $500 to $999.99, $1,000 to $1,499.99 and $1,500 to $2,500.",
    source: FARMERS,
  },
  {
    id: "FM-5",
    plan: "farmers-mobile",
    heading: "Exclusions",
    text: "Coverage does not include damage from nature, flood, war, terrorism, fires, wind, lightning strikes or other Acts of God. Full exclusions are in the insurance policy.",
    source: FARMERS,
  },
  {
    id: "FM-6",
    plan: "farmers-mobile",
    heading: "Market value",
    text: "Market value is the amount one would receive if selling the covered device on the open market just before it was lost, stolen, or damaged, based on age, condition, and current market demand.",
    source: FARMERS,
  },
  // Device Care
  {
    id: "DC-1",
    plan: "device-care",
    heading: "What Device Care covers",
    text: "Device Care covers accidental damage from handling as well as electrical and mechanical malfunctions that occur after the manufacturer's warranty has expired. Excludes loss, theft, cosmetic damage, and pre-existing issues.",
    source: DEVICE_CARE,
  },
  {
    id: "DC-2",
    plan: "device-care",
    heading: "Claim limits",
    text: "Your claim is covered up to the estimated retail value of your device, with a maximum of $3,000. You can file up to two claims within a rolling 12 month period.",
    source: DEVICE_CARE,
  },
  {
    id: "DC-3",
    plan: "device-care",
    heading: "Filing window",
    text: "Claims must be filed within 60 days of the incident, and all required documents, service fees, and fulfillment must be completed within 60 days of filing to keep the claim active. You will need proof of purchase and photos of the damage.",
    source: DEVICE_CARE,
  },
  {
    id: "DC-4",
    plan: "device-care",
    heading: "When coverage starts",
    text: "If you are enrolling a new device, your coverage starts right away. For bring your own devices, coverage begins 31 days after enrollment.",
    source: DEVICE_CARE,
  },
  {
    id: "DC-5",
    plan: "device-care",
    heading: "Processing fees",
    text: "Processing fees start at $39 for screen repairs and range from $99 to $399 for replacement devices. Repairs are covered by a 90-day warranty.",
    source: DEVICE_CARE,
  },
  // The Mobile Shop
  {
    id: "MS-1",
    plan: "mobile-shop",
    heading: "How many claims",
    text: "Your plan provides up to a total of 2 fulfillments (repair or replacement) during a rolling 12-month period for any incident or failure covered under the terms and conditions, up to a $3,500 limit per Service Request/Claim. Repairs or replacements processed under the manufacturer's warranty do not count towards the limit.",
    source: MOBILE_SHOP,
  },
  {
    id: "MS-2",
    plan: "mobile-shop",
    heading: "Repair or replace",
    text: "Location, device make/model, type of damage, and part availability can influence the choice of replacement versus repair. Brand new models may not be available for repair right away, and certain types of damage such as liquid damage may not be eligible for repair.",
    source: MOBILE_SHOP,
  },
  {
    id: "MS-3",
    plan: "mobile-shop",
    heading: "Replacement device",
    text: "Your replacement will be new or reconditioned. Reconditioned devices look and function like new, and have a 90-day replacement warranty. If approved, your replacement will be shipped within 2 to 10 business days in Canada.",
    source: MOBILE_SHOP,
  },
  {
    id: "MS-4",
    plan: "mobile-shop",
    heading: "Mail-in repair",
    text: "Repair partners accept devices via mail with a prepaid label. The device is repaired and returned within 3 to 5 business days after it is received. All repair work is guaranteed for 90 days.",
    source: MOBILE_SHOP,
  },
];
