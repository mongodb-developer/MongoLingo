/* MongoLingo — Gaming & LiveOps industry content pack.
 * Every level has proprietary exercise content specific to gaming workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'gaming',
  name: 'Gaming & LiveOps',
  shortName: 'Gaming',
  description: 'MongoDB supports player profiles, inventories, sessions, matchmaking, telemetry, live events, and AI-powered moderation or personalization.',
  promise: 'MongoDB supports player profiles, inventories, sessions, matchmaking, telemetry, live events, and AI-powered moderation or personalization.',
  searchPhrase: 'toxic chat report',
  nouns: { profile: 'player', profilePlural: 'players', profileCollection: 'players', item: 'item', itemPlural: 'items', itemCollection: 'items', catalog: 'item catalog', user: 'game master', transaction: 'match event', transactionPlural: 'match events', documentPlural: 'player reports' },
  aha: [
    { title: 'AHA: Player profiles are living documents', message: 'Inventory, achievements, preferences, and social graph evolve every session — MongoDB documents grow naturally with the player.' },
    { title: 'AHA: Inventories and events change constantly', message: 'New items, seasonal events, and balance patches arrive weekly. Flexible documents absorb changes without downtime.' },
    { title: 'AHA: Aggregation powers live ops dashboards', message: 'Pipeline stages can compute daily active users, match win rates, economy health, and revenue metrics in real time.' },
    { title: 'AHA: Search and vectors improve moderation', message: 'Vector Search over chat embeddings and Atlas Search over player reports help trust & safety teams detect toxicity fast.' }
  ],
  levels: {
    d1: {
      title: 'Build a player profile document', kind: 'shape',
      prompt: 'Drag the right values into the player profile for "ShadowKnight".',
      sub: 'Player documents combine username, level, currency, and online status.',
      why: 'Player profiles are living documents that grow every session — inventory, achievements, friends, preferences. MongoDB handles this evolving shape without migrations or downtime between patches.',
      skeleton: [
        { key: '_id',      type: 'oid',  value: 'ObjectId("72c...")' },
        { key: 'username', type: 'slot', slot: 'user' },
        { key: 'level',    type: 'slot', slot: 'lvl' },
        { key: 'gold',     type: 'slot', slot: 'gold' },
        { key: 'online',   type: 'slot', slot: 'online' }
      ],
      bank: [
        { id: 'user',   label: '"ShadowKnight"', kind: 'value' },
        { id: 'lvl',    label: '42',             kind: 'value' },
        { id: 'gold',   label: '8750',           kind: 'value' },
        { id: 'online', label: 'true',           kind: 'value' },
        { id: 'd1',     label: 'ShadowKnight',   kind: 'value' },
        { id: 'd2',     label: '"42"',           kind: 'value' },
        { id: 'd3',     label: '"true"',         kind: 'value' }
      ],
      answer: { user: 'user', lvl: 'lvl', gold: 'gold', online: 'online' }
    },
    d2: {
      title: 'insertOne() — log a match result', kind: 'blocks',
      prompt: 'Record a match result into the matchEvents collection.',
      sub: 'Each match result is an immutable event for leaderboards and analytics.',
      why: 'Match events feed leaderboards, skill ratings, and balance analytics. `insertOne()` captures each result atomically with full context (players, scores, duration) for real-time and historical analysis.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  matchId: "M-99201",',
        '\n  winner: ', { slot: 'val' }, ',',
        '\n  duration: ', { slot: 'dur' },
        '\n})'
      ],
      bank: [
        { id: 'op',  label: 'insertOne',     kind: 'op',    answer: 'op' },
        { id: 'col', label: 'matchEvents',    kind: 'field', answer: 'col' },
        { id: 'val', label: '"ShadowKnight"', kind: 'value', answer: 'val' },
        { id: 'dur', label: '342',            kind: 'value', answer: 'dur' },
        { id: 'x1',  label: 'addOne',         kind: 'op' },
        { id: 'x2',  label: 'matches',        kind: 'field' },
        { id: 'x3',  label: 'ShadowKnight',   kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — grant achievement', kind: 'fill',
      prompt: 'Award player "ShadowKnight" the "First Blood" achievement.',
      sub: '$push adds an achievement to the player\'s array without replacing the profile.',
      why: 'Achievements accumulate over a player\'s lifetime. `$push` appends to the achievements array without touching inventory, stats, or preferences — keeping the profile intact.',
      snippet: [
        'db.players.updateOne(',
        '\n  { username: "ShadowKnight" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$push', '$set', '$inc', '$addToSet'], answer: '$push' },
        field: { options: ['achievements', 'badges', 'unlocks', 'awards'], answer: 'achievements' },
        val:   { options: ['"First Blood"', 'First Blood', 'true', '1'], answer: '"First Blood"' }
      }
    },
    d4: {
      title: 'deleteOne() — remove banned player', kind: 'fill',
      prompt: 'Remove the most recently banned player from the active players collection.',
      sub: 'deleteOne() removes one banned player document — sort targets the most recent ban.',
      why: 'Banned players must be removed from matchmaking pools. Sort by bannedAt descending to remove the most recently banned, keeping the active pool clean for fair play.',
      snippet: [
        'db.players.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { bannedAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"banned"', 'banned', '"suspended"'], answer: '"banned"' },
        dir: { options: ['-1', '1', '"desc"'], answer: '-1' }
      }
    },
    q1: {
      title: 'Find players by rank', kind: 'blocks',
      prompt: 'Find every player at rank "diamond".',
      sub: 'Equality queries power rank-based matchmaking and leaderboards.',
      why: 'Matchmaking needs to find players at specific ranks. An index on `rank` returns the diamond tier in microseconds — critical for keeping queue times low.',
      snippet: [ 'db.players.find({ ', { slot: 'field' }, ': ', { slot: 'val' }, ' })' ],
      bank: [
        { id: 'field', label: 'rank',       kind: 'field', answer: 'field' },
        { id: 'val',   label: '"diamond"',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'tier',         kind: 'field' },
        { id: 'x2',    label: 'diamond',      kind: 'value' },
        { id: 'x3',    label: 'skillTier',    kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — high-MMR players', kind: 'blocks',
      prompt: 'Find players with MMR over 2500 for the elite queue.',
      sub: '$match with $gt filters players above the elite skill threshold.',
      why: 'Elite matchmaking needs players above MMR thresholds. $match with $gt on an indexed `mmr` field surfaces top players instantly for ranked queue pairing.',
      snippet: [ 'db.players.aggregate([\n  { ', { slot: 'stage' }, ': { mmr: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }\n])' ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '2500',   kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"2500"',  kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-region matchmaking', kind: 'fill',
      prompt: 'Find online players in "NA" or "EU" regions for cross-region queue.',
      sub: '$in matches any region value — essential for multi-region matchmaking.',
      why: 'Cross-region matchmaking queries players in multiple regions simultaneously. `$in` handles this with a single efficient index scan.',
      snippet: [ 'db.players.find({\n  region: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }\n})' ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["NA", "EU"]', '"NA, EU"', '{ NA, EU }', '[NA, EU]'], answer: '["NA", "EU"]' }
      }
    },
    q4: {
      title: 'Compound filter — rank + online', kind: 'fill',
      prompt: 'Find online diamond-rank players with MMR above 2000.',
      sub: 'Combine equality and range for precise matchmaking pools.',
      why: 'Fair matchmaking needs rank + MMR + online status. MongoDB ANDs these fields implicitly, letting the matchmaker find suitable opponents in milliseconds.',
      snippet: [ 'db.players.find({\n  rank: "diamond",\n  online: true,\n  mmr: { ', { blank: 'op' }, ': 2000 }\n})' ],
      choices: { op: { options: ['$gt', '$gte', '$eq', '>='], answer: '$gt' } }
    },
    a1: {
      title: 'Win rate by character', kind: 'reorder',
      prompt: 'Compute average win rate per character in ranked matches — re-order the stages.',
      sub: 'Filter to ranked, group by character, sort by win rate, limit to top picks.',
      why: 'Balance teams need per-character win rates. Filter to ranked (where balance matters), group by character to average wins, sort descending, and identify overperforming characters.',
      stages: [
        { id: 'm', code: '$match: { mode: "ranked" }', sub: 'filter to ranked matches', correct: 0 },
        { id: 'g', code: '$group: { _id: "$character", winRate: { $avg: "$won" } }', sub: 'average win per character', correct: 1 },
        { id: 's', code: '$sort: { winRate: -1 }', sub: 'highest win rate first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 characters', correct: 3 }
      ],
      initial: ['l', 's', 'm', 'g']
    },
    a2: {
      title: '$project — leaderboard entry', kind: 'fill',
      prompt: 'Return just the username and MMR — hide _id.',
      sub: '$project shapes output for the leaderboard API.',
      why: 'Leaderboard APIs need lean payloads. `$project` with `_id: 0` strips internals and delivers only username and MMR for the ranked ladder.',
      snippet: [ 'db.players.aggregate([\n  { $project: {\n    _id: ', { blank: 'id' }, ',\n    username: ', { blank: 'one' }, ',\n    mmr: ', { blank: 'one2' }, '\n  } }\n])' ],
      choices: { id: { options: ['0', '1', 'false', 'null'], answer: '0' }, one: { options: ['1', '0', 'true', '"yes"'], answer: '1' }, one2: { options: ['1', '0', '"$mmr"', 'yes'], answer: '1' } }
    },
    a3: {
      title: '$lookup — enrich matches with player info', kind: 'reorder',
      prompt: 'Attach player rank to each match event for balance analysis.',
      sub: '$lookup joins player data, $unwind flattens, $project picks fields.',
      why: 'Balance analysis needs player context alongside match outcomes. `$lookup` brings player rank in, enabling win-rate analysis segmented by skill tier.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "players", localField: "winnerId", foreignField: "_id", as: "winner" }', sub: 'join winner profile', correct: 0 },
        { id: 'un', code: '$unwind: "$winner"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, matchId: 1, rank: "$winner.rank", duration: 1 }', sub: 'keep match + rank', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — recent matches', kind: 'blocks',
      prompt: 'Show the 10 most recently completed matches.',
      sub: 'Sort by endedAt descending, limit to 10 for the match history feed.',
      why: 'Match history feeds need the freshest results first. `$sort` + `$limit` streams only the top-N matches without sorting the entire event log.',
      snippet: [ 'db.matchEvents.aggregate([\n  { ', { slot: 'sort' }, ': { endedAt: ', { slot: 'dir' }, ' } },\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }\n])' ],
      bank: [
        { id: 'sort', label: '$sort', kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir', label: '-1', kind: 'value', answer: 'dir' },
        { id: 'n', label: '10', kind: 'value', answer: 'n' },
        { id: 'x1', label: '$top', kind: 'stage' },
        { id: 'x2', label: '$first', kind: 'stage' },
        { id: 'x3', label: '1', kind: 'value' },
        { id: 'x4', label: '"10"', kind: 'value' }
      ]
    },
    i1: {
      title: 'Index strategies for player queries', kind: 'index',
      prompt: 'The `players` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each gaming access pattern to the right index type.',
      why: 'Gaming queries span rank lookups, rank+MMR combos, full-text chat moderation, and low-cardinality flags. Each needs the right index to keep matchmaking under 50ms.',
      collection: 'players',
      fields: [
        { name: 'rank', type: 'String', need: 'single', used: 'db.players.find({ rank })' },
        { name: 'rank + mmr', type: 'String + Number', need: 'compound', used: 'db.players.find({ rank }).sort({ mmr: -1 })' },
        { name: 'chatHistory', type: 'String', need: 'search', used: 'Atlas Search for toxicity detection in chat logs' },
        { name: 'isBanned', type: 'Bool', need: 'none', used: 'low cardinality — only true/false' }
      ],
      bank: [ { id: 'single', label: 'Single-field', kind: 'index' }, { id: 'compound', label: 'Compound', kind: 'index' }, { id: 'search', label: 'Atlas Search', kind: 'index' }, { id: 'none', label: 'No index', kind: 'index' } ]
    },
    i2: {
      title: 'ESR for matchmaking queries', kind: 'reorder',
      prompt: 'Order this compound index for: find online players with high MMR, sorted by queue time.',
      sub: 'For: db.players.find({ online: true, mmr: { $gt: 2000 } }).sort({ queuedAt: 1 })',
      why: 'ESR in gaming: equality (online) narrows to available players, sort (queuedAt) prioritizes longest-waiting, range (mmr) scans only the skill bracket.',
      stages: [
        { id: 'e', code: 'online: 1',   sub: 'Equality — { online: true }', correct: 0 },
        { id: 's', code: 'queuedAt: 1', sub: 'Sort — .sort({ queuedAt: 1 })', correct: 1 },
        { id: 'r', code: 'mmr: 1',      sub: 'Range — { $gt: 2000 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire game sessions', kind: 'fill',
      prompt: 'Auto-delete inactive game sessions 2 hours after last heartbeat.',
      sub: 'TTL indexes clean up abandoned sessions — critical for server capacity.',
      why: 'Abandoned sessions waste server resources. A TTL index on `lastHeartbeat` auto-removes them after 2 hours (7200 seconds), keeping the active session pool accurate.',
      snippet: [ 'db.sessions.', { blank: 'op' }, '(\n  { lastHeartbeat: 1 },\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }\n)' ],
      choices: { op: { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' }, key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' }, sec: { options: ['7200', '2', '120', '3600'], answer: '7200' } }
    },
    i4: {
      title: 'Covered query — player rank check', kind: 'fill',
      prompt: 'Query only fields in the index { username: 1, rank: 1 } for zero-fetch matchmaking.',
      sub: 'Covered queries return from the index — critical for real-time matchmaking lookups.',
      why: 'Matchmaking checks player rank on every queue. A covered query on { username, rank } returns from the index alone — zero document fetches at hundreds of queue requests per second.',
      snippet: [ 'db.players.find(\n  { username: ', { blank: 'val' }, ' },\n  { _id: ', { blank: 'id' }, ', username: 1, rank: 1 }\n).', { blank: 'verb' }, '("executionStats")' ],
      choices: { val: { options: ['"ShadowKnight"', 'ShadowKnight', '*', '{}'], answer: '"ShadowKnight"' }, id: { options: ['0', '1', 'null', 'true'], answer: '0' }, verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' } }
    },
    v1: {
      title: '$vectorSearch — similar player behavior', kind: 'fill',
      prompt: 'Find the 5 players with play styles most similar to a target for team suggestions.',
      sub: 'Atlas Vector Search uses player behavior embeddings for team compatibility.',
      why: 'Good team composition needs compatible play styles. Vector Search finds players with similar behavioral embeddings — play patterns, role preferences, communication style — for better team suggestions.',
      snippet: [ 'db.players.aggregate([{\n  $vectorSearch: {\n    index: "player_embed_idx",\n    path: ', { blank: 'path' }, ',\n    queryVector: playStyleEmbedding,\n    numCandidates: 100,\n    ', { blank: 'limit' }, ': 5\n  }\n}])' ],
      choices: { path: { options: ['"embedding"', '"vector"', 'embedding', '"behavior"'], answer: '"embedding"' }, limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' } }
    },
    v2: {
      title: '$search — toxicity detection', kind: 'blocks',
      prompt: 'Use Atlas Search to find player reports mentioning "toxic chat report".',
      sub: 'Atlas Search helps trust & safety teams find toxic behavior patterns.',
      why: 'Moderation teams search thousands of reports for patterns. Atlas Search provides relevance scoring over reports — finding related toxicity cases in seconds for consistent enforcement.',
      snippet: [ 'db.reports.aggregate([\n  { ', { slot: 'stage' }, ': {\n    ', { slot: 'operator' }, ': {\n      path: ', { slot: 'path' }, ',\n      query: ', { slot: 'query' }, '\n    }\n  } }\n])' ],
      bank: [
        { id: 'stage', label: '$search', kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text', kind: 'op', answer: 'operator' },
        { id: 'path', label: '"description"', kind: 'field', answer: 'path' },
        { id: 'query', label: '"toxic chat report"', kind: 'value', answer: 'query' },
        { id: 'x1', label: '$text', kind: 'op' },
        { id: 'x2', label: 'find', kind: 'op' },
        { id: 'x3', label: 'toxic chat report', kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — anti-cheat alert', kind: 'fill',
      prompt: 'Fire an anti-cheat review whenever a suspicious match result is recorded.',
      sub: 'Database triggers detect suspicious outcomes and flag for review.',
      why: 'Anti-cheat must react in real time. Atlas Triggers fire on match inserts and can flag suspicious statistical anomalies within seconds — before cheaters ruin more games.',
      snippet: [ '// Atlas Trigger config\n{\n  type: "DATABASE",\n  database: "game",\n  collection: ', { blank: 'col' }, ',\n  operationTypes: [', { blank: 'evt' }, '],\n  function: ', { blank: 'fn' }, '\n}' ],
      choices: { col: { options: ['"matchEvents"', 'matchEvents', 'MatchEvents', '*'], answer: '"matchEvents"' }, evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' }, fn: { options: ['"checkAntiCheat"', 'checkAntiCheat', 'fn()', 'detect()'], answer: '"checkAntiCheat"' } }
    },
    v4: {
      title: 'RAG — game master copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for a GM copilot: scope to game, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to game → drop weak matches → project for the LLM.',
      why: 'Game master copilots must only access the game\'s own rules and policies. Pre-filtering by gameId ensures consistency, and trimming keeps the LLM focused on relevant rulings.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "rules_embed", path: "embedding", queryVector: q, limit: 8, filter: { gameId } }', sub: 'k-NN scoped to this game', correct: 0 },
        { id: 'pj', code: '$project: { _id: 0, rule: 1, context: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.79 } }', sub: 'drop weak matches', correct: 1 },
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
