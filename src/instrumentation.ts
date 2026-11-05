/**
 * Observability. The AI SDK emits OpenTelemetry spans for every model call and
 * tool call; Langfuse receives them as traces with tokens, cost and latency.
 * No Langfuse keys means no exporter, and the app still runs.
 *
 * On Vercel the function is frozen when the response ends, so batched spans
 * would be lost: export immediately there, and the route flushes after each run.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return;

  const [{ registerOTel }, { LangfuseSpanProcessor }, { registerTelemetry }, { OpenTelemetry }] = await Promise.all([
    import("@vercel/otel"),
    import("@langfuse/otel"),
    import("ai"),
    import("@ai-sdk/otel"),
  ]);

  const processor = new LangfuseSpanProcessor({ exportMode: process.env.VERCEL ? "immediate" : "batched" });
  (globalThis as { langfuseProcessor?: { forceFlush(): Promise<void> } }).langfuseProcessor = processor;
  registerOTel({ serviceName: "likewize-claim-desk", spanProcessors: [processor] });
  registerTelemetry(new OpenTelemetry());
}

/** Called from route handlers via `after()` so traces leave before the function freezes. */
export const flushTraces = () =>
  (globalThis as { langfuseProcessor?: { forceFlush(): Promise<void> } }).langfuseProcessor?.forceFlush();
