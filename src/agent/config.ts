import "server-only";

/**
 * Every integration is optional except OpenRouter. A missing key turns a
 * capability off instead of crashing the run, and the trace says what was skipped.
 */
const env = (k: string) => process.env[k]?.trim() || undefined;
const list = (k: string, fallback: string) =>
  (env(k) ?? fallback)
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

export const config = {
  openrouterKey: env("OPENROUTER_API_KEY"),
  typesafeKey: env("TYPESAFE_API_KEY"),
  jevModel: env("JEV_MODEL") ?? "jev-latest",
  /** Stands in for Jev until a TypeSafe key exists: small, fast, cheap. */
  fastModels: list("FAST_MODELS", "google/gemma-4-26b-a4b-it,mistralai/mistral-small-2603,google/gemma-4-31b-it"),
  /** Extraction and the decision write-up. */
  reasoningModels: list("REASONING_MODELS", "deepseek/deepseek-v4.1-flash,deepseek/deepseek-v4-pro-0813,qwen/qwen3.8-flash"),
  mem0Key: env("MEM0_API_KEY"),
  langfuseEnabled: Boolean(env("LANGFUSE_PUBLIC_KEY") && env("LANGFUSE_SECRET_KEY")),
  langfuseHost: env("LANGFUSE_BASE_URL") ?? "https://cloud.langfuse.com",
};

export const capabilities = () => ({
  live: Boolean(config.openrouterKey),
  classifier: config.typesafeKey ? "jev" : "stand-in",
  memory: Boolean(config.mem0Key),
  tracing: config.langfuseEnabled,
});
