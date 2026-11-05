import type { NodeId, Route } from "@/agent/types";

export const NODES: { id: NodeId; label: string; kind: "fast" | "reason" | "code" | "memory" }[] = [
  { id: "intake", label: "Intake classifier", kind: "fast" },
  { id: "extract", label: "Fact extraction", kind: "reason" },
  { id: "memory", label: "Customer memory", kind: "memory" },
  { id: "retrieve", label: "Plan terms retrieval", kind: "fast" },
  { id: "rules", label: "Eligibility rules", kind: "code" },
  { id: "decide", label: "Claim write up", kind: "reason" },
  { id: "verify", label: "Reply verification", kind: "fast" },
  { id: "gate", label: "Review gate", kind: "code" },
  { id: "act", label: "Ticket and memory", kind: "code" },
];

export const ROUTE_SHORT: Record<Route, string> = {
  approve: "Approved",
  deny: "Not covered",
  needs_info: "Needs info",
  human_review: "To a handler",
  redirect: "Support",
};

export const routeHeadline = (route: Route, fulfillment: string) =>
  ({
    approve: fulfillment === "replace" ? "Approved for replacement" : fulfillment === "reimburse" ? "Approved for reimbursement" : "Approved for repair",
    deny: "Not covered under this plan",
    needs_info: "Waiting on the customer",
    human_review: "Sent to a claims handler",
    redirect: "Not a claim. Routed to support",
  })[route];

export const money = (n: number, c: "USD" | "CAD") => `${c === "CAD" ? "CA$" : "$"}${n.toLocaleString("en-US")}`;
