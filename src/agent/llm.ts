import "server-only";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import type { z } from "zod";
import { config } from "./config";

export type Usage = { input: number; output: number; cost: number };
export const emptyUsage = (): Usage => ({ input: 0, output: 0, cost: 0 });

let router: ReturnType<typeof createOpenRouter> | undefined;
const openrouter = () => {
  if (!config.openrouterKey) throw new Error("OPENROUTER_API_KEY is not set");
  return (router ??= createOpenRouter({ apiKey: config.openrouterKey }));
};

/** First id is primary; OpenRouter tries the rest in order if it is down or rate limited. */
const model = (ids: string[]) => {
  const [primary, ...fallbacks] = ids;
  // Every call here is short and well specified; long thinking only adds latency.
  return openrouter().chat(primary, {
    models: fallbacks,
    usage: { include: true },
    reasoning: { enabled: false, effort: "none", exclude: true },
    extraBody: { provider: { sort: "latency" } },
  });
};

/**
 * JSON out of any model, including ones whose providers do not support
 * structured output. Parse the first object in the reply, validate with zod,
 * retry once with the validation error. Cheaper models need the second chance.
 */
export async function jsonCall<T>(opts: {
  tier: "fast" | "reasoning";
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  functionId: string;
  metadata?: Record<string, string>;
}): Promise<{ value: T; usage: Usage; model: string }> {
  const ids = opts.tier === "fast" ? config.fastModels : config.reasoningModels;
  const usage = emptyUsage();
  let prompt = opts.prompt;
  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await generateText({
      model: model(ids),
      system: `${opts.system}\n\nReply with one JSON object only. No prose, no code fences.`,
      prompt,
      temperature: 0,
      maxOutputTokens: 3000,
      telemetry: { functionId: opts.functionId },
    });
    usage.input += res.usage.inputTokens ?? 0;
    usage.output += res.usage.outputTokens ?? 0;
    usage.cost += (res.providerMetadata as { openrouter?: { usage?: { cost?: number } } })?.openrouter?.usage?.cost ?? 0;
    const served = res.response?.modelId ?? ids[0];
    const raw = res.text.match(/\{[\s\S]*\}/)?.[0];
    try {
      const parsed = opts.schema.safeParse(JSON.parse(raw ?? ""));
      if (parsed.success) return { value: parsed.data, usage, model: served };
      lastError = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch {
      lastError = "Reply was not valid JSON";
    }
    prompt = `${opts.prompt}\n\nYour previous reply was rejected (${lastError}). Return only the corrected JSON object.`;
  }
  throw new Error(`${opts.functionId}: ${lastError}`);
}
