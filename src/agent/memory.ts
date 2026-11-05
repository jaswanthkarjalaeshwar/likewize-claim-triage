import "server-only";
import { MemoryClient } from "mem0ai";
import { config } from "./config";

/**
 * Conversation memory per customer: what they told us last time, what we
 * asked them for. Claim history comes from the system of record, not here.
 * Without a key every call is a no-op, so memory is never on the critical path.
 */
const AGENT_ID = "likewize-claim-desk";

let client: MemoryClient | undefined;
const mem0 = () => (config.mem0Key ? (client ??= new MemoryClient({ apiKey: config.mem0Key })) : undefined);

export async function recall(customerId: string): Promise<string[]> {
  const m = mem0();
  if (!m) return [];
  const { results } = await m.search(`Past claim conversations for customer ${customerId}`, {
    filters: { AND: [{ agent_id: AGENT_ID }] },
    topK: 20,
  });
  return results
    .filter((r) => r.metadata?.customer === customerId)
    .map((r) => r.memory)
    .filter((x): x is string => Boolean(x))
    .slice(0, 4);
}

export async function remember(customerId: string, note: string) {
  const m = mem0();
  if (!m) return;
  await m.add([{ role: "assistant", content: note }], { agentId: AGENT_ID, metadata: { customer: customerId } });
}
