"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NodeEvent, NodeId, TriageEvent, TriageResult } from "@/agent/types";
import type { RecordedRun } from "./recorded";

export type RunState = {
  status: "idle" | "running" | "done" | "error";
  source: "recorded" | "live" | null;
  nodes: Partial<Record<NodeId, NodeEvent>>;
  result?: TriageResult;
  error?: string;
};

const idle: RunState = { status: "idle", source: null, nodes: {} };

/**
 * One state shape, two sources: a live run streamed from /api/triage, or a
 * recorded run replayed on a compressed clock. The UI cannot tell them apart,
 * which is the point; it only labels which one it is showing.
 */
export function useTriage() {
  const [state, setState] = useState<RunState>(idle);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const abort = useRef<AbortController | null>(null);

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    abort.current?.abort();
  };
  useEffect(() => reset, []);

  const apply = (s: RunState, e: TriageEvent): RunState =>
    e.type === "node"
      ? { ...s, nodes: { ...s.nodes, [e.node.id]: e.node } }
      : e.type === "result"
        ? { ...s, status: "done", result: e.result }
        : { ...s, status: "error", error: e.message };

  const replay = useCallback((run: RecordedRun) => {
    reset();
    const last = run.events.at(-1)?.at ?? 1;
    const scale = Math.min(1, 4200 / last);
    setState({ ...idle, status: "running", source: "recorded" });
    for (const e of run.events) {
      timers.current.push(setTimeout(() => setState((s) => apply(s, e)), e.at * scale));
    }
    if (run.result) {
      const result = run.result;
      timers.current.push(setTimeout(() => setState((s) => ({ ...s, status: "done", result })), last * scale + 60));
    }
  }, []);

  const runLive = useCallback(async (customerId: string, message: string, asOf?: string) => {
    reset();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setState({ ...idle, status: "running", source: "live" });
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, message, asOf }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) setState((s) => apply(s, JSON.parse(line)));
      }
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setState((s) => ({ ...s, status: "error", error: err instanceof Error ? err.message : "Run failed" }));
    }
  }, []);

  const clear = useCallback(() => {
    reset();
    setState(idle);
  }, []);

  return { state, replay, runLive, clear };
}
