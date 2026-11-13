# Retrieval Metrics Mini Project

Implements `eval.js` to score keyword search vs semantic search on the same 10-query test set using **MRR** and **Recall@10**.

## Run

```bash
node eval.js
```

## Result table

| Query | Keyword rank | Semantic rank |
|---|---|---|
| my redis cache keeps showing old data | 8 | 1 |
| how do I add semantic search to a table I already have | miss | 2 |
| redis or memcached for caching | 1 | 2 |
| why did my query get slower after I added an index | miss | 1 |
| what does ACID actually guarantee | 2 | 1 |
| how do I keep my postgres online while changing the schema | 6 | 3 |
| my background jobs stop after every deploy | miss | 2 |
| how do I let my database accept more writes per second | 4 | 1 |
| sql or nosql for a new product | 1 | 3 |
| why does my redis memory keep climbing | miss | 2 |
| **Summary** | **MRR 0.30 · Recall@10 0.60** | **MRR 0.67 · Recall@10 1.00** |

## Interpretation

Overall, semantic search is better on both metrics: it achieves a higher MRR (0.67 vs 0.30) and perfect Recall@10 (1.00 vs 0.60), meaning it not only finds the correct result for every query but also ranks it higher on average. Keyword search wins on two exact, term-heavy comparison queries—"redis or memcached for caching" and "sql or nosql for a new product"—where the important product names appear verbatim and lexical matching can place the right post at rank 1. Semantic search wins on the more descriptive, problem-stated queries such as "why did my query get slower after I added an index", "my background jobs stop after every deploy", and "how do I add semantic search to a table I already have", where the user’s wording differs from the document’s keywords but the intent matches. Even when keyword search finds a result, semantic search often ranks the relevant post closer to the top. A team would still keep keyword search around because it can be very precise and fast for exact-term or entity lookups, and combining both systems (e.g. hybrid search) can cover cases where either approach alone falls short.


```text
| Query | Keyword rank | Semantic rank |
|---|---|---|
| my redis cache keeps showing old data | 8 | 1 |
| how do I add semantic search to a table I already have | miss | 2 |
| redis or memcached for caching | 1 | 2 |
| why did my query get slower after I added an index | miss | 1 |
| what does ACID actually guarantee | 2 | 1 |
| how do I keep my postgres online while changing the schema | 6 | 3 |
| my background jobs stop after every deploy | miss | 2 |
| how do I let my database accept more writes per second | 4 | 1 |
| sql or nosql for a new product | 1 | 3 |
| why does my redis memory keep climbing | miss | 2 |
| **Summary** | **MRR 0.30 · Recall@10 0.60** | **MRR 0.67 · Recall@10 1.00** |
```

## Write up your findings

Add a short interpretation (4 to 6 sentences) to this README or a `RESULT.md`:
- Which system is better overall, and on which metric(s)?
- Which queries did keyword search win, and what do those queries have in common?
- Which queries did semantic search win, and what do those have in common?
- One sentence on why a team would still keep the weaker system around (hint: the two systems win on different queries).

## Take it further (optional)

If you have a working Postgres with the posts loaded and embeddings generated, swap `search-results.json` for real searches:

```sql
-- Keyword search (PG full-text)
SELECT post_id
FROM posts
WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', $1)
ORDER BY ts_rank(to_tsvector('english', title || ' ' || body), plainto_tsquery('english', $1)) DESC
LIMIT 10;

-- Semantic search (pgvector)
SELECT post_id FROM posts ORDER BY embedding <=> $1 LIMIT 10;
```

Wire each into `async keywordSearch(query)` and `async semanticSearch(query)` returning ranked `post_id` lists, then run your exact same metric code. The metrics do not change, only where the ranked lists come from.
