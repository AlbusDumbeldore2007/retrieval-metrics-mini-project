// eval.js - computes MRR and Recall@10 for keyword vs semantic search.
// Run: node eval.js
const fs = require('fs');

// --- 1. Load the inputs ----------------------------------------------------
// test-set.csv has a header row, then: query,correct_post_ids
// correct_post_ids may be a semicolon list, e.g. "1024;1025".
function loadTestSet(path) {
  const lines = fs.readFileSync(path, 'utf8').trim().split('\n').slice(1);
  return lines.map(line => {
    const [query, ids] = line.split(',');
    return { query, correctIds: ids.split(';').map(Number) };
  });
}
const testSet = loadTestSet('test-set.csv');

// search-results.json maps each query to the top-10 ranked post_id lists that
// each system returned: { "<query>": { keyword: [...], semantic: [...] } }
const results = JSON.parse(fs.readFileSync('search-results.json', 'utf8'));

// --- 2. Reciprocal Rank ----------------------------------------------------
// Return 1 / (rank of the FIRST correct id in rankedIds). Return 0 if none of
// the correct ids appear in rankedIds. Rank is 1-based (first result = rank 1).
function reciprocalRank(rankedIds, correctIds) {
  const rank = rankOf(rankedIds, correctIds);
  return rank === null ? 0 : 1 / rank;
}

// Helper: the 1-based rank of the first correct id, or null if it is a miss.
function rankOf(rankedIds, correctIds) {
  const correctSet = new Set(correctIds);
  for (let i = 0; i < rankedIds.length; i++) {
    if (correctSet.has(rankedIds[i])) return i + 1;
  }
  return null;
}

// --- 3. Run the evaluation loop --------------------------------------------
let keywordRRTotal = 0;
let semanticRRTotal = 0;
let keywordHits = 0;
let semanticHits = 0;
const rows = [];

for (const { query, correctIds } of testSet) {
  const entry = results[query] || { keyword: [], semantic: [] };
  const kRank = rankOf(entry.keyword, correctIds);
  const sRank = rankOf(entry.semantic, correctIds);

  const kRR = kRank === null ? 0 : 1 / kRank;
  const sRR = sRank === null ? 0 : 1 / sRank;

  keywordRRTotal += kRR;
  semanticRRTotal += sRR;
  if (kRR > 0) keywordHits++;
  if (sRR > 0) semanticHits++;

  rows.push({
    query,
    keyword: kRank === null ? 'miss' : String(kRank),
    semantic: sRank === null ? 'miss' : String(sRank),
  });
}

const n = testSet.length;
const keywordMRR = keywordRRTotal / n;
const semanticMRR = semanticRRTotal / n;
const keywordRecall = keywordHits / n;
const semanticRecall = semanticHits / n;

function fmt(x) {
  return x.toFixed(2);
}

// --- 4. Print a markdown comparison table ----------------------------------
console.log('| Query | Keyword rank | Semantic rank |');
console.log('|---|---|---|');
for (const row of rows) {
  console.log(`| ${row.query} | ${row.keyword} | ${row.semantic} |`);
}
console.log(
  `| **Summary** | **MRR ${fmt(keywordMRR)} · Recall@10 ${fmt(keywordRecall)}** | **MRR ${fmt(semanticMRR)} · Recall@10 ${fmt(semanticRecall)}** |`
);

