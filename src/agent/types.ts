import { z } from "zod";
import type { Check } from "./rules";
import type { ClaimType, PlanId } from "./plans";

export const ClaimInput = z.object({
  customerId: z.string().regex(/^C-\d{4}$/),
  message: z.string().trim().min(8, "Describe what happened.").max(1200),
  /** Pinned "today" so recorded runs and evals stay reproducible. */
  asOf: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type ClaimInput = z.infer<typeof ClaimInput>;

export type NodeId = "intake" | "extract" | "memory" | "retrieve" | "rules" | "decide" | "verify" | "gate" | "act";

export type Dist = { label: string; p: number }[];

export type NodeEvent = {
  id: NodeId;
  status: "running" | "done" | "skipped" | "error";
  ms?: number;
  engine?: string;
  detail?: string;
  cost?: number;
  /** Probability readouts from the classifier, for the trace panel. */
  readouts?: { question: string; value: string; dist?: Dist; confidence?: number }[];
};

export type Route = "approve" | "deny" | "needs_info" | "human_review" | "redirect";

export type CitedClause = { id: string; heading: string; text: string; source: string; relevance?: number };

export type TriageResult = {
  ticket: string;
  customer: { id: string; name: string; plan: PlanId; planName: string; partner: string; device: string };
  claimType: ClaimType;
  claimTypeConfidence: number;
  incidentDate: string | null;
  summary: string;
  route: Route;
  routeReason: string;
  fulfillment: "repair" | "replace" | "reimburse" | "none";
  fee?: { amount: number; label: string; currency: "USD" | "CAD" };
  checks: Check[];
  clauses: CitedClause[];
  reply: string;
  nextSteps: string[];
  documents: string[];
  statements: { text: string; clause: string; support: number }[];
  removed: string[];
  risk: { score: number; signals: string[] };
  memory: string[];
  totals: { ms: number; cost: number; tokens: number };
  engines: { classifier: string; reasoning: string };
};

export type TriageEvent = { type: "node"; node: NodeEvent } | { type: "result"; result: TriageResult } | { type: "error"; message: string };
