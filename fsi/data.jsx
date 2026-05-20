/* MongoLingo — Financial Services industry content pack.
 * Every level has proprietary exercise content specific to FSI workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'fsi',
  name: 'Financial Services',
  shortName: 'FSI',
  description: 'MongoDB helps financial institutions unify customer 360, transaction streams, fraud signals, audit evidence, and real-time AI experiences.',
  promise: 'MongoDB helps financial institutions unify customer 360, transaction streams, fraud signals, audit evidence, and real-time AI experiences.',
  searchPhrase: 'suspicious wire transfer',
  nouns: { profile: 'customer', profilePlural: 'customers', profileCollection: 'customers', item: 'account product', itemPlural: 'account products', itemCollection: 'products', catalog: 'product catalog', user: 'relationship manager', transaction: 'transaction', transactionPlural: 'transactions', documentPlural: 'policy and disclosure documents' },
  aha: [
    { title: 'AHA: Customer 360 needs flexible connected data', message: 'A single customer document can hold KYC, preferences, risk signals, and relationship history — no joins required at read time.' },
    { title: 'AHA: Fraud signals change faster than schemas', message: 'New fraud patterns emerge weekly. MongoDB documents absorb new signal fields without downtime or migrations.' },
    { title: 'AHA: Aggregation supports real-time risk scoring', message: 'Pipeline stages can compute risk scores, flag anomalies, and feed compliance dashboards from live transaction data.' },
    { title: 'AHA: Search and vectors unlock analyst copilots', message: 'Atlas Search and Vector Search let compliance teams find suspicious patterns using natural language over operational data.' }
  ],
  levels: {
    /* ===== WORLD 1: Documents & Collections ===== */
    d1: {
      title: 'Build a customer 360 document', kind: 'shape',
      prompt: 'Drag the right values into the customer profile for Marcus Chen.',
      sub: 'Financial customer documents combine KYC data, risk tier, and account status in one place.',
      why: 'A customer 360 document in banking keeps identity, risk, preferences, and relationship data together — eliminating expensive joins across siloed systems during every interaction.',
      skeleton: [
        { key: '_id',        type: 'oid',  value: 'ObjectId("65a...")' },
        { key: 'name',       type: 'slot', slot: 'name' },
        { key: 'riskTier',   type: 'slot', slot: 'risk' },
        { key: 'kycStatus',  type: 'slot', slot: 'kyc' },
        { key: 'totalAssets', type: 'slot', slot: 'assets' }
      ],
      bank: [
        { id: 'name',   label: '"Marcus Chen"',  kind: 'value' },
        { id: 'risk',   label: '"low"',          kind: 'value' },
        { id: 'kyc',    label: '"verified"',     kind: 'value' },
        { id: 'assets', label: '2450000',        kind: 'value' },
        { id: 'd1',     label: 'Marcus Chen',    kind: 'value' },
        { id: 'd2',     label: '"2450000"',      kind: 'value' },
        { id: 'd3',     label: 'verified',       kind: 'value' }
      ],
      answer: { name: 'name', risk: 'risk', kyc: 'kyc', assets: 'assets' }
    },
    d2: {
      title: 'insertOne() — new transaction', kind: 'blocks',
      prompt: 'Record a wire transfer into the transactions ledger. Drag the missing pieces.',
      sub: 'insertOne() captures each financial event as an immutable document with full context.',
      why: 'In banking, every transaction is an immutable event. MongoDB `insertOne()` writes it with full context (amount, parties, timestamps) so downstream fraud and compliance systems see a complete picture.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  type: "wire",',
        '\n  amount: ', { slot: 'val' }, ',',
        '\n  currency: "USD",',
        '\n  status: ', { slot: 'status' },
        '\n})'
      ],
      bank: [
        { id: 'op',     label: 'insertOne',     kind: 'op',    answer: 'op' },
        { id: 'col',    label: 'transactions',  kind: 'field', answer: 'col' },
        { id: 'val',    label: '50000',          kind: 'value', answer: 'val' },
        { id: 'status', label: '"pending"',      kind: 'value', answer: 'status' },
        { id: 'x1',     label: 'addOne',         kind: 'op' },
        { id: 'x2',     label: 'ledger',         kind: 'field' },
        { id: 'x3',     label: '"50000"',        kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — flag suspicious activity', kind: 'fill',
      prompt: 'Flag transaction #TXN-9042 for compliance review.',
      sub: 'Use $set to add a fraud flag without replacing the entire transaction document.',
      why: 'In fraud detection, you patch a flag onto the existing transaction rather than replacing it — preserving the original event data for audit trails while routing the doc to compliance workflows.',
      snippet: [
        'db.transactions.updateOne(',
        '\n  { txnId: "TXN-9042" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['flagged', 'status', 'alert', 'risk'], answer: 'flagged' },
        val:   { options: ['true', '"true"', '1', '"flagged"'], answer: 'true' }
      }
    },
    d4: {
      title: 'deleteOne() — purge expired hold', kind: 'fill',
      prompt: 'Remove the oldest expired payment hold from the holds collection.',
      sub: 'deleteOne() removes one document matching the filter — use with precision in financial data.',
      why: 'Financial holds expire and must be cleaned up precisely. Always filter tightly and sort to pick the right doc — a loose filter on deleteMany() in a ledger is catastrophic.',
      snippet: [
        'db.holds.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { expiresAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"expired"', 'expired', '"released"'], answer: '"expired"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },

    /* ===== WORLD 2: Querying ===== */
    q1: {
      title: 'Find high-value customers', kind: 'blocks',
      prompt: 'Find every customer whose segment is "private_banking".',
      sub: 'Equality queries return all docs matching a field value — no $eq needed.',
      why: 'In FSI, segmenting customers by tier (retail, premier, private banking) drives personalization. MongoDB equality queries on indexed fields return results in microseconds even across millions of profiles.',
      snippet: [
        'db.customers.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: 'segment',            kind: 'field', answer: 'field' },
        { id: 'val',   label: '"private_banking"',  kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'tier',               kind: 'field' },
        { id: 'x2',    label: 'private_banking',    kind: 'value' },
        { id: 'x3',    label: 'accountType',        kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — large transactions', kind: 'blocks',
      prompt: 'Find transactions over $10,000 for compliance reporting.',
      sub: '$match with $gt filters high-value transactions that require regulatory review.',
      why: 'Regulatory thresholds (like $10K CTR reporting) require filtering transactions by amount. Placing $match first lets MongoDB use an index on `amount` for fast compliance scans.',
      snippet: [
        'db.transactions.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { amount: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '10000',  kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"10000"', kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-status query', kind: 'fill',
      prompt: 'Find accounts in "frozen" or "under_review" status.',
      sub: '$in matches any value from an array — perfect for multi-status compliance filters.',
      why: 'Compliance teams need to query accounts in multiple risk states simultaneously. `$in` is more efficient than chaining `$or` conditions and still uses indexes.',
      snippet: [
        'db.accounts.find({',
        '\n  status: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["frozen", "under_review"]', '"frozen, under_review"', '{ frozen, under_review }', '[frozen, under_review]'], answer: '["frozen", "under_review"]' }
      }
    },
    q4: {
      title: 'Compound filter — risk + balance', kind: 'fill',
      prompt: 'Find high-risk accounts with balances over $100K.',
      sub: 'Combine equality and range operators to target risky high-balance accounts.',
      why: 'Multi-field filters (risk tier + balance range) let compliance teams zero in on accounts that need attention. MongoDB ANDs fields implicitly — no verbose $and wrapper needed.',
      snippet: [
        'db.accounts.find({',
        '\n  riskTier: "high",',
        '\n  balance: { ', { blank: 'op' }, ': 100000 }',
        '\n})'
      ],
      choices: {
        op: { options: ['$gt', '$gte', '$eq', '>='], answer: '$gt' }
      }
    },

    /* ===== WORLD 3: Aggregation Pipeline ===== */
    a1: {
      title: 'Transaction volume by account', kind: 'reorder',
      prompt: 'Compute total transaction volume per account in Q4 2024 — re-order the stages.',
      sub: 'Filter to Q4, group by account, sort by volume, then limit to top spenders.',
      why: 'In FSI reporting, filtering by date range first (Q4 2024) shrinks the working set before the expensive $group. This maps directly to how compliance and risk teams build their quarterly reports.',
      stages: [
        { id: 'm', code: '$match: { date: { $gte: ISODate("2024-10-01") } }', sub: 'filter to Q4 2024', correct: 0 },
        { id: 'g', code: '$group: { _id: "$accountId", volume: { $sum: "$amount" } }', sub: 'sum per account', correct: 1 },
        { id: 's', code: '$sort: { volume: -1 }', sub: 'highest volume first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 accounts', correct: 3 }
      ],
      initial: ['l', 's', 'm', 'g']
    },
    a2: {
      title: '$project — compliance report shape', kind: 'fill',
      prompt: 'Return just the account number and transaction total for the regulator.',
      sub: '$project picks fields for the output — hide _id, show only what the report needs.',
      why: 'Regulatory reports need exact field shapes. `$project` with `_id: 0` removes the internal identifier and delivers only the fields the regulator expects — accountNo and total.',
      snippet: [
        'db.transactions.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    accountNo: ', { blank: 'one' }, ',',
        '\n    total: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$total"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup — enrich transactions with customer', kind: 'reorder',
      prompt: 'Attach each transaction\'s customer profile, then extract just the risk tier.',
      sub: '$lookup joins customer data, $unwind flattens it, $project picks the fields.',
      why: 'Fraud analysts need customer context alongside transaction data. `$lookup` brings the customer profile in, `$unwind` flattens the array, and `$project` delivers only the fields needed for the risk dashboard.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "cust" }', sub: 'join customer profile', correct: 0 },
        { id: 'un', code: '$unwind: "$cust"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, txnId: 1, amount: 1, riskTier: "$cust.riskTier" }', sub: 'keep txn + risk tier', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — recent alerts', kind: 'blocks',
      prompt: 'Show the 5 most recent fraud alerts.',
      sub: 'Sort by alertTime descending, then limit to 5 for the analyst dashboard.',
      why: 'Fraud analysts need the freshest alerts first. When `$sort` is followed by `$limit`, MongoDB only materializes the top-N results — critical when scanning millions of alerts.',
      snippet: [
        'db.alerts.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { alertTime: ', { slot: 'dir' }, ' } },',
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
      title: 'Index strategies for banking queries', kind: 'index',
      prompt: 'The `transactions` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each query shape to single-field, compound, Atlas Search, or no index.',
      why: 'Banking queries range from simple account lookups to full-text compliance searches. Each pattern needs the right index type — compound for filter+sort, Search for narrative text, and never index low-cardinality flags alone.',
      collection: 'transactions',
      fields: [
        { name: 'accountId', type: 'ObjectId', need: 'single', used: 'db.transactions.find({ accountId })' },
        { name: 'accountId + date', type: 'ObjectId + Date', need: 'compound', used: 'db.transactions.find({ accountId }).sort({ date: -1 })' },
        { name: 'narrative', type: 'String', need: 'search', used: 'Atlas Search over transaction descriptions for compliance' },
        { name: 'isReconciled', type: 'Bool', need: 'none', used: 'low cardinality flag — only two values' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for transaction queries', kind: 'reorder',
      prompt: 'Order this compound index for: find paid transactions over $5K, sorted by date.',
      sub: 'For: db.transactions.find({ status: "settled", amount: { $gt: 5000 } }).sort({ date: -1 })',
      why: 'ESR in banking: index the equality field (status) first for the tightest filter, then the sort key (date) so results come pre-ordered, then the range field (amount) which scans a sub-range.',
      stages: [
        { id: 'e', code: 'status: 1',  sub: 'Equality — { status: "settled" }', correct: 0 },
        { id: 's', code: 'date: -1',   sub: 'Sort — .sort({ date: -1 })', correct: 1 },
        { id: 'r', code: 'amount: 1',  sub: 'Range — { $gt: 5000 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire session tokens', kind: 'fill',
      prompt: 'Auto-expire banking session tokens 30 minutes after last activity.',
      sub: 'TTL indexes delete documents automatically after a time window — critical for session security.',
      why: 'Banking sessions must expire quickly for security. TTL indexes handle this automatically — no cron jobs. The background thread checks once per minute, so expect up to 60s drift.',
      snippet: [
        'db.sessions.', { blank: 'op' }, '(',
        '\n  { lastActivity: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['1800', '30', '3600', '86400'], answer: '1800' }
      }
    },
    i4: {
      title: 'Covered query — account lookup', kind: 'fill',
      prompt: 'Query only the fields in the index { accountId: 1, balance: 1 } for a covered query.',
      sub: 'When all projected fields live in the index, MongoDB skips the document fetch entirely.',
      why: 'In high-frequency balance checks, a covered query returns from the index alone — zero document fetches, sub-millisecond response. Critical for real-time payment authorization.',
      snippet: [
        'db.accounts.find(',
        '\n  { accountId: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', accountId: 1, balance: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"ACC-001"', 'ACC-001', '*', '{}'], answer: '"ACC-001"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Superpowers ===== */
    v1: {
      title: '$vectorSearch — similar transactions', kind: 'fill',
      prompt: 'Find the 5 transactions most similar to a suspicious pattern embedding.',
      sub: 'Atlas Vector Search runs k-NN to find transactions with similar behavioral fingerprints.',
      why: 'Fraud detection uses embeddings to capture transaction "shape" (amount patterns, timing, geography). Vector search finds behaviorally similar transactions even when exact field matches miss the pattern.',
      snippet: [
        'db.transactions.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "txn_embed_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: suspiciousPattern,',
        '\n    numCandidates: 200,',
        '\n    ', { blank: 'limit' }, ': 5',
        '\n  }',
        '\n}])'
      ],
      choices: {
        path:  { options: ['"embedding"', '"vector"', 'embedding', '"features"'], answer: '"embedding"' },
        limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' }
      }
    },
    v2: {
      title: '$search — compliance text search', kind: 'blocks',
      prompt: 'Use Atlas Search to find transaction narratives mentioning "suspicious wire transfer".',
      sub: 'Atlas Search runs inside aggregate() with a dedicated search index — not legacy $text.',
      why: 'Compliance analysts search millions of transaction narratives for keywords. Atlas Search provides relevance scoring, fuzzy matching, and highlighting — far beyond what legacy $text offers.',
      snippet: [
        'db.transactions.aggregate([',
        '\n  { ', { slot: 'stage' }, ': {',
        '\n    ', { slot: 'operator' }, ': {',
        '\n      path: ', { slot: 'path' }, ',',
        '\n      query: ', { slot: 'query' },
        '\n    }',
        '\n  } }',
        '\n])'
      ],
      bank: [
        { id: 'stage',    label: '$search',                    kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text',                       kind: 'op',    answer: 'operator' },
        { id: 'path',     label: '"narrative"',                kind: 'field', answer: 'path' },
        { id: 'query',    label: '"suspicious wire transfer"', kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                      kind: 'op' },
        { id: 'x2',       label: 'find',                       kind: 'op' },
        { id: 'x3',       label: 'suspicious wire transfer',   kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — fraud alert', kind: 'fill',
      prompt: 'Fire a fraud alert function whenever a high-value transaction is inserted.',
      sub: 'Database triggers react to change events in real time — perfect for fraud monitoring.',
      why: 'Real-time fraud detection requires immediate reaction to new transactions. Atlas Triggers fire on insert events and run fraud-scoring logic server-side within seconds.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "banking",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"transactions"', 'transactions', 'Transactions', '*'], answer: '"transactions"' },
        evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' },
        fn:  { options: ['"scoreFraudRisk"', 'scoreFraudRisk', 'fn()', 'alert()'], answer: '"scoreFraudRisk"' }
      }
    },
    v4: {
      title: 'RAG — compliance copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline: scope to the bank\'s regulations, retrieve semantically, trim for the LLM.',
      sub: 'Vector search with tenant pre-filter → drop weak matches → project only what the compliance LLM needs.',
      why: 'Compliance copilots must only search within the institution\'s regulatory corpus. Pre-filtering by institution ensures the LLM never sees another bank\'s data, and trimming the payload controls token cost.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "reg_embed", path: "embedding", queryVector: q, limit: 8, filter: { bankId } }', sub: 'k-NN scoped to this bank', correct: 0 },
        { id: 'ms', code: '$match: { score: { $gt: 0.80 } }', sub: 'drop low-confidence matches', correct: 1 },
        { id: 'pj', code: '$project: { _id: 0, regulation: 1, section: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 }
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
