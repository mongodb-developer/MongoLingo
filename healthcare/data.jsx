/* MongoLingo — Healthcare & Life Sciences industry content pack.
 * Every level has proprietary exercise content specific to healthcare workflows. */
registerMongoLingoIndustry(createMongoLingoIndustryPack({
  id: 'healthcare',
  name: 'Healthcare & Life Sciences',
  shortName: 'Healthcare',
  description: 'MongoDB lets healthcare teams model patient 360, encounters, care plans, consent, research data, and AI search with privacy-aware flexibility.',
  promise: 'MongoDB lets healthcare teams model patient 360, encounters, care plans, consent, research data, and AI search with privacy-aware flexibility.',
  searchPhrase: 'diabetes care plan',
  nouns: { profile: 'patient', profilePlural: 'patients', profileCollection: 'patients', item: 'care plan', itemPlural: 'care plans', itemCollection: 'carePlans', catalog: 'care catalog', user: 'clinician', transaction: 'encounter', transactionPlural: 'encounters', documentPlural: 'clinical notes' },
  aha: [
    { title: 'AHA: Patient context changes over time', message: 'A patient document grows with each encounter, diagnosis, and consent update — MongoDB handles evolving shapes naturally.' },
    { title: 'AHA: Documents match clinical records naturally', message: 'Encounter notes, lab results, and care plans are inherently document-shaped — no forced normalization.' },
    { title: 'AHA: Aggregation powers population insights', message: 'Pipeline stages can cohort patients, compute readmission risk, and feed clinical dashboards from live data.' },
    { title: 'AHA: Search makes clinical knowledge discoverable', message: 'Atlas Search over clinical notes and care plans helps clinicians find relevant protocols in seconds.' }
  ],
  levels: {
    /* ===== WORLD 1: Documents & Collections ===== */
    d1: {
      title: 'Build a patient document', kind: 'shape',
      prompt: 'Drag the right values into the patient record for Elena Rodriguez.',
      sub: 'Patient documents combine demographics, MRN, blood type, and active status.',
      why: 'A patient 360 document keeps demographics, conditions, allergies, and consent together — eliminating the fragmented records that cause clinical errors in traditional systems.',
      skeleton: [
        { key: '_id',       type: 'oid',  value: 'ObjectId("67c...")' },
        { key: 'name',      type: 'slot', slot: 'name' },
        { key: 'mrn',       type: 'slot', slot: 'mrn' },
        { key: 'bloodType', type: 'slot', slot: 'blood' },
        { key: 'active',    type: 'slot', slot: 'active' }
      ],
      bank: [
        { id: 'name',   label: '"Elena Rodriguez"', kind: 'value' },
        { id: 'mrn',    label: '"MRN-204891"',      kind: 'value' },
        { id: 'blood',  label: '"O+"',              kind: 'value' },
        { id: 'active', label: 'true',              kind: 'value' },
        { id: 'd1',     label: 'Elena Rodriguez',   kind: 'value' },
        { id: 'd2',     label: '"true"',            kind: 'value' },
        { id: 'd3',     label: 'MRN-204891',        kind: 'value' }
      ],
      answer: { name: 'name', mrn: 'mrn', blood: 'blood', active: 'active' }
    },
    d2: {
      title: 'insertOne() — record an encounter', kind: 'blocks',
      prompt: 'Record a new patient encounter in the encounters collection. Drag the missing pieces.',
      sub: 'Each clinical encounter becomes an immutable document capturing the care event.',
      why: 'Clinical encounters must be recorded immediately and immutably. `insertOne()` captures the full encounter context — provider, diagnosis, vitals — in one write for downstream analytics and billing.',
      snippet: [
        'db.', { slot: 'col' }, '.', { slot: 'op' }, '({',
        '\n  patientId: "MRN-204891",',
        '\n  type: ', { slot: 'val' }, ',',
        '\n  status: ', { slot: 'status' },
        '\n})'
      ],
      bank: [
        { id: 'op',     label: 'insertOne',    kind: 'op',    answer: 'op' },
        { id: 'col',    label: 'encounters',   kind: 'field', answer: 'col' },
        { id: 'val',    label: '"outpatient"',  kind: 'value', answer: 'val' },
        { id: 'status', label: '"in-progress"', kind: 'value', answer: 'status' },
        { id: 'x1',     label: 'addOne',        kind: 'op' },
        { id: 'x2',     label: 'visits',        kind: 'field' },
        { id: 'x3',     label: 'outpatient',    kind: 'value' }
      ]
    },
    d3: {
      title: 'updateOne() — discharge patient', kind: 'fill',
      prompt: 'Update encounter #ENC-8891 to "discharged" status.',
      sub: '$set patches the encounter status without replacing the clinical record.',
      why: 'Discharge updates must preserve the entire encounter history (vitals, notes, orders) while changing only the status. `$set` patches one field cleanly, maintaining the audit trail.',
      snippet: [
        'db.encounters.updateOne(',
        '\n  { encounterId: "ENC-8891" },',
        '\n  { ', { blank: 'op' }, ': { ', { blank: 'field' }, ': ', { blank: 'val' }, ' } }',
        '\n)'
      ],
      choices: {
        op:    { options: ['$set', '$push', '$inc', '$replace'], answer: '$set' },
        field: { options: ['status', 'state', 'discharged', 'phase'], answer: 'status' },
        val:   { options: ['"discharged"', 'discharged', 'true', '"complete"'], answer: '"discharged"' }
      }
    },
    d4: {
      title: 'deleteOne() — revoke expired consent', kind: 'fill',
      prompt: 'Remove the oldest expired consent record for data retention compliance.',
      sub: 'deleteOne() removes exactly one consent doc — sort ensures you pick the oldest.',
      why: 'Health data regulations (GDPR, HIPAA) require precise consent lifecycle management. Always sort by expiration date to target the correct expired record — a broad filter could revoke active consent.',
      snippet: [
        'db.consents.', { blank: 'op' }, '(',
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

    /* ===== WORLD 2: Querying ===== */
    q1: {
      title: 'Find patients by condition', kind: 'blocks',
      prompt: 'Find every patient whose primaryCondition is "diabetes".',
      sub: 'Equality queries return all matching patient records instantly with an index.',
      why: 'Condition-based patient lookups power clinical dashboards, cohort analysis, and care coordination. An index on `primaryCondition` lets MongoDB return results in microseconds across millions of records.',
      snippet: [
        'db.patients.find({ ',
        { slot: 'field' }, ': ', { slot: 'val' },
        ' })'
      ],
      bank: [
        { id: 'field', label: 'primaryCondition', kind: 'field', answer: 'field' },
        { id: 'val',   label: '"diabetes"',        kind: 'value', answer: 'val' },
        { id: 'x1',    label: 'condition',          kind: 'field' },
        { id: 'x2',    label: 'diabetes',           kind: 'value' },
        { id: 'x3',    label: 'diagnosis',          kind: 'field' }
      ]
    },
    q2: {
      title: '$gt — high-risk vitals', kind: 'blocks',
      prompt: 'Find encounters where heart rate exceeded 120 bpm.',
      sub: '$match with $gt filters critical vital signs that need clinical attention.',
      why: 'Clinical alerts fire on threshold breaches. Placing $match with $gt on an indexed vitals field lets MongoDB quickly surface the encounters that need immediate clinical review.',
      snippet: [
        'db.encounters.aggregate([',
        '\n  { ', { slot: 'stage' }, ': { heartRate: { ', { slot: 'op' }, ': ', { slot: 'val' }, ' } } }',
        '\n])'
      ],
      bank: [
        { id: 'stage', label: '$match', kind: 'stage', answer: 'stage' },
        { id: 'op',    label: '$gt',    kind: 'op',    answer: 'op' },
        { id: 'val',   label: '120',    kind: 'value', answer: 'val' },
        { id: 'x1',    label: '$filter', kind: 'stage' },
        { id: 'x2',    label: '$gte',    kind: 'op' },
        { id: 'x3',    label: '$lt',     kind: 'op' },
        { id: 'x4',    label: '"120"',   kind: 'value' }
      ]
    },
    q3: {
      title: '$in — multi-department query', kind: 'fill',
      prompt: 'Find patients currently in "ICU" or "ER" departments.',
      sub: '$in matches any value from an array — perfect for multi-location queries.',
      why: 'Hospital coordinators need to see patients across critical departments at once. `$in` efficiently queries multiple department values with a single index scan.',
      snippet: [
        'db.patients.find({',
        '\n  department: { ', { blank: 'op' }, ': ', { blank: 'arr' }, ' }',
        '\n})'
      ],
      choices: {
        op:  { options: ['$in', '$any', '$or', '$contains'], answer: '$in' },
        arr: { options: ['["ICU", "ER"]', '"ICU, ER"', '{ ICU, ER }', '[ICU, ER]'], answer: '["ICU", "ER"]' }
      }
    },
    q4: {
      title: 'Compound filter — age + condition', kind: 'fill',
      prompt: 'Find active patients aged 65 or older with diabetes.',
      sub: 'Combine equality and range operators for precise clinical cohorts.',
      why: 'Geriatric care programs target specific populations. Combining active status, age range, and condition in one query gives care teams instant access to their patient cohort.',
      snippet: [
        'db.patients.find({',
        '\n  active: true,',
        '\n  primaryCondition: "diabetes",',
        '\n  age: { ', { blank: 'op' }, ': 65 }',
        '\n})'
      ],
      choices: {
        op: { options: ['$gte', '$gt', '$eq', '>='], answer: '$gte' }
      }
    },

    /* ===== WORLD 3: Aggregation Pipeline ===== */
    a1: {
      title: 'Readmission rates by department', kind: 'reorder',
      prompt: 'Compute 30-day readmission count per department in 2024 — re-order the stages.',
      sub: 'Filter to 2024 readmissions, group by department, sort by count, limit to worst.',
      why: 'Readmission rates are a key quality metric. Filter to readmissions first (shrink the dataset), group by department to count, sort descending, and limit to the departments needing intervention.',
      stages: [
        { id: 'm', code: '$match: { readmission: true, admitDate: { $gte: ISODate("2024-01-01") } }', sub: 'filter to 2024 readmissions', correct: 0 },
        { id: 'g', code: '$group: { _id: "$department", readmitCount: { $sum: 1 } }', sub: 'count per department', correct: 1 },
        { id: 's', code: '$sort: { readmitCount: -1 }', sub: 'worst departments first', correct: 2 },
        { id: 'l', code: '$limit: 5', sub: 'top 5 problem areas', correct: 3 }
      ],
      initial: ['l', 's', 'm', 'g']
    },
    a2: {
      title: '$project — discharge summary', kind: 'fill',
      prompt: 'Return just the patient name and discharge diagnosis — hide _id.',
      sub: '$project shapes the output for downstream clinical systems.',
      why: 'Discharge summaries sent to primary care need only essential fields. `$project` with `_id: 0` removes internal identifiers and delivers exactly what the receiving system expects.',
      snippet: [
        'db.encounters.aggregate([',
        '\n  { $project: {',
        '\n    _id: ', { blank: 'id' }, ',',
        '\n    patientName: ', { blank: 'one' }, ',',
        '\n    diagnosis: ', { blank: 'one2' },
        '\n  } }',
        '\n])'
      ],
      choices: {
        id:   { options: ['0', '1', 'false', 'null'], answer: '0' },
        one:  { options: ['1', '0', 'true', '"yes"'], answer: '1' },
        one2: { options: ['1', '0', '"$diagnosis"', 'yes'], answer: '1' }
      }
    },
    a3: {
      title: '$lookup — enrich encounters with patient info', kind: 'reorder',
      prompt: 'Attach patient demographics to each encounter, then extract allergies.',
      sub: '$lookup joins patient data, $unwind flattens, $project picks relevant fields.',
      why: 'Clinical decision support needs patient context alongside encounter data. `$lookup` brings demographics and allergies in, `$unwind` flattens, and `$project` delivers the safety-critical fields.',
      stages: [
        { id: 'lo', code: '$lookup: { from: "patients", localField: "patientId", foreignField: "_id", as: "patient" }', sub: 'join patient record', correct: 0 },
        { id: 'un', code: '$unwind: "$patient"', sub: 'flatten to single doc', correct: 1 },
        { id: 'pr', code: '$project: { _id: 0, encounterId: 1, allergies: "$patient.allergies", diagnosis: 1 }', sub: 'keep safety-critical fields', correct: 2 }
      ],
      initial: ['pr', 'lo', 'un']
    },
    a4: {
      title: '$sort + $limit — critical alerts', kind: 'blocks',
      prompt: 'Show the 3 most recent critical lab results.',
      sub: 'Sort by resultTime descending, limit to 3 for the clinician dashboard.',
      why: 'Clinicians need the most urgent lab results immediately. `$sort` + `$limit` streams only the top-N critical results without sorting the entire lab history in memory.',
      snippet: [
        'db.labResults.aggregate([',
        '\n  { ', { slot: 'sort' }, ': { resultTime: ', { slot: 'dir' }, ' } },',
        '\n  { ', { slot: 'limit' }, ': ', { slot: 'n' }, ' }',
        '\n])'
      ],
      bank: [
        { id: 'sort',  label: '$sort',  kind: 'stage', answer: 'sort' },
        { id: 'limit', label: '$limit', kind: 'stage', answer: 'limit' },
        { id: 'dir',   label: '-1',     kind: 'value', answer: 'dir' },
        { id: 'n',     label: '3',      kind: 'value', answer: 'n' },
        { id: 'x1',    label: '$top',   kind: 'stage' },
        { id: 'x2',    label: '$first', kind: 'stage' },
        { id: 'x3',    label: '1',      kind: 'value' },
        { id: 'x4',    label: '"3"',    kind: 'value' }
      ]
    },

    /* ===== WORLD 4: Indexes & Performance ===== */
    i1: {
      title: 'Index strategies for clinical queries', kind: 'index',
      prompt: 'The `encounters` collection has four query patterns. Pick the best index for each.',
      sub: 'Match each clinical access pattern to the right index type.',
      why: 'Healthcare queries range from patient lookups to full-text clinical note searches. Each pattern needs the right index — compound for patient+date, Search for clinical narratives, and never index low-cardinality flags alone.',
      collection: 'encounters',
      fields: [
        { name: 'patientId', type: 'ObjectId', need: 'single', used: 'db.encounters.find({ patientId })' },
        { name: 'patientId + admitDate', type: 'ObjectId + Date', need: 'compound', used: 'db.encounters.find({ patientId }).sort({ admitDate: -1 })' },
        { name: 'clinicalNotes', type: 'String', need: 'search', used: 'Atlas Search over encounter narratives for clinical decision support' },
        { name: 'isBillable', type: 'Bool', need: 'none', used: 'low cardinality flag — only two values' }
      ],
      bank: [
        { id: 'single',   label: 'Single-field', kind: 'index' },
        { id: 'compound', label: 'Compound',     kind: 'index' },
        { id: 'search',   label: 'Atlas Search', kind: 'index' },
        { id: 'none',     label: 'No index',     kind: 'index' }
      ]
    },
    i2: {
      title: 'ESR for encounter queries', kind: 'reorder',
      prompt: 'Order this compound index for: find admitted patients with long stays, sorted by admit date.',
      sub: 'For: db.encounters.find({ status: "admitted", lengthOfStay: { $gt: 7 } }).sort({ admitDate: -1 })',
      why: 'ESR in healthcare: equality (status) narrows to admitted patients, sort (admitDate) delivers results chronologically, range (lengthOfStay) scans only long-stay encounters.',
      stages: [
        { id: 'e', code: 'status: 1',        sub: 'Equality — { status: "admitted" }', correct: 0 },
        { id: 's', code: 'admitDate: -1',     sub: 'Sort — .sort({ admitDate: -1 })', correct: 1 },
        { id: 'r', code: 'lengthOfStay: 1',   sub: 'Range — { $gt: 7 }', correct: 2 }
      ],
      initial: ['r', 's', 'e']
    },
    i3: {
      title: 'TTL — expire temp access tokens', kind: 'fill',
      prompt: 'Auto-expire clinical access tokens 8 hours after issuance.',
      sub: 'TTL indexes enforce session security for PHI access — automatic, no cron.',
      why: 'HIPAA requires strict access controls. TTL indexes auto-expire clinical session tokens after 8 hours (28800 seconds), ensuring abandoned sessions cannot access PHI indefinitely.',
      snippet: [
        'db.accessTokens.', { blank: 'op' }, '(',
        '\n  { issuedAt: 1 },',
        '\n  { ', { blank: 'key' }, ': ', { blank: 'sec' }, ' }',
        '\n)'
      ],
      choices: {
        op:  { options: ['createIndex', 'addIndex', 'index', 'ensureIndex'], answer: 'createIndex' },
        key: { options: ['expireAfterSeconds', 'ttl', 'expires', 'maxAge'], answer: 'expireAfterSeconds' },
        sec: { options: ['28800', '8', '480', '86400'], answer: '28800' }
      }
    },
    i4: {
      title: 'Covered query — patient lookup', kind: 'fill',
      prompt: 'Query only fields in the index { mrn: 1, name: 1 } for a zero-fetch lookup.',
      sub: 'Covered queries return from the index alone — critical for high-frequency patient lookups.',
      why: 'Patient identification happens on every clinical interaction. A covered query on { mrn, name } returns instantly from the index — zero document fetches for the most common lookup pattern.',
      snippet: [
        'db.patients.find(',
        '\n  { mrn: ', { blank: 'val' }, ' },',
        '\n  { _id: ', { blank: 'id' }, ', mrn: 1, name: 1 }',
        '\n).', { blank: 'verb' }, '("executionStats")'
      ],
      choices: {
        val:  { options: ['"MRN-204891"', 'MRN-204891', '*', '{}'], answer: '"MRN-204891"' },
        id:   { options: ['0', '1', 'null', 'true'], answer: '0' },
        verb: { options: ['explain', 'plan', 'analyze', 'trace'], answer: 'explain' }
      }
    },

    /* ===== WORLD 5: Atlas Superpowers ===== */
    v1: {
      title: '$vectorSearch — similar clinical cases', kind: 'fill',
      prompt: 'Find the 5 encounters most clinically similar to the current patient presentation.',
      sub: 'Atlas Vector Search uses embeddings to find cases with similar symptom patterns.',
      why: 'Clinical decision support uses encounter embeddings to find past cases with similar presentations — even when diagnoses use different terminology. This powers "patients like mine" recommendations.',
      snippet: [
        'db.encounters.aggregate([{',
        '\n  $vectorSearch: {',
        '\n    index: "clinical_embed_idx",',
        '\n    path: ', { blank: 'path' }, ',',
        '\n    queryVector: presentationEmbedding,',
        '\n    numCandidates: 150,',
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
      title: '$search — clinical note search', kind: 'blocks',
      prompt: 'Use Atlas Search to find clinical notes mentioning "diabetes care plan".',
      sub: 'Atlas Search enables full-text search over clinical narratives with relevance ranking.',
      why: 'Clinicians search thousands of notes for treatment protocols and past decisions. Atlas Search provides relevance scoring and fuzzy matching — finding relevant clinical knowledge in seconds.',
      snippet: [
        'db.encounters.aggregate([',
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
        { id: 'path',     label: '"clinicalNotes"',      kind: 'field', answer: 'path' },
        { id: 'query',    label: '"diabetes care plan"', kind: 'value', answer: 'query' },
        { id: 'x1',       label: '$text',                kind: 'op' },
        { id: 'x2',       label: 'find',                 kind: 'op' },
        { id: 'x3',       label: 'diabetes care plan',   kind: 'value' }
      ]
    },
    v3: {
      title: 'Atlas Trigger — critical result alert', kind: 'fill',
      prompt: 'Fire a clinician notification whenever a critical lab result is inserted.',
      sub: 'Database triggers react to new critical results and alert the care team instantly.',
      why: 'Critical lab results (e.g., dangerously high potassium) need immediate clinician attention. Atlas Triggers fire on insert and notify the care team within seconds — faster than any polling system.',
      snippet: [
        '// Atlas Trigger config',
        '\n{',
        '\n  type: "DATABASE",',
        '\n  database: "clinical",',
        '\n  collection: ', { blank: 'col' }, ',',
        '\n  operationTypes: [', { blank: 'evt' }, '],',
        '\n  function: ', { blank: 'fn' },
        '\n}'
      ],
      choices: {
        col: { options: ['"labResults"', 'labResults', 'LabResults', '*'], answer: '"labResults"' },
        evt: { options: ['"insert"', '"create"', '"write"', '"new"'], answer: '"insert"' },
        fn:  { options: ['"notifyCriticalResult"', 'notifyCriticalResult', 'fn()', 'alert()'], answer: '"notifyCriticalResult"' }
      }
    },
    v4: {
      title: 'RAG — clinical copilot', kind: 'reorder',
      prompt: 'Build a RAG pipeline for a clinical copilot: scope to hospital, retrieve semantically, trim for the LLM.',
      sub: 'Vector search scoped to hospital → drop weak matches → project only what the LLM needs.',
      why: 'Clinical copilots must only access the institution\'s own clinical knowledge base. Pre-filtering by hospitalId ensures patient privacy, and trimming the payload keeps the LLM focused on relevant protocols.',
      stages: [
        { id: 'vs', code: '$vectorSearch: { index: "protocol_embed", path: "embedding", queryVector: q, limit: 8, filter: { hospitalId } }', sub: 'k-NN scoped to this hospital', correct: 0 },
        { id: 'pj', code: '$project: { _id: 0, protocol: 1, section: 1, score: { $meta: "vectorSearchScore" } }', sub: 'trim for the LLM', correct: 2 },
        { id: 'ms', code: '$match: { score: { $gt: 0.82 } }', sub: 'drop low-confidence matches', correct: 1 },
      ],
      initial: ['pj', 'ms', 'vs']
    }
  }
}));
