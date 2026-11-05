import data from "@/data/runs.json";
import type { TriageEvent, TriageResult } from "@/agent/types";

export type RecordedRun = { id: string; expect: string; events: (TriageEvent & { at: number })[]; result?: TriageResult; error?: string };

export const recorded = data as unknown as { asOf: string; recordedAt: string; runs: Record<string, RecordedRun> };
