/* MongoLingo — Cybersecurity industry content pack.
 * Every level has proprietary exercise content specific to security workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'cyber',
  name: 'Cybersecurity',
  shortName: 'Cyber',
  description: 'MongoDB fits cyber workloads by combining high-volume events, evolving threat intel, entity context, search, and AI investigation workflows.',
  promise: 'MongoDB fits cyber workloads by combining high-volume events, evolving threat intel, entity context, search, and AI investigation workflows.',
  searchPhrase: 'credential stuffing indicator',
  nouns: { profile: 'asset', profilePlural: 'assets', profileCollection: 'assets', item: 'alert rule', itemPlural: 'alert rules', itemCollection: 'detections', catalog: 'detection catalog', user: 'security analyst', transaction: 'security event', transactionPlural: 'security events', documentPlural: 'threat intel reports' },
  aha: [
    { title: 'AHA: Threat data evolves constantly', message: 'New IOCs, TTPs, and actor profiles appear daily. MongoDB documents absorb new threat fields without schema migrations.' },
    { title: 'AHA: One asset document can carry context and risk', message: 'Combining asset metadata, vulnerabilities, and ownership in one document accelerates triage decisions.' },
    { title: 'AHA: Pipelines correlate events without export', message: 'Aggregation stages can join, window, and score security events in-database — no SIEM round-trip needed.' },
    { title: 'AHA: Atlas Search accelerates investigations', message: 'Full-text and vector search over logs, alerts, and intel reports help analysts find related incidents in seconds.' }
  ],
  levels: {
    /* ===== WORLD 1: Documents & Collections ===== */
    d1: {
      title: 'Build an asset inventory document', kind: 'shape',
      prompt: 'Drag the right values into the asset record for a production web server.',
      sub: 'Asset documents combine hostname, criticality, OS, and online status.',
      why: 'An asset document in security keeps hostname, criticality, vulnerabilities, and ownership together — giving SOC analysts instant context during triage without querying multiple CMDBs.',
      skeleton: [
        { key: '_id',        type: 'oid',  value: 'ObjectId("69e...")' },
        { key: 'hostname',   type: 'slot', slot: 'host' },
        { key: 'criticality', type: 'slot', slot: 'crit' },
        { key: 'os',         type: 'slot', slot: 'os' },
        { key: 'online',     type: 'slot', slot: 'online' }
      ],
      bank: [
        { id: 'host',   label: '"web-prod-01"',  kind: 'value' },
        { id: 'crit',   label: '"critical"',     kind: 'value' },
        { id: 'os',     label: '"ubuntu-22.04"', kind: 'value' },
        { id: 'online', label: 'true',           kind: 'value' },
        { id: 'd1',     label: 'web-prod-01',    kind: 'value' },
        { id: 'd2',     label: '"true"',         kind: 'value' },
        { id: 'd3',     label: 'critical',       kind: 'value' }
      ],
      answer: { host: 'host', crit: 'crit', os: 'os', online: 'online' }
    },
    d2: {
      title: 'insertOne() — log a security event', kind: 'blocks',
      prompt: 'Record a failed login event into the security events collection.',
      sub: 'Each security event becomes an immutable document for investigation and correlation.',
      why: 'Security events must be captured immediately and immutably for forensics. `insertOne()` records the event type, source, and severity in one write — building the timeline investigators reconstruct during incidents.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  type: "auth_failure",',
        '\n  sourceIp: ', { slot: 'val' }, ',',
        '\n  severity: ', { slot: 'sev' },
        '\n})'
      ],
      bank: [
        { id: 'op',  label: 'insertOne',      kind: 'op',    answer: 'op' },
        { id: 'col', label: 'securityEvents',  kind: 'field', answer: 'col' },
        { id: 'val', label: '"10.0.0.42"',     kind: 'value', answer: 'val' },
        { id: 'sev', label: '"high"',          kind: 'value', answer: 'sev' },
        { id: 'x1',  label: 'addOne',          kind: 'op' },
        { id: 'x2',  label: 'logs',            kind: 'field' },
        { id: 'x3',  label: '10.0.0.42',       kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — escalate an alert', kind: 'fill',
      prompt: 'Escalate alert #ALT-2891 to severity "critical".',
      sub: '$set patches the severity without replacing investigation notes and evidence.',
      why: 'Escalating an alert preserves all context (analyst notes, IOCs, timelines) while changing only the severity. `$set` patches cleanly, maintaining the investigation trail for the next responder.',
      snippet: [
        'db.alerts.updateOne(',
        '\n  { alertId: "ALT-2891" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['severity', 'status', 'priority', 'level'], answer: 'severity' },
        val:   { options: ['"critical"', 'critical', '"escalated"', '1'], answer: '"critical"' }
      }
    },
    d4: {
      title: 'deleteOne() — purge stale IOC', kind: 'fill',
      prompt: 'Remove the oldest expired indicator of compromise from the threat intel collection.',
      sub: 'deleteOne() removes one document — sort ensures you target the oldest expired IOC.',
      why: 'Stale IOCs cause false positives. Sort by expiresAt ascending to target the oldest expired indicator, ensuring you never accidentally remove a valid active IOC being used for detection.',
      snippet: [
        'db.threatIntel.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { expiresAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"expired"', 'expired', '"stale"'], answer: '"expired"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },

    /* ===== WORLD 2: Querying ===== */
    q1: {
      title: 'Find critical assets', kind: 'blocks',
      prompt: 'Find every asset with criticality "critical" for the crown jewels report.',
      sub: 'Equality queries return all matching assets — fast with an index.',
      why: 'Knowing your critical assets is the first step in cybersecurity. An index on `criticality` lets the SOC instantly identify crown jewels during an incident — no full scan required.',
      snippet: [
        'db.assets.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: 'criticality',  kind: 'field', answer: 'field' },
        { id: 'val',   label: '"critical"',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'priority',      kind: 'field' },
        { id: 'x2',    label: 'critical',      kind: 'value' },
        { id: 'x3',    label: 'riskLevel',     kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — high-severity events', kind: 'blocks',
      prompt: 'Find security events with riskScore over 80 for immediate triage.',
      sub: '$match with $gt filters events above the alert threshold.',
      why: 'SOC analysts triage by risk score. Placing $match with $gt on an indexed `riskScore` field lets MongoDB surface high-severity events instantly for investigation.',
      snippet: [
        'db.securityEvents.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { riskScore: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '80',     kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"80"',    kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-type event query', kind: 'fill',
      prompt: 'Find events of type "brute_force" or "credential_stuffing".',
      sub: '$in matches any value from an array — ideal for multi-technique detection queries.',
      why: 'Incident responders correlate related attack techniques. `$in` queries multiple event types in one efficient pass, avoiding verbose `$or` chains while still using indexes.',
      snippet: [
        'db.securityEvents.find({',
        '\n  type: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["brute_force", "credential_stuffing"]', '"brute_force, credential_stuffing"', '{ brute_force, credential_stuffing }', '[brute_force, credential_stuffing]'], answer: '["brute_force", "credential_stuffing"]' }
      }
    },
    q4: {
      title: 'Compound filter — source + severity', kind: 'fill',
      prompt: 'Find high-severity events from external sources in the last hour.',
      sub: 'Combine equality and range operators to pinpoint active external threats.',
      why: 'Active threats come from external sources with high severity. Combining source type and severity in one query gives SOC analysts an instant view of the most urgent external threats.',
      snippet: [
        'db.securityEvents.find({',
        '\n  source: "external",',
        '\n  riskScore: { ', { blank: 'op' }, ': 90 }',
        '\n})'
      ],
      choices: {
        op: { options: ['$gte', '$gt', '$eq', '>='], answer: '$gte' }
      }
    },

    /* ===== WORLD 3: Aggregation Pipeline ===== */
    a1: {
      title: 'Attack frequency by source IP', kind: 'reorder',
      prompt: 'Count attack events per source IP in the last 24h — re-order the stages.',
      sub: 'Filter recent events, group by source, sort by count, limit to top offenders.',
      why: 'Identifying top attacker IPs drives blocking decisions. Filter to recent events (shrink dataset), group by sourceIp to count, sort descending, and surface the most active threat sources.',
      stages: [
        { id: 'm', code: '$match: { timestamp: { $gte: ISODate("2024-05-19T00:00Z") }, type: "attack" }', sub: 'filter to last 24h attacks', correct: 0 },
        { id: 'g', code: '$group: { _id: "$sourceIp", attackCount: { $sum: 1 } }', sub: 'count per source IP', correct: 1 },
        { id: 's', code: '$sort: { attackCount: -1 }', sub: 'most active attackers first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 sources', correct: 3 }
      ],
      initial: ['l', 's', 'm', 'g']
    },
    a2: {
      title: '$project — incident report shape', kind: 'fill',
      prompt: 'Return just the alert ID and affected asset — hide _id.',
      sub: '$project shapes the incident report for downstream SOAR playbooks.',
      why: 'SOAR playbooks need lean structured input. `$project` with `_id: 0` strips internal IDs and delivers only the fields the automation expects — alertId and affectedAsset.',
      snippet: [
        'db.alerts.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    alertId: ', { blank: 'one' }, ',',
        '\n    affectedAsset: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$affectedAsset"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup — enrich events with asset context', kind: 'reorder',
      prompt: 'Attach the affected asset\'s criticality to each event, then extract for triage.',
      sub: '$lookup joins asset data, $unwind flattens, $project picks triage fields.',
      why: 'An event on a critical server matters more than one on a dev box. `$lookup` brings asset context in, `$unwind` flattens, and `$project` delivers event + criticality for prioritized triage.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "assets", localField: "assetId", foreignField: "_id", as: "asset" }', sub: 'join asset inventory', correct: 0 },
        { id: 'un', code: '$unwind: "$asset"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, eventId: 1, type: 1, criticality: "$asset.criticality" }', sub: 'keep event + criticality', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — latest alerts', kind: 'blocks',
      prompt: 'Show the 10 most recent security alerts.',
      sub: 'Sort by detectedAt descending, limit to 10 for the SOC dashboard.',
      why: 'SOC analysts need the freshest alerts first. `$sort` + `$limit` streams only the top-N alerts without sorting the entire event log — critical in environments generating millions of events per day.',
      snippet: [
        'db.alerts.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { detectedAt: ', { slot: 'dir' }, ' } },',
        '\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }',
        '\n])'
      ],
      bank: [
        { id: 'sort',  label: '$sort',  kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir',   label: '-1',     kind: 'value', answer: 'dir' },
        { id: 'n',     label: '10',     kind: 'value', answer: 'n' },
        { id: 'x1',    label: '$top',   kind: 'stage' },
        { id: 'x2',    label: '$first', kind: 'stage' },
        { id: 'x3',    label: '1',      kind: 'value' },
        { id: 'x4',    label: '"10"',   kind: 'value' }
      ]
    },

    /* ===== WORLD 4: Indexes & Performance ===== */
    i1: {
      title: 'Index strategies for security events', kind: 'index',
      prompt: 'The `securityEvents` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each SOC access pattern to the right index type.',
      why: 'Security queries range from IP lookups to full-text log searches. Each pattern needs the right index — compound for source+time, Search for log narratives, never index low-cardinality flags alone.',
      collection: 'securityEvents',
      fields: [
        { name: 'sourceIp', type: 'String', need: 'single', used: 'db.securityEvents.find({ sourceIp })' },
        { name: 'sourceIp + timestamp', type: 'String + Date', need: 'compound', used: 'db.securityEvents.find({ sourceIp }).sort({ timestamp: -1 })' },
        { name: 'rawLog', type: 'String', need: 'search', used: 'Atlas Search over raw log messages for IOC hunting' },
        { name: 'isProcessed', type: 'Bool', need: 'none', used: 'low cardinality — only two values' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for event correlation', kind: 'reorder',
      prompt: 'Order this compound index for: find attack events with high scores, sorted by time.',
      sub: 'For: db.securityEvents.find({ type: "attack", riskScore: { $gt: 70 } }).sort({ timestamp: -1 })',
      why: 'ESR in security: equality (type) narrows to attacks, sort (timestamp) delivers results chronologically for investigation timelines, range (riskScore) scans only high-scoring events.',
      stages: [
        { id: 'e', code: 'type: 1',       sub: 'Equality — { type: "attack" }', correct: 0 },
        { id: 's', code: 'timestamp: -1',  sub: 'Sort — .sort({ timestamp: -1 })', correct: 1 },
        { id: 'r', code: 'riskScore: 1',   sub: 'Range — { $gt: 70 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire old raw events', kind: 'fill',
      prompt: 'Auto-delete raw security events 90 days after ingestion.',
      sub: 'TTL indexes enforce retention policies automatically — critical for compliance.',
      why: 'Security data has retention limits. A TTL index on `ingestedAt` auto-removes events after 90 days (7776000 seconds), enforcing your data retention policy without manual purge scripts.',
      snippet: [
        'db.rawEvents.', { blank: 'op' }, '(',
        '\n  { ingestedAt: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['7776000', '90', '2160', '86400'], answer: '7776000' }
      }
    },
    i4: {
      title: 'Covered query — IOC lookup', kind: 'fill',
      prompt: 'Query only fields in the index { iocValue: 1, iocType: 1 } for zero-fetch detection.',
      sub: 'Covered queries return from the index alone — critical for real-time IOC matching.',
      why: 'IOC matching happens on every network flow. A covered query on { iocValue, iocType } confirms threats from the index alone — zero document fetches at wire-speed detection rates.',
      snippet: [
        'db.threatIntel.find(',
        '\n  { iocValue: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', iocValue: 1, iocType: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"185.220.101.42"', '185.220.101.42', '*', '{}'], answer: '"185.220.101.42"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Superpowers ===== */
    v1: {
      title: '$vectorSearch — similar attack patterns', kind: 'fill',
      prompt: 'Find the 5 events most similar to a known attack pattern embedding.',
      sub: 'Atlas Vector Search finds events with similar behavioral signatures using embeddings.',
      why: 'Attack patterns leave behavioral fingerprints. Vector Search finds events with similar patterns even when attackers change specific IOCs — catching variants that signature-based detection misses.',
      snippet: [
        'db.securityEvents.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "event_embed_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: attackPatternEmbedding,',
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
      title: '$search — threat intel search', kind: 'blocks',
      prompt: 'Use Atlas Search to find threat reports mentioning "credential stuffing indicator".',
      sub: 'Atlas Search enables full-text search over threat intelligence with relevance ranking.',
      why: 'Analysts search threat intel for techniques and IOCs. Atlas Search provides relevance scoring and fuzzy matching over reports — finding related intelligence in seconds during active incidents.',
      snippet: [
        'db.threatIntel.aggregate([',
        '\n  { ', { slot: 'stage' }, ': {',
        '\n    ', { slot: 'operator' }, ': {',
        '\n      path: ', { slot: 'path' }, ',',
        '\n      query: ', { slot: 'query' },
        '\n    }',
        '\n  } }',
        '\n])'
      ],
      bank: [
        { id: 'stage',    label: '$search',                          kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text',                             kind: 'op',    answer: 'operator' },
        { id: 'path',     label: '"report"',                         kind: 'field', answer: 'path' },
        { id: 'query',    label: '"credential stuffing indicator"',  kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                            kind: 'op' },
        { id: 'x2',       label: 'find',                             kind: 'op' },
        { id: 'x3',       label: 'credential stuffing indicator',    kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — auto-containment', kind: 'fill',
      prompt: 'Fire an isolation function whenever a critical alert is inserted.',
      sub: 'Database triggers react to high-severity alerts and contain threats automatically.',
      why: 'Critical threats need immediate containment. Atlas Triggers fire on insert and can isolate compromised assets within seconds — faster than waiting for a human analyst to respond.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "soc",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"alerts"', 'alerts', 'Alerts', '*'], answer: '"alerts"' },
        evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' },
        fn:  { options: ['"containThreat"', 'containThreat', 'fn()', 'isolate()'], answer: '"containThreat"' }
      }
    },
    v4: {
      title: 'RAG — SOC copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for a SOC copilot: scope to org, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to org → drop weak matches → project only what the LLM needs.',
      why: 'SOC copilots must only access the organization\'s own runbooks and intel. Pre-filtering by orgId ensures data isolation, and trimming keeps the LLM focused on relevant investigation procedures.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "runbook_embed", path: "embedding", queryVector: q, limit: 8, filter: { orgId } }', sub: 'k-NN scoped to this org', correct: 0 },
        { id: 'ms', code: '$match: { score: { $gt: 0.80 } }', sub: 'drop low-confidence matches', correct: 1 },
        { id: 'pj', code: '$project: { _id: 0, procedure: 1, section: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 }
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
