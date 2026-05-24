/* MongoLingo — Telecommunications industry content pack.
 * Every level has proprietary exercise content specific to telecom workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'telecom',
  name: 'Telecommunications',
  shortName: 'Telecom',
  description: 'MongoDB helps telecom teams unify subscriber profiles, network events, device data, support interactions, and churn-prevention AI.',
  promise: 'MongoDB helps telecom teams unify subscriber profiles, network events, device data, support interactions, and churn-prevention AI.',
  searchPhrase: 'dropped call troubleshooting',
  nouns: { profile: 'subscriber', profilePlural: 'subscribers', profileCollection: 'subscribers', item: 'plan', itemPlural: 'plans', itemCollection: 'plans', catalog: 'plan catalog', user: 'support agent', transaction: 'network event', transactionPlural: 'network events', documentPlural: 'support articles' },
  aha: [
    { title: 'AHA: Subscriber 360 needs many data shapes', message: 'Usage, billing, devices, support tickets, and preferences — one subscriber document holds it all for instant personalization.' },
    { title: 'AHA: Network events arrive at massive scale', message: 'MongoDB handles high-velocity ingestion of CDRs, handover events, and quality metrics with time-series and TTL indexes.' },
    { title: 'AHA: Aggregation turns signals into service insight', message: 'Pipeline stages can detect churn risk, compute ARPU, and rank network cells by performance — all in-database.' },
    { title: 'AHA: Search helps agents resolve issues faster', message: 'Full-text search over knowledge bases and past tickets lets support agents find solutions during live calls.' }
  ],
  levels: {
    /* ===== WORLD 1: Documents & Collections ===== */
    d1: {
      title: 'Build a subscriber document', kind: 'shape',
      prompt: 'Drag the right values into the subscriber profile for James Park.',
      sub: 'Subscriber documents combine name, plan tier, data usage, and active status.',
      why: 'A subscriber 360 document keeps identity, plan details, usage patterns, and support history together — giving agents instant context during calls without querying separate BSS and OSS systems.',
      skeleton: [
        { key: '_id',      type: 'oid',  value: 'ObjectId("70a...")' },
        { key: 'name',     type: 'slot', slot: 'name' },
        { key: 'planTier', type: 'slot', slot: 'tier' },
        { key: 'dataUsedGB', type: 'slot', slot: 'data' },
        { key: 'active',   type: 'slot', slot: 'active' }
      ],
      bank: [
        { id: 'name',   label: '"James Park"',  kind: 'value' },
        { id: 'tier',   label: '"premium"',     kind: 'value' },
        { id: 'data',   label: '47.2',          kind: 'value' },
        { id: 'active', label: 'true',          kind: 'value' },
        { id: 'd1',     label: 'James Park',    kind: 'value' },
        { id: 'd2',     label: '"47.2"',        kind: 'value' },
        { id: 'd3',     label: '"true"',        kind: 'value' }
      ],
      answer: { name: 'name', tier: 'tier', data: 'data', active: 'active' }
    },
    d2: {
      title: 'insertOne() — log a network event', kind: 'blocks',
      prompt: 'Record a call drop event into the network events collection.',
      sub: 'Each network event becomes an immutable document for quality analysis.',
      why: 'Network events (CDRs, handovers, drops) must be ingested at massive scale. `insertOne()` captures each event atomically with full context for downstream quality analysis and churn prediction.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  type: "call_drop",',
        '\n  cellId: ', { slot: 'val' }, ',',
        '\n  severity: ', { slot: 'sev' },
        '\n})'
      ],
      bank: [
        { id: 'op',  label: 'insertOne',      kind: 'op',    answer: 'op' },
        { id: 'col', label: 'networkEvents',   kind: 'field', answer: 'col' },
        { id: 'val', label: '"CELL-4491"',     kind: 'value', answer: 'val' },
        { id: 'sev', label: '"medium"',        kind: 'value', answer: 'sev' },
        { id: 'x1',  label: 'addOne',          kind: 'op' },
        { id: 'x2',  label: 'events',          kind: 'field' },
        { id: 'x3',  label: 'CELL-4491',       kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — upgrade subscriber plan', kind: 'fill',
      prompt: 'Upgrade subscriber #SUB-7712 to "unlimited" plan tier.',
      sub: '$set patches the plan tier without replacing usage history and preferences.',
      why: 'Plan upgrades must preserve all subscriber context (usage history, preferences, devices). `$set` patches only the planTier field, keeping the full subscriber profile intact.',
      snippet: [
        'db.subscribers.updateOne(',
        '\n  { subscriberId: "SUB-7712" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['planTier', 'plan', 'tier', 'subscription'], answer: 'planTier' },
        val:   { options: ['"unlimited"', 'unlimited', '"premium"', '"upgraded"'], answer: '"unlimited"' }
      }
    },
    d4: {
      title: 'deleteOne() — remove expired promotion', kind: 'fill',
      prompt: 'Delete the oldest expired promotional offer from the promotions collection.',
      sub: 'deleteOne() removes exactly one document — sort targets the oldest expired offer.',
      why: 'Expired promotions confuse agents and customers. Sort by expiresAt ascending to target the oldest, ensuring you never accidentally remove an active promotion being offered to subscribers.',
      snippet: [
        'db.promotions.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { expiresAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"expired"', 'expired', '"inactive"'], answer: '"expired"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },

    /* ===== WORLD 2: Querying ===== */
    q1: {
      title: 'Find subscribers by plan', kind: 'blocks',
      prompt: 'Find every subscriber on the "premium" plan tier.',
      sub: 'Equality queries on indexed fields return results instantly.',
      why: 'Segment-based marketing targets subscribers by plan tier. An index on `planTier` lets MongoDB return the full premium segment in microseconds — even across tens of millions of subscribers.',
      snippet: [
        'db.subscribers.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: 'planTier',    kind: 'field', answer: 'field' },
        { id: 'val',   label: '"premium"',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'tier',         kind: 'field' },
        { id: 'x2',    label: 'premium',      kind: 'value' },
        { id: 'x3',    label: 'subscription', kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — heavy data users', kind: 'blocks',
      prompt: 'Find subscribers using over 100 GB of data this month.',
      sub: '$match with $gt filters heavy users for capacity planning.',
      why: 'Network capacity planning requires identifying heavy users. $match with $gt on an indexed `dataUsedGB` field surfaces subscribers above the threshold instantly for proactive outreach.',
      snippet: [
        'db.subscribers.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { dataUsedGB: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '100',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"100"',   kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-status subscriber query', kind: 'fill',
      prompt: 'Find subscribers in "churning" or "at_risk" status.',
      sub: '$in matches any value — perfect for targeting retention campaigns.',
      why: 'Retention teams need to see all at-risk subscribers at once. `$in` queries multiple churn states efficiently with a single index scan, feeding proactive outreach campaigns.',
      snippet: [
        'db.subscribers.find({',
        '\n  churnStatus: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["churning", "at_risk"]', '"churning, at_risk"', '{ churning, at_risk }', '[churning, at_risk]'], answer: '["churning", "at_risk"]' }
      }
    },
    q4: {
      title: 'Compound filter — plan + usage', kind: 'fill',
      prompt: 'Find active premium subscribers using over 50 GB.',
      sub: 'Combine equality and range for targeted upsell campaigns.',
      why: 'Heavy premium users are upsell candidates for unlimited plans. Combining plan tier, active status, and data usage in one query gives marketing instant access to high-value targets.',
      snippet: [
        'db.subscribers.find({',
        '\n  planTier: "premium",',
        '\n  active: true,',
        '\n  dataUsedGB: { ', { blank: 'op' }, ': 50 }',
        '\n})'
      ],
      choices: {
        op: { options: ['$gt', '$gte', '$eq', '>='], answer: '$gt' }
      }
    },

    /* ===== WORLD 3: Aggregation Pipeline ===== */
    a1: {
      title: 'ARPU by plan tier', kind: 'reorder',
      prompt: 'Compute average revenue per user by plan tier in Q4 — re-order the stages.',
      sub: 'Filter to Q4 billing, group by plan, sort by ARPU, limit to top tiers.',
      why: 'ARPU by plan tier drives pricing strategy. Filter to Q4 (shrink dataset), group by planTier to average revenue, sort descending, and identify the most valuable segments.',
      stages: [
        { id: 'm', code: '$match: { billingPeriod: { $gte: ISODate("2024-10-01") } }', sub: 'filter to Q4 billing', correct: 0 },
        { id: 'g', code: '$group: { _id: "$planTier", arpu: { $avg: "$monthlyRevenue" } }', sub: 'average revenue per tier', correct: 1 },
        { id: 's', code: '$sort: { arpu: -1 }', sub: 'highest ARPU first', correct: 2 },
        { id: 'l', code: '$limit: 5', sub: 'top 5 tiers', correct: 3 }
      ],
      initial: ['s', 'l', 'm', 'g']
    },
    a2: {
      title: '$project — subscriber summary', kind: 'fill',
      prompt: 'Return just the subscriber name and data usage — hide _id.',
      sub: '$project shapes output for the usage dashboard.',
      why: 'Dashboard widgets need lean payloads. `$project` with `_id: 0` strips internal IDs and delivers only what the usage dashboard needs — subscriberName and dataUsedGB.',
      snippet: [
        'db.subscribers.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    subscriberName: ', { blank: 'one' }, ',',
        '\n    dataUsedGB: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$dataUsedGB"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup — enrich events with subscriber info', kind: 'reorder',
      prompt: 'Attach subscriber plan details to each network event for quality correlation.',
      sub: '$lookup joins subscriber data, $unwind flattens, $project picks analysis fields.',
      why: 'Network quality analysis needs subscriber context. `$lookup` brings plan tier and device info in, `$unwind` flattens, and `$project` delivers the fields needed to correlate quality issues with subscriber segments.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "subscribers", localField: "subscriberId", foreignField: "_id", as: "sub" }', sub: 'join subscriber profile', correct: 0 },
        { id: 'un', code: '$unwind: "$sub"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, eventType: 1, cellId: 1, planTier: "$sub.planTier" }', sub: 'keep event + plan tier', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — worst cells', kind: 'blocks',
      prompt: 'Show the 5 cells with the most recent drop events.',
      sub: 'Sort by eventTime descending, limit to 5 for the NOC dashboard.',
      why: 'Network operations centers need to spot degrading cells fast. `$sort` + `$limit` streams the most recent drop events without sorting millions of network events in memory.',
      snippet: [
        'db.networkEvents.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { eventTime: ', { slot: 'dir' }, ' } },',
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
      title: 'Index strategies for network events', kind: 'index',
      prompt: 'The `networkEvents` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each telecom access pattern to the right index type.',
      why: 'Telecom queries span cell lookups, cell+time combos, full-text troubleshooting searches, and low-cardinality flags. Each needs the right index for sub-second response at telco scale.',
      collection: 'networkEvents',
      fields: [
        { name: 'cellId', type: 'String', need: 'single', used: 'db.networkEvents.find({ cellId })' },
        { name: 'cellId + eventTime', type: 'String + Date', need: 'compound', used: 'db.networkEvents.find({ cellId }).sort({ eventTime: -1 })' },
        { name: 'description', type: 'String', need: 'search', used: 'Atlas Search over event descriptions for troubleshooting' },
        { name: 'isAcknowledged', type: 'Bool', need: 'none', used: 'low cardinality — only true/false values' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for network quality queries', kind: 'reorder',
      prompt: 'Order this compound index for: find drop events with high impact, sorted by time.',
      sub: 'For: db.networkEvents.find({ type: "call_drop", impactScore: { $gt: 8 } }).sort({ eventTime: -1 })',
      why: 'ESR in telecom: equality (type) narrows to drops, sort (eventTime) delivers results chronologically for the NOC timeline, range (impactScore) scans only high-impact events.',
      stages: [
        { id: 'e', code: 'type: 1',        sub: 'Equality — { type: "call_drop" }', correct: 0 },
        { id: 's', code: 'eventTime: -1',   sub: 'Sort — .sort({ eventTime: -1 })', correct: 1 },
        { id: 'r', code: 'impactScore: 1',  sub: 'Range — { $gt: 8 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire CDR records', kind: 'fill',
      prompt: 'Auto-delete call detail records 60 days after creation.',
      sub: 'TTL indexes enforce data retention — critical for telecom regulatory compliance.',
      why: 'CDRs have regulatory retention periods. A TTL index on `createdAt` auto-removes records after 60 days (5184000 seconds), enforcing compliance without manual purge jobs at massive scale.',
      snippet: [
        'db.cdrRecords.', { blank: 'op' }, '(',
        '\n  { createdAt: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['5184000', '60', '1440', '86400'], answer: '5184000' }
      }
    },
    i4: {
      title: 'Covered query — subscriber lookup', kind: 'fill',
      prompt: 'Query only fields in the index { msisdn: 1, planTier: 1 } for zero-fetch lookup.',
      sub: 'Covered queries return from the index alone — critical for real-time subscriber routing.',
      why: 'Subscriber plan checks happen on every call setup. A covered query on { msisdn, planTier } returns instantly from the index — zero document fetches at millions of calls per hour.',
      snippet: [
        'db.subscribers.find(',
        '\n  { msisdn: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', msisdn: 1, planTier: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"+1555042891"', '+1555042891', '*', '{}'], answer: '"+1555042891"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Superpowers ===== */
    v1: {
      title: '$vectorSearch — similar network issues', kind: 'fill',
      prompt: 'Find the 5 network events most similar to the current degradation pattern.',
      sub: 'Atlas Vector Search finds events with similar performance signatures.',
      why: 'Network degradation follows patterns. Vector Search finds past events with similar QoS fingerprints — helping NOC engineers diagnose issues faster by finding what worked before.',
      snippet: [
        'db.networkEvents.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "network_embed_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: degradationPattern,',
        '\n    numCandidates: 150,',
        '\n    ', { blank: 'limit' }, ': 5',
        '\n  }',
        '\n}])'
      ],
      choices: {
        path:  { options: ['"embedding"', '"vector"', 'embedding', '"metrics"'], answer: '"embedding"' },
        limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' }
      }
    },
    v2: {
      title: '$search — knowledge base search', kind: 'blocks',
      prompt: 'Use Atlas Search to find support articles about "dropped call troubleshooting".',
      sub: 'Atlas Search powers real-time knowledge base lookups during live support calls.',
      why: 'Support agents need instant answers during calls. Atlas Search provides relevance-ranked results from the knowledge base — finding troubleshooting guides in seconds while the customer is on the line.',
      snippet: [
        'db.knowledgeBase.aggregate([',
        '\n  { ', { slot: 'stage' }, ': {',
        '\n    ', { slot: 'operator' }, ': {',
        '\n      path: ', { slot: 'path' }, ',',
        '\n      query: ', { slot: 'query' },
        '\n    }',
        '\n  } }',
        '\n])'
      ],
      bank: [
        { id: 'stage',    label: '$search',                         kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text',                            kind: 'op',    answer: 'operator' },
        { id: 'path',     label: '"content"',                       kind: 'field', answer: 'path' },
        { id: 'query',    label: '"dropped call troubleshooting"',  kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                           kind: 'op' },
        { id: 'x2',       label: 'find',                            kind: 'op' },
        { id: 'x3',       label: 'dropped call troubleshooting',    kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — churn alert', kind: 'fill',
      prompt: 'Fire a retention workflow whenever a subscriber\'s churn score is updated.',
      sub: 'Database triggers detect churn risk changes and route to retention teams.',
      why: 'Churn prevention requires immediate action when risk scores spike. Atlas Triggers fire on update and can notify retention teams within seconds — before the subscriber starts shopping competitors.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "telecom",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"subscribers"', 'subscribers', 'Subscribers', '*'], answer: '"subscribers"' },
        evt: { options: ['"update"', '"insert"', '"write"', '"modify"'], answer: '"update"' },
        fn:  { options: ['"triggerRetention"', 'triggerRetention', 'fn()', 'retain()'], answer: '"triggerRetention"' }
      }
    },
    v4: {
      title: 'RAG — support copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for a support copilot: scope to carrier, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to carrier → drop weak matches → project only what the LLM needs.',
      why: 'Support copilots must only access the carrier\'s own documentation. Pre-filtering by carrierId ensures isolation, and trimming keeps the LLM focused on relevant troubleshooting steps.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "kb_embed", path: "embedding", queryVector: q, limit: 8, filter: { carrierId } }', sub: 'k-NN scoped to this carrier', correct: 0 },
        { id: 'pj', code: '$project: { _id: 0, article: 1, solution: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.76 } }', sub: 'drop weak matches', correct: 1 },

      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
