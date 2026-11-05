import { CLAUSES, type Clause, type PlanId } from "./plans";

/**
 * BM25 over the clauses of one plan. A vector store is overkill for fifteen
 * paragraphs, and keyword match keeps exact terms like "60 days" and "theft"
 * from being smoothed away. The classifier re-scores the shortlist afterwards.
 */
const tokenize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9$ ]+/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

export function shortlist(plan: PlanId, query: string, k = 4): Clause[] {
  const docs = CLAUSES.filter((c) => c.plan === plan);
  const toks = docs.map((d) => tokenize(`${d.heading} ${d.text}`));
  const avg = toks.reduce((a, t) => a + t.length, 0) / (toks.length || 1);
  const q = [...new Set(tokenize(query))];
  const df = (term: string) => toks.filter((t) => t.includes(term)).length;
  const scored = docs.map((d, i) => {
    let s = 0;
    for (const term of q) {
      const tf = toks[i].filter((t) => t === term).length;
      if (!tf) continue;
      const idf = Math.log(1 + (docs.length - df(term) + 0.5) / (df(term) + 0.5));
      s += idf * ((tf * 2.2) / (tf + 1.2 * (0.25 + 0.75 * (toks[i].length / avg))));
    }
    return { d, s };
  });
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.d);
}
