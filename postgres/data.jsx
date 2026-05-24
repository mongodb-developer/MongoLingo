/* MongoLingo — MongoDB vs Postgres value proposition path.
 * This pack sits side by side with the current General and industry paths. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'postgres',
  name: 'MongoDB vs Postgres',
  shortName: 'MongoDB vs Postgres',
  description: 'A side-by-side value path showing where MongoDB shines for flexible schemas, nested data, aggregation, search, vectors, and developer velocity.',
  promise: 'MongoDB shines when modern applications need flexible, JSON-shaped operational data, rich indexes, in-database transformations, and Atlas search/vector capabilities without stitching together extra systems.',
  searchPhrase: 'schema migration pain',
  hints: {
    'document model': 'MongoDB stores application objects as rich BSON documents instead of splitting every object across rows and join tables.',
    'schema flexibility': 'MongoDB can validate structure where needed while still allowing new fields and shapes to evolve quickly.',
    'embedded data': 'Embed data that is read together; reference when entities have independent lifecycles.',
    'multikey': 'MongoDB automatically indexes array elements with multikey indexes.'
  },
  nouns: {
    profile: 'customer profile',
    profilePlural: 'customer profiles',
    profileCollection: 'customers',
    item: 'application object',
    itemPlural: 'application objects',
    itemCollection: 'products',
    catalog: 'feature catalog',
    user: 'developer',
    transaction: 'workflow event',
    transactionPlural: 'workflow events',
    documentPlural: 'application documents'
  },
  aha: [
    { title: 'AHA: MongoDB stores the object your app already uses', message: 'Instead of decomposing every customer, product, or event into many tables, MongoDB keeps related JSON-shaped data together so teams ship features faster.' },
    { title: 'AHA: Flexible schema reduces migration drag', message: 'When product requirements change, MongoDB can add fields to new documents immediately while validation rules keep critical structure safe.' },
    { title: 'AHA: Aggregation shapes data for apps and analytics', message: 'MongoDB pipelines filter, group, enrich, and project operational data into API-ready results without exporting every transformation to another tier.' },
    { title: 'AHA: Atlas adds search and vectors beside operational data', message: 'Atlas Search and Vector Search let teams build discovery and AI features over the same documents instead of operating separate search and vector stacks.' }
  ],
  levels: {
    /* ===== WORLD 1: Flexible Documents vs Rigid Rows ===== */
    d1: {
      title: 'Model one customer view', kind: 'shape',
      prompt: 'Build a customer document that keeps profile, plan, and preferences together.',
      sub: 'MongoDB documents map naturally to the JSON objects applications already send and receive.',
      why: 'In Postgres, this customer view often starts across users, plans, preferences, and join tables. MongoDB can store the high-value operational view together, reducing joins and matching the API shape directly.',
      skeleton: [
        { key: '_id',         type: 'oid',  value: 'ObjectId("67a...")' },
        { key: 'email',       type: 'slot', slot: 'email' },
        { key: 'plan',        type: 'slot', slot: 'plan' },
        { key: 'betaFeatures', type: 'slot', slot: 'features' },
        { key: 'active',      type: 'slot', slot: 'active' }
      ],
      bank: [
        { id: 'email',    label: '"ada@example.com"', kind: 'value' },
        { id: 'plan',     label: '"pro"',             kind: 'value' },
        { id: 'features', label: '["aiSearch", "teamSpaces"]', kind: 'value' },
        { id: 'active',   label: 'true',               kind: 'value' },
        { id: 'x1',       label: 'ada@example.com',    kind: 'value' },
        { id: 'x2',       label: 'pro',                kind: 'value' },
        { id: 'x3',       label: '"true"',            kind: 'value' }
      ],
      answer: { email: 'email', plan: 'plan', features: 'features', active: 'active' }
    },
    d2: {
      title: 'insertOne() — no migration wait', kind: 'blocks',
      prompt: 'Launch a new product feature by inserting a document with a new optional field.',
      sub: 'MongoDB accepts evolving document shapes while you can still add validation where it matters.',
      why: 'A relational design may require ALTER TABLE, backfills, nullable columns, or separate extension tables for every product variation. MongoDB lets new attributes travel with the document as the application evolves.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  sku: "APP-SEARCH-01",',
        '\n  name: ', { slot: 'val' }, ',',
        '\n  supportsVectorSearch: ', { slot: 'bool' },
        '\n})'
      ],
      bank: [
        { id: 'op',   label: 'insertOne',              kind: 'op',    answer: 'op' },
        { id: 'col',  label: 'products',               kind: 'field', answer: 'col' },
        { id: 'val',  label: '"AI Search Add-on"',    kind: 'value', answer: 'val' },
        { id: 'bool', label: 'true',                   kind: 'value', answer: 'bool' },
        { id: 'x1',   label: 'alterTable',             kind: 'op' },
        { id: 'x2',   label: 'product_features_join',  kind: 'field' },
        { id: 'x3',   label: 'AI Search Add-on',       kind: 'value' }
      ]
    },
    d3: {
      title: '$set — evolve safely', kind: 'fill',
      prompt: 'Add a nested preference without replacing the whole customer document.',
      sub: '$set patches only the targeted field, including nested paths.',
      why: 'MongoDB supports incremental change at document level. You can add `preferences.notifications.product` now, then formalize rules later with schema validation as the pattern stabilizes.',
      snippet: [
        'db.customers.updateOne(',
        '\n  { email: "ada@example.com" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$join', '$alter'], answer: '$set' },
        field: { options: ['"preferences.notifications.product"', 'preferences', 'notifications.product', 'ALTER COLUMN'], answer: '"preferences.notifications.product"' },
        val:   { options: ['true', '"true"', '1', 'enabled'], answer: 'true' }
      }
    },
    d4: {
      title: 'deleteOne() — precise lifecycle cleanup', kind: 'fill',
      prompt: 'Remove the oldest expired experiment assignment.',
      sub: 'Document-oriented apps often capture short-lived operational events that need safe cleanup.',
      why: 'MongoDB supports precise deletes and TTL indexes for lifecycle-heavy data such as sessions, experiments, notifications, and events — data that can feel awkward when spread across relational side tables.',
      snippet: [
        'db.experiments.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { expiresAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'dropTable', 'removeAll'], answer: 'deleteOne' },
        val: { options: ['"expired"', 'expired', 'null'], answer: '"expired"' },
        dir: { options: ['1', '-1', '"oldest"'], answer: '1' }
      }
    },

    /* ===== WORLD 2: Query Nested and Array Data Directly ===== */
    q1: {
      title: 'Query nested fields directly', kind: 'blocks',
      prompt: 'Find customers whose plan tier is "enterprise" inside a nested billing object.',
      sub: 'Dot notation queries nested document fields without joining separate tables first.',
      why: 'MongoDB lets developers query the same nested structure the application uses. In Postgres, this access pattern may require joins across normalized tables or special JSONB handling that bypasses the relational model.',
      snippet: [
        'db.customers.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: '"billing.plan.tier"', kind: 'field', answer: 'field' },
        { id: 'val',   label: '"enterprise"',       kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'JOIN billing',        kind: 'field' },
        { id: 'x2',    label: 'enterprise',          kind: 'value' },
        { id: 'x3',    label: 'billing_plan_tier',   kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — filter operational events', kind: 'blocks',
      prompt: 'Find workflow events with a risk score over 80.',
      sub: 'MongoDB handles event-like documents with changing attributes and indexed filters.',
      why: 'Operational events often vary by source and version. MongoDB stores the full event shape while still making common filters like `riskScore > 80` straightforward and indexable.',
      snippet: [
        'db.events.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { riskScore: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '80',     kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$where', kind: 'stage' },
        { id: 'x2',    label: '$lt',    kind: 'op' },
        { id: 'x3',    label: '"80"',  kind: 'value' }
      ]
    },
    q3: {
      title: '$in — arrays without join tables', kind: 'fill',
      prompt: 'Find customers enrolled in either the "aiSearch" or "analytics" feature.',
      sub: 'MongoDB can query arrays directly; no feature enrollment join table required for this shape.',
      why: 'For bounded arrays that are read with the parent, MongoDB keeps the feature list in the customer document and queries it directly. This reduces schema ceremony for common application access patterns.',
      snippet: [
        'db.customers.find({',
        '\n  betaFeatures: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$join', '$contains', '$anyTable'], answer: '$in' },
        arr: { options: ['["aiSearch", "analytics"]', '"aiSearch, analytics"', '{ aiSearch, analytics }', '[aiSearch, analytics]'], answer: '["aiSearch", "analytics"]' }
      }
    },
    q4: {
      title: 'Compound filter — app-ready query', kind: 'fill',
      prompt: 'Find active enterprise customers with health score at least 90.',
      sub: 'Combine nested equality and range conditions in one readable filter object.',
      why: 'MongoDB query syntax stays close to application objects. The filter reads like the data shape, which shortens the path from product requirement to working query.',
      snippet: [
        'db.customers.find({',
        '\n  "billing.plan.tier": "enterprise",',
        '\n  active: true,',
        '\n  healthScore: { ', { blank: 'gte' }, ': 90, ', { blank: 'lte' }, ': 100 }',
        '\n})'
      ],
      choices: {
        gte: { options: ['$gte', '$gt', '>=', '$min'], answer: '$gte' },
        lte: { options: ['$lte', '$lt', '<=', '$max'], answer: '$lte' }
      }
    },

    /* ===== WORLD 3: Aggregation vs Join-Heavy ETL ===== */
    a1: {
      title: 'Pipeline an app dashboard', kind: 'reorder',
      prompt: 'Rank enterprise customers by 2024 expansion value — order the pipeline.',
      sub: 'Filter early, group, sort, then limit.',
      why: 'MongoDB aggregation gives developers an in-database transformation language over operational documents. Many dashboard and API views can be produced without exporting to a separate ETL process first.',
      stages: [
        { id: 'm', code: '$match: { year: 2024, "plan.tier": "enterprise" }', sub: 'filter to target customers', correct: 0 },
        { id: 'g', code: '$group: { _id: "$customerId", expansion: { $sum: "$amount" } }', sub: 'sum value per customer', correct: 1 },
        { id: 's', code: '$sort: { expansion: -1 }', sub: 'highest expansion first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 customers', correct: 3 }
      ],
      initial: ['s', 'l', 'm', 'g']
    },
    a2: {
      title: '$project — API-ready JSON', kind: 'fill',
      prompt: 'Return only the fields the frontend needs for a customer card.',
      sub: '$project reshapes output close to the data.',
      why: 'MongoDB can emit API-friendly JSON directly from the pipeline. That reduces translation code that often appears when relational rows must be joined and reshaped into nested application responses.',
      snippet: [
        'db.customers.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    name: ', { blank: 'one' }, ',',
        '\n    healthScore: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$score"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup when references fit', kind: 'reorder',
      prompt: 'Attach account owner details to each customer summary, then keep a clean response shape.',
      sub: 'MongoDB supports references and joins when entities have independent lifecycles.',
      why: 'MongoDB is not anti-join; it is access-pattern-first. Embed data read together, reference independent entities, and use `$lookup` when the query needs to combine them.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "employees", localField: "ownerId", foreignField: "_id", as: "owner" }', sub: 'join account owner', correct: 0 },
        { id: 'un', code: '$unwind: "$owner"', sub: 'flatten owner array', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, company: 1, ownerName: "$owner.name", healthScore: 1 }', sub: 'return API shape', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — top-N without app code', kind: 'blocks',
      prompt: 'Show the 5 most recently updated customer records.',
      sub: 'Let the database sort and trim before data reaches the app.',
      why: 'MongoDB pipelines let applications request exactly the view they need. Sorting and limiting in the database avoids over-fetching and custom post-processing in application code.',
      snippet: [
        'db.customers.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { updatedAt: ', { slot: 'dir' }, ' } },',
        '\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }',
        '\n])'
      ],
      bank: [
        { id: 'sort',  label: '$sort',  kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir',   label: '-1',     kind: 'value', answer: 'dir' },
        { id: 'n',     label: '5',      kind: 'value', answer: 'n' },
        { id: 'x1',    label: '$order', kind: 'stage' },
        { id: 'x2',    label: '$top',   kind: 'stage' },
        { id: 'x3',    label: '"5"',   kind: 'value' }
      ]
    },

    /* ===== WORLD 4: Performance for Modern Access Patterns ===== */
    i1: {
      title: 'Index modern query shapes', kind: 'index',
      prompt: 'The `customers` collection has four query patterns. Pick the best MongoDB index strategy for each.',
      sub: 'Match nested fields, compound filters, Atlas Search, and low-cardinality flags to the right index decision.',
      why: 'MongoDB indexes are built around how the application reads data, including nested fields, arrays, compound access patterns, and dedicated search indexes — not just primary/foreign-key joins.',
      collection: 'customers',
      fields: [
        { name: 'billing.plan.tier', type: 'Nested String', need: 'single', used: 'db.customers.find({ "billing.plan.tier": "enterprise" })' },
        { name: 'plan + healthScore', type: 'String + Number', need: 'compound', used: 'filter by plan, sort by health score' },
        { name: 'notes', type: 'Text', need: 'search', used: 'Atlas Search for fuzzy customer notes' },
        { name: 'active', type: 'Bool', need: 'none', used: 'low cardinality true/false flag alone' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for app pages', kind: 'reorder',
      prompt: 'Order this compound index for active customers sorted by updatedAt with score above 80.',
      sub: 'For: db.customers.find({ active: true, healthScore: { $gt: 80 } }).sort({ updatedAt: -1 })',
      why: 'MongoDB compound indexes encode the access pattern: equality narrows, sort returns data in display order, range scans within the narrowed slice.',
      stages: [
        { id: 'e', code: 'active: 1',      sub: 'Equality — active customers', correct: 0 },
        { id: 's', code: 'updatedAt: -1',  sub: 'Sort — newest first', correct: 1 },
        { id: 'r', code: 'healthScore: 1', sub: 'Range — score above 80', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — built-in data lifecycle', kind: 'fill',
      prompt: 'Auto-delete session documents 30 days after lastSeen.',
      sub: 'TTL indexes handle expiry without cron jobs or custom cleanup workers.',
      why: 'MongoDB has first-class lifecycle support for expiring operational data. This is ideal for sessions, tokens, temporary workflows, IoT events, and other time-boxed records.',
      snippet: [
        'db.sessions.', { blank: 'op' }, '(',
        '\n  { lastSeen: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'alterTable', 'vacuum'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['2592000', '30', '720', '86400'], answer: '2592000' }
      }
    },
    i4: {
      title: 'Covered query — fast API lookup', kind: 'fill',
      prompt: 'Use only fields inside the index { email: 1, plan: 1 } for a zero-fetch customer lookup.',
      sub: 'Covered queries return from the index without reading full documents.',
      why: 'MongoDB can serve high-volume API lookups directly from indexes when the filter and projection are covered. The result is low latency and less document I/O.',
      snippet: [
        'db.customers.find(',
        '\n  { email: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', email: 1, plan: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"ada@example.com"', 'ada@example.com', '*', '{}'], answer: '"ada@example.com"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Platform Advantage ===== */
    v1: {
      title: '$vectorSearch beside operational data', kind: 'fill',
      prompt: 'Find the 5 customer-success notes most similar to a support question embedding.',
      sub: 'Atlas Vector Search runs semantic retrieval over documents already in MongoDB.',
      why: 'Postgres can be extended for vectors, but MongoDB Atlas combines operational documents, metadata filters, and vector search in one managed developer data platform.',
      snippet: [
        'db.notes.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "notes_vector_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: questionEmbedding,',
        '\n    numCandidates: 150,',
        '\n    ', { blank: 'limit' }, ': 5',
        '\n  }',
        '\n}])'
      ],
      choices: {
        path:  { options: ['"embedding"', '"vector"', 'embedding', '*'], answer: '"embedding"' },
        limit: { options: ['limit', 'topK', 'numResults', 'k'], answer: 'limit' }
      }
    },
    v2: {
      title: '$search — no separate search cluster', kind: 'blocks',
      prompt: 'Use Atlas Search to find docs mentioning "schema migration pain".',
      sub: 'Atlas Search adds relevance, fuzzy matching, highlighting, and analyzers beside the database.',
      why: 'Teams often pair Postgres with external search infrastructure for rich discovery. Atlas Search keeps search indexes close to operational MongoDB data, reducing integration and synchronization work.',
      snippet: [
        'db.docs.aggregate([',
        '\n  { ', { slot: 'stage' }, ': {',
        '\n    ', { slot: 'operator' }, ': {',
        '\n      path: ', { slot: 'path' }, ',',
        '\n      query: ', { slot: 'query' },
        '\n    }',
        '\n  } }',
        '\n])'
      ],
      bank: [
        { id: 'stage',    label: '$search',                  kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text',                     kind: 'op',    answer: 'operator' },
        { id: 'path',     label: '"body"',                  kind: 'field', answer: 'path' },
        { id: 'query',    label: '"schema migration pain"', kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                    kind: 'op' },
        { id: 'x2',       label: 'LIKE',                     kind: 'op' },
        { id: 'x3',       label: 'schema migration pain',    kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — react to changes', kind: 'fill',
      prompt: 'Fire a lifecycle workflow when a customer document is updated.',
      sub: 'Atlas Triggers run from database change events without a polling worker.',
      why: 'Modern apps need reactive workflows: sync a CRM, notify a user, update a projection, or start an AI enrichment job. Atlas Triggers and change streams make this a platform capability.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "app",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"customers"', 'customers', 'Customer', '*'], answer: '"customers"' },
        evt: { options: ['"update"', '"insert"', '"write"', '"alter"'], answer: '"update"' },
        fn:  { options: ['"syncLifecycleWorkflow"', 'syncLifecycleWorkflow', 'fn()', 'trigger()'], answer: '"syncLifecycleWorkflow"' }
      }
    },
    v4: {
      title: 'RAG — hybrid retrieval path', kind: 'reorder',
      prompt: 'Build a RAG pipeline: scope by tenant, retrieve semantically, then trim context for the LLM.',
      sub: 'Vector retrieval with metadata filters keeps AI grounded in authorized operational data.',
      why: 'MongoDB Atlas lets AI features use documents, metadata filters, semantic vectors, and projections together. That means fewer moving pieces than coordinating a relational store, search engine, vector DB, and sync pipelines.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "docs_embed", path: "embedding", queryVector: q, limit: 8, filter: { tenantId } }', sub: 'semantic search scoped to tenant', correct: 0 },
                { id: 'pj', code: '$project: { _id: 0, title: 1, chunk: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim context for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.78 } }', sub: 'drop weak matches', correct: 1 },

      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));