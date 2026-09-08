import fs from 'node:fs';
import path from 'node:path';
import { init } from '@console-agent/agent';
import '@console-agent/agent';

const ROOT = process.cwd();
const INDUSTRY_FILES = [
  'fsi/data.jsx',
  'retail/data.jsx',
  'healthcare/data.jsx',
  'insurance/data.jsx',
  'cyber/data.jsx',
  'telecom/data.jsx',
  'media/data.jsx',
  'gaming/data.jsx',
  'manufacture/data.jsx',
  'postgres/data.jsx'
];

const AGENT_MODEL = process.env.CONSOLE_AGENT_MODEL || 'gemini-3.1-flash-lite';
const REVIEW_RESPONSE_FORMAT = {
  type: 'json_object',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['file', 'overall', 'findings'],
    properties: {
      file: { type: 'string' },
      overall: { type: 'string', enum: ['pass', 'review', 'fail'] },
      findings: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['severity', 'levelId', 'issue', 'suggestedFix'],
          properties: {
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            levelId: { type: 'string' },
            issue: { type: 'string' },
            suggestedFix: { type: 'string' }
          }
        }
      }
    }
  }
};

function loadDotEnv(filePath = path.join(ROOT, '.env')) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function extractLevelSummaries(source) {
  const levelsStart = source.search(/\blevels\s*:\s*\{/);
  if (levelsStart === -1) return [];
  const levelsOpen = source.indexOf('{', levelsStart);
  const levelsBody = source.slice(levelsOpen + 1, findMatchingDelimiter(source, levelsOpen, '{', '}'));
  const matches = [];
  const levelPattern = /(?:^|\n)\s*([a-z]\w*)\s*:\s*\{/g;
  let match;
  while ((match = levelPattern.exec(levelsBody))) {
    const open = levelsBody.indexOf('{', match.index);
    const close = findMatchingDelimiter(levelsBody, open, '{', '}');
    matches.push([match[1], levelsBody.slice(open + 1, close)]);
    levelPattern.lastIndex = close + 1;
  }

  return matches.map(([id, body]) => {
    const get = (field) => body.match(new RegExp(`${field}:\\s*'([^']*)'`))?.[1] || '';
    const snippet = extractDelimitedProperty(body, 'snippet', '[', ']');
    const bank = extractDelimitedProperty(body, 'bank', '[', ']');
    const choices = extractDelimitedProperty(body, 'choices', '{', '}');
    const stages = extractDelimitedProperty(body, 'stages', '[', ']');
    const fields = extractDelimitedProperty(body, 'fields', '[', ']');
    const skeleton = extractDelimitedProperty(body, 'skeleton', '[', ']');
    const correctCommand = renderCorrectCommand({ body, snippet, bank, choices, stages, fields, skeleton });
    const level = {
      id,
      title: get('title'),
      prompt: get('prompt'),
      kind: get('kind'),
      collection: get('collection')
    };
    const previewContract = inferPreviewContract(correctCommand, level);
    const actualPreview = inferActualUiPreview(correctCommand, level);
    return {
      id,
      title: get('title'),
      kind: get('kind'),
      prompt: get('prompt'),
      sub: get('sub'),
      why: get('why'),
      snippet: snippet.replace(/\s+/g, ' ').slice(0, 900),
      bank: bank.replace(/\s+/g, ' ').slice(0, 900),
      correctCommand,
      previewContract,
      actualPreview
    };
  });
}

function extractDelimitedProperty(source, property, openChar, closeChar) {
  const propertyMatch = new RegExp(`\\b${property}\\s*:\\s*\\${openChar}`).exec(source);
  if (!propertyMatch) return '';
  const open = propertyMatch.index + propertyMatch[0].lastIndexOf(openChar);
  const close = findMatchingDelimiter(source, open, openChar, closeChar);
  return source.slice(open + 1, close);
}

function findMatchingDelimiter(source, openIndex, openChar, closeChar) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (!escaped && char === quote) quote = null;
      escaped = !escaped && char === '\\';
      if (char !== '\\') escaped = false;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error(`Unclosed ${openChar} while parsing industry data`);
}

function unquote(value = '') {
  return String(value).trim().replace(/^['"]|['"]$/g, '');
}

function extractLabelMap(bank) {
  const map = {};
  for (const entry of bank.matchAll(/\{([\s\S]*?)\}/g)) {
    const object = entry[1];
    const label = object.match(/label:\s*'([^']*)'/)?.[1];
    const answer = object.match(/answer:\s*'([^']*)'/)?.[1];
    if (answer && label) map[answer] = label;
  }
  return map;
}

function extractChoiceAnswerMap(choices) {
  const map = {};
  for (const entry of choices.matchAll(/(\w+):\s*\{[\s\S]*?answer:\s*'([^']*)'[\s\S]*?\}/g)) {
    map[entry[1]] = entry[2];
  }
  return map;
}

function renderSnippet(snippet, replacements, tokenType) {
  if (!snippet) return '';
  const renderedPieces = [];
  const pieceRegex = /'((?:\\'|[^'])*)'|\{\s*(slot|blank):\s*'([^']+)'\s*\}/g;
  for (const match of snippet.matchAll(pieceRegex)) {
    if (match[1] !== undefined) {
      renderedPieces.push(match[1].replace(/\\'/g, "'"));
    } else if (match[2] === tokenType) {
      renderedPieces.push(replacements[match[3]] ?? `____${match[3]}____`);
    }
  }
  return renderedPieces.join('');
}

function renderCorrectCommand({ body, snippet, bank, choices, stages, fields, skeleton }) {
  const kind = body.match(/kind:\s*'([^']*)'/)?.[1] || '';
  if (kind === 'blocks') return renderSnippet(snippet, extractLabelMap(bank), 'slot');
  if (kind === 'fill') return renderSnippet(snippet, extractChoiceAnswerMap(choices), 'blank');
  if (kind === 'reorder') {
    const ordered = [...stages.matchAll(/\{[\s\S]*?code:\s*'([^']*)'[\s\S]*?correct:\s*(\d+)[\s\S]*?\}/g)]
      .map(([, code, correct]) => ({ code, correct: Number(correct) }))
      .sort((a, b) => a.correct - b.correct)
      .map(stage => stage.code);
    return ordered.join('\n');
  }
  if (kind === 'index') {
    const collection = body.match(/collection:\s*'([^']*)'/)?.[1] || inferCollectionFromText(body);
    const fieldNeeds = [...fields.matchAll(/\{[\s\S]*?name:\s*'([^']*)'[\s\S]*?need:\s*'([^']*)'[\s\S]*?used:\s*'([^']*)'[\s\S]*?\}/g)]
      .map(([, name, need, used]) => `${name} => ${need} (${used})`);
    return `Index matching for db.${collection}:\n${fieldNeeds.join('\n')}`;
  }
  if (kind === 'shape') {
    const labels = extractLabelMap(bank);
    const fieldsOut = [...skeleton.matchAll(/\{[\s\S]*?key:\s*'([^']*)'[\s\S]*?(?:slot:\s*'([^']*)'|value:\s*'([^']*)')[\s\S]*?\}/g)]
      .map(([, key, slot, value]) => `${key}: ${slot ? (labels[slot] ?? `____${slot}____`) : value}`);
    return `{ ${fieldsOut.join(', ')} }`;
  }
  return '';
}

function inferCollectionFromText(text = '', level = {}) {
  if (level.collection) return level.collection;
  const source = String(text);
  const direct = source.match(/db\.(\w+)/);
  if (direct) return direct[1];
  const configured = source.match(/collection:\s*["'](\w+)["']/);
  if (configured) return configured[1];
  const lookup = source.match(/from:\s*["'](\w+)["']/);
  if (lookup) return lookup[1];
  const levelText = `${level.title || ''} ${level.prompt || ''}`;
  if (/claim/i.test(levelText)) return 'claims';
  if (/policy/i.test(levelText)) return 'policies';
  if (/customer|shopper|patient|member|subscriber|player|user/i.test(levelText)) return 'customers';
  if (/product|catalog|sku|item|inventory|cart/i.test(levelText)) return 'products';
  if (/order|transaction|payment|billing|revenue/i.test(levelText)) return 'transactions';
  if (/session/i.test(levelText)) return 'sessions';
  if (/event|alert|log|experiment|sensor|network/i.test(levelText)) return 'events';
  return 'sandbox';
}

function inferPreviewContract(command, level) {
  const text = `${command || ''}\n${level.title || ''}\n${level.prompt || ''}`;
  const collection = inferCollectionFromText(text, level);
  const limit = text.match(/\$limit\s*:\s*(\d+)|limit:\s*(\d+)/)?.slice(1).find(Boolean) || null;
  const sort = text.match(/\$sort\s*:\s*\{\s*([\w.]+)\s*:\s*(-?1)\s*\}|sort:\s*\{\s*([\w.]+)\s*:\s*(-?1)\s*\}/);
  const filterHints = [...text.matchAll(/([\w.]+)\s*:\s*("[^"]+"|true|false|\{\s*\$(?:gt|gte|lt|lte)\s*:\s*\d+(?:\.\d+)?\s*\})/g)]
    .filter(([, field]) => !['$sort', '$limit', '$match', '$project'].includes(field))
    .slice(0, 8)
    .map(([, field, value]) => `${field}: ${value}`);
  const operation = /Trigger config/.test(text) ? 'createTrigger'
    : /insertOne/.test(text) ? 'insert'
    : /updateOne/.test(text) ? 'update'
    : /deleteOne/.test(text) ? 'delete'
    : /createIndex/.test(text) ? 'index'
    : /\$search|\$vectorSearch|aggregate|find\(/.test(text) ? 'read'
    : level.kind || 'unknown';
  return {
    operation,
    collection,
    expectedResultCount: limit ? Number(limit) : (/find|aggregate|\$search|\$vectorSearch/.test(text) ? 3 : 1),
    sortedBy: sort ? `${sort[1] || sort[3]} ${sort[2] || sort[4]}` : null,
    filterHints,
    resultMustMatchCommand: true
  };
}

function inferActualUiPreview(command, level) {
  const text = `${command || ''}\n${level.title || ''}\n${level.prompt || ''}`.toLowerCase();
  const collection = inferCollectionFromText(command || text, level);

  if (/\$lookup/.test(command || '')) {
    return {
      renderer: 'ReorderPreview → sampleJoinedDocsForLevel',
      note: 'joined and projected into the requested shape',
      docs: sampleJoinedDocsForPrompt(text)
    };
  }

  if (/\$sort|\$limit/.test(command || '')) {
    return {
      renderer: 'BlocksPreview → sampleDocsForLevel/recentTopNDocsForContext',
      note: `${Math.min(5, inferLimit(command) || 3)} ${collection} · sorted and limited`,
      docs: sampleRecentDocsForPrompt(text, collection).slice(0, Math.min(5, inferLimit(command) || 3))
    };
  }

  if (/insertOne/.test(command || '')) {
    return { renderer: 'BlocksPreview → docFromInsertedSnippet', note: 'acknowledged: true · insertedId: ObjectId(...)', docs: [extractInsertedDoc(command)] };
  }

  if (/updateOne/.test(command || '')) {
    return { renderer: 'FillPreview updateOne', note: 'matchedCount: 1 · modifiedCount: 1', docs: [extractUpdatedDoc(command)] };
  }

  if (/deleteOne/.test(command || '')) {
    return { renderer: 'FillPreview deleteOne', note: `deletedCount: 1 · removed one ${collection.replace(/s$/, '')} matching the filter`, docs: [] };
  }

  if (/\$vectorSearch/.test(command || '')) {
    return { renderer: 'Vector preview', note: 'nearest neighbors / RAG context', docs: [{ title: 'Domain-specific vector match', score: 0.94 }] };
  }

  if (/\$search/.test(command || '')) {
    return { renderer: 'Search preview', note: `2 ${collection} matched by Atlas Search`, docs: sampleSearchDocsForPrompt(text, collection) };
  }

  if (/find\(|aggregate/.test(command || '')) {
    return { renderer: 'Generic read preview', note: `3 ${collection} matched`, docs: sampleGenericDocsForPrompt(text, collection) };
  }

  return { renderer: 'No read-result preview', note: null, docs: [] };
}

function inferLimit(command = '') {
  const match = String(command).match(/\$limit\s*:\s*(\d+)|limit\s*:\s*(\d+)/);
  return match ? Number(match[1] || match[2]) : null;
}

function extractInsertedDoc(command = '') {
  const body = String(command).match(/insertOne\s*\(\s*\{([\s\S]*?)\}\s*\)/)?.[1] || '';
  const doc = { _id: 'ObjectId("67b…")' };
  for (const line of body.split(',')) {
    const match = line.match(/([\w.]+)\s*:\s*(.+)/);
    if (match) doc[match[1].trim()] = unquote(match[2].trim());
  }
  return doc;
}

function extractUpdatedDoc(command = '') {
  const field = String(command).match(/\$set\s*:\s*\{\s*([\w.]+)\s*:/)?.[1] || 'updatedField';
  const value = String(command).match(/\$set\s*:\s*\{\s*[\w.]+\s*:\s*([^}]+)\}/)?.[1]?.trim() || true;
  return { _id: '...', updatedAt: '2026-05-24T12:00Z', [field]: unquote(value) };
}

function sampleJoinedDocsForPrompt(text) {
  if (/transaction|txn|risk tier|fraud|customer profile/.test(text)) {
    return [
      { txnId: 'TXN-9042', amount: 12840.55, riskTier: 'high' },
      { txnId: 'TXN-9043', amount: 7300.00, riskTier: 'medium' },
      { txnId: 'TXN-9044', amount: 21990.00, riskTier: 'high' }
    ];
  }
  if (/product/.test(text)) {
    return [
      { orderId: 'ORD-7821', productName: 'Trail Pro Jacket', qty: 2 },
      { orderId: 'ORD-7822', productName: 'Air Runner X', qty: 1 }
    ];
  }
  if (/owner|employee/.test(text)) {
    return [
      { company: 'Ada Labs', ownerName: 'Grace Hopper', healthScore: 96 },
      { company: 'Turing Systems', ownerName: 'Linus Torvalds', healthScore: 91 }
    ];
  }
  return [
    { joinedId: 'join_01', summary: 'joined domain context' },
    { joinedId: 'join_02', summary: 'joined account context' }
  ];
}

function sampleRecentDocsForPrompt(text, collection) {
  if (/networkevents|drop event|call_drop/.test(text)) return [{ cellId: 'CELL-4491', type: 'call_drop', impactScore: 98, eventTime: '2026-05-26T09:42:18Z' }];
  if (/fraud|alerts/.test(text)) return [{ accountId: 'ACC-4421', riskScore: 97, alertTime: '2026-05-26T09:42:33Z' }];
  if (/lab/.test(text)) return [{ patientId: 'PAT-4182', test: 'potassium', severity: 'critical', resultTime: '2026-05-26T08:58:00Z' }];
  if (/claim/.test(text)) return [{ claimId: 'CLM-4525', status: 'open', estimatedLoss: 42500, filedAt: '2026-05-26T09:25:00Z' }];
  if (/product/.test(text)) return [{ sku: 'JKT-204', name: 'Trail Pro Jacket', addedAt: '2026-05-26T09:22:00Z' }];
  return sampleGenericDocsForPrompt(text, collection);
}

function sampleSearchDocsForPrompt(text, collection) {
  if (/transaction|fraud|wire/.test(text)) return [{ txnId: 'TXN-9042', narrative: 'suspicious wire transfer pattern', score: 1.42 }];
  if (/product|retail/.test(text)) return [{ sku: 'JKT-204', name: 'Waterproof hiking jacket', score: 1.42 }];
  return [{ _id: `${collection}_search_01`, title: 'Relevant domain document', score: 1.42 }];
}

function sampleGenericDocsForPrompt(text, collection) {
  if (/transaction/.test(text)) return [{ txnId: 'TXN-9042', accountId: 'ACC-4421', amount: 12840.55 }];
  if (/account/.test(text)) return [{ accountId: 'ACC-1001', status: 'active', balance: 12840.55 }];
  if (/customer/.test(text)) return [{ customerId: 'C-7821', segment: 'private_banking', status: 'active' }];
  return [{ _id: `${collection}_01`, status: 'active' }];
}

function buildPrompt(filePath, source) {
  const summaries = extractLevelSummaries(source);
  return `You are validating MongoLingo industry exercise data for domain realism and internal consistency.

Review this ${filePath} module. Focus on whether every exercise's title, prompt, subtext, collection names, snippets, token-bank answers, index examples, and explanations make sense for that industry.

For each level, I am surfacing the rendered correct query/command, an inferred preview/result contract, and the actual UI preview sample that this app will show. Compare all four: prompt → correctCommand → previewContract → actualPreview. Flag any mismatch where the visible result is generic, cross-domain, missing projected fields, has the wrong collection semantics, wrong count, wrong sort fields, or does not match the query/command.

Flag concrete issues only. Examples of issues:
- retail exercise accidentally says subscriber/customer/telecom terminology
- result/query fields are implausible for the collection
- result does not align with the query/command of the exercise
- prompt asks for one limit/sort/filter but snippet or bank answers implement another
- industry explanation references another domain
- collection names or field names do not match the exercise concept
- data values are unrealistic or confusing for a learner

Return concise JSON-compatible findings with this shape:
{
  "file": "${filePath}",
  "overall": "pass|review|fail",
  "findings": [
    { "severity": "low|medium|high", "levelId": "a4", "issue": "...", "suggestedFix": "..." }
  ]
}

If everything looks coherent, return overall "pass" and an empty findings array.

Level summaries:
${JSON.stringify(summaries, null, 2)}

Full source for deeper inspection:
\`\`\`jsx
${source}
\`\`\``;
}

async function main() {
  loadDotEnv();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_api_key_here') {
    console.error('Missing GEMINI_API_KEY. Add it to .env, then run: npm run validate:data-agent');
    process.exit(2);
  }

  init({
    apiKey,
    model: AGENT_MODEL,
    persona: 'architect',
    mode: 'blocking',
    timeout: 45_000,
    anonymize: true,
    budget: {
      maxCallsPerDay: 50,
      maxTokensPerCall: 8000,
      costCapDaily: 1.00
    }
  });

  const report = [];
  for (const filePath of INDUSTRY_FILES) {
    const absolute = path.join(ROOT, filePath);
    const source = fs.readFileSync(absolute, 'utf8');
    console.log(`\n[agent] validating ${filePath}...`);
    const result = await console.agent(
      buildPrompt(filePath, source),
      { filePath, sourceLength: source.length },
      {
        persona: 'architect',
        timeout: 45_000,
        responseFormat: REVIEW_RESPONSE_FORMAT
      }
    );

    const findings = result.data?.findings || [];
    const overall = result.data?.overall || 'fail';
    const actionable = overall === 'pass' || findings.length > 0;

    report.push({
      file: filePath,
      success: result.success && actionable,
      overall,
      findings,
      summary: result.summary,
      confidence: result.confidence
    });

    console.log(result.summary || '(no summary)');
    if (!actionable) {
      console.error('[agent] invalid review: non-pass verdict without concrete findings');
    }
    console.log(JSON.stringify({ overall, findings }, null, 2));
  }

  const outDir = path.join(ROOT, 'tmp');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'industry-data-agent-report.json');
  fs.writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), report }, null, 2));
  console.log(`\n[agent] wrote ${path.relative(ROOT, outFile)}`);
}

main().catch((error) => {
  console.error('[agent] validation failed');
  console.error(error);
  process.exit(1);
});