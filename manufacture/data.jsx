/* MongoLingo — Manufacturing & IoT industry content pack.
 * Every level has proprietary exercise content specific to manufacturing workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'manufacture',
  name: 'Manufacturing & IoT',
  shortName: 'Manufacturing',
  description: 'MongoDB connects equipment telemetry, asset documents, parts catalogs, work orders, and AI maintenance copilots in one flexible operational model.',
  promise: 'MongoDB connects equipment telemetry, asset documents, parts catalogs, work orders, and AI maintenance copilots in one flexible operational model.',
  searchPhrase: 'bearing temperature anomaly',
  nouns: { profile: 'asset', profilePlural: 'assets', profileCollection: 'assets', item: 'part', itemPlural: 'parts', itemCollection: 'parts', catalog: 'parts catalog', user: 'plant operator', transaction: 'sensor event', transactionPlural: 'sensor events', documentPlural: 'maintenance notes' },
  aha: [
    { title: 'AHA: Equipment context belongs with telemetry', message: 'When sensor readings live alongside asset metadata, teams diagnose problems faster without joining across systems.' },
    { title: 'AHA: Flexible schemas handle every machine model', message: 'Different equipment types have different attributes. MongoDB documents adapt without schema migrations.' },
    { title: 'AHA: Aggregation turns raw sensor events into uptime insight', message: 'Pipeline stages filter, bucket, and rank telemetry in-database — no ETL export needed.' },
    { title: 'AHA: Atlas Search finds maintenance knowledge fast', message: 'Full-text search over maintenance logs lets technicians find past fixes in seconds.' }
  ],
  levels: {
    d1: {
      title: 'Build an equipment asset document', kind: 'shape',
      prompt: 'Drag the right values into the asset record for a CNC milling machine.',
      sub: 'Asset documents combine serial number, type, location, and operational status.',
      why: 'Equipment assets in manufacturing vary widely — pumps have flow rates, CNC machines have spindle specs. MongoDB documents let each machine carry its own attributes without forcing a universal table.',
      skeleton: [
        { key: '_id',      type: 'oid',  value: 'ObjectId("73d...")' },
        { key: 'serial',   type: 'slot', slot: 'serial' },
        { key: 'type',     type: 'slot', slot: 'type' },
        { key: 'location', type: 'slot', slot: 'loc' },
        { key: 'operational', type: 'slot', slot: 'op' }
      ],
      bank: [
        { id: 'serial', label: '"CNC-4401"',    kind: 'value' },
        { id: 'type',   label: '"milling"',     kind: 'value' },
        { id: 'loc',    label: '"Plant-B Bay-3"', kind: 'value' },
        { id: 'op',     label: 'true',          kind: 'value' },
        { id: 'd1',     label: 'CNC-4401',      kind: 'value' },
        { id: 'd2',     label: '"true"',         kind: 'value' },
        { id: 'd3',     label: 'milling',        kind: 'value' }
      ],
      answer: { serial: 'serial', type: 'type', loc: 'loc', op: 'op' }
    },
    d2: {
      title: 'insertOne() — log a sensor reading', kind: 'blocks',
      prompt: 'Record a temperature sensor reading into the sensorEvents collection.',
      sub: 'Each sensor reading becomes an immutable document for time-series analysis.',
      why: 'IoT sensor data arrives at massive scale. `insertOne()` captures each reading with full context (asset, metric, timestamp) for real-time anomaly detection and predictive maintenance.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  assetId: "CNC-4401",',
        '\n  metric: "temperature",',
        '\n  value: ', { slot: 'val' }, ',',
        '\n  unit: ', { slot: 'unit' },
        '\n})'
      ],
      bank: [
        { id: 'op',   label: 'insertOne',     kind: 'op',    answer: 'op' },
        { id: 'col',  label: 'sensorEvents',   kind: 'field', answer: 'col' },
        { id: 'val',  label: '78.4',           kind: 'value', answer: 'val' },
        { id: 'unit', label: '"celsius"',      kind: 'value', answer: 'unit' },
        { id: 'x1',   label: 'addOne',         kind: 'op' },
        { id: 'x2',   label: 'telemetry',      kind: 'field' },
        { id: 'x3',   label: '"78.4"',         kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — mark asset for maintenance', kind: 'fill',
      prompt: 'Set asset CNC-4401 status to "maintenance_required".',
      sub: '$set patches the maintenance status without replacing calibration and history data.',
      why: 'Flagging equipment for maintenance must preserve all operational data (calibration, history, specs) while updating only the status field for the maintenance workflow.',
      snippet: [
        'db.assets.updateOne(',
        '\n  { serial: "CNC-4401" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['status', 'state', 'maintenance', 'flag'], answer: 'status' },
        val:   { options: ['"maintenance_required"', 'maintenance_required', 'true', '"offline"'], answer: '"maintenance_required"' }
      }
    },
    d4: {
      title: 'deleteOne() — purge old work order', kind: 'fill',
      prompt: 'Remove the oldest completed work order from the workOrders collection.',
      sub: 'deleteOne() removes one document — sort targets the oldest completed order.',
      why: 'Completed work orders accumulate and waste storage. Sort by completedAt ascending to archive the oldest, ensuring active or in-progress orders are never accidentally deleted.',
      snippet: [
        'db.workOrders.', { blank: 'op' }, '(',
        '\n  { status: ', { blank: 'val' }, ' },',
        '\n  { sort: { completedAt: ', { blank: 'dir' }, ' } }',
        '\n)'
      ],
      choices: {
        op:  { options: ['deleteOne', 'removeOne', 'dropOne'], answer: 'deleteOne' },
        val: { options: ['"completed"', 'completed', '"archived"'], answer: '"completed"' },
        dir: { options: ['1', '-1', '"asc"'], answer: '1' }
      }
    },
    q1: {
      title: 'Find assets by type', kind: 'blocks',
      prompt: 'Find every asset of type "milling" for the CNC maintenance schedule.',
      sub: 'Equality queries on equipment type enable type-based maintenance planning.',
      why: 'Maintenance schedules group by equipment type. An index on `type` returns all milling machines instantly for coordinated service windows.',
      snippet: [ 'db.assets.find({ ', { slot: 'field' }, ': ', { slot: 'val' }, ' })' ],
      bank: [
        { id: 'field', label: 'type',        kind: 'field', answer: 'field' },
        { id: 'val',   label: '"milling"',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'category',     kind: 'field' },
        { id: 'x2',    label: 'milling',      kind: 'value' },
        { id: 'x3',    label: 'machineType',  kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — high-temperature alerts', kind: 'blocks',
      prompt: 'Find sensor events where temperature exceeded 95°C for anomaly review.',
      sub: '$match with $gt filters readings above the safe operating threshold.',
      why: 'Equipment protection requires immediate flagging of threshold breaches. $match with $gt on an indexed `value` field surfaces dangerous readings instantly for the control room.',
      snippet: [ 'db.sensorEvents.aggregate([\n  { ', { slot: 'stage' }, ': { value: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }\n])' ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '95',     kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"95"',    kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-status asset query', kind: 'fill',
      prompt: 'Find assets in "maintenance_required" or "offline" status.',
      sub: '$in matches any status — perfect for maintenance planning dashboards.',
      why: 'Plant managers need to see all non-operational equipment at once. `$in` queries multiple statuses efficiently for the maintenance planning board.',
      snippet: [ 'db.assets.find({\n  status: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }\n})' ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["maintenance_required", "offline"]', '"maintenance_required, offline"', '{ maintenance_required, offline }', '[maintenance_required, offline]'], answer: '["maintenance_required", "offline"]' }
      }
    },
    q4: {
      title: 'Compound filter — type + temperature', kind: 'fill',
      prompt: 'Find operational milling machines with temperature readings above 80°C.',
      sub: 'Combine equality and range for targeted monitoring.',
      why: 'Monitoring specific equipment types at elevated temperatures prevents failures. MongoDB ANDs type, status, and temperature range implicitly.',
      snippet: [ 'db.sensorEvents.find({\n  assetType: "milling",\n  metric: "temperature",\n  value: { ', { blank: 'op' }, ': 80 }\n})' ],
      choices: { op: { options: ['$gt', '$gte', '$eq', '>='], answer: '$gt' } }
    },
    a1: {
      title: 'Downtime hours by asset', kind: 'reorder',
      prompt: 'Compute total downtime hours per asset in 2024 — re-order the stages.',
      sub: 'Filter to 2024 downtime events, group by asset, sort by hours, limit to worst.',
      why: 'Identifying worst-performing assets drives capital investment decisions. Filter to downtime events, group by assetId to sum hours, sort descending, and flag the worst offenders.',
      stages: [
        { id: 'm', code: '$match: { type: "downtime", timestamp: { $gte: ISODate("2024-01-01") } }', sub: 'filter to 2024 downtime', correct: 0 },
        { id: 'g', code: '$group: { _id: "$assetId", downtimeHours: { $sum: "$duration" } }', sub: 'sum hours per asset', correct: 1 },
        { id: 's', code: '$sort: { downtimeHours: -1 }', sub: 'worst performers first', correct: 2 },
        { id: 'l', code: '$limit: 10', sub: 'top 10 problem assets', correct: 3 }
      ],
      initial: ['l', 's', 'm', 'g']
    },
    a2: {
      title: '$project — maintenance report', kind: 'fill',
      prompt: 'Return just the asset serial and last maintenance date — hide _id.',
      sub: '$project shapes output for the maintenance compliance report.',
      why: 'Compliance reports need exact field shapes. `$project` with `_id: 0` delivers only serial and lastMaintenance for the regulatory submission.',
      snippet: [ 'db.assets.aggregate([\n  { $project: {\n    _id: ', { blank: 'id' }, ',\n    serial: ', { blank: 'one' }, ',\n    lastMaintenance: ', { blank: 'one2' }, '\n  } }\n])' ],
      choices: { id: { options: ['0', '1', 'false', 'null'], answer: '0' }, one: { options: ['1', '0', 'true', '"yes"'], answer: '1' }, one2: { options: ['1', '0', '"$lastMaintenance"', 'yes'], answer: '1' } }
    },
    a3: {
      title: '$lookup — enrich events with asset context', kind: 'reorder',
      prompt: 'Attach asset location and type to each sensor event for spatial analysis.',
      sub: '$lookup joins asset data, $unwind flattens, $project picks analysis fields.',
      why: 'Sensor analysis needs equipment context. `$lookup` brings asset location and type in, enabling spatial and type-based anomaly correlation without denormalization.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "assets", localField: "assetId", foreignField: "_id", as: "asset" }', sub: 'join asset record', correct: 0 },
        { id: 'un', code: '$unwind: "$asset"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, metric: 1, value: 1, location: "$asset.location", assetType: "$asset.type" }', sub: 'keep reading + context', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — latest readings', kind: 'blocks',
      prompt: 'Show the 5 most recent sensor readings.',
      sub: 'Sort by timestamp descending, limit to 5 for the real-time dashboard.',
      why: 'Control room dashboards need the freshest sensor data. `$sort` + `$limit` streams only the top-N readings without sorting the entire telemetry log.',
      snippet: [ 'db.sensorEvents.aggregate([\n  { ', { slot: 'sort' }, ': { timestamp: ', { slot: 'dir' }, ' } },\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }\n])' ],
      bank: [
        { id: 'sort', label: '$sort', kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir', label: '-1', kind: 'value', answer: 'dir' },
        { id: 'n', label: '5', kind: 'value', answer: 'n' },
        { id: 'x1', label: '$top', kind: 'stage' },
        { id: 'x2', label: '$first', kind: 'stage' },
        { id: 'x3', label: '1', kind: 'value' },
        { id: 'x4', label: '"5"', kind: 'value' }
      ]
    },
    i1: {
      title: 'Index strategies for sensor data', kind: 'index',
      prompt: 'The `sensorEvents` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each IoT access pattern to the right index type.',
      why: 'IoT queries span asset lookups, asset+time combos, full-text maintenance log searches, and low-cardinality flags. Each needs the right index at telemetry scale.',
      collection: 'sensorEvents',
      fields: [
        { name: 'assetId', type: 'ObjectId', need: 'single', used: 'db.sensorEvents.find({ assetId })' },
        { name: 'assetId + timestamp', type: 'ObjectId + Date', need: 'compound', used: 'db.sensorEvents.find({ assetId }).sort({ timestamp: -1 })' },
        { name: 'notes', type: 'String', need: 'search', used: 'Atlas Search over maintenance notes for knowledge retrieval' },
        { name: 'isProcessed', type: 'Bool', need: 'none', used: 'low cardinality — only true/false' }
      ],
      bank: [ { id: 'single', label: 'Single-field', kind: 'index' }, { id: 'compound', label: 'Compound', kind: 'index' }, { id: 'search', label: 'Atlas Search', kind: 'index' }, { id: 'none', label: 'No index', kind: 'index' } ]
    },
    i2: {
      title: 'ESR for telemetry queries', kind: 'reorder',
      prompt: 'Order this compound index for: find temperature readings above threshold, sorted by time.',
      sub: 'For: db.sensorEvents.find({ metric: "temperature", value: { $gt: 80 } }).sort({ timestamp: -1 })',
      why: 'ESR in IoT: equality (metric) narrows to temperature readings, sort (timestamp) delivers chronological order, range (value) scans only above-threshold readings.',
      stages: [
        { id: 'e', code: 'metric: 1',     sub: 'Equality — { metric: "temperature" }', correct: 0 },
        { id: 's', code: 'timestamp: -1',  sub: 'Sort — .sort({ timestamp: -1 })', correct: 1 },
        { id: 'r', code: 'value: 1',       sub: 'Range — { $gt: 80 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire raw telemetry', kind: 'fill',
      prompt: 'Auto-delete raw sensor events 30 days after ingestion.',
      sub: 'TTL indexes enforce data lifecycle — keep aggregates, expire raw readings.',
      why: 'Raw telemetry generates massive volume. A TTL index on `ingestedAt` auto-removes raw readings after 30 days (2592000 seconds), while pre-aggregated summaries persist for long-term analysis.',
      snippet: [ 'db.sensorEvents.', { blank: 'op' }, '(\n  { ingestedAt: 1 },\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }\n)' ],
      choices: { op: { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' }, key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' }, sec: { options: ['2592000', '30', '720', '86400'], answer: '2592000' } }
    },
    i4: {
      title: 'Covered query — asset status check', kind: 'fill',
      prompt: 'Query only fields in the index { serial: 1, status: 1 } for zero-fetch lookups.',
      sub: 'Covered queries return from the index — critical for real-time SCADA integrations.',
      why: 'SCADA systems poll asset status constantly. A covered query on { serial, status } returns from the index alone — zero document fetches at industrial polling rates.',
      snippet: [ 'db.assets.find(\n  { serial: ', { blank: 'val' }, ' },\n  { _id: ', { blank: 'id' }, ', serial: 1, status: 1 }\n).', { blank: 'verb' }, '("executionStats")' ],
      choices: { val: { options: ['"CNC-4401"', 'CNC-4401', '*', '{}'], answer: '"CNC-4401"' }, id: { options: ['0', '1', 'null', 'true'], answer: '0' }, verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' } }
    },
    v1: {
      title: '$vectorSearch — similar failure patterns', kind: 'fill',
      prompt: 'Find the 5 sensor events most similar to a known failure signature.',
      sub: 'Atlas Vector Search identifies equipment degradation using telemetry embeddings.',
      why: 'Predictive maintenance uses sensor embeddings to capture failure "signatures". Vector Search finds events with similar degradation patterns — catching problems before they become breakdowns.',
      snippet: [ 'db.sensorEvents.aggregate([{\n  $vectorSearch: {\n    index: "telemetry_embed_idx",\n    path: ', { blank: 'path' }, ',\n    queryVector: failureSignature,\n    numCandidates: 200,\n    ', { blank: 'limit' }, ': 5\n  }\n}])' ],
      choices: { path: { options: ['"embedding"', '"vector"', 'embedding', '"signature"'], answer: '"embedding"' }, limit: { options: ['limit', 'numResults', 'topK', 'k'], answer: 'limit' } }
    },
    v2: {
      title: '$search — maintenance knowledge', kind: 'blocks',
      prompt: 'Use Atlas Search to find maintenance notes about "bearing temperature anomaly".',
      sub: 'Atlas Search helps technicians find past fixes from maintenance logs.',
      why: 'Technicians need past repair knowledge during active issues. Atlas Search over maintenance notes finds relevant procedures and past fixes in seconds — reducing mean time to repair.',
      snippet: [ 'db.maintenanceLogs.aggregate([\n  { ', { slot: 'stage' }, ': {\n    ', { slot: 'operator' }, ': {\n      path: ', { slot: 'path' }, ',\n      query: ', { slot: 'query' }, '\n    }\n  } }\n])' ],
      bank: [
        { id: 'stage', label: '$search', kind: 'stage', answer: 'stage' },
        { id: 'operator', label: 'text', kind: 'op', answer: 'operator' },
        { id: 'path', label: '"notes"', kind: 'field', answer: 'path' },
        { id: 'query', label: '"bearing temperature anomaly"', kind: 'value', answer: 'query' },
        { id: 'x1', label: '$text', kind: 'op' },
        { id: 'x2', label: 'find', kind: 'op' },
        { id: 'x3', label: 'bearing temperature anomaly', kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — predictive alert', kind: 'fill',
      prompt: 'Fire a maintenance alert whenever a critical sensor threshold is breached.',
      sub: 'Database triggers react to dangerous readings and alert maintenance teams.',
      why: 'Equipment protection requires immediate response to threshold breaches. Atlas Triggers fire on insert and can alert maintenance within seconds — preventing cascading failures.',
      snippet: [ '// Atlas Trigger config\n{\n  type: "DATABASE",\n  database: "plant",\n  collection: ', { blank: 'col' }, ',\n  operationTypes: [', { blank: 'evt' }, '],\n  function: ', { blank: 'fn' }, '\n}' ],
      choices: { col: { options: ['"sensorEvents"', 'sensorEvents', 'SensorEvents', '*'], answer: '"sensorEvents"' }, evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' }, fn: { options: ['"alertMaintenance"', 'alertMaintenance', 'fn()', 'alert()'], answer: '"alertMaintenance"' } }
    },
    v4: {
      title: 'RAG — maintenance copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for a maintenance copilot: scope to plant, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to plant → drop weak matches → project for the LLM.',
      why: 'Maintenance copilots must only access the plant\'s own procedures. Pre-filtering by plantId ensures safety-critical isolation, and trimming keeps the LLM focused on relevant repair steps.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "maint_embed", path: "embedding", queryVector: q, limit: 8, filter: { plantId } }', sub: 'k-NN scoped to this plant', correct: 0 },
        { id: 'ms', code: '$match: { score: { $gt: 0.80 } }', sub: 'drop weak matches', correct: 1 },
        { id: 'pj', code: '$project: { _id: 0, procedure: 1, equipment: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 }
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
