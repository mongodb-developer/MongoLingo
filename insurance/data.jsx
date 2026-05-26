/* MongoLingo — Insurance industry content pack.
 * Every level has proprietary exercise content specific to insurance workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'insurance',
  name: 'Insurance',
  shortName: 'Insurance',
  description: 'MongoDB supports policyholder 360, claims, evidence, risk scoring, document search, and AI-assisted underwriting or claims handling.',
  promise: 'MongoDB supports policyholder 360, claims, evidence, risk scoring, document search, and AI-assisted underwriting or claims handling.',
  searchPhrase: 'water damage claim',
  nouns: { profile: 'policyholder', profilePlural: 'policyholders', profileCollection: 'policyholders', item: 'policy', itemPlural: 'policies', itemCollection: 'policies', catalog: 'policy catalog', user: 'claims adjuster', transaction: 'claim', transactionPlural: 'claims', documentPlural: 'claim documents' },
  stream: { eventCollection: 'claims', alertCollection: 'claimAlerts', eventPlural: 'claim events', criticalLabel: 'high-severity claims', scoreField: 'severityScore', threshold: 80, alertType: 'claim_triage', sourceDb: 'insurance', outcome: 'triage queues and adjuster dashboards' },
  aha: [
    { title: 'AHA: Claims combine structured and unstructured evidence', message: 'Photos, adjuster notes, repair estimates, and IoT sensor data live together in one claim document — no scattered file stores.' },
    { title: 'AHA: Policies vary by product and region', message: 'Auto, home, life, and commercial policies each have unique fields. MongoDB documents adapt without a universal table.' },
    { title: 'AHA: Aggregation summarizes risk and exposure', message: 'Pipeline stages can compute loss ratios, flag high-frequency claimants, and power underwriting dashboards from live data.' },
    { title: 'AHA: Search helps adjusters find evidence fast', message: 'Full-text search over claim narratives, policy documents, and precedent cases accelerates decision-making.' }
  ],
  levels: {
    /* ===== WORLD 1: Documents & Collections ===== */
    d1: {
      title: 'Build a policyholder document', kind: 'shape',
      prompt: 'Drag the right values into the policyholder profile for Sarah Kim.',
      sub: 'Policyholder documents combine identity, risk tier, policy count, and active status.',
      why: 'A policyholder 360 document keeps identity, coverage details, risk tier, and claims history together — giving adjusters instant context without querying five separate systems.',
      skeleton: [
        { key: '_id',         type: 'oid',  value: 'ObjectId("68d...")' },
        { key: 'name',        type: 'slot', slot: 'name' },
        { key: 'riskScore',   type: 'slot', slot: 'risk' },
        { key: 'policyCount', type: 'slot', slot: 'count' },
        { key: 'active',      type: 'slot', slot: 'active' }
      ],
      bank: [
        { id: 'name',   label: '"Sarah Kim"',  kind: 'value' },
        { id: 'risk',   label: '72',           kind: 'value' },
        { id: 'count',  label: '3',            kind: 'value' },
        { id: 'active', label: 'true',         kind: 'value' },
        { id: 'd1',     label: 'Sarah Kim',    kind: 'value' },
        { id: 'd2',     label: '"72"',         kind: 'value' },
        { id: 'd3',     label: '"true"',       kind: 'value' }
      ],
      answer: { name: 'name', risk: 'risk', count: 'count', active: 'active' }
    },
    d2: {
      title: 'insertOne() — file a new claim', kind: 'blocks',
      prompt: 'File a new auto claim into the claims collection. Drag the missing pieces.',
      sub: 'Each claim is an immutable event document with type, amount, and initial status.',
      why: 'Insurance claims must be captured immediately with full context. `insertOne()` records the claim type, estimated amount, and status in one atomic write — creating the audit trail from moment one.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  type: "auto",',
        '\n  estimatedLoss: ', { slot: 'val' }, ',',
        '\n  status: ', { slot: 'status' },
        '\n})'
      ],
      bank: [
        { id: 'op',     label: 'insertOne',  kind: 'op',    answer: 'op' },
        { id: 'col',    label: 'claims',     kind: 'field', answer: 'col' },
        { id: 'val',    label: '12500',       kind: 'value', answer: 'val' },
        { id: 'status', label: '"open"',      kind: 'value', answer: 'status' },
        { id: 'x1',     label: 'addOne',      kind: 'op' },
        { id: 'x2',     label: 'incidents',   kind: 'field' },
        { id: 'x3',     label: '"12500"',     kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — approve a claim', kind: 'fill',
      prompt: 'Approve claim #CLM-4521 and set its status to "approved".',
      sub: '$set patches the claim status without replacing the evidence and notes.',
      why: 'Claim approval must preserve all evidence (photos, notes, estimates) while changing only the status. `$set` patches one field cleanly, keeping the full audit trail intact for regulatory review.',
      snippet: [
        'db.claims.updateOne(',
        '\n  { claimId: "CLM-4521" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['status', 'state', 'approved', 'decision'], answer: 'status' },
        val:   { options: ['"approved"', 'approved', 'true', '"closed"'], answer: '"approved"' }
      }
    },
    d4: {
      title: 'deleteOne() — purge expired quote', kind: 'fill',
      prompt: 'Remove the oldest expired insurance quote from the quotes collection.',
      sub: 'deleteOne() removes exactly one document — sort to target the oldest expired quote.',
      why: 'Expired quotes clutter the system and can confuse agents. Sort by expiresAt ascending to target the oldest, ensuring you never accidentally delete a valid active quote.',
      snippet: [
        'db.quotes.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { expiresAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"expired"', 'expired', '"void"'], answer: '"expired"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },

    /* ===== WORLD 2: Querying ===== */
    q1: {
      title: 'Find claims by type', kind: 'blocks',
      prompt: 'Find every claim of type "home" for the property adjusters dashboard.',
      sub: 'Equality queries match a field value directly — fast with an index.',
      why: 'Claims adjusters work by line of business. An index on `type` lets MongoDB instantly route claims to the right team — home, auto, life, or commercial — even across millions of records.',
      snippet: [
        'db.claims.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: 'type',     kind: 'field', answer: 'field' },
        { id: 'val',   label: '"home"',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'category',  kind: 'field' },
        { id: 'x2',    label: 'home',      kind: 'value' },
        { id: 'x3',    label: 'lineOfBusiness', kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — high-value claims', kind: 'blocks',
      prompt: 'Find claims with estimated loss over $50,000 for SIU review.',
      sub: '$match with $gt surfaces claims above the Special Investigations threshold.',
      why: 'Special Investigation Units review high-value claims for fraud. Placing $match with $gt on an indexed `estimatedLoss` field lets MongoDB surface flagged claims instantly for investigation.',
      snippet: [
        'db.claims.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { estimatedLoss: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '50000',  kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"50000"', kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-status claims', kind: 'fill',
      prompt: 'Find claims in "open" or "under_investigation" status.',
      sub: '$in matches any value from an array — perfect for tracking active workload.',
      why: 'Adjusters need their active workload at a glance. `$in` queries claims in multiple active states with a single efficient index scan, avoiding verbose `$or` chains.',
      snippet: [
        'db.claims.find({',
        '\n  status: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["open", "under_investigation"]', '"open, under_investigation"', '{ open, under_investigation }', '[open, under_investigation]'], answer: '["open", "under_investigation"]' }
      }
    },
    q4: {
      title: 'Compound filter — type + amount', kind: 'fill',
      prompt: 'Find open auto claims with estimated loss over $25,000.',
      sub: 'Combine equality and range operators to target specific claim segments.',
      why: 'Prioritizing large open auto claims requires combining claim type, status, and amount range. MongoDB implicitly ANDs these conditions — simple syntax, efficient execution.',
      snippet: [
        'db.claims.find({',
        '\n  type: "auto",',
        '\n  status: "open",',
        '\n  estimatedLoss: { ', { blank: 'op' }, ': 25000 }',
        '\n})'
      ],
      choices: {
        op: { options: ['$gt', '$gte', '$eq', '>='], answer: '$gt' }
      }
    },

    /* ===== WORLD 3: Aggregation Pipeline ===== */
    a1: {
      title: 'Loss ratio by product line', kind: 'reorder',
      prompt: 'Compute total claim payouts per policy type in 2024 — re-order the stages.',
      sub: 'Filter to 2024 settled claims, group by type, sort by payout, limit to top lines.',
      why: 'Loss ratio by product line drives underwriting strategy. Filter to settled claims (shrink dataset), group by policy type to sum payouts, sort descending, and identify the most expensive lines of business.',
      stages: [
        { id: 'm', code: '$match: { settledDate: { $gte: ISODate("2024-01-01") }, status: "settled" }', sub: 'filter to 2024 settled claims', correct: 0 },
        { id: 'g', code: '$group: { _id: "$policyType", totalPayout: { $sum: "$paidAmount" } }', sub: 'sum payouts per type', correct: 1 },
        { id: 's', code: '$sort: { totalPayout: -1 }', sub: 'costliest lines first', correct: 2 },
        { id: 'l', code: '$limit: 5', sub: 'top 5 product lines', correct: 3 }
      ],
      initial: ['s', 'l', 'm', 'g']
    },
    a2: {
      title: '$project — claims summary', kind: 'fill',
      prompt: 'Return just the policyholder name and claim amount — hide _id.',
      sub: '$project shapes output for the claims dashboard.',
      why: 'Adjuster dashboards need lean payloads. `$project` with `_id: 0` strips internal IDs and delivers only the fields the adjusters need — policyholder and amount.',
      snippet: [
        'db.claims.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    policyholderName: ', { blank: 'one' }, ',',
        '\n    estimatedLoss: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$estimatedLoss"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup — enrich claims with policyholder', kind: 'reorder',
      prompt: 'Attach policyholder info to each claim, then extract the risk score.',
      sub: '$lookup joins policyholder data, $unwind flattens, $project picks relevant fields.',
      why: 'Fraud detection needs policyholder context alongside claim data. `$lookup` brings risk scores and history in, `$unwind` flattens the array, and `$project` delivers the fields adjusters need for triage.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "policyholders", localField: "holderId", foreignField: "_id", as: "holder" }', sub: 'join policyholder profile', correct: 0 },
        { id: 'un', code: '$unwind: "$holder"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, claimId: 1, estimatedLoss: 1, riskScore: "$holder.riskScore" }', sub: 'keep claim + risk score', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — recent claims', kind: 'blocks',
      prompt: 'Show the 5 most recently filed claims.',
      sub: 'Sort by filedAt descending, limit to 5 for the adjuster queue.',
      why: 'Adjusters triage claims by recency. `$sort` + `$limit` streams only the newest claims without sorting the entire claims history in memory — critical for large portfolios.',
      snippet: [
        'db.claims.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { filedAt: ', { slot: 'dir' }, ' } },',
        '\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }',
        '\n])'
      ],
      bank: [
        { id: 'sort',  label: '$sort',  kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir',   label: '-1',     kind: 'value', answer: 'dir' },
        { id: 'n',     label: '5',      kind: 'value', answer: 'n' },
        { id: 'x1',    label: '$top',   kind: 'stage' },
        { id: 'x2',    label: '$first', kind: 'stage' },
        { id: 'x3',    label: '1',      kind: 'value' },
        { id: 'x4',    label: '"5"',    kind: 'value' }
      ]
    },

    /* ===== WORLD 4: Indexes & Performance ===== */
    i1: {
      title: 'Index strategies for claims', kind: 'index',
      prompt: 'The `claims` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each claims access pattern to the right index type.',
      why: 'Insurance queries span simple type lookups, type+date combos, full-text narrative searches, and low-cardinality flags. Each pattern needs the right index to keep adjuster workflows fast.',
      collection: 'claims',
      fields: [
        { name: 'holderId', type: 'ObjectId', need: 'single', used: 'db.claims.find({ holderId })' },
        { name: 'holderId + filedAt', type: 'ObjectId + Date', need: 'compound', used: 'db.claims.find({ holderId }).sort({ filedAt: -1 })' },
        { name: 'narrative', type: 'String', need: 'search', used: 'Atlas Search over claim descriptions for precedent lookup' },
        { name: 'isArchived', type: 'Bool', need: 'none', used: 'low cardinality — only true/false values' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for claims queries', kind: 'reorder',
      prompt: 'Order this compound index for: find open claims over $10K, sorted by filed date.',
      sub: 'For: db.claims.find({ status: "open", estimatedLoss: { $gt: 10000 } }).sort({ filedAt: -1 })',
      why: 'ESR in insurance: equality (status) narrows to open claims, sort (filedAt) delivers results chronologically for the queue, range (estimatedLoss) scans only high-value claims.',
      stages: [
        { id: 'e', code: 'status: 1',        sub: 'Equality — { status: "open" }', correct: 0 },
        { id: 's', code: 'filedAt: -1',       sub: 'Sort — .sort({ filedAt: -1 })', correct: 1 },
        { id: 'r', code: 'estimatedLoss: 1',  sub: 'Range — { $gt: 10000 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire temporary quotes', kind: 'fill',
      prompt: 'Auto-expire insurance quotes 30 days after creation.',
      sub: 'TTL indexes automatically remove expired quotes — no batch cleanup needed.',
      why: 'Insurance quotes have a validity window. A TTL index on `createdAt` auto-removes quotes after 30 days (2592000 seconds), keeping the quotes collection lean and preventing stale offers from being accepted.',
      snippet: [
        'db.quotes.', { blank: 'op' }, '(',
        '\n  { createdAt: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['2592000', '30', '720', '86400'], answer: '2592000' }
      }
    },
    i4: {
      title: 'Covered query — policy lookup', kind: 'fill',
      prompt: 'Query only fields in the index { policyNo: 1, holderId: 1 } for zero-fetch access.',
      sub: 'Covered queries never touch the document — ideal for high-frequency policy validation.',
      why: 'Policy validation happens on every call and every claim. A covered query on { policyNo, holderId } confirms coverage instantly from the index alone — zero document fetches at call-center scale.',
      snippet: [
        'db.policies.find(',
        '\n  { policyNo: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', policyNo: 1, holderId: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"POL-88421"', 'POL-88421', '*', '{}'], answer: '"POL-88421"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Superpowers ===== */
    v1: {
      title: '$vectorSearch — similar claims', kind: 'fill',
      prompt: 'Find the 5 claims most similar to the current claim narrative for precedent analysis.',
      sub: 'Atlas Vector Search finds claims with similar damage descriptions using embeddings.',
      why: 'Adjusters look for precedent claims to guide decisions. Vector Search finds semantically similar claims even when different adjusters use different terminology to describe the same type of damage.',
      snippet: [
        'db.claims.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "claim_embed_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: narrativeEmbedding,',
        '\n    numCandidates: 200,',
        '\n    ', { blank: 'limit' }, ': 5',
        '\n  }',
        '\n}])'
      ],
      choices: {
        path:  { options: ['"embedding"', '"vector"', 'embedding', '"narrative"'], answer: '"embedding"' },
        limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' }
      }
    },
    v2: {
      title: '$search — claim narrative search', kind: 'blocks',
      prompt: 'Use Atlas Search to find claim narratives mentioning "water damage claim".',
      sub: 'Atlas Search powers full-text search over claim descriptions with relevance ranking.',
      why: 'Adjusters search past claims for precedent and fraud patterns. Atlas Search provides relevance scoring and fuzzy matching over claim narratives — finding related cases in seconds.',
      snippet: [
        'db.claims.aggregate([',
        '\n  { ', { slot: 'stage' }, ': {',
        '\n    ', { slot: 'operator' }, ': {',
        '\n      path: ', { slot: 'path' }, ',',
        '\n      query: ', { slot: 'query' },
        '\n    }',
        '\n  } }',
        '\n])'
      ],
      bank: [
        { id: 'stage',    label: '$search',              kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text',                 kind: 'op',    answer: 'operator' },
        { id: 'path',     label: '"narrative"',          kind: 'field', answer: 'path' },
        { id: 'query',    label: '"water damage claim"', kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                kind: 'op' },
        { id: 'x2',       label: 'find',                 kind: 'op' },
        { id: 'x3',       label: 'water damage claim',   kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — fraud scoring', kind: 'fill',
      prompt: 'Fire a fraud scoring function whenever a new claim is filed.',
      sub: 'Database triggers score every new claim automatically for fraud indicators.',
      why: 'Every new claim should be scored for fraud risk immediately. Atlas Triggers fire on insert and run scoring logic server-side — flagging suspicious patterns before an adjuster even opens the file.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "insurance",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"claims"', 'claims', 'Claims', '*'], answer: '"claims"' },
        evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' },
        fn:  { options: ['"scoreFraudRisk"', 'scoreFraudRisk', 'fn()', 'score()'], answer: '"scoreFraudRisk"' }
      }
    },
    v4: {
      title: 'RAG — underwriting copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for an underwriting copilot: scope to insurer, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to insurer → drop weak matches → project only what the LLM needs.',
      why: 'Underwriting copilots must only access the insurer\'s own guidelines and precedent. Pre-filtering by insurerId ensures data isolation, and trimming keeps the LLM focused on relevant underwriting rules.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "uw_embed", path: "embedding", queryVector: q, limit: 8, filter: { insurerId } }', sub: 'k-NN scoped to this insurer', correct: 0 },
                { id: 'pj', code: '$project: { _id: 0, guideline: 1, section: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.78 } }', sub: 'drop low-confidence matches', correct: 1 },

      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
