/* MongoLingo — Retail & E-commerce industry content pack.
 * Every level has proprietary exercise content specific to retail workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'retail',
  name: 'Retail & E-commerce',
  shortName: 'Retail',
  description: 'MongoDB powers retail experiences by joining product catalogs, inventory, carts, orders, personalization, search, and recommendations.',
  promise: 'MongoDB powers retail experiences by joining product catalogs, inventory, carts, orders, personalization, search, and recommendations.',
  searchPhrase: 'waterproof hiking jacket',
  nouns: { profile: 'shopper', profilePlural: 'shoppers', profileCollection: 'customers', item: 'product', itemPlural: 'products', itemCollection: 'products', catalog: 'product catalog', user: 'store associate', transaction: 'order', transactionPlural: 'orders', documentPlural: 'product descriptions' },
  stream: { eventCollection: 'orderEvents', alertCollection: 'opsAlerts', eventPlural: 'order and inventory events', criticalLabel: 'fulfillment-risk events', scoreField: 'priorityScore', threshold: 85, alertType: 'fulfillment_risk', sourceDb: 'retail', outcome: 'store operations dashboards and recommendation workflows' },
  aha: [
    { title: 'AHA: Product catalogs are naturally document-shaped', message: 'Shoes have sizes, electronics have specs, food has nutrition — MongoDB documents hold any product shape without a universal table.' },
    { title: 'AHA: Personalization needs changing signals', message: 'Shopper preferences, cart history, and recommendations evolve constantly — flexible documents keep up without migrations.' },
    { title: 'AHA: Aggregation ranks revenue and inventory quickly', message: 'Pipeline stages can compute best-sellers, low-stock alerts, and revenue trends from live order data.' },
    { title: 'AHA: Search and vectors create discovery experiences', message: 'Atlas Search powers autocomplete and faceted browse; Vector Search enables "find similar" and visual search.' }
  ],
  levels: {
    /* ===== WORLD 1: Documents & Collections ===== */
    d1: {
      title: 'Build a product document', kind: 'shape',
      prompt: 'Drag the right values into the product listing for a hiking jacket.',
      sub: 'Product documents combine name, price, category, and availability in one shape.',
      why: 'Retail product catalogs are naturally document-shaped — shoes have sizes, electronics have specs, jackets have materials. MongoDB lets each product carry its own attribute set without a one-size-fits-all table.',
      skeleton: [
        { key: '_id',      type: 'oid',  value: 'ObjectId("66b...")' },
        { key: 'name',     type: 'slot', slot: 'name' },
        { key: 'price',    type: 'slot', slot: 'price' },
        { key: 'category', type: 'slot', slot: 'cat' },
        { key: 'inStock',  type: 'slot', slot: 'stock' }
      ],
      bank: [
        { id: 'name',  label: '"Trail Pro Jacket"', kind: 'value' },
        { id: 'price', label: '189.99',             kind: 'value' },
        { id: 'cat',   label: '"outerwear"',        kind: 'value' },
        { id: 'stock', label: 'true',               kind: 'value' },
        { id: 'd1',    label: 'Trail Pro Jacket',   kind: 'value' },
        { id: 'd2',    label: '"189.99"',           kind: 'value' },
        { id: 'd3',    label: '"true"',             kind: 'value' }
      ],
      answer: { name: 'name', price: 'price', cat: 'cat', stock: 'stock' }
    },
    d2: {
      title: 'insertOne() — add to catalog', kind: 'blocks',
      prompt: 'Add a new sneaker to the products collection. Drag the missing pieces.',
      sub: 'insertOne() writes a single product document and returns its generated _id.',
      why: 'New products arrive daily in retail. `insertOne()` captures the full product shape — name, price, variants — in a single write, and MongoDB generates the `_id` automatically.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  name: ', { slot: 'val' }, ',',
        '\n  price: 129.00,',
        '\n  inStock: ', { slot: 'bool' },
        '\n})'
      ],
      bank: [
        { id: 'op',   label: 'insertOne',      kind: 'op',    answer: 'op' },
        { id: 'col',  label: 'products',        kind: 'field', answer: 'col' },
        { id: 'val',  label: '"Air Runner X"',  kind: 'value', answer: 'val' },
        { id: 'bool', label: 'true',            kind: 'value', answer: 'bool' },
        { id: 'x1',   label: 'addOne',          kind: 'op' },
        { id: 'x2',   label: 'inventory',       kind: 'field' },
        { id: 'x3',   label: 'Air Runner X',    kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — mark item shipped', kind: 'fill',
      prompt: 'Update order #ORD-7821 to "shipped" status.',
      sub: '$set patches specific fields without replacing the entire order document.',
      why: 'Order status changes frequently (placed → paid → shipped → delivered). `$set` updates only the status field, preserving all line items, payment details, and shipping info in the document.',
      snippet: [
        'db.orders.updateOne(',
        '\n  { orderId: "ORD-7821" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['status', 'state', 'shipped', 'flag'], answer: 'status' },
        val:   { options: ['"shipped"', 'shipped', 'true', '1'], answer: '"shipped"' }
      }
    },
    d4: {
      title: 'deleteOne() — remove expired cart', kind: 'fill',
      prompt: 'Delete the oldest abandoned cart from the carts collection.',
      sub: 'deleteOne() removes exactly one document — sort to target the oldest.',
      why: 'Abandoned carts pile up and waste storage. Deleting the oldest expired cart keeps the collection lean. Always sort by creation date to pick the right one — a broad filter could delete active carts.',
      snippet: [
        'db.carts.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { createdAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"abandoned"', 'abandoned', '"expired"'], answer: '"abandoned"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },

    /* ===== WORLD 2: Querying ===== */
    q1: {
      title: 'Find products by category', kind: 'blocks',
      prompt: 'Find every product in the "electronics" category.',
      sub: 'Equality queries match a field value directly — fast with an index.',
      why: 'Category browsing is the most common retail query. An index on `category` lets MongoDB return matching products in microseconds, even across millions of SKUs.',
      snippet: [
        'db.products.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: 'category',       kind: 'field', answer: 'field' },
        { id: 'val',   label: '"electronics"',   kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'type',            kind: 'field' },
        { id: 'x2',    label: 'electronics',     kind: 'value' },
        { id: 'x3',    label: 'department',      kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — premium products', kind: 'blocks',
      prompt: 'Find products priced over $500 for the luxury tier page.',
      sub: '$match with $gt filters products above a price threshold.',
      why: 'Price-range filters are fundamental to e-commerce. Placing $match with an indexed `price` field first means MongoDB scans only the relevant price bucket, not the entire catalog.',
      snippet: [
        'db.products.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { price: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '500',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"500"',   kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-category browse', kind: 'fill',
      prompt: 'Find products in "shoes" or "accessories" categories.',
      sub: '$in matches any value in the array — great for multi-select filters.',
      why: 'Shoppers often filter by multiple categories simultaneously. `$in` handles this efficiently with a single index scan, unlike chaining multiple `$or` conditions.',
      snippet: [
        'db.products.find({',
        '\n  category: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["shoes", "accessories"]', '"shoes, accessories"', '{ shoes, accessories }', '[shoes, accessories]'], answer: '["shoes", "accessories"]' }
      }
    },
    q4: {
      title: 'Compound filter — price + rating', kind: 'fill',
      prompt: 'Find in-stock products rated 4 stars or above, priced under $50.',
      sub: 'Combine equality and range filters in one query object.',
      why: 'Shoppers want "good and cheap" — combining inStock equality with rating/price ranges. MongoDB ANDs multiple fields implicitly, making these compound filters simple to write and fast to execute.',
      snippet: [
        'db.products.find({',
        '\n  inStock: true,',
        '\n  rating: { ', { blank: 'gte' }, ': 4 },',
        '\n  price: { ', { blank: 'lt' }, ': 50 }',
        '\n})'
      ],
      choices: {
        gte: { options: ['$gte', '$gt', '$geq', '>='], answer: '$gte' },
        lt:  { options: ['$lt', '$lte', '$leq', '<='], answer: '$lt' }
      }
    },

    /* ===== WORLD 3: Aggregation Pipeline ===== */
    a1: {
      title: 'Best-sellers by revenue', kind: 'reorder',
      prompt: 'Rank products by total revenue in 2024 — re-order the pipeline stages.',
      sub: 'Filter to 2024 orders, group by product, sort by revenue, limit to top 10.',
      why: 'Best-seller rankings drive homepage placement and restocking decisions. Filter first (shrink the dataset), group to sum revenue per SKU, sort descending, and limit to the top N.',
      stages: [
        { id: 'm', code: '$match: { orderDate: { $gte: ISODate("2024-01-01") } }', sub: 'filter to 2024 orders', correct: 0 },
        { id: 'g', code: '$group: { _id: "$productId", revenue: { $sum: "$lineTotal" } }', sub: 'sum revenue per product', correct: 1 },
        { id: 's', code: '$sort: { revenue: -1 }', sub: 'highest revenue first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 products', correct: 3 }
      ],
      initial: ['s', 'l', 'm', 'g']
    },
    a2: {
      title: '$project — order summary', kind: 'fill',
      prompt: 'Return just the product name and total quantity sold — hide _id.',
      sub: '$project controls which fields appear in the output.',
      why: 'Dashboard widgets need lean payloads. `$project` with `_id: 0` strips the internal identifier, delivering only the fields the frontend needs — productName and totalQty.',
      snippet: [
        'db.orderLines.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    productName: ', { blank: 'one' }, ',',
        '\n    totalQty: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$totalQty"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup — enrich orders with product info', kind: 'reorder',
      prompt: 'Attach product details to each order line, then show just the product name.',
      sub: '$lookup joins products, $unwind flattens, $project picks fields.',
      why: 'Order history pages need product names alongside line items. `$lookup` brings product data in, `$unwind` flattens the array, and `$project` delivers a clean shape for the storefront.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "products", localField: "productId", foreignField: "_id", as: "product" }', sub: 'join product catalog', correct: 0 },
        { id: 'un', code: '$unwind: "$product"', sub: 'flatten to one doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, orderId: 1, productName: "$product.name", qty: 1 }', sub: 'keep useful fields', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — newest arrivals', kind: 'blocks',
      prompt: 'Show the 6 most recently added products.',
      sub: 'Sort by addedAt descending, then limit to 6 for the "New Arrivals" carousel.',
      why: 'The "New Arrivals" section drives discovery. `$sort` + `$limit` together let MongoDB stream only the top-N newest products without sorting the entire catalog in memory.',
      snippet: [
        'db.products.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { addedAt: ', { slot: 'dir' }, ' } },',
        '\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }',
        '\n])'
      ],
      bank: [
        { id: 'sort',  label: '$sort',  kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir',   label: '-1',     kind: 'value', answer: 'dir' },
        { id: 'n',     label: '6',      kind: 'value', answer: 'n' },
        { id: 'x1',    label: '$top',   kind: 'stage' },
        { id: 'x2',    label: '$first', kind: 'stage' },
        { id: 'x3',    label: '1',      kind: 'value' },
        { id: 'x4',    label: '"6"',    kind: 'value' }
      ]
    },

    /* ===== WORLD 4: Indexes & Performance ===== */
    i1: {
      title: 'Index strategies for e-commerce', kind: 'index',
      prompt: 'The `products` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each access pattern to single-field, compound, Atlas Search, or no index.',
      why: 'E-commerce queries span simple category lookups, category+price combos, full-text product search, and low-cardinality flags. Each needs the right index type to keep page loads under 100ms.',
      collection: 'products',
      fields: [
        { name: 'category', type: 'String', need: 'single', used: 'db.products.find({ category })' },
        { name: 'category + price', type: 'String + Number', need: 'compound', used: 'db.products.find({ category }).sort({ price: 1 })' },
        { name: 'description', type: 'String', need: 'search', used: 'Atlas Search for product discovery and autocomplete' },
        { name: 'isFeatured', type: 'Bool', need: 'none', used: 'low cardinality — only true/false values' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for product listings', kind: 'reorder',
      prompt: 'Order this compound index for: find in-stock products under $100, sorted by rating.',
      sub: 'For: db.products.find({ inStock: true, price: { $lt: 100 } }).sort({ rating: -1 })',
      why: 'ESR in retail: equality (inStock) narrows to available items, sort (rating) delivers results pre-ordered for display, range (price) scans only the relevant price bucket.',
      stages: [
        { id: 'e', code: 'inStock: 1',  sub: 'Equality — { inStock: true }', correct: 0 },
        { id: 's', code: 'rating: -1',  sub: 'Sort — .sort({ rating: -1 })', correct: 1 },
        { id: 'r', code: 'price: 1',    sub: 'Range — { $lt: 100 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire abandoned carts', kind: 'fill',
      prompt: 'Auto-delete shopping carts 7 days after last update.',
      sub: 'TTL indexes clean up stale carts automatically — no scheduled jobs needed.',
      why: 'Abandoned carts waste storage and skew analytics. A TTL index on `updatedAt` automatically removes carts after 7 days (604800 seconds), keeping the collection lean without maintenance scripts.',
      snippet: [
        'db.carts.', { blank: 'op' }, '(',
        '\n  { updatedAt: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['604800', '7', '168', '86400'], answer: '604800' }
      }
    },
    i4: {
      title: 'Covered query — SKU price check', kind: 'fill',
      prompt: 'Query only fields inside the index { sku: 1, price: 1 } for a zero-fetch lookup.',
      sub: 'When all projected fields live in the index, MongoDB never touches the document.',
      why: 'Price-check APIs hit millions of times per day. A covered query on { sku, price } returns from the index alone — zero document fetches, sub-millisecond latency at checkout scale.',
      snippet: [
        'db.products.find(',
        '\n  { sku: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', sku: 1, price: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"SKU-JACKET-01"', 'SKU-JACKET-01', '*', '{}'], answer: '"SKU-JACKET-01"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Superpowers ===== */
    v1: {
      title: '$vectorSearch — similar products', kind: 'fill',
      prompt: 'Find the 5 products most visually similar to a query image embedding.',
      sub: 'Atlas Vector Search finds nearest neighbors by cosine similarity on product embeddings.',
      why: 'Visual similarity ("shop the look") uses product image embeddings. Vector Search finds items with similar visual features even when text descriptions differ — powering "more like this" recommendations.',
      snippet: [
        'db.products.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "product_embed_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: imageEmbedding,',
        '\n    numCandidates: 100,',
        '\n    ', { blank: 'limit' }, ': 5',
        '\n  }',
        '\n}])'
      ],
      choices: {
        path:  { options: ['"embedding"', '"vector"', 'embedding', '"image"'], answer: '"embedding"' },
        limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' }
      }
    },
    v2: {
      title: '$search — product discovery', kind: 'blocks',
      prompt: 'Use Atlas Search to find products matching "waterproof hiking jacket".',
      sub: 'Atlas Search powers autocomplete, faceted browse, and relevance-ranked product results.',
      why: 'Site search is the #1 revenue driver in e-commerce. Atlas Search gives you relevance scoring, typo tolerance, synonyms, and facets — all from the same data already in MongoDB.',
      snippet: [
        'db.products.aggregate([',
        '\n  { ', { slot: 'stage' }, ': {',
        '\n    ', { slot: 'operator' }, ': {',
        '\n      path: ', { slot: 'path' }, ',',
        '\n      query: ', { slot: 'query' },
        '\n    }',
        '\n  } }',
        '\n])'
      ],
      bank: [
        { id: 'stage',    label: '$search',                     kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text',                        kind: 'op',    answer: 'operator' },
        { id: 'path',     label: '"description"',               kind: 'field', answer: 'path' },
        { id: 'query',    label: '"waterproof hiking jacket"',  kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                       kind: 'op' },
        { id: 'x2',       label: 'find',                        kind: 'op' },
        { id: 'x3',       label: 'waterproof hiking jacket',    kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — low stock alert', kind: 'fill',
      prompt: 'Fire a restock notification whenever inventory is updated below threshold.',
      sub: 'Database triggers watch for changes and fire functions in real time.',
      why: 'Real-time inventory alerts prevent stockouts. Atlas Triggers fire on update events and can notify procurement systems within seconds — no polling or batch jobs needed.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "ecommerce",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"inventory"', 'inventory', 'Inventory', '*'], answer: '"inventory"' },
        evt: { options: ['"update"', '"insert"', '"write"', '"modify"'], answer: '"update"' },
        fn:  { options: ['"checkRestockLevel"', 'checkRestockLevel', 'fn()', 'restock()'], answer: '"checkRestockLevel"' }
      }
    },
    v4: {
      title: 'RAG — shopping assistant', kind: 'reorder',
      prompt: 'Build a RAG pipeline for an AI shopping assistant: scope to store, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to store → drop low-confidence matches → project only what the LLM needs.',
      why: 'AI shopping assistants must search within the retailer\'s catalog only. Pre-filtering by storeId ensures relevance, and trimming the payload keeps LLM costs low while delivering accurate recommendations.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "catalog_embed", path: "embedding", queryVector: q, limit: 8, filter: { storeId } }', sub: 'k-NN scoped to this store', correct: 0 },
                { id: 'pj', code: '$project: { _id: 0, name: 1, description: 1, price: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.75 } }', sub: 'drop weak matches', correct: 1 },
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
