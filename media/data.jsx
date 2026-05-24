/* MongoLingo — Media & Entertainment industry content pack.
 * Every level has proprietary exercise content specific to media workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'media',
  name: 'Media & Entertainment',
  shortName: 'Media',
  description: 'MongoDB fits media platforms by combining content metadata, audience events, entitlements, recommendations, search, and AI content workflows.',
  promise: 'MongoDB fits media platforms by combining content metadata, audience events, entitlements, recommendations, search, and AI content workflows.',
  searchPhrase: 'space documentary',
  nouns: { profile: 'viewer', profilePlural: 'viewers', profileCollection: 'viewers', item: 'title', itemPlural: 'titles', itemCollection: 'titles', catalog: 'content catalog', user: 'content editor', transaction: 'viewing event', transactionPlural: 'viewing events', documentPlural: 'content metadata' },
  aha: [
    { title: 'AHA: Content metadata is rich and variable', message: 'Movies have cast and ratings, podcasts have episodes, live events have schedules — MongoDB documents hold any content shape.' },
    { title: 'AHA: Audience signals drive personalization', message: 'Watch history, preferences, and engagement signals evolve per session. Flexible documents keep recommendations fresh.' },
    { title: 'AHA: Aggregation ranks engagement in real time', message: 'Pipeline stages can compute trending content, audience cohorts, and revenue attribution from live event streams.' },
    { title: 'AHA: Search and vectors power discovery', message: 'Atlas Search enables browse and autocomplete; Vector Search powers "more like this" and mood-based recommendations.' }
  ],
  levels: {
    d1: {
      title: 'Build a content title document', kind: 'shape',
      prompt: 'Drag the right values into the title record for a new documentary.',
      sub: 'Content documents combine title, genre, runtime, and availability.',
      why: 'Media catalogs are naturally document-shaped — movies have cast lists, series have seasons, podcasts have episodes. MongoDB lets each content type carry its own metadata without a universal table.',
      skeleton: [
        { key: '_id',     type: 'oid',  value: 'ObjectId("71b...")' },
        { key: 'title',   type: 'slot', slot: 'title' },
        { key: 'genre',   type: 'slot', slot: 'genre' },
        { key: 'runtime', type: 'slot', slot: 'runtime' },
        { key: 'active',  type: 'slot', slot: 'active' }
      ],
      bank: [
        { id: 'title',   label: '"Cosmos: Beyond"',  kind: 'value' },
        { id: 'genre',   label: '"documentary"',     kind: 'value' },
        { id: 'runtime', label: '92',                kind: 'value' },
        { id: 'active',  label: 'true',              kind: 'value' },
        { id: 'd1',      label: 'Cosmos: Beyond',    kind: 'value' },
        { id: 'd2',      label: '"92"',              kind: 'value' },
        { id: 'd3',      label: '"true"',            kind: 'value' }
      ],
      answer: { title: 'title', genre: 'genre', runtime: 'runtime', active: 'active' }
    },
    d2: {
      title: 'insertOne() — log a viewing event', kind: 'blocks',
      prompt: 'Record a new viewing event into the viewingEvents collection.',
      sub: 'Each viewing event captures what was watched, for how long, and by whom.',
      why: 'Viewing events feed recommendation engines, trending lists, and revenue analytics. `insertOne()` captures each event atomically so downstream systems always see a complete engagement picture.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  titleId: "tt_cosmos",',
        '\n  duration: ', { slot: 'val' }, ',',
        '\n  completed: ', { slot: 'bool' },
        '\n})'
      ],
      bank: [
        { id: 'op',   label: 'insertOne',      kind: 'op',    answer: 'op' },
        { id: 'col',  label: 'viewingEvents',   kind: 'field', answer: 'col' },
        { id: 'val',  label: '4200',            kind: 'value', answer: 'val' },
        { id: 'bool', label: 'true',            kind: 'value', answer: 'bool' },
        { id: 'x1',   label: 'addOne',          kind: 'op' },
        { id: 'x2',   label: 'streams',         kind: 'field' },
        { id: 'x3',   label: '"4200"',          kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — publish a title', kind: 'fill',
      prompt: 'Set title #TT-2091 status to "published".',
      sub: '$set patches the publication status without replacing metadata.',
      why: 'Publishing a title must preserve all metadata (cast, synopsis, artwork) while flipping status to "published". `$set` patches only the status field cleanly.',
      snippet: [
        'db.titles.updateOne(',
        '\n  { titleId: "TT-2091" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['status', 'state', 'published', 'phase'], answer: 'status' },
        val:   { options: ['"published"', 'published', 'true', '"live"'], answer: '"published"' }
      }
    },
    d4: {
      title: 'deleteOne() — remove expired license', kind: 'fill',
      prompt: 'Remove the oldest expired content license from the entitlements collection.',
      sub: 'deleteOne() removes exactly one expired license document.',
      why: 'Expired content licenses must be removed to prevent unauthorized streaming. Sort by expiresAt ascending to target the oldest, avoiding accidental removal of active licenses.',
      snippet: [
        'db.entitlements.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { expiresAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"expired"', 'expired', '"revoked"'], answer: '"expired"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },
    q1: {
      title: 'Find titles by genre', kind: 'blocks',
      prompt: 'Find every title in the "documentary" genre.',
      sub: 'Equality queries power genre-based content browsing.',
      why: 'Genre pages are the primary browse experience. An index on `genre` returns matching titles in microseconds — even across catalogs with millions of titles.',
      snippet: [ 'db.titles.find({ ', { slot: 'field' }, ': ', { slot: 'val' }, ' })' ],
      bank: [
        { id: 'field', label: 'genre',          kind: 'field', answer: 'field' },
        { id: 'val',   label: '"documentary"',   kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'type',            kind: 'field' },
        { id: 'x2',    label: 'documentary',     kind: 'value' },
        { id: 'x3',    label: 'category',        kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — trending by views', kind: 'blocks',
      prompt: 'Find titles with over 1 million views this week for the trending shelf.',
      sub: '$match with $gt filters high-engagement content.',
      why: 'Trending shelves drive engagement. $match with $gt on an indexed `weeklyViews` field instantly surfaces content above the trending threshold for homepage placement.',
      snippet: [
        'db.titles.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { weeklyViews: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match',  kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',     kind: 'op',    answer: 'op' },
        { id: 'val',   label: '1000000', kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter',  kind: 'stage' },
        { id: 'x2',    label: '$gte',     kind: 'op' },
        { id: 'x3',    label: '$lt',      kind: 'op' },
        { id: 'x4',    label: '"1000000"', kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-genre browse', kind: 'fill',
      prompt: 'Find titles in "sci-fi" or "fantasy" genres.',
      sub: '$in matches any genre value — perfect for multi-select browse filters.',
      why: 'Viewers often browse multiple related genres. `$in` efficiently queries multiple genre values with a single index scan.',
      snippet: [ 'db.titles.find({\n  genre: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }\n})' ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["sci-fi", "fantasy"]', '"sci-fi, fantasy"', '{ sci-fi, fantasy }', '[sci-fi, fantasy]'], answer: '["sci-fi", "fantasy"]' }
      }
    },
    q4: {
      title: 'Compound filter — genre + rating', kind: 'fill',
      prompt: 'Find active titles rated 8.0 or above in the documentary genre.',
      sub: 'Combine equality and range operators for curated shelves.',
      why: 'Curated "Best of" shelves combine genre equality with rating ranges. MongoDB ANDs fields implicitly for simple, fast compound queries.',
      snippet: [ 'db.titles.find({\n  genre: "documentary",\n  active: true,\n  rating: { ', { blank: 'op' }, ': 8.0 }\n})' ],
      choices: { op: { options: ['$gte', '$gt', '$eq', '>='], answer: '$gte' } }
    },
    a1: {
      title: 'Top titles by watch hours', kind: 'reorder',
      prompt: 'Rank titles by total watch hours in 2024 — re-order the pipeline stages.',
      sub: 'Filter to 2024 events, group by title, sort by hours, limit to top 10.',
      why: 'Watch-hour rankings drive licensing decisions and homepage placement. Filter first, group to sum hours per title, sort descending, and limit to top performers.',
      stages: [
        { id: 'm', code: '$match: { timestamp: { $gte: ISODate("2024-01-01") } }', sub: 'filter to 2024 events', correct: 0 },
        { id: 'g', code: '$group: { _id: "$titleId", watchHours: { $sum: "$duration" } }', sub: 'sum hours per title', correct: 1 },
        { id: 's', code: '$sort: { watchHours: -1 }', sub: 'most watched first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 titles', correct: 3 }
      ],
      initial: ['l', 's', 'm', 'g']
    },
    a2: {
      title: '$project — content card shape', kind: 'fill',
      prompt: 'Return just the title name and rating — hide _id.',
      sub: '$project shapes output for content card components.',
      why: 'UI content cards need minimal data. `$project` with `_id: 0` strips internals and delivers only title and rating for the frontend.',
      snippet: [ 'db.titles.aggregate([\n  { $project: {\n    _id: ', { blank: 'id' }, ',\n    title: ', { blank: 'one' }, ',\n    rating: ', { blank: 'one2' }, '\n  } }\n])' ],
      choices: { id: { options: ['0', '1', 'false', 'null'], answer: '0' }, one: { options: ['1', '0', 'true', '"yes"'], answer: '1' }, one2: { options: ['1', '0', '"$rating"', 'yes'], answer: '1' } }
    },
    a3: {
      title: '$lookup — enrich events with title metadata', kind: 'reorder',
      prompt: 'Attach title genre to each viewing event, then extract for analytics.',
      sub: '$lookup joins title data, $unwind flattens, $project picks fields.',
      why: 'Engagement analytics need content context. `$lookup` brings title metadata in, enabling genre-level engagement analysis without denormalizing the catalog.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "titles", localField: "titleId", foreignField: "_id", as: "title" }', sub: 'join title metadata', correct: 0 },
        { id: 'un', code: '$unwind: "$title"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, viewerId: 1, genre: "$title.genre", duration: 1 }', sub: 'keep event + genre', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — new releases', kind: 'blocks',
      prompt: 'Show the 8 most recently added titles.',
      sub: 'Sort by addedAt descending, limit to 8 for the "New" row.',
      why: 'The "New Releases" row drives first-day engagement. `$sort` + `$limit` streams the top-N newest titles without sorting the entire catalog.',
      snippet: [ 'db.titles.aggregate([\n  { ', { slot: 'sort' }, ': { addedAt: ', { slot: 'dir' }, ' } },\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }\n])' ],
      bank: [
        { id: 'sort', label: '$sort', kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir', label: '-1', kind: 'value', answer: 'dir' },
        { id: 'n', label: '8', kind: 'value', answer: 'n' },
        { id: 'x1', label: '$top', kind: 'stage' },
        { id: 'x2', label: '$first', kind: 'stage' },
        { id: 'x3', label: '1', kind: 'value' },
        { id: 'x4', label: '"8"', kind: 'value' }
      ]
    },
    i1: {
      title: 'Index strategies for content queries', kind: 'index',
      prompt: 'The `titles` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each content access pattern to the right index type.',
      why: 'Media queries span genre lookups, genre+rating combos, full-text search over synopses, and low-cardinality flags. Each needs the right index for fast browse and discovery.',
      collection: 'titles',
      fields: [
        { name: 'genre', type: 'String', need: 'single', used: 'db.titles.find({ genre })' },
        { name: 'genre + rating', type: 'String + Number', need: 'compound', used: 'db.titles.find({ genre }).sort({ rating: -1 })' },
        { name: 'synopsis', type: 'String', need: 'search', used: 'Atlas Search for content discovery and autocomplete' },
        { name: 'isOriginal', type: 'Bool', need: 'none', used: 'low cardinality — only true/false' }
      ],
      bank: [ { id: 'single', label: 'Single-field', kind: 'index' }, { id: 'compound', label: 'Compound', kind: 'index' }, { id: 'search', label: 'Atlas Search', kind: 'index' }, { id: 'none', label: 'No index', kind: 'index' } ]
    },
    i2: {
      title: 'ESR for content listings', kind: 'reorder',
      prompt: 'Order this compound index for: find active titles over 90 min, sorted by rating.',
      sub: 'For: db.titles.find({ active: true, runtime: { $gt: 90 } }).sort({ rating: -1 })',
      why: 'ESR in media: equality (active) narrows to available titles, sort (rating) delivers results ranked for display, range (runtime) scans only feature-length content.',
      stages: [
        { id: 'e', code: 'active: 1', sub: 'Equality — { active: true }', correct: 0 },
        { id: 's', code: 'rating: -1', sub: 'Sort — .sort({ rating: -1 })', correct: 1 },
        { id: 'r', code: 'runtime: 1', sub: 'Range — { $gt: 90 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire watch sessions', kind: 'fill',
      prompt: 'Auto-delete streaming session tokens 4 hours after creation.',
      sub: 'TTL indexes clean up expired sessions automatically.',
      why: 'Streaming sessions expire after a viewing window. A TTL index on `createdAt` auto-removes them after 4 hours (14400 seconds), preventing session reuse without manual cleanup.',
      snippet: [ 'db.sessions.', { blank: 'op' }, '(\n  { createdAt: 1 },\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }\n)' ],
      choices: { op: { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' }, key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' }, sec: { options: ['14400', '4', '240', '86400'], answer: '14400' } }
    },
    i4: {
      title: 'Covered query — title lookup', kind: 'fill',
      prompt: 'Query only fields in the index { titleId: 1, genre: 1 } for zero-fetch lookup.',
      sub: 'Covered queries return from the index — critical for high-frequency catalog lookups.',
      why: 'Title lookups happen on every page load. A covered query on { titleId, genre } returns from the index alone — zero document fetches at streaming-platform scale.',
      snippet: [ 'db.titles.find(\n  { titleId: ', { blank: 'val' }, ' },\n  { _id: ', { blank: 'id' }, ', titleId: 1, genre: 1 }\n).', { blank: 'verb' }, '("executionStats")' ],
      choices: { val: { options: ['"TT-2091"', 'TT-2091', '*', '{}'], answer: '"TT-2091"' }, id: { options: ['0', '1', 'null', 'true'], answer: '0' }, verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' } }
    },
    v1: {
      title: '$vectorSearch — "more like this"', kind: 'fill',
      prompt: 'Find the 5 titles most similar to the currently-watched documentary.',
      sub: 'Atlas Vector Search powers "more like this" recommendations via content embeddings.',
      why: 'Content similarity drives engagement. Vector Search finds titles with similar themes, mood, and style — even when descriptions use different words — powering "because you watched" recommendations.',
      snippet: [ 'db.titles.aggregate([{\n  $vectorSearch: {\n    index: "content_embed_idx",\n    path: ', { blank: 'path' }, ',\n    queryVector: titleEmbedding,\n    numCandidates: 100,\n    ', { blank: 'limit' }, ': 5\n  }\n}])' ],
      choices: { path: { options: ['"embedding"', '"vector"', 'embedding', '"features"'], answer: '"embedding"' }, limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' } }
    },
    v2: {
      title: '$search — content discovery', kind: 'blocks',
      prompt: 'Use Atlas Search to find titles matching "space documentary".',
      sub: 'Atlas Search powers the main search bar with relevance ranking and autocomplete.',
      why: 'Search is how viewers find new content. Atlas Search provides relevance scoring, typo tolerance, and autocomplete — matching viewer intent even with partial or misspelled queries.',
      snippet: [ 'db.titles.aggregate([\n  { ', { slot: 'stage' }, ': {\n    ', { slot: 'operator' }, ': {\n      path: ', { slot: 'path' }, ',\n      query: ', { slot: 'query' }, '\n    }\n  } }\n])' ],
      bank: [
        { id: 'stage', label: '$search', kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text', kind: 'op', answer: 'operator' },
        { id: 'path', label: '"synopsis"', kind: 'field', answer: 'path' },
        { id: 'query', label: '"space documentary"', kind: 'value', answer: 'query' },
        { id: 'x1', label: '$text', kind: 'op' },
        { id: 'x2', label: 'find', kind: 'op' },
        { id: 'x3', label: 'space documentary', kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — new release notification', kind: 'fill',
      prompt: 'Notify subscribers whenever a new title is added to the catalog.',
      sub: 'Database triggers react to catalog inserts and push notifications.',
      why: 'New content drives same-day engagement. Atlas Triggers fire on insert and can push notifications to interested subscribers within seconds of a title going live.',
      snippet: [ '// Atlas Trigger config\n{\n  type: "DATABASE",\n  database: "streaming",\n  collection: ', { blank: 'col' }, ',\n  operationTypes: [', { blank: 'evt' }, '],\n  function: ', { blank: 'fn' }, '\n}' ],
      choices: { col: { options: ['"titles"', 'titles', 'Titles', '*'], answer: '"titles"' }, evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' }, fn: { options: ['"notifySubscribers"', 'notifySubscribers', 'fn()', 'notify()'], answer: '"notifySubscribers"' } }
    },
    v4: {
      title: 'RAG — content copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for a content recommendation AI: scope to platform, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to platform → drop weak matches → project for the LLM.',
      why: 'Content copilots must only recommend from the platform\'s own catalog. Pre-filtering by platformId ensures only licensed content is suggested, and trimming controls LLM token cost.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "catalog_embed", path: "embedding", queryVector: q, limit: 8, filter: { platformId } }', sub: 'k-NN scoped to platform', correct: 0 },
                { id: 'pj', code: '$project: { _id: 0, title: 1, synopsis: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.77 } }', sub: 'drop weak matches', correct: 1 },
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
