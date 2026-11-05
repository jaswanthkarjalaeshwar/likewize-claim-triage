import type { ClaimType, PlanId } from "./plans";

/**
 * A stand-in for the policy admin system. Fictional people, real plan terms.
 * Claim history lives here (the system of record); Mem0 only holds what was
 * said in past conversations.
 */
export type PriorClaim = { date: string; type: ClaimType; outcome: "approved" | "denied" };

export type Customer = {
  id: string;
  name: string;
  plan: PlanId;
  enrolled: string;
  byod: boolean;
  device: string;
  marketValue: number;
  priorClaims: PriorClaim[];
};

export const CUSTOMERS: Customer[] = [
  {
    id: "C-1042",
    name: "Maria Lopez",
    plan: "farmers-mobile",
    enrolled: "2025-03-10",
    byod: false,
    device: "iPhone 16 Pro",
    marketValue: 880,
    priorClaims: [{ date: "2026-03-02", type: "theft", outcome: "approved" }],
  },
  {
    id: "C-5120",
    name: "Aisha Rahman",
    plan: "farmers-mobile",
    enrolled: "2024-08-19",
    byod: false,
    device: "Galaxy S26 Ultra",
    marketValue: 1240,
    priorClaims: [
      { date: "2026-01-14", type: "loss", outcome: "approved" },
      { date: "2026-06-30", type: "theft", outcome: "approved" },
    ],
  },
  {
    id: "C-2210",
    name: "Daniel Okafor",
    plan: "device-care",
    enrolled: "2026-10-20",
    byod: true,
    device: "Galaxy S25",
    marketValue: 690,
    priorClaims: [],
  },
  {
    id: "C-3307",
    name: "Priya Shah",
    plan: "device-care",
    enrolled: "2025-06-01",
    byod: false,
    device: "Pixel 9",
    marketValue: 520,
    priorClaims: [
      { date: "2026-01-22", type: "cracked_glass", outcome: "approved" },
      { date: "2026-07-09", type: "liquid_damage", outcome: "approved" },
    ],
  },
  {
    id: "C-6001",
    name: "Lena Fischer",
    plan: "device-care",
    enrolled: "2025-11-12",
    byod: false,
    device: "iPhone 15",
    marketValue: 610,
    priorClaims: [],
  },
  {
    id: "C-4415",
    name: "Tom Becker",
    plan: "mobile-shop",
    enrolled: "2024-11-03",
    byod: false,
    device: "Pixel 10 Pro",
    marketValue: 1100,
    priorClaims: [],
  },
];

export const getCustomer = (id: string) => CUSTOMERS.find((c) => c.id === id);
