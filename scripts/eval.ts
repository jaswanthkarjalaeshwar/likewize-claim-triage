/**
 * Runs every sample claim through the live graph and records the full event
 * stream. The output feeds two things: the evals page (expected vs actual),
 * and instant replays in the inbox, so a visitor sees a real run without
 * spending a cent.
 *
 *   npm run eval            all cases
 *   npm run eval -- glass   one case
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { runTriage } from "../src/agent/graph";
import type { TriageEvent, TriageResult } from "../src/agent/types";
import { AS_OF, SAMPLES } from "../src/data/claims";

const OUT = "src/data/runs.json";
const only = process.argv.slice(2);

type Recorded = { id: string; expect: string; events: (TriageEvent & { at: number })[]; result?: TriageResult; error?: string };

async function one(s: (typeof SAMPLES)[number]): Promise<Recorded> {
  const t0 = Date.now();
  const events: Recorded["events"] = [];
  try {
    const result = await runTriage({ customerId: s.customerId, message: s.message, asOf: AS_OF }, (e) => events.push({ ...e, at: Date.now() - t0 }));
    const ok = result.route === s.expect;
    console.log(`${ok ? "PASS" : "FAIL"}  ${s.id.padEnd(14)} expected ${s.expect.padEnd(13)} got ${result.route.padEnd(13)} ${(result.totals.ms / 1000).toFixed(1)}s  $${result.totals.cost.toFixed(4)}`);
    if (!ok) console.log(`      ${result.routeReason}`);
    return { id: s.id, expect: s.expect, events, result };
  } catch (err) {
    console.log(`ERR   ${s.id}: ${String(err).slice(0, 200)}`);
    return { id: s.id, expect: s.expect, events, error: String(err) };
  }
}

async function main() {
  const cases = SAMPLES.filter((s) => !only.length || only.includes(s.id));
  const prior: Record<string, Recorded> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")).runs : {};
  const results: Recorded[] = [];
  for (let i = 0; i < cases.length; i += 4) results.push(...(await Promise.all(cases.slice(i, i + 4).map(one))));
  for (const r of results) prior[r.id] = r;
  const done = Object.values(prior).filter((r) => r.result);
  const passed = done.filter((r) => r.result!.route === r.expect).length;
  writeFileSync(OUT, JSON.stringify({ asOf: AS_OF, recordedAt: new Date().toISOString(), runs: prior }, null, 1));
  console.log(`\n${passed}/${done.length} routed as expected`);
}

main();
