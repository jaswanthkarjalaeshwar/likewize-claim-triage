import { after } from "next/server";
import { capabilities } from "@/agent/config";
import { runTriage } from "@/agent/graph";
import { ClaimInput, type TriageEvent } from "@/agent/types";
import { flushTraces } from "@/instrumentation";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 120;

/** Streams one JSON event per line: node updates as the graph runs, then the result. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(ip)) return Response.json({ error: "A few too many claims in a minute. Try again shortly." }, { status: 429 });

  const parsed = ClaimInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid claim" }, { status: 400 });
  if (!capabilities().live) return Response.json({ error: "Live runs are off: no model key configured." }, { status: 503 });

  after(() => flushTraces());

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: TriageEvent) => controller.enqueue(enc.encode(`${JSON.stringify(e)}\n`));
      try {
        const result = await runTriage(parsed.data, send);
        send({ type: "result", result });
      } catch (err) {
        console.error("[triage]", err);
        send({ type: "error", message: "The run failed partway. The recorded runs in the inbox still work." });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}

export function GET() {
  return Response.json(capabilities());
}
