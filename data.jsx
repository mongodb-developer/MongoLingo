/* MongoLingo — content data
 * Five worlds × multiple levels. Each level declares its `kind`:
 *   - "shape"   → drag fields into a JSON document shape
 *   - "blocks"  → drag operator/value tokens into snippet slots
 *   - "reorder" → drag pipeline stages into the right order
 *   - "index"   → drag index types onto fields of a collection
 *   - "fill"    → click-to-fill blanks from a choice bank
 * Each level also carries its prompt, the source for the live preview pane,
 * a "why this works" concept blurb, and the correct-answer key.
 */

const HINTS = /*EDITMODE-BEGIN*/{
  "$match":        "Filters docs against a condition — like a WHERE clause.",
  "$group":        "Groups docs by a key and accumulates totals.",
  "$project":      "Reshapes each doc: include, rename, or compute fields.",
  "$lookup":       "Joins another collection by matching a foreign key.",
  "$unwind":       "Explodes an array field into one doc per element.",
  "$sort":         "Orders results by one or more fields.",
  "$limit":        "Returns only the first N docs after sort.",
  "$search":       "Atlas Search stage for full-text search inside aggregate().",
  "$eq":           "Matches exactly equal values.",
  "$gt":           "Greater than. ($gte for inclusive.)",
  "$lt":           "Less than. ($lte for inclusive.)",
  "$in":           "Matches any value in an array.",
  "$text":         "Full-text search across indexed string fields.",
  "$vectorSearch": "Atlas-only stage: k-NN search over a vector index.",
  "find":          "Returns matching documents from a collection.",
  "insertOne":     "Inserts a single document, returns its _id.",
  "updateOne":     "Updates the first matching doc with a `$set` patch.",
  "deleteOne":     "Deletes the first matching doc.",
  "explain":       "Returns the query plan + execution stats.",
  "createIndex":   "Builds an index on one or more fields. Reads get fast.",
  "TTL":           "Time-To-Live: docs expire automatically after N seconds.",
  "ESR":           "Equality → Sort → Range. Compound-index field order rule.",
  "covered":       "All projected fields live in the index — no fetch needed.",
  "compound":      "Index across multiple fields. Order matters (ESR)."
}/*HINTS-END*/;

const LEVEL_HINTS = {
  d1: [
    'Match each field to the BSON/JSON type the document expects.',
    'Strings need quotes; numbers, booleans, arrays, and ObjectIds do not.'
  ],
  d2: [
    'Find the collection name first, then choose the MongoDB write operation.',
    'insertOne() writes exactly one document object and returns an inserted _id.'
  ],
  d3: [
    'Use $set when you want to patch fields without replacing the whole document.',
    'The first argument finds the document; the second argument describes the update.'
  ],
  d4: [
    'Use deleteOne when the task asks to remove exactly one matching document.',
    'If a sort is present, it decides which matching document is removed first.'
  ],
  q1: [
    'Equality queries match a field directly to one value.',
    'The filter shape is { field: value }; string values need quotes.'
  ],
  q2: [
    '$match is the aggregation stage that filters documents.',
    'Use $gt for “greater than”; keep numeric thresholds as numbers, not strings.'
  ],
  q3: [
    '$in expects an array of possible values.',
    'Use $in when one field can match any value from a list.'
  ],
  q4: [
    'MongoDB implicitly ANDs conditions listed in the same filter object.',
    'Use range operators like $gte/$lte or $gt/$lt inside the field condition.'
  ],
  a1: [
    'Filter early to reduce how much data later stages process.',
    'Group before sorting when the sort depends on an aggregated value.'
  ],
  a2: [
    '$project controls the output shape returned by the pipeline.',
    'Use _id: 0 to hide MongoDB’s default _id field when the UI does not need it.'
  ],
  a3: [
    '$lookup attaches matching documents from another collection as an array.',
    'Use $unwind after $lookup when you want one joined object instead of an array.'
  ],
  a4: [
    '$sort chooses the order; $limit chooses how many results remain.',
    'For newest or highest first, descending sort usually uses -1.'
  ],
  i1: [
    'Pick the index based on the whole query pattern, not just the field name.',
    'Text search belongs to Atlas Search; low-cardinality booleans often should not be indexed alone.'
  ],
  i2: [
    'ESR means Equality fields first, then Sort fields, then Range fields.',
    'Range predicates like $gt/$lt usually come after equality and sort keys in the compound index.'
  ],
  i3: [
    'TTL indexes require a date field and expireAfterSeconds.',
    'Convert days or hours into seconds before filling the TTL value.'
  ],
  i4: [
    'A covered query projects only fields that exist in the index.',
    'Exclude _id with _id: 0 unless _id is also part of the index.'
  ],
  v1: [
    '$vectorSearch needs the indexed vector path and a numeric limit.',
    'The query vector comes from an embedding model; Atlas returns nearest neighbors.'
  ],
  v2: [
    'Atlas Search runs inside aggregate() as a $search stage.',
    'Use the text operator with a path and query for full-text matching.'
  ],
  v3: [
    'A trigger watches one collection for specific operation types.',
    'The function name should be a string reference to the server-side handler.'
  ],
  v4: [
    'For RAG, retrieve relevant records first, then trim the payload for the LLM.',
    'Use filters to keep retrieval scoped to the right tenant, store, org, or domain.'
  ]
};

const WORLDS = [
  /* ============================================================ WORLD 1 */
  {
    id: 'docs',
    icon: 'leaf',
    name: 'Documents & Collections',
    tagline: 'Shape your data',
    blurb: 'JSON-shaped documents, organized into collections. Where MongoDB begins.',
    tint: 'rgba(0,237,100,0.18)',
    tintSolid: '#00ED64',
    levels: [
      {
        id: 'd1', title: 'Build a user document', kind: 'shape',
        prompt: 'Drag the right values into the user document for Ada Lovelace.',
        sub:    'Documents are JSON. Strings get quotes. Numbers and booleans don\'t.',
        why:    'A MongoDB document is BSON — JSON with extra types (ObjectId, Date, Decimal128). Field order is preserved but rarely meaningful.',
        skeleton: [
          { key: '_id',    type: 'oid',   value: 'ObjectId("64e...")' },
          { key: 'name',   type: 'slot',  slot: 'name'   },
          { key: 'email',  type: 'slot',  slot: 'email'  },
          { key: 'age',    type: 'slot',  slot: 'age'    },
          { key: 'active', type: 'slot',  slot: 'active' }
        ],
        bank: [
          { id: 'name',    label: '"Ada Lovelace"',           kind: 'value' },
          { id: 'email',   label: '"ada@analytical.dev"',     kind: 'value' },
          { id: 'age',     label: '36',                       kind: 'value' },
          { id: 'active',  label: 'true',                     kind: 'value' },
          /* distractors */
          { id: 'd1',      label: '"36"',                     kind: 'value' },
          { id: 'd2',      label: 'Ada Lovelace',             kind: 'value' },
          { id: 'd3',      label: '"true"',                   kind: 'value' }
        ],
        answer: { name: 'name', email: 'email', age: 'age', active: 'active' }
      },
      {
        id: 'd2', title: 'insertOne()', kind: 'blocks',
        prompt: 'Insert a new product into the catalog. Drag the missing pieces.',
        sub:    'insertOne() takes a single document and returns its generated _id.',
        why:    '`insertOne()` is the simplest write. For many docs, use `insertMany()`. MongoDB auto-generates an `_id` if you don\'t provide one.',
        snippet: [
          'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
          '\n  name: ', { slot: 'val' }, ',',
          '\n  price: 24.99,',
          '\n  inStock: ', { slot: 'bool' },
          '\n})'
        ],
        bank: [
          { id: 'op',   label: 'insertOne', kind: 'op',    answer: 'op'   },
          { id: 'col',  label: 'products',  kind: 'field', answer: 'col'  },
          { id: 'val',  label: '"Espresso"', kind: 'value', answer: 'val' },
          { id: 'bool', label: 'true',      kind: 'value', answer: 'bool' },
          /* distractors */
          { id: 'x1',   label: 'addOne',    kind: 'op'    },
          { id: 'x2',   label: 'inventory', kind: 'field' },
          { id: 'x3',   label: 'Espresso',  kind: 'value' }
        ]
      },
      {
        id: 'd3', title: 'updateOne()', kind: 'fill',
        prompt: 'Mark order #1042 as shipped.',
        sub:    'Use the $set operator to change one or more fields in place.',
        why:    'Without `$set` you would *replace* the entire doc. `$set` patches only the listed fields and leaves the rest alone.',
        snippet: [
          'db.orders.updateOne(',
          '\n  { orderId: 1042 },',
          '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
          '\n)'
        ],
        choices: {
          op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
          field: { options: ['status', 'state', 'shipped', 'flag'], answer: 'status' },
          val:   { options: ['"shipped"', 'shipped', 'true', '1'],  answer: '"shipped"' }
        }
      },
      {
        id: 'd4', title: 'deleteOne()', kind: 'fill',
        prompt: 'Remove the cancelled order with the highest id.',
        sub:    'deleteOne() removes the first doc that matches — no second chances.',
        why:    'Filter precision matters: a too-broad filter on `deleteMany()` is the classic MongoDB foot-gun. Always preview with `find()` first.',
        snippet: [
          'db.orders.', { blank: 'op' }, '(',
          '\n  { status: ', { blank: 'val' }, ' },',
          '\n  { sort: { orderId: ', { blank: 'dir' }, ' } }',
          '\n)'
        ],
        choices: {
          op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
          val: { options: ['"cancelled"', 'cancelled', 'null'],   answer: '"cancelled"' },
          dir: { options: ['-1', '1', '"desc"'],                  answer: '-1' }
        }
      }
    ]
  },

  /* ============================================================ WORLD 2 */
  {
    id: 'query',
    icon: 'magnify',
    name: 'Querying',
    tagline: 'Ask the database questions',
    blurb: 'find() and the operator family: $eq, $gt, $lt, $in, $and, $or.',
    tint: 'rgba(1,107,248,0.22)',
    tintSolid: '#4DA3FF',
    levels: [
      {
        id: 'q1', title: 'Equality with find()', kind: 'blocks',
        prompt: 'Find every user whose role is "admin".',
        sub:    'For equality, you can write the value directly — $eq is implicit.',
        why:    'When you write `{ field: value }`, Mongo treats it as `$eq`. Explicit `$eq` is only required inside larger expressions.',
        snippet: [
          'db.users.find({ ',
          { slot: 'field' }, ': ', { slot: 'val' },
          ' })'
        ],
        bank: [
          { id: 'field', label: 'role',     kind: 'field', answer: 'field' },
          { id: 'val',   label: '"admin"',  kind: 'value', answer: 'val'   },
          /* distractors */
          { id: 'x1',    label: 'roles',    kind: 'field' },
          { id: 'x2',    label: 'admin',    kind: 'value' },
          { id: 'x3',    label: 'isAdmin',  kind: 'field' }
        ]
      },
      {
        id: 'q2', title: '$gt with $match', kind: 'blocks',
        prompt: 'Find orders over $100. Drag the operator and value.',
        sub:    'In aggregation, you wrap conditions in $match. Operators start with $.',
        why:    '$match early in a pipeline lets the planner push the filter down to an index — same speed as a regular `find()`.',
        snippet: [
          'db.orders.aggregate([',
          '\n  { ', { slot: 'stage' }, ': { total: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
          '\n])'
        ],
        bank: [
          { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
          { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op'    },
          { id: 'val',   label: '100',    kind: 'value', answer: 'val'   },
          /* distractors */
          { id: 'x1',    label: '$where', kind: 'stage' },
          { id: 'x2',    label: '$eq',    kind: 'op'    },
          { id: 'x3',    label: '$lt',    kind: 'op'    },
          { id: 'x4',    label: '"100"',  kind: 'value' }
        ]
      },
      {
        id: 'q3', title: '$in — multi-value match', kind: 'fill',
        prompt: 'Find products in the "coffee" or "tea" categories.',
        sub:    '$in matches if a field equals any value in the array.',
        why:    '`$in` is shorthand for an `$or` of equality checks. It uses indexes efficiently — prefer it over a string of `$or`s.',
        snippet: [
          'db.products.find({',
          '\n  category: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
          '\n})'
        ],
        choices: {
          op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
          arr: {
            options: ['["coffee", "tea"]', '"coffee, tea"', '{ coffee, tea }', '[coffee, tea]'],
            answer: '["coffee", "tea"]'
          }
        }
      },
      {
        id: 'q4', title: 'Compound filter', kind: 'fill',
        prompt: 'Find active users aged 18–25.',
        sub:    'Combine equality and range operators in one filter object.',
        why:    'When all conditions are on different fields, just list them — Mongo ANDs them implicitly. No need for explicit `$and`.',
        snippet: [
          'db.users.find({',
          '\n  active: true,',
          '\n  age: { ', { blank: 'gte' }, ': 18, ', { blank: 'lte' }, ': 25 }',
          '\n})'
        ],
        choices: {
          gte: { options: ['$gte', '$gt', '$geq', '>='], answer: '$gte' },
          lte: { options: ['$lte', '$lt', '$leq', '<='], answer: '$lte' }
        }
      }
    ]
  },

  /* ============================================================ WORLD 3 */
  {
    id: 'agg',
    icon: 'diagram',
    name: 'Aggregation Pipeline',
    tagline: 'Compose data transformations',
    blurb: 'Stack stages like a UNIX pipe. Each stage feeds the next.',
    tint: 'rgba(255,192,16,0.20)',
    tintSolid: '#FFC76A',
    levels: [
      {
        id: 'a1', title: 'Order matters', kind: 'reorder',
        prompt: 'Total revenue per customer in 2024 — re-order the stages.',
        sub:    'Filter early, group, sort, then limit. The ESR of pipelines.',
        why:    'Put `$match` first so the planner can use indexes and shrink the dataset before the expensive `$group`. Sort after grouping; limit last.',
        stages: [
          { id: 'm', code: '$match: { year: 2024 }', sub: 'filter to 2024 docs',          correct: 0 },
          { id: 'g', code: '$group: { _id: "$customer", total: { $sum: "$amount" } }', sub: 'sum amounts per customer', correct: 1 },
          { id: 's', code: '$sort: { total: -1 }',     sub: 'highest spenders first',     correct: 2 },
          { id: 'l', code: '$limit: 5',                sub: 'top 5 only',                  correct: 3 }
        ],
        // initial scramble
        initial: ['s', 'l', 'm', 'g']
      },
      {
        id: 'a2', title: '$project — reshape output', kind: 'fill',
        prompt: 'Return just the customer name and order total.',
        sub:    '$project picks (and renames or computes) fields per doc.',
        why:    '`1` includes a field, `0` excludes it. `_id` is the only field included by default — disable it explicitly when you don\'t want it.',
        snippet: [
          'db.orders.aggregate([',
          '\n  { $project: {',
          '\n    _id: ', { blank: 'id' }, ',',
          '\n    customer: ', { blank: 'one' }, ',',
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
      {
        id: 'a3', title: '$lookup — join collections', kind: 'reorder',
        prompt: 'Attach each order\'s customer doc, then keep only the name.',
        sub:    '$lookup adds an array of matches. $unwind flattens it. $project finishes the shape.',
        why:    '`$lookup` is your JOIN. It returns an array — even for single matches — so `$unwind` is almost always next.',
        stages: [
          { id: 'lo', code: '$lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "cust" }', sub: 'attach customer docs as array', correct: 0 },
          { id: 'un', code: '$unwind: "$cust"',                       sub: 'one doc per match',         correct: 1 },
          { id: 'pr', code: '$project: { _id: 0, name: "$cust.name" }', sub: 'keep only the name',     correct: 2 }
        ],
        initial: ['pr', 'lo', 'un']
      },
      {
        id: 'a4', title: '$sort + $limit', kind: 'blocks',
        prompt: 'Show the three most recent posts.',
        sub:    'Sort descending by createdAt, then keep three.',
        why:    'When `$sort` is followed by `$limit`, the engine streams just enough docs through the sort — much cheaper than sorting the whole collection.',
        snippet: [
          'db.posts.aggregate([',
          '\n  { ', { slot: 'sort' }, ': { createdAt: ', { slot: 'dir' }, ' } },',
          '\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }',
          '\n])'
        ],
        bank: [
          { id: 'sort',  label: '$sort',  kind: 'stage', answer: 'sort'  },
          { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
          { id: 'dir',   label: '-1',     kind: 'value', answer: 'dir'   },
          { id: 'n',     label: '3',      kind: 'value', answer: 'n'     },
          /* distractors */
          { id: 'x1',    label: '$top',   kind: 'stage' },
          { id: 'x2',    label: '$first', kind: 'stage' },
          { id: 'x3',    label: '1',      kind: 'value' },
          { id: 'x4',    label: '"3"',    kind: 'value' }
        ]
      }
    ]
  },

  /* ============================================================ WORLD 4 */
  {
    id: 'idx',
    icon: 'database',
    name: 'Indexes & Performance',
    tagline: 'Make queries fast',
    blurb: 'The ESR rule, covered queries, and TTL indexes.',
    tint: 'rgba(94,12,158,0.30)',
    tintSolid: '#C390DF',
    levels: [
      {
        id: 'i1', title: 'Classify index choices', kind: 'index',
        prompt: 'The `events` collection has four query shapes. Pick the best index strategy for each one.',
        sub:    'Classify the full query shape: one equality field, equality+sort fields, Atlas Search text, or no index.',
        why:    'Indexes trade write cost for read speed. A compound index must include every field needed by that query shape — for example `{ userId: 1, createdAt: -1 }` supports filtering by userId and sorting by createdAt.',
        collection: 'events',
        fields: [
          { name: 'userId',             type: 'ObjectId', need: 'single', used: 'db.events.find({ userId })'  },
          { name: 'userId + createdAt', type: 'ObjectId + Date', need: 'compound', used: 'db.events.find({ userId }).sort({ createdAt: -1 })' },
          { name: 'title',              type: 'String', need: 'search', used: 'Atlas Search text query on event titles' },
          { name: 'isInternal',         type: 'Bool', need: 'none', used: 'low cardinality flag — usually do not index alone' }
        ],
        bank: [
          { id: 'single',   label: 'Single-field', kind: 'index' },
          { id: 'compound', label: 'Compound',     kind: 'index' },
          { id: 'search',   label: 'Atlas Search', kind: 'index' },
          { id: 'none',     label: 'No index',     kind: 'index' }
        ]
      },
      {
        id: 'i2', title: 'The ESR rule', kind: 'reorder',
        prompt: 'Put the fields of this compound index in ESR order: Equality, Sort, Range.',
        sub:    'For: db.orders.find({ status: "paid", amount: { $gt: 50 } }).sort({ createdAt: -1 })',
        why:    'ESR: index Equality fields first (smallest sub-tree), then the Sort key (so the index returns rows pre-sorted), then Range (which forces a scan inside the bucket).',
        stages: [
          { id: 'e', code: 'status: 1',     sub: 'Equality — { status: "paid" }', correct: 0 },
          { id: 's', code: 'createdAt: -1', sub: 'Sort — .sort({ createdAt: -1 })', correct: 1 },
          { id: 'r', code: 'amount: 1',     sub: 'Range — { $gt: 50 }',           correct: 2 }
        ],
        initial: ['r', 's', 'e']
      },
      {
        id: 'i3', title: 'TTL index', kind: 'fill',
        prompt: 'Expire session docs 24 hours after `lastSeen`.',
        sub:    'Add expireAfterSeconds to a date-typed field index.',
        why:    'TTL indexes are checked by a background thread once per minute. Don\'t use them for precise timing — expect drift of up to 60s.',
        snippet: [
          'db.sessions.', { blank: 'op' }, '(',
          '\n  { lastSeen: 1 },',
          '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
          '\n)'
        ],
        choices: {
          op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
          key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'],   answer: 'expireAfterSeconds' },
          sec: { options: ['86400', '24', '1440', '3600'],                       answer: '86400' }
        }
      },
      {
        id: 'i4', title: 'Covered query', kind: 'fill',
        prompt: 'Project only fields that live inside the index { sku: 1, price: 1 }.',
        sub:    'When every projected field is in the index, MongoDB skips the document fetch.',
        why:    'A *covered* query returns from the index alone — no disk seek. Watch for `totalDocsExamined: 0` in `explain()`.',
        snippet: [
          'db.products.find(',
          '\n  { sku: ', { blank: 'val' }, ' },',
          '\n  { _id: ', { blank: 'id' }, ', sku: 1, price: 1 }',
          '\n).', { blank: 'verb' }, '("executionStats")'
        ],
        choices: {
          val:  { options: ['"ESPRESSO-01"', 'ESPRESSO-01', '*', '{}'],  answer: '"ESPRESSO-01"' },
          id:   { options: ['0', '1', 'null', 'true'],                   answer: '0' },
          verb: { options: ['explain', 'plan', 'analyze', 'trace'],      answer: 'explain' }
        }
      }
    ]
  },

  /* ============================================================ WORLD 5 */
  {
    id: 'atlas',
    icon: 'cloud',
    name: 'Atlas Superpowers',
    tagline: 'Vector, search, triggers',
    blurb: 'The pieces that turn MongoDB into a modern AI data platform.',
    tint: 'rgba(0,237,100,0.22)',
    tintSolid: '#71F6BA',
    levels: [
      {
        id: 'v1', title: '$vectorSearch', kind: 'fill',
        prompt: 'Find the 5 nearest products to a query embedding.',
        sub:    'Atlas Vector Search runs k-NN against an HNSW index you created on `embedding`.',
        why:    'Vector search powers RAG. Generate the embedding from your LLM, pass it as `queryVector`, and Atlas returns the closest docs by cosine distance.',
        snippet: [
          'db.products.aggregate([{',
          '\n  $vectorSearch: {',
          '\n    index: "embed_idx",',
          '\n    path: ', { blank: 'path' }, ',',
          '\n    queryVector: queryEmbedding,',
          '\n    numCandidates: 150,',
          '\n    ', { blank: 'limit' }, ': 5',
          '\n  }',
          '\n}])'
        ],
        choices: {
          path:  { options: ['"embedding"', '"vector"', 'embedding', '*'], answer: '"embedding"' },
          limit: { options: ['limit', 'numResults', 'topK', 'k'],          answer: 'limit' }
        }
      },
      {
        id: 'v2', title: '$search — Atlas Search', kind: 'blocks',
        prompt: 'Use Atlas Search to find blog posts mentioning "aggregation pipeline".',
        sub:    'Atlas Search runs as a `$search` stage inside `aggregate()`, not as `find({ $text: ... })`.',
        why:    'Atlas Search uses a dedicated search index and the `$search` aggregation stage. It supports relevance scoring, analyzers, fuzzy matching, highlighting, autocomplete, and richer production search patterns than legacy `$text`.',
        snippet: [
          'db.posts.aggregate([',
          '\n  { ', { slot: 'stage' }, ': {',
          '\n    ', { slot: 'operator' }, ': {',
          '\n      path: ', { slot: 'path' }, ',',
          '\n      query: ', { slot: 'query' },
          '\n    }',
          '\n  } }',
          '\n])'
        ],
        bank: [
          { id: 'stage',    label: '$search',       kind: 'stage', answer: 'stage' },
          { id: 'operator', label: 'text',          kind: 'op',    answer: 'operator' },
          { id: 'path',     label: '"body"',        kind: 'field', answer: 'path' },
          { id: 'query',    label: '"aggregation pipeline"', kind: 'value', answer: 'query' },
          /* distractors */
          { id: 'x1',  label: '$text',         kind: 'op'    },
          { id: 'x2',  label: 'find',          kind: 'op'    },
          { id: 'x3',  label: 'aggregation pipeline', kind: 'value' }
        ]
      },
      {
        id: 'v3', title: 'Atlas Trigger', kind: 'fill',
        prompt: 'Send a welcome email whenever a user is inserted.',
        sub:    'Triggers run server-side on change events. Pick the event type and the collection.',
        why:    'Triggers attach to a change stream. Keep handlers small (<60s) and idempotent — they can re-fire.',
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
          col: { options: ['"users"', 'users', 'User', '*'],                          answer: '"users"' },
          evt: { options: ['"insert"', '"create"', '"write"', '"new"'],               answer: '"insert"' },
          fn:  { options: ['"sendWelcomeEmail"', 'sendWelcomeEmail', 'fn()', 'send()'], answer: '"sendWelcomeEmail"' }
        }
      },
      {
        id: 'v4', title: 'RAG: hybrid retrieval', kind: 'reorder',
        prompt: 'Pipeline for retrieval-augmented chat: filter by tenant, vector-search, then trim payload.',
        sub:    '$match early (tenant scope) → $vectorSearch (semantic) → $project (keep only what the LLM needs).',
        why:    'Tenant filters belong before semantic search so you only rank documents the user is allowed to see. Always trim the payload — every token costs.',
        stages: [
          { id: 'vs', code: '$vectorSearch: { index: "embed", path: "embedding", queryVector: q, limit: 8, filter: { tenantId } }', sub: 'k-NN with tenant prefilter', correct: 0 },
          { id: 'ms', code: '$match: { score: { $gt: 0.78 } }', sub: 'drop weak matches',  correct: 1 },
          { id: 'pj', code: '$project: { _id: 0, title: 1, chunk: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 }
        ],
        initial: ['pj', 'ms', 'vs']
      }
    ]
  }
];

/* ============================================================
 * Industry pack registry & helpers
 * ============================================================ */
window.MONGOLINGO_INDUSTRIES = {};

function registerMongoLingoIndustry(pack) {
  window.MONGOLINGO_INDUSTRIES[pack.id] = pack;
  return pack;
}

function createIndustryWorlds(profile) {
  const worlds = JSON.parse(JSON.stringify(WORLDS));
  const nouns = profile.nouns || {};
  const aha = profile.aha || [];
  const levelOverrides = profile.levels || {};

  worlds.forEach((world, wi) => {
    world.levels.forEach((level, li) => {
      const idx = wi * 4 + li;
      const moment = aha[idx % Math.max(aha.length, 1)] || {
        title: 'AHA: ' + profile.name + ' runs on connected data',
        message: profile.promise
      };
      level.aha = moment;

      // Apply full level override if provided
      if (levelOverrides[level.id]) {
        const override = levelOverrides[level.id];
        Object.keys(override).forEach(function(key) {
          level[key] = override[key];
        });
      }
    });
  });

  const [docs, query, agg, idxWorld, atlas] = worlds;

  // Only apply generic text substitutions for levels that were NOT overridden
  if (!levelOverrides['d1']) {
    docs.levels[0].title = 'Model a ' + (nouns.profile || 'profile') + ' document';
    docs.levels[0].prompt = 'Drag the right values into a ' + profile.name + ' ' + (nouns.profile || 'profile') + ' document.';
    docs.levels[0].why = profile.name + ' teams move fast when operational data fits the way the business thinks. MongoDB documents keep rich ' + (nouns.profile || 'profile') + ' context together without forcing every new attribute through a rigid migration.';
  }
  if (!levelOverrides['d2']) {
    docs.levels[1].prompt = 'Insert a new ' + (nouns.item || 'record') + ' into the ' + (nouns.catalog || 'catalog') + '. Drag the missing pieces.';
    docs.levels[1].why = 'MongoDB makes it natural to capture new ' + (nouns.itemPlural || 'records') + ' as JSON-shaped events, products, assets, or cases while preserving room for industry-specific fields.';
  }

  docs.name = (profile.shortName || profile.name) + ' Documents';
  docs.tagline = 'Model the domain';
  docs.blurb = profile.promise;

  query.name = (profile.shortName || profile.name) + ' Queries';
  query.tagline = 'Ask operational questions';
  query.blurb = 'Find and filter ' + profile.name + ' data in the shapes applications actually need.';
  if (!levelOverrides['q1']) {
    query.levels[0].prompt = 'Find every ' + (nouns.user || 'user') + ' whose segment is "priority".';
    query.levels[0].snippet = ['db.', { slot: 'field' }, '.find({ segment: ', { slot: 'val' }, ' })'];
    query.levels[0].bank = [
      { id: 'field', label: nouns.profileCollection || 'customers', kind: 'field', answer: 'field' },
      { id: 'val', label: '"priority"', kind: 'value', answer: 'val' },
      { id: 'x1', label: nouns.itemCollection || 'events', kind: 'field' },
      { id: 'x2', label: 'priority', kind: 'value' },
      { id: 'x3', label: 'tier', kind: 'field' }
    ];
    query.levels[0].why = 'MongoDB indexes make high-volume ' + profile.name + ' lookups fast while keeping each ' + (nouns.profile || 'profile') + ' flexible enough for changing business signals.';
  }
  if (!levelOverrides['q2']) {
    query.levels[1].prompt = 'Find ' + (nouns.transactionPlural || 'events') + ' over the important threshold. Drag the operator and value.';
    query.levels[1].why = 'Aggregation lets ' + profile.name + ' teams filter early, transform in place, and feed dashboards, apps, and AI workflows from the same operational data.';
  }

  agg.name = (profile.shortName || profile.name) + ' Pipelines';
  agg.tagline = 'Transform in place';
  agg.blurb = 'Turn ' + profile.name + ' events into ranked, joined, and shaped outcomes.';
  if (!levelOverrides['a1']) {
    agg.levels[0].prompt = profile.name + ': rank ' + (nouns.profilePlural || 'customers') + ' by 2024 value — re-order the stages.';
    agg.levels[0].why = 'The aggregation pipeline is MongoDB\'s in-database transformation engine: filter, group, rank, and reshape ' + profile.name + ' data without exporting it to a separate ETL tier.';
  }
  if (!levelOverrides['a3']) {
    agg.levels[2].prompt = 'Attach each ' + (nouns.transaction || 'event') + ' to its ' + (nouns.profile || 'profile') + ' record, then keep only the useful summary.';
    agg.levels[2].why = 'MongoDB supports embedding when data is accessed together and $lookup when independent entities need to meet at query time — a practical fit for ' + profile.name + '.';
  }

  idxWorld.name = (profile.shortName || profile.name) + ' Performance';
  idxWorld.tagline = 'Make reads fast';
  idxWorld.blurb = 'Index the ' + profile.name + ' access patterns that matter.';
  if (!levelOverrides['i1']) {
    idxWorld.levels[0].prompt = 'Classify the best index strategy for common ' + profile.name + ' query shapes.';
    idxWorld.levels[0].why = 'MongoDB performance tuning maps directly to how ' + profile.name + ' applications read data: equality lookups, compound filter+sort patterns, Atlas Search, and low-cardinality fields that should not be indexed alone.';
  }
  if (!levelOverrides['i2']) {
    idxWorld.levels[1].prompt = 'Put this ' + profile.name + ' compound index in ESR order: Equality, Sort, Range.';
  }

  atlas.name = (profile.shortName || profile.name) + ' Atlas AI';
  atlas.tagline = 'Search, vectors, triggers';
  atlas.blurb = 'Use Atlas Search and Vector Search to build smarter ' + profile.name + ' experiences.';
  if (!levelOverrides['v1']) {
    atlas.levels[0].prompt = 'Find the 5 nearest ' + (nouns.itemPlural || 'records') + ' to an embedding.';
    atlas.levels[0].why = 'Vector Search lets ' + profile.name + ' teams build semantic search and RAG over operational data already living in MongoDB Atlas.';
  }
  if (!levelOverrides['v2']) {
    atlas.levels[1].prompt = 'Use Atlas Search to find ' + (nouns.documentPlural || 'documents') + ' mentioning "' + (profile.searchPhrase || 'aggregation pipeline') + '".';
    atlas.levels[1].bank = atlas.levels[1].bank.map(function(b) { return b.id === 'query' ? Object.assign({}, b, { label: '"' + (profile.searchPhrase || 'aggregation pipeline') + '"' }) : b; });
    atlas.levels[1].why = 'Atlas Search gives ' + profile.name + ' applications relevance scoring, analyzers, fuzzy matching, autocomplete, and highlighting without bolting on a separate search cluster.';
  }
  if (!levelOverrides['v3']) {
    atlas.levels[2] = atlas.levels[2]; // no change needed
  }
  if (!levelOverrides['v4']) {
    atlas.levels[3].prompt = profile.name + ' RAG pipeline: scope by tenant or domain, retrieve semantically, then trim payload.';
    atlas.levels[3].why = 'MongoDB Atlas brings operational data, search, vector search, and app services together so ' + profile.name + ' teams can build AI features with fewer moving parts.';
  }

  return worlds;
}

function createMongoLingoIndustryPack(profile) {
  return {
    id: profile.id,
    name: profile.name,
    shortName: profile.shortName || profile.name,
    description: profile.description || profile.promise,
    promise: profile.promise,
    hints: Object.assign({}, HINTS, profile.hints || {}),
    worlds: createIndustryWorlds(profile)
  };
}

/* Register the general/default pack */
registerMongoLingoIndustry({
  id: 'general',
  name: 'General MongoDB Foundations',
  shortName: 'General',
  description: 'A broad MongoDB learning path from documents to Atlas Search and Vector Search.',
  promise: 'MongoDB fits modern applications because documents, indexes, aggregation, search, and vectors work together in one developer data platform.',
  hints: HINTS,
  worlds: WORLDS
});

window.WORLDS = WORLDS;
window.HINTS  = HINTS;
window.LEVEL_HINTS = LEVEL_HINTS;
