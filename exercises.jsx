/* MongoLingo — exercise components.
 * Each one calls onResult({ correct: bool, perfect: bool, diff?: string[] }) when checked.
 * They expose: { ready: bool } via onState({ ready }) so the parent enables/disables CHECK.
 */

const { useState: useS, useEffect: useE, useRef: useR, useMemo: useM, useCallback: useC } = React;

/* ====================================================================
 * Common: drag-and-drop helpers (HTML5 + touch-friendly via pointer events)
 * ==================================================================== */

/* A token in the bank. Drag with mouse OR tap-to-select then tap a slot. */
function DragToken({ id, kind, label, used, selected, onSelect, onDragStart }) {
  return (
    <button
      className="ml-token"
      data-kind={kind}
      draggable={!used}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart && onDragStart(id);
      }}
      onClick={() => onSelect && onSelect(id)}
      disabled={used}
      style={selected ? { outline: '2px solid var(--lg-spring)', outlineOffset: 2 } : {}}
      aria-pressed={selected || undefined}
      aria-label={`${kind} ${label}`}
    >
      {label}
    </button>
  );
}

/* A drop slot that accepts dragged token ids. */
function DropSlot({
  filledLabel, filledKind, onDrop, onClear, accepted = true, placeholder = '____', state
}) {
  const [over, setOver] = useS(false);
  return (
    <span
      className="ml-slot"
      data-over={over}
      data-filled={!!filledLabel}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDrop(id);
      }}
      onClick={() => filledLabel && onClear && onClear()}
      role="button"
      tabIndex={0}
      aria-label={filledLabel ? `Filled with ${filledLabel}, click to clear` : 'Empty slot'}
    >
      {filledLabel
        ? <span className="ml-token" data-kind={filledKind} style={{ padding: '4px 8px' }}>{filledLabel}</span>
        : <span style={{ padding: '0 6px' }}>{placeholder}</span>}
    </span>
  );
}

/* ====================================================================
 * Exercise: SHAPE — drag JSON values into a document skeleton.
 * ==================================================================== */
function ShapeExercise({ level, onResult, onState }) {
  const slots = useM(() => level.skeleton.filter(f => f.type === 'slot'), [level]);
  const [filled, setFilled] = useS({}); // { slotName: tokenId }
  const [feedback, setFeedback] = useS(null);
  const [perfect, setPerfect] = useS(true);

  const allFilled = slots.every(s => filled[s.slot]);

  const bankById = useM(() => Object.fromEntries(level.bank.map(b => [b.id, b])), [level]);

  function placeAt(slotKey, tokenId) {
    setFilled(prev => {
      const next = { ...prev };
      // Remove tokenId from any other slot
      for (const k of Object.keys(next)) if (next[k] === tokenId) delete next[k];
      next[slotKey] = tokenId;
      return next;
    });
  }

  function check() {
    let correct = true;
    for (const [k, expected] of Object.entries(level.answer)) {
      if (filled[k] !== expected) correct = false;
    }
    if (!correct) setPerfect(false);
    setFeedback(correct ? {
      state: 'correct',
      title: 'Document accepted.',
      message: `Inserted into db.users — _id auto-generated.`
    } : {
      state: 'wrong',
      title: 'BSON type mismatch.',
      message: 'Strings need quotes. Numbers and booleans do not. Try again.'
    });
    onResult && onResult({ correct, perfect: correct && perfect });
  }
  // expose check via state
  useE(() => { onState && onState({
    ready: allFilled, check,
    userState: { filled, bankById },
    reset: () => { setFilled({}); setFeedback(null); setPerfect(true); }
  }); }, [allFilled, filled, perfect]);

  return (
    <>
      <div className="ml-doc-result" style={{ marginBottom: 18 }}>
        {/* The skeleton itself acts as the drop targets */}
        <div className="ml-code" aria-label="user document">
          <span style={{ color: '#6F8390' }}>{'{'}</span>
          {level.skeleton.map((f, i) => {
            const isLast = i === level.skeleton.length - 1;
            return (
              <div key={f.key} style={{ marginLeft: 12 }}>
                <span style={{ color: '#B6E1FF' }}>{f.key}</span>
                <span style={{ color: '#6F8390' }}>: </span>
                {f.type === 'oid'
                  ? <span style={{ color: '#FFC76A' }}>{f.value}</span>
                  : <DropSlot
                      filledLabel={filled[f.slot] ? bankById[filled[f.slot]].label : null}
                      filledKind="value"
                      onDrop={(id) => placeAt(f.slot, id)}
                      onClear={() => setFilled(p => { const n = { ...p }; delete n[f.slot]; return n; })}
                      placeholder="____"
                    />}
                {!isLast && <span style={{ color: '#6F8390' }}>,</span>}
              </div>
            );
          })}
          <span style={{ color: '#6F8390' }}>{'}'}</span>
        </div>
      </div>
      <div>
        <div className="ml-pane__label">Token bank — drag the JSON values</div>
        <div className="ml-tokenbank">
          {level.bank.map(t => (
            <DragToken
              key={t.id}
              id={t.id}
              kind="value"
              label={t.label}
              used={Object.values(filled).includes(t.id)}
            />
          ))}
        </div>
      </div>
      <Feedback {...(feedback || {})} state={feedback?.state} />
    </>
  );
}

/* ====================================================================
 * Exercise: BLOCKS — assemble a snippet by dragging operator/value tokens.
 * ==================================================================== */
function BlocksExercise({ level, onResult, onState }) {
  const [filled, setFilled] = useS({}); // slotName → tokenId
  const [feedback, setFeedback] = useS(null);
  const [perfect, setPerfect] = useS(true);

  const slots = useM(() => level.snippet.filter(t => typeof t === 'object' && t.slot).map(t => t.slot), [level]);
  const bankById = useM(() => Object.fromEntries(level.bank.map(b => [b.id, b])), [level]);

  const allFilled = slots.every(s => filled[s]);

  function placeAt(slotKey, tokenId) {
    setFilled(prev => {
      const next = { ...prev };
      for (const k of Object.keys(next)) if (next[k] === tokenId) delete next[k];
      next[slotKey] = tokenId;
      return next;
    });
  }

  function check() {
    let correct = true;
    for (const slot of slots) {
      const tid = filled[slot];
      const tok = tid && bankById[tid];
      if (!tok || tok.answer !== slot) correct = false;
    }
    if (!correct) setPerfect(false);

    // Diff for wrong-answer feedback
    const correctSnippet = renderSnippet(level.snippet, Object.fromEntries(
      slots.map(s => [s, level.bank.find(b => b.answer === s)?.label || '?'])
    ));
    const yourSnippet = renderSnippet(level.snippet, Object.fromEntries(
      slots.map(s => [s, filled[s] ? bankById[filled[s]].label : '____'])
    ));

    setFeedback(correct ? {
      state: 'correct',
      title: 'Query compiles. 1 doc affected.',
      message: 'Reads cleanly. Run it!'
    } : {
      state: 'wrong',
      title: 'Almost. Check your operators.',
      message: 'Operators start with `$`. Strings need quotes.',
      diff: makeDiff(yourSnippet, correctSnippet)
    });
    onResult && onResult({ correct, perfect: correct && perfect });
  }

  useE(() => { onState && onState({
    ready: allFilled, check,
    userState: { filled, bankById },
    reset: () => { setFilled({}); setFeedback(null); setPerfect(true); }
  }); }, [allFilled, filled, perfect]);

  return (
    <>
      <div className="ml-code" style={{ marginBottom: 16 }}>
        {renderSnippetReact(level.snippet, filled, bankById, placeAt, setFilled)}
      </div>
      <div className="ml-pane__label">Token bank — drag the missing pieces</div>
      <div className="ml-tokenbank">
        {level.bank.map(t => (
          <DragToken
            key={t.id}
            id={t.id}
            kind={t.kind}
            label={t.label}
            used={Object.values(filled).includes(t.id)}
          />
        ))}
      </div>
      <Feedback {...(feedback || {})} state={feedback?.state} />
    </>
  );
}

function renderSnippetReact(snippet, filled, bankById, placeAt, setFilled) {
  return snippet.map((piece, i) => {
    if (typeof piece === 'string') {
      return <React.Fragment key={i}>{piece}</React.Fragment>;
    }
    const tid = filled[piece.slot];
    const tok = tid ? bankById[tid] : null;
    return (
      <DropSlot
        key={i}
        filledLabel={tok?.label}
        filledKind={tok?.kind || 'value'}
        onDrop={(id) => placeAt(piece.slot, id)}
        onClear={() => setFilled(p => { const n = { ...p }; delete n[piece.slot]; return n; })}
        placeholder="____"
      />
    );
  });
}

function renderSnippet(snippet, filledLabels) {
  return snippet.map(p => typeof p === 'string' ? p : (filledLabels[p.slot] ?? '____')).join('');
}

/* ====================================================================
 * Exercise: FILL — click a blank, choose from the option list.
 * ==================================================================== */
function FillExercise({ level, onResult, onState }) {
  const blanks = useM(() => level.snippet.filter(t => typeof t === 'object').map(t => t.blank), [level]);
  const [filled, setFilled] = useS({});
  const [active, setActive] = useS(null);
  const [tried, setTried] = useS({}); // blank → set of wrong tokens
  const [feedback, setFeedback] = useS(null);
  const [perfect, setPerfect] = useS(true);

  const allFilled = blanks.every(b => filled[b]);

  function choose(blank, value) {
    const ans = level.choices[blank].answer;
    if (value === ans) {
      setFilled(prev => ({ ...prev, [blank]: value }));
      setActive(null);
    } else {
      setTried(prev => ({ ...prev, [blank]: new Set([...(prev[blank] || []), value]) }));
      setPerfect(false);
      // shake the blank
      const el = document.querySelector(`[data-blank="${blank}"]`);
      if (el) {
        el.setAttribute('data-state', 'wrong');
        setTimeout(() => { el.setAttribute('data-state', active === blank ? 'active' : (filled[blank] ? 'filled' : '')); }, 280);
      }
    }
  }

  function check() {
    const correct = blanks.every(b => filled[b] === level.choices[b].answer);
    setFeedback(correct ? {
      state: 'correct',
      title: 'Compiled.',
      message: '1 doc affected. Acknowledged.'
    } : {
      state: 'wrong',
      title: 'Almost.',
      message: 'Re-check the highlighted blanks.'
    });
    onResult && onResult({ correct, perfect: correct && perfect });
  }

  useE(() => { onState && onState({
    ready: allFilled, check,
    userState: { filled },
    reset: () => { setFilled({}); setTried({}); setActive(null); setFeedback(null); setPerfect(true); }
  }); }, [allFilled, filled, perfect]);

  // build a flat element list w/ blanks
  return (
    <>
      <div className="ml-code" style={{ marginBottom: 16 }}>
        {level.snippet.map((piece, i) => {
          if (typeof piece === 'string') return <React.Fragment key={i}>{piece}</React.Fragment>;
          const filledVal = filled[piece.blank];
          const state = filledVal ? 'filled' : (active === piece.blank ? 'active' : '');
          return (
            <span
              key={i}
              className="ml-blank"
              data-blank={piece.blank}
              data-state={state}
              onClick={() => setActive(piece.blank)}
              tabIndex={0}
              role="button"
              aria-label={`blank ${piece.blank}`}
            >
              {filledVal || '____'}
            </span>
          );
        })}
      </div>
      {active && (
        <div style={{ marginBottom: 16 }}>
          <div className="ml-pane__label">Choose for blank · <span style={{ color: 'var(--lg-spring)' }}>{active}</span></div>
          <div className="ml-tokenbank">
            {level.choices[active].options.map(opt => {
              const wasTried = (tried[active] || new Set()).has(opt);
              return (
                <button
                  key={opt}
                  className="ml-token"
                  data-kind={isOperator(opt) ? 'op' : (opt.startsWith('"') ? 'value' : 'value')}
                  onClick={() => choose(active, opt)}
                  style={wasTried ? { opacity: 0.45, textDecoration: 'line-through' } : {}}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Feedback {...(feedback || {})} state={feedback?.state} />
    </>
  );
}

function isOperator(s) { return typeof s === 'string' && s.startsWith('$'); }

/* ====================================================================
 * Exercise: REORDER — drag pipeline stages into the right order.
 * ==================================================================== */
function ReorderExercise({ level, onResult, onState }) {
  const stageMap = useM(() => Object.fromEntries(level.stages.map(s => [s.id, s])), [level]);
  const [order, setOrder] = useS(level.initial);
  const [feedback, setFeedback] = useS(null);
  const [perfect, setPerfect] = useS(true);
  const draggingRef = useR(null);
  const [overIndex, setOverIndex] = useS({ idx: null, half: null });

  function moveTo(from, to) {
    if (from === to) return;
    setOrder(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function check() {
    const correct = order.every((id, i) => stageMap[id].correct === i);
    if (!correct) setPerfect(false);
    setFeedback(correct ? {
      state: 'correct',
      title: 'Pipeline runs.',
      message: 'Stages are in the right order.'
    } : {
      state: 'wrong',
      title: 'That pipeline is out of order.',
      message: 'Remember: $match before $group keeps the planner happy.'
    });
    onResult && onResult({ correct, perfect: correct && perfect });
  }

  useE(() => { onState && onState({
    ready: true, check,
    userState: { order, stageMap },
    reset: () => { setOrder(level.initial); setFeedback(null); setPerfect(true); }
  }); }, [order, perfect]);

  // keyboard support: focus + arrow keys
  function bumpKey(idx, dir) {
    const to = idx + dir;
    if (to < 0 || to >= order.length) return;
    moveTo(idx, to);
  }

  return (
    <>
      <div className="ml-reorder" role="list" aria-label="pipeline stages">
        {order.map((id, idx) => {
          const stage = stageMap[id];
          const isOver = overIndex.idx === idx;
          return (
            <div
              key={id}
              className={`ml-stage${draggingRef.current === id ? ' is-dragging' : ''}${
                isOver && overIndex.half === 'top' ? ' is-over-top' :
                isOver && overIndex.half === 'bot' ? ' is-over-bot' : ''
              }`}
              draggable
              tabIndex={0}
              role="listitem"
              aria-grabbed={draggingRef.current === id || undefined}
              onDragStart={(e) => {
                draggingRef.current = id;
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', id);
              }}
              onDragEnd={() => { draggingRef.current = null; setOverIndex({ idx: null, half: null }); }}
              onDragOver={(e) => {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                const half = (e.clientY - rect.top) < rect.height / 2 ? 'top' : 'bot';
                setOverIndex({ idx, half });
              }}
              onDrop={(e) => {
                e.preventDefault();
                const fromId = e.dataTransfer.getData('text/plain');
                const fromIdx = order.indexOf(fromId);
                if (fromIdx < 0) return;
                let toIdx = idx + (overIndex.half === 'bot' ? 1 : 0);
                if (fromIdx < toIdx) toIdx--;
                moveTo(fromIdx, toIdx);
                setOverIndex({ idx: null, half: null });
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp')   { e.preventDefault(); bumpKey(idx, -1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); bumpKey(idx, +1); }
              }}
            >
              <div className="ml-stage__num">{idx + 1}</div>
              <div className="ml-stage__body">
                <code>{stage.code}</code>
                <small>{stage.sub}</small>
              </div>
              <Icon name="Drag" size={14} className="ml-stage__drag" color="var(--ml-text-faint)" />
            </div>
          );
        })}
      </div>
      <Feedback {...(feedback || {})} state={feedback?.state} />
    </>
  );
}

/* ====================================================================
 * Exercise: INDEX — drop index types onto collection fields.
 * ==================================================================== */
function IndexExercise({ level, onResult, onState }) {
  const [drops, setDrops] = useS({}); // fieldName → indexId
  const [selectedIndex, setSelectedIndex] = useS(null);
  const [feedback, setFeedback] = useS(null);
  const [perfect, setPerfect] = useS(true);
  const bankById = useM(() => Object.fromEntries(level.bank.map(b => [b.id, b])), [level]);

  const allFilled = level.fields.every(f => drops[f.name]);

  function place(fieldName, idxId) {
    setDrops(prev => ({ ...prev, [fieldName]: idxId }));
    setSelectedIndex(null);
  }

  function check() {
    const correct = level.fields.every(f => drops[f.name] === f.need);
    if (!correct) setPerfect(false);
    setFeedback(correct ? {
      state: 'correct',
      title: 'explain() shows IXSCAN.',
      message: 'No more COLLSCANs. Your reads got fast.'
    } : {
      state: 'wrong',
      title: 'One of those is a COLLSCAN waiting to happen.',
      message: 'Low-cardinality bool fields rarely pay back the write cost. Combine filter+sort fields into a compound index.'
    });
    onResult && onResult({ correct, perfect: correct && perfect });
  }

  useE(() => { onState && onState({
    ready: allFilled, check,
    userState: { drops, bankById },
    reset: () => { setDrops({}); setSelectedIndex(null); setFeedback(null); setPerfect(true); }
  }); }, [allFilled, drops, selectedIndex, perfect]);

  return (
    <>
      <div className="ml-collection">
        <div className="ml-collection__name">db.{level.collection}</div>
        {level.fields.map(f => (
          <div key={f.name} className="ml-field-row">
            <div>
              <span className="ml-field-row__name">{f.name}</span>
              <span style={{ color: '#6F8390', margin: '0 8px' }}>·</span>
              <span className="ml-field-row__type">{f.type}</span>
              <div style={{ fontFamily: 'var(--ml-font-sans)', fontSize: 11.5, color: 'var(--ml-text-faint)' }}>
                used for {f.used}
              </div>
            </div>
            <FieldDrop
              filled={drops[f.name]}
              label={drops[f.name] ? bankById[drops[f.name]].label : null}
              onDrop={(id) => place(f.name, id)}
              onClear={() => setDrops(p => { const n = { ...p }; delete n[f.name]; return n; })}
              onPick={() => selectedIndex && place(f.name, selectedIndex)}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <div className="ml-pane__label">Index types — drag onto each field, or tap an index then tap a row</div>
        <div className="ml-tokenbank">
          {level.bank.map(b => (
            <DragToken
              key={b.id}
              id={b.id}
              kind="index"
              label={b.label}
              selected={selectedIndex === b.id}
              onSelect={() => setSelectedIndex(prev => prev === b.id ? null : b.id)}
            />
          ))}
        </div>
      </div>
      <Feedback {...(feedback || {})} state={feedback?.state} />
    </>
  );
}

function FieldDrop({ filled, label, onDrop, onClear, onPick }) {
  const [over, setOver] = useS(false);
  return (
    <div
      className="ml-field-row__drop"
      data-over={over}
      data-filled={!!filled}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onDrop(id);
      }}
      onClick={() => filled ? onClear() : onPick && onPick()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          filled ? onClear() : onPick && onPick();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {label || 'Drop an index'}
    </div>
  );
}

/* ====================================================================
 * Live previews per exercise kind — rendered by parent in the right pane.
 * ==================================================================== */
function LevelPreview({ level, userState, resultState }) {
  if (!resultState?.correct) {
    return <div className="ml-empty">Submit a correct answer to run the sandbox and reveal results.</div>;
  }
  if (!userState) return <div className="ml-empty">Result pending — submit a correct answer to run the sandbox.</div>;
  switch (level.kind) {
    case 'shape':   return <ShapePreview   level={level} {...userState} />;
    case 'blocks':  return <BlocksPreview  level={level} {...userState} />;
    case 'fill':    return <FillPreview    level={level} {...userState} />;
    case 'reorder': return <ReorderPreview level={level} {...userState} />;
    case 'index':   return <IndexPreview   level={level} {...userState} />;
    default:        return <div className="ml-empty">No preview.</div>;
  }
}

function ShapePreview({ level, filled, bankById }) {
  const allFilled = level.skeleton.filter(f => f.type === 'slot').every(f => filled[f.slot]);
  if (!allFilled) {
    return <div className="ml-empty">Fill the document to see how Mongo will store it.</div>;
  }
  const correct = Object.entries(level.answer).every(([k, v]) => filled[k] === v);
  return <>
    <FakeDocs docs={[{
      _id: 'ObjectId("64e…")',
      ...Object.fromEntries(
        level.skeleton.filter(f => f.type === 'slot').map(f =>
          [f.key, bankById[filled[f.slot]]?.label.replace(/^"|"$/g, '') || '?'])
      )
    }]} note={correct ? 'acknowledged: true' : 'type warning — numbers should not be strings'} />
  </>;
}

function BlocksPreview({ level, filled, bankById }) {
  const fl = Object.fromEntries(Object.entries(filled).map(([k, v]) => [k, bankById[v]?.label]));
  const completeAll = level.snippet.filter(p => typeof p === 'object').every(p => fl[p.slot]);

  if (completeAll) {
    const rendered = renderSnippet(level.snippet, fl);
    const collection = inferCollectionFromText(rendered, level);
    // Stream / change-stream preview
    const streamPreview = streamPreviewForLevel(level);
    if (streamPreview) {
      return <FakeDocs docs={streamPreview.docs} note={streamPreview.note} />;
    }
    if (/\.insertOne\s*\(/.test(rendered)) {
      return <FakeDocs docs={[docFromInsertedSnippet(rendered, collection, level)]} note="acknowledged: true · insertedId: ObjectId(...)" />;
    }
    const note = rendered.includes('$search')
      ? `2 ${humanizeCollection(collection)} matched by Atlas Search`
      : rendered.includes('$sort') || rendered.includes('$limit')
        ? `${Math.min(5, inferLimit(rendered) || 3)} ${humanizeCollection(collection)} · sorted and limited`
        : `3 ${humanizeCollection(collection)} matched`;
    return <FakeDocs docs={sampleDocsForLevel(level, collection, inferLimit(rendered) || 3, { queryText: rendered })} note={note} />;
  }
  return <div className="ml-empty">Fill the blanks to see the query result.</div>;
}

function FillPreview({ level, filled }) {
  const choices = level.choices || {};
  const filledValues = filled || {};
  const allKnown = Object.keys(choices).length > 0 &&
    Object.keys(choices).every(k => filledValues[k] === choices[k].answer);
  if (!allKnown) return <div className="ml-empty">Fill all blanks to see the live result.</div>;

  const rendered = renderFillSnippet(level, filledValues);
  const collection = inferCollectionFromText(rendered, level);

  const streamPreview = streamPreviewForLevel(level);
  if (streamPreview) {
    return <FakeDocs docs={streamPreview.docs} note={streamPreview.note} />;
  }

  if (/\.updateOne\s*\(/.test(rendered)) {
    const field = stripQuotes(choices.field?.answer || 'updatedField');
    const val = parsePreviewValue(choices.val?.answer || 'true');
    return <FakeDocs docs={[Object.assign({ _id: '...', updatedAt: '2026-05-24T12:00Z' }, { [field]: val })]} note="matchedCount: 1 · modifiedCount: 1" highlight={field} />;
  }
  if (/\.deleteOne\s*\(/.test(rendered)) {
    return <FakeDocs docs={[]} note={`deletedCount: 1 · removed one ${singularize(collection)} matching the filter`} />;
  }
  if (/\.createIndex\s*\(/.test(rendered)) {
    const key = rendered.match(/\{\s*([\w.]+)\s*:\s*1\s*\}/)?.[1] || 'field';
    const ttl = choices.sec?.answer || 'configured';
    return <pre className="mono" style={{ color: '#9DD6B5', margin: 0 }}>
{`✓ index built
  ns:     app.${collection}
  key:    { ${key}: 1 }
  expireAfterSeconds: ${ttl}
  background: true`}
  </pre>;
  }
  if (/\.explain\s*\(/.test(rendered)) {
    const indexedFields = extractProjectionFields(rendered).join(', ') || collection;
    return (
    <div className="ml-explain">
      <div className="ml-explain__col">
        <h5>Docs examined</h5>
        <div className="stat">0</div>
        <div className="sub">covered query · index only</div>
      </div>
      <div className="ml-explain__col">
        <h5>Keys examined</h5>
        <div className="stat">1</div>
        <div className="sub">{`${indexedFields} · 0.4 ms`}</div>
      </div>
    </div>
    );
  }
  if (rendered.includes('$vectorSearch')) {
    return <FakeDocs docs={sampleDocsForLevel(level, collection, 5, { vector: true, queryText: rendered })} note="5 nearest neighbors · cosine similarity" />;
  }
  if (/Trigger config/.test(rendered)) {
    const col = stripQuotes(choices.col?.answer || collection);
    const evt = stripQuotes(choices.evt?.answer || 'change');
    const fn = stripQuotes(choices.fn?.answer || 'handler');
    return <pre className="mono" style={{ color: '#9DD6B5', margin: 0 }}>
{`✓ trigger created
  app.${col} · on${capitalize(evt)} → ${fn}()
  enabled: true`}
  </pre>;
  }
  return <FakeDocs docs={sampleDocsForLevel(level, collection, 3, { queryText: rendered })} note={`3 ${humanizeCollection(collection)} matched`} />;
}

function ReorderPreview({ level, order, stageMap }) {
  const currentOrder = order || [];
  const stagesById = stageMap || {};
  const inOrder = currentOrder.length > 0 && currentOrder.every((id, i) => stagesById[id]?.correct === i);
  if (!inOrder) return <div className="ml-empty">Pipeline isn't in order yet — preview waiting.</div>;
  const pipelineText = level.stages.map(s => s.code).join('\n');
  const collection = inferCollectionFromText(pipelineText, level);
  const streamPreview = streamPreviewForLevel(level);
  if (streamPreview) {
    return <FakeDocs docs={streamPreview.docs} note={streamPreview.note} />;
  }
  if (pipelineText.includes('$vectorSearch')) {
    return <FakeDocs docs={sampleDocsForLevel(level, collection, 3, { vector: true, rag: true, queryText: pipelineText })} note="3 chunks ready to send to the LLM" />;
  }
  if (pipelineText.includes('$lookup')) {
    return <FakeDocs docs={sampleJoinedDocsForLevel(level)} note="joined and projected into the requested shape" />;
  }
  return <FakeDocs docs={sampleGroupedDocsForLevel(level, collection)} note="pipeline output matches this challenge" />;
}

function IndexPreview({ level, drops }) {
  const safeDrops = drops || {};
  const right = level.fields.every(f => safeDrops[f.name] === f.need);
  if (Object.keys(safeDrops).length === 0) {
    return <div className="ml-empty">Drop an index on each field to see explain() change.</div>;
  }
  if (right) {
    return (
      <div className="ml-explain">
        <div className="ml-explain__col">
          <h5>B-tree indexes</h5>
          <div className="stat">IXSCAN</div>
          <div className="sub">{summarizeIndexNeeds(level, ['single', 'compound'])}</div>
        </div>
        <div className="ml-explain__col">
          <h5>Search index</h5>
          <div className="stat">$search</div>
          <div className="sub">{summarizeIndexNeeds(level, ['search'])}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="ml-explain">
      <div className="ml-explain__col" data-bad="true">
        <h5>Winning plan</h5>
        <div className="stat">COLLSCAN</div>
        <div className="sub">no usable index</div>
      </div>
      <div className="ml-explain__col" data-bad="true">
        <h5>Docs examined</h5>
        <div className="stat">412k</div>
        <div className="sub">full scan · 1.8 s</div>
      </div>
    </div>
  );
}

/* Preview helpers: derive side-panel results from the active level content
 * instead of hardcoding shared ids like q1/d2/a1. This keeps every industry
 * pack, plus comparison paths such as MongoDB vs Postgres, visually aligned. */
function renderFillSnippet(level, filledValues) {
  return (level.snippet || []).map(piece => {
    if (typeof piece === 'string') return piece;
    return filledValues[piece.blank] ?? '____';
  }).join('');
}

function inferCollectionFromText(text, level = {}) {
  if (level.collection) return level.collection;
  const direct = String(text || '').match(/db\.(\w+)/);
  if (direct) return direct[1];
  const lookup = String(text || '').match(/from:\s*["'](\w+)["']/);
  if (lookup) return lookup[1];
  const levelText = `${level.prompt || ''} ${level.title || ''}`;
  if (/claim/i.test(levelText)) return 'claims';
  if (/policy/i.test(levelText)) return 'policies';
  if (/customer|shopper|patient|member|subscriber|player|user|policyholder/i.test(levelText)) return 'customers';
  if (/product|catalog|sku|item|inventory|cart/i.test(levelText)) return 'products';
  if (/order|transaction|payment/i.test(levelText)) return 'orders';
  if (/session/i.test(levelText)) return 'sessions';
  if (/event|alert|log|experiment/i.test(levelText)) return 'events';
  return 'sandbox';
}

function inferLimit(text) {
  const limit = String(text || '').match(/\$limit\s*['"]?\s*[:,]\s*(\d+)/) || String(text || '').match(/limit\s*:\s*(\d+)/);
  return limit ? Number(limit[1]) : null;
}

function stripQuotes(value) {
  return String(value || '').replace(/^['"]|['"]$/g, '');
}

function parsePreviewValue(value) {
  const raw = String(value || '');
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return stripQuotes(raw);
}

function capitalize(value) {
  const s = String(value || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function singularize(collection) {
  const name = humanizeCollection(collection).replace(/ matched$/, '');
  return name.endsWith('ies') ? name.slice(0, -3) + 'y' : name.replace(/s$/, '');
}

function humanizeCollection(collection) {
  return String(collection || 'docs').replace(/_/g, ' ');
}

function extractProjectionFields(text) {
  const projection = String(text || '').match(/,\s*\{([^{}]+)\}\s*\)\s*\.explain/);
  if (!projection) return [];
  return projection[1]
    .split(',')
    .map(part => part.trim().split(':')[0]?.trim())
    .filter(field => field && field !== '_id');
}

function summarizeIndexNeeds(level, needs) {
  const fields = (level.fields || []).filter(f => needs.includes(f.need)).map(f => f.name);
  return fields.length ? fields.join(' · ') : 'not needed for this challenge';
}

function docFromInsertedSnippet(rendered, collection, level) {
  const doc = { _id: 'ObjectId("67b…")' };
  const body = String(rendered || '').match(/insertOne\s*\(\s*\{([\s\S]*?)\}\s*\)/)?.[1] || '';
  body.split(',').forEach(line => {
    const m = line.match(/([\w.]+)\s*:\s*(.+)/);
    if (!m) return;
    const key = m[1].trim();
    const val = m[2].trim();
    if (key && !key.startsWith('$')) doc[key] = parsePreviewValue(val);
  });
  if (Object.keys(doc).length > 1) return doc;
  return sampleDocsForLevel(level, collection, 1)[0];
}

function sampleDocsForLevel(level, collection, count = 3, options = {}) {
  const prompt = `${level.title || ''} ${level.prompt || ''}`.toLowerCase();
  const col = String(collection || '').toLowerCase();
  const n = Math.max(1, Math.min(count, 5));
  const query = String(options.queryText || '');
  const queryHints = extractQueryHints(query);

  let docs;
  const recentDocs = recentTopNDocsForContext(level, collection);
  if (recentDocs) {
    docs = recentDocs;
  } else if (options.rag) {
    docs = ragDocsForContext(level, collection);
  } else if (options.vector || /vector|embedding|similar|nearest|rag/.test(prompt)) {
    docs = vectorDocsForContext(level, collection);
  } else if (/claim/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'clm_4521', claimId: 'CLM-4521', type: 'home', status: 'open', estimatedLoss: 64000 },
      { _id: 'clm_4522', claimId: 'CLM-4522', type: 'auto', status: 'under_investigation', estimatedLoss: 37500 },
      { _id: 'clm_4523', claimId: 'CLM-4523', type: 'home', status: 'open', estimatedLoss: 51000 }
    ];
  } else if (/polic/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'pol_101', policyId: 'POL-101', policyType: 'home', status: 'active', premium: 1280 },
      { _id: 'pol_204', policyId: 'POL-204', policyType: 'auto', status: 'active', premium: 920 },
      { _id: 'pol_309', policyId: 'POL-309', policyType: 'commercial', status: 'review', premium: 4120 }
    ];
  } else if (/asset|machine|factory|workorder|work_order/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'asset_01', assetId: 'CNC-14', status: 'maintenance_due', line: 'A' },
      { _id: 'asset_02', assetId: 'PRESS-07', status: 'active', line: 'B' },
      { _id: 'asset_03', assetId: 'ROBOT-22', status: 'offline', line: 'A' }
    ];
  } else if (/account|payment|trade|portfolio|card/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'acct_01', accountId: 'ACC-1001', status: 'active', balance: 12840.55 },
      { _id: 'acct_02', accountId: 'ACC-1002', status: 'review', balance: 8750.10 },
      { _id: 'acct_03', accountId: 'ACC-1003', status: 'active', balance: 22190.00 }
    ];
  } else if (/patient|encounter|care|clinical|provider/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'pat_01', patientId: 'PAT-1001', status: 'active', riskScore: 91 },
      { _id: 'pat_02', patientId: 'PAT-1002', status: 'follow_up', riskScore: 86 },
      { _id: 'pat_03', patientId: 'PAT-1003', status: 'active', riskScore: 82 }
    ];
  } else if (/device|subscriber|network|ticket|call|telecom/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'sub_01', subscriberId: 'SUB-1001', plan: '5G unlimited', status: 'active' },
      { _id: 'sub_02', subscriberId: 'SUB-1002', plan: 'fiber pro', status: 'priority' },
      { _id: 'sub_03', subscriberId: 'SUB-1003', plan: 'business', status: 'active' }
    ];
  } else if (/game|player|match|session|guild/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'ply_01', playerId: 'P-1001', segment: 'whale', level: 42 },
      { _id: 'ply_02', playerId: 'P-1002', segment: 'returning', level: 27 },
      { _id: 'ply_03', playerId: 'P-1003', segment: 'priority', level: 35 }
    ];
  } else if (/product|catalog|inventory|sku|cart/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'prod_101', name: 'AI Search Add-on', category: 'software', price: 129 },
      { _id: 'prod_204', name: 'Trail Pro Jacket', category: 'outerwear', price: 189.99 },
      { _id: 'prod_309', name: 'Analytics Bundle', category: 'platform', price: 79 }
    ];
  } else if (/order|transaction|payment/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'ord_881', customer: 'Ada L.', status: 'shipped', total: 142.50 },
      { _id: 'ord_894', customer: 'Grace H.', status: 'paid', total: 220.00 },
      { _id: 'ord_902', customer: 'Linus T.', status: 'review', total: 305.99 }
    ];
  } else if (/event|alert|log|session|experiment/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'evt_01', type: 'workflow', riskScore: 91, status: 'active' },
      { _id: 'evt_02', type: 'security', riskScore: 86, status: 'review' },
      { _id: 'evt_03', type: 'lifecycle', riskScore: 82, status: 'queued' }
    ];
  } else if (/doc|post|note|article|content|media/.test(col + ' ' + prompt)) {
    docs = [
      { _id: 'doc_91', title: sampleTitleFor(collection, 'primary'), score: 1.42 },
      { _id: 'doc_77', title: sampleTitleFor(collection, 'secondary'), score: 1.18 },
      { _id: 'doc_64', title: sampleTitleFor(collection, 'tertiary'), score: 0.97 }
    ];
  } else {
    docs = [
      { _id: 'cust_01', name: 'Ada L.', segment: 'priority', healthScore: 96 },
      { _id: 'cust_02', name: 'Grace H.', segment: 'enterprise', healthScore: 91 },
      { _id: 'cust_03', name: 'Linus T.', segment: 'priority', healthScore: 88 }
    ];
  }
  return alignDocsToQuery(docs.slice(0, n), queryHints, collection, prompt);
}

function streamPreviewForLevel(level) {
  const text = `${level.title || ''} ${level.prompt || ''}`.toLowerCase();
  if (!/watch|stream|change|source|merge|alert|operationtype/i.test(text)) return null;

  if (/watch for new|inserts|operationtype|watch a collection|change stream.*watch/i.test(text)) {
    const col = level.bank?.find(b => b.answer === 'col')?.label || 'events';
    return {
      kind: 'change_stream',
      note: `// Change stream opened on db.${col} — watching for inserts`,
      docs: [
        { operationType: 'insert', ns: `app.${col}`, fullDocument: '{ … event fields … }', clusterTime: '2026-05-26T09:41:00Z' },
        { operationType: 'insert', ns: `app.${col}`, fullDocument: '{ … next event … }', clusterTime: '2026-05-26T09:41:18Z' }
      ]
    };
  }
  if (/filter critical|cross the critical|only react|fullDocument/i.test(text)) {
    const col = (level.snippet || []).join('').match(/db\.(\w+)\.watch/)?.[1] || 'events';
    const scoreField = (level.snippet || []).join('').match(/"fullDocument\.(\w+)"/)?.[1] || 'priorityScore';
    const threshold = level.choices?.threshold?.answer || '90';
    return {
      kind: 'change_stream',
      note: `// Only events where fullDocument.${scoreField} ≥ ${threshold} pass through`,
      docs: [
        { operationType: 'insert', ns: `app.${col}`, [scoreField]: Number(threshold) + 2, clusterTime: '2026-05-26T09:42:05Z' },
        { operationType: 'insert', ns: `app.${col}`, [scoreField]: Number(threshold) + 7, clusterTime: '2026-05-26T09:43:12Z' }
      ]
    };
  }
  if (/stream processing|route alert|\$source|\$merge/i.test(text)) {
    const matchStage = level.stages?.find(s => s.code.includes('$match'))?.code || '';
    const scoreField = matchStage.match(/([\w]+):\s*\{\s*\$gte/)?.[1] || 'priorityScore';
    const threshold = Number(matchStage.match(/\$gte:\s*(\d+)/)?.[1] || 90);
    const alertType = level.stages?.find(s => s.code.includes('alertType'))?.code.match(/"([\w_]+)"/)?.[1] || 'critical_event';
    return {
      kind: 'stream_output',
      note: `// Stream processor wrote routed alerts where ${scoreField} ≥ ${threshold}`,
      docs: [
        { eventId: 'evt_9042', [scoreField]: threshold + 7, alertType, observedAt: '2026-05-26T09:42:01Z' },
        { eventId: 'evt_9041', [scoreField]: threshold + 3, alertType, observedAt: '2026-05-26T09:41:48Z' },
        { eventId: 'evt_9040', [scoreField]: threshold, alertType, observedAt: '2026-05-26T09:40:33Z' }
      ]
    };
  }
  if (/\$merge|alert collection|stream output/i.test(text)) {
    const alertType = level.choices?.coll?.answer?.replace(/^"|"$/g, '') || 'alerts';
    return {
      kind: 'stream_output',
      note: `// Processed events merged into db.app.${alertType}`,
      docs: [
        { eventId: 'evt_9042', alertType: 'critical_event', whenMatched: 'replace', mergedAt: '2026-05-26T09:42:01Z' }
      ]
    };
  }
  return null;
}

function recentTopNDocsForContext(level, collection) {
  const text = `${collection || ''} ${level.title || ''} ${level.prompt || ''}`.toLowerCase();
  if (!/\$sort\s*\+\s*\$limit|most recent|recently|latest|newest|top-n/.test(text)) return null;

  if (/networkevents|drop event|worst cells|call_drop/.test(text)) {
    return [
      { _id: 'evt_9005', cellId: 'CELL-4491', type: 'call_drop', impactScore: 98, eventTime: '2026-05-26T09:42:18Z' },
      { _id: 'evt_9004', cellId: 'CELL-1187', type: 'call_drop', impactScore: 94, eventTime: '2026-05-26T09:39:02Z' },
      { _id: 'evt_9003', cellId: 'CELL-7730', type: 'call_drop', impactScore: 91, eventTime: '2026-05-26T09:35:47Z' },
      { _id: 'evt_9002', cellId: 'CELL-2209', type: 'call_drop', impactScore: 88, eventTime: '2026-05-26T09:31:14Z' },
      { _id: 'evt_9001', cellId: 'CELL-6054', type: 'call_drop', impactScore: 86, eventTime: '2026-05-26T09:28:39Z' }
    ];
  }
  if (/labresults|critical lab|lab result/.test(text)) {
    return [
      { _id: 'lab_3175', patientId: 'PAT-4182', test: 'potassium', value: 6.4, severity: 'critical', resultTime: '2026-05-26T08:58:00Z' },
      { _id: 'lab_3174', patientId: 'PAT-2039', test: 'troponin', value: 0.19, severity: 'critical', resultTime: '2026-05-26T08:44:00Z' },
      { _id: 'lab_3173', patientId: 'PAT-7710', test: 'glucose', value: 412, severity: 'critical', resultTime: '2026-05-26T08:36:00Z' }
    ];
  }
  if (/sensor|reading|sensorevents/.test(text)) {
    return [
      { _id: 'sen_8841', assetId: 'CNC-14', metric: 'vibration_mm_s', value: 8.7, timestamp: '2026-05-26T09:41:00Z' },
      { _id: 'sen_8840', assetId: 'PRESS-07', metric: 'oil_temp_c', value: 91.2, timestamp: '2026-05-26T09:40:45Z' },
      { _id: 'sen_8839', assetId: 'ROBOT-22', metric: 'torque_nm', value: 146, timestamp: '2026-05-26T09:40:10Z' },
      { _id: 'sen_8838', assetId: 'OVEN-03', metric: 'temperature_c', value: 182.5, timestamp: '2026-05-26T09:39:58Z' },
      { _id: 'sen_8837', assetId: 'LINE-A', metric: 'throughput_ppm', value: 72, timestamp: '2026-05-26T09:39:21Z' }
    ];
  }
  if (/matchevents|recent matches|completed matches/.test(text)) {
    return [
      { _id: 'match_7420', matchId: 'M-7420', mode: 'ranked', winnerId: 'P-1007', endedAt: '2026-05-26T09:40:12Z' },
      { _id: 'match_7419', matchId: 'M-7419', mode: 'arena', winnerId: 'P-1182', endedAt: '2026-05-26T09:38:55Z' },
      { _id: 'match_7418', matchId: 'M-7418', mode: 'ranked', winnerId: 'P-1044', endedAt: '2026-05-26T09:37:09Z' },
      { _id: 'match_7417', matchId: 'M-7417', mode: 'co_op', winnerId: 'P-1320', endedAt: '2026-05-26T09:34:41Z' },
      { _id: 'match_7416', matchId: 'M-7416', mode: 'ranked', winnerId: 'P-1198', endedAt: '2026-05-26T09:32:18Z' }
    ];
  }
  if (/alerts|fraud alert/.test(text)) {
    const security = /security|detectedat|attack|risk/.test(text);
    return security ? [
      { _id: 'alrt_6110', type: 'attack', riskScore: 96, sourceIp: '203.0.113.18', detectedAt: '2026-05-26T09:43:10Z' },
      { _id: 'alrt_6109', type: 'attack', riskScore: 92, sourceIp: '198.51.100.44', detectedAt: '2026-05-26T09:39:28Z' },
      { _id: 'alrt_6108', type: 'attack', riskScore: 89, sourceIp: '192.0.2.77', detectedAt: '2026-05-26T09:36:02Z' },
      { _id: 'alrt_6107', type: 'attack', riskScore: 84, sourceIp: '203.0.113.91', detectedAt: '2026-05-26T09:33:45Z' },
      { _id: 'alrt_6106', type: 'attack', riskScore: 79, sourceIp: '198.51.100.12', detectedAt: '2026-05-26T09:30:11Z' }
    ] : [
      { _id: 'fraud_5105', accountId: 'ACC-4421', amount: 12840.55, riskScore: 97, alertTime: '2026-05-26T09:42:33Z' },
      { _id: 'fraud_5104', accountId: 'ACC-1188', amount: 7300.00, riskScore: 93, alertTime: '2026-05-26T09:37:21Z' },
      { _id: 'fraud_5103', accountId: 'ACC-9074', amount: 21990.00, riskScore: 91, alertTime: '2026-05-26T09:35:05Z' },
      { _id: 'fraud_5102', accountId: 'ACC-3310', amount: 5400.75, riskScore: 88, alertTime: '2026-05-26T09:31:48Z' },
      { _id: 'fraud_5101', accountId: 'ACC-6629', amount: 9800.20, riskScore: 86, alertTime: '2026-05-26T09:29:12Z' }
    ];
  }
  if (/claims|filed claims|filedat/.test(text)) {
    return [
      { _id: 'clm_4525', claimId: 'CLM-4525', type: 'auto', status: 'open', estimatedLoss: 42500, filedAt: '2026-05-26T09:25:00Z' },
      { _id: 'clm_4524', claimId: 'CLM-4524', type: 'home', status: 'open', estimatedLoss: 64000, filedAt: '2026-05-26T08:58:00Z' },
      { _id: 'clm_4523', claimId: 'CLM-4523', type: 'property', status: 'open', estimatedLoss: 51000, filedAt: '2026-05-26T08:41:00Z' },
      { _id: 'clm_4522', claimId: 'CLM-4522', type: 'auto', status: 'open', estimatedLoss: 37500, filedAt: '2026-05-26T08:17:00Z' },
      { _id: 'clm_4521', claimId: 'CLM-4521', type: 'home', status: 'open', estimatedLoss: 28500, filedAt: '2026-05-26T07:54:00Z' }
    ];
  }
  if (/titles|new releases|added titles/.test(text)) {
    return [
      { _id: 'ttl_8801', title: 'Northern Lights', genre: 'drama', active: true, addedAt: '2026-05-26T09:20:00Z' },
      { _id: 'ttl_8800', title: 'Signal Lost', genre: 'thriller', active: true, addedAt: '2026-05-26T08:55:00Z' },
      { _id: 'ttl_8799', title: 'Chef\'s Table: Seoul', genre: 'documentary', active: true, addedAt: '2026-05-26T08:35:00Z' },
      { _id: 'ttl_8798', title: 'Mars Relay', genre: 'sci-fi', active: true, addedAt: '2026-05-26T08:10:00Z' },
      { _id: 'ttl_8797', title: 'The Last Harbor', genre: 'mystery', active: true, addedAt: '2026-05-26T07:48:00Z' }
    ];
  }
  if (/products|newest arrivals|recently added products/.test(text)) {
    return [
      { _id: 'prod_9405', sku: 'JKT-204', name: 'Trail Pro Jacket', category: 'outerwear', addedAt: '2026-05-26T09:22:00Z' },
      { _id: 'prod_9404', sku: 'BOT-118', name: 'Insulated Bottle', category: 'gear', addedAt: '2026-05-26T08:51:00Z' },
      { _id: 'prod_9403', sku: 'SHO-773', name: 'Summit Runner', category: 'footwear', addedAt: '2026-05-26T08:27:00Z' },
      { _id: 'prod_9402', sku: 'BAG-221', name: 'Daypack 22L', category: 'packs', addedAt: '2026-05-26T08:02:00Z' },
      { _id: 'prod_9401', sku: 'CAP-605', name: 'Rain Cap', category: 'accessories', addedAt: '2026-05-26T07:39:00Z' }
    ];
  }
  if (/customers|customer records|updated customer/.test(text)) {
    return [
      { _id: 'cust_7821', customerId: 'C-7821', segment: 'enterprise', status: 'active', updatedAt: '2026-05-26T09:24:00Z' },
      { _id: 'cust_7819', customerId: 'C-7819', segment: 'priority', status: 'active', updatedAt: '2026-05-26T09:11:00Z' },
      { _id: 'cust_7816', customerId: 'C-7816', segment: 'growth', status: 'review', updatedAt: '2026-05-26T08:59:00Z' },
      { _id: 'cust_7812', customerId: 'C-7812', segment: 'enterprise', status: 'active', updatedAt: '2026-05-26T08:37:00Z' },
      { _id: 'cust_7808', customerId: 'C-7808', segment: 'self_serve', status: 'active', updatedAt: '2026-05-26T08:05:00Z' }
    ];
  }
  return null;
}

function extractQueryHints(queryText) {
  const text = String(queryText || '');
  const hints = {};

  // Equality snippets: { field: "value" } or field: "value" inside find/aggregate.
  Array.from(text.matchAll(/([\w.]+)\s*:\s*"([^"]+)"/g)).forEach(([, field, value]) => {
    if (!['$match', '$project', '$sort', '$group', 'from', 'localField', 'foreignField', 'as', 'path', 'query', 'index'].includes(field)) {
      hints[field] = value;
    }
  });

  // $in arrays: status: { $in: ["open", "under_investigation"] }
  const inMatch = text.match(/([\w.]+)\s*:\s*\{\s*\$in\s*:\s*\[([^\]]+)\]/);
  if (inMatch) {
    hints[inMatch[1]] = inMatch[2]
      .split(',')
      .map(v => stripQuotes(v.trim()))
      .filter(Boolean);
  }

  // Numeric thresholds: estimatedLoss: { $gt: 50000 }
  Array.from(text.matchAll(/([\w.]+)\s*:\s*\{\s*\$(gt|gte|lt|lte)\s*:\s*(\d+(?:\.\d+)?)/g)).forEach(([, field, op, value]) => {
    hints[field] = { op, value: Number(value) };
  });

  return hints;
}

function alignDocsToQuery(docs, hints, collection, prompt) {
  const entries = Object.entries(hints || {});
  if (!entries.length) return docs;

  return docs.map((doc, idx) => {
    const next = { ...doc };
    entries.forEach(([field, expected]) => {
      const key = field.includes('.') ? field.split('.').pop() : field;
      if (Array.isArray(expected)) {
        next[key] = expected[idx % expected.length];
      } else if (expected && typeof expected === 'object') {
        next[key] = saneNumericValueForField(key, expected, idx);
      } else {
        next[key] = expected;
      }
    });

    if (/claim/i.test(collection + ' ' + prompt) && !next.claimId) next.claimId = `CLM-45${21 + idx}`;
    return next;
  });
}

function saneNumericValueForField(field, condition, idx) {
  const key = String(field || '').toLowerCase();
  const base = Number(condition.value || 0);
  const isUpperBound = condition.op === 'lt' || condition.op === 'lte';

  function above(step, max = Infinity) {
    return Math.min(max, base + (idx + 1) * step);
  }
  function below(step, min = 0) {
    return Math.max(min, base - (idx + 1) * step);
  }

  if (key === 'age' || key.endsWith('.age')) {
    return isUpperBound ? below(4, 1) : Math.min(99, base + idx * 7);
  }
  if (key.includes('score') || key.includes('risk')) {
    if (base > 0 && base < 1) return Number(Math.min(0.99, base + (idx + 1) * 0.03).toFixed(2));
    return isUpperBound ? below(3, 1) : above(3, 100);
  }
  if (key.includes('rating')) {
    return Number((isUpperBound ? below(0.2, 0) : above(0.2, 5)).toFixed(1));
  }
  if (key.includes('heartrate')) {
    return isUpperBound ? below(4, 40) : above(5, 210);
  }
  if (key.includes('temperature') || key === 'value') {
    return isUpperBound ? below(2, -50) : above(2, 140);
  }
  if (key.includes('lengthofstay') || key.includes('duration')) {
    return isUpperBound ? below(1, 0) : above(2, 365);
  }
  if (key.includes('level')) {
    return isUpperBound ? below(1, 1) : above(2, 100);
  }
  if (key.includes('count') || key.includes('qty') || key.includes('quantity')) {
    return Math.round(isUpperBound ? below(1, 0) : above(1, 100000));
  }

  // Money-like fields can safely move in larger increments.
  if (key.includes('amount') || key.includes('loss') || key.includes('balance') || key.includes('premium') || key.includes('price') || key.includes('total') || key.includes('asset')) {
    return isUpperBound ? below(2500, 0) : above(2500);
  }

  return isUpperBound ? below(5, 0) : above(5);
}

function sampleTitleFor(collection, variant) {
  const col = String(collection || '').toLowerCase();
  const titles = /product|catalog/.test(col)
    ? ['Semantic product match', 'Personalized recommendation', 'Related catalog item', 'Similar SKU', 'Alternative item']
    : /note|doc|post|article/.test(col)
      ? ['Schema migration playbook', 'Operational data guide', 'Search relevance notes', 'RAG grounding example', 'Developer velocity memo']
      : ['Customer success note', 'Onboarding insight', 'Feature adoption signal', 'Lifecycle recommendation', 'Support context'];
  const idx = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'].indexOf(variant);
  return titles[Math.max(0, idx)];
}

function vectorDocsForContext(level, collection) {
  const text = `${collection || ''} ${level.title || ''} ${level.prompt || ''}`.toLowerCase();
  let titles;
  if (/claim|insurance/.test(text)) {
    titles = ['Water damage precedent claim', 'Similar roof leak claim', 'Comparable auto collision claim', 'Prior fraud-review narrative', 'Resolved property loss case'];
  } else if (/patient|encounter|clinical|health/.test(text)) {
    titles = ['Similar diabetes care plan', 'Comparable cardiac encounter', 'Readmission-risk case note', 'Medication interaction note', 'Follow-up protocol match'];
  } else if (/transaction|account|bank|fsi|fraud/.test(text)) {
    titles = ['Suspicious wire pattern', 'Similar card fraud event', 'High-value transfer precedent', 'AML review narrative', 'Related account activity'];
  } else if (/asset|sensor|maintenance|manufactur/.test(text)) {
    titles = ['Similar pump vibration event', 'Prior overheating incident', 'Maintenance procedure match', 'Downtime root-cause note', 'Comparable sensor anomaly'];
  } else if (/security|threat|alert|runbook|ioc/.test(text)) {
    titles = ['Similar intrusion alert', 'Related threat intel note', 'Incident response runbook', 'Matching IOC investigation', 'Privilege escalation case'];
  } else if (/subscriber|network|telecom|device/.test(text)) {
    titles = ['Similar churn-risk subscriber', 'Network outage precedent', 'Comparable device issue', 'Fiber support case', '5G coverage complaint'];
  } else if (/game|player|match|guild/.test(text)) {
    titles = ['Similar player behavior', 'Comparable match pattern', 'Churn-risk session', 'High-value player segment', 'Guild activity signal'];
  } else if (/product|catalog|retail|cart/.test(text)) {
    titles = ['Similar catalog item', 'Related product description', 'Comparable shopper intent', 'Personalized recommendation', 'Product discovery match'];
  } else if (/postgres|schema|migration/.test(text)) {
    titles = ['Schema migration pain note', 'Document-model comparison', 'Join-heavy workflow example', 'JSON payload modeling case', 'Atlas platform advantage'];
  } else {
    titles = ['Relevant operational document', 'Similar domain record', 'Related support note', 'Comparable workflow event', 'Matched knowledge article'];
  }
  return titles.map((title, idx) => ({ _id: `vec_${String(idx + 1).padStart(2, '0')}`, title, score: [0.94, 0.90, 0.86, 0.82, 0.79][idx] }));
}

function ragDocsForContext(level, collection) {
  return vectorDocsForContext(level, collection).slice(0, 3).map((doc, idx) => ({
    title: doc.title,
    chunk: ['…authorized context only…', '…most relevant passage…', '…trimmed for the LLM…'][idx],
    score: doc.score
  }));
}

function sampleGroupedDocsForLevel(level, collection) {
  const prompt = `${level.title || ''} ${level.prompt || ''}`.toLowerCase();
  const metric = /revenue|value|amount|expansion/.test(prompt) ? 'total' : /risk/.test(prompt) ? 'riskScore' : 'count';
  const base = sampleDocsForLevel(level, collection, 5);
  return base.map((doc, idx) => ({
    _id: doc.name || doc.customer || doc.title || doc.type || `${singularize(collection)}_${idx + 1}`,
    [metric]: metric === 'count' ? (120 - idx * 17) : (4820 - idx * 731)
  }));
}

function sampleJoinedDocsForLevel(level) {
  const prompt = `${level.title || ''} ${level.prompt || ''}`.toLowerCase();
  if (/transaction|txn|risk tier|fraud|customer profile/.test(prompt)) {
    return [
      { txnId: 'TXN-9042', amount: 12840.55, riskTier: 'high' },
      { txnId: 'TXN-9043', amount: 7300.00, riskTier: 'medium' },
      { txnId: 'TXN-9044', amount: 21990.00, riskTier: 'high' }
    ];
  }
  if (/owner|employee/.test(prompt)) {
    return [
      { company: 'Ada Labs', ownerName: 'Grace Hopper', healthScore: 96 },
      { company: 'Turing Systems', ownerName: 'Linus Torvalds', healthScore: 91 }
    ];
  }
  if (/product/.test(prompt)) {
    return [
      { orderId: 'ORD-7821', productName: 'Trail Pro Jacket', qty: 2 },
      { orderId: 'ORD-7822', productName: 'Air Runner X', qty: 1 }
    ];
  }
  return [
    { name: 'Ada L.', summary: 'joined profile context' },
    { name: 'Grace H.', summary: 'joined account context' },
    { name: 'Linus T.', summary: 'joined activity context' }
  ];
}

/* Cute fake mongo result rendering. */
function FakeDocs({ docs, note, highlight }) {
  if (!docs.length) {
    return <div style={{ color: 'var(--ml-text-dim)', fontFamily: 'var(--ml-font-mono)' }}>{note}</div>;
  }
  return (
    <div className="ml-doc-result">
      {docs.map((d, i) => (
        <div key={i} className="ml-doc">
          {'{ '}
          {Object.entries(d).map(([k, v], j) => (
            <React.Fragment key={k}>
              <span style={{ color: highlight === k ? '#FFC76A' : '#B6E1FF' }}>{k}</span>
              <span style={{ color: '#6F8390' }}>: </span>
              {typeof v === 'string'
                ? <span style={{ color: '#9DD6B5' }}>"{v}"</span>
                : <span style={{ color: '#FFC76A' }}>{String(v)}</span>}
              {j < Object.entries(d).length - 1 && <span style={{ color: '#6F8390' }}>, </span>}
            </React.Fragment>
          ))}
          {' }'}
        </div>
      ))}
      {note && <div style={{ color: 'var(--ml-text-faint)', fontSize: 11.5, marginTop: 6, fontFamily: 'var(--ml-font-sans)' }}>// {note}</div>}
    </div>
  );
}

/* Very basic line-diff for wrong answers (joined by \n then compared) */
function makeDiff(your, correct) {
  const a = your.split('\n');
  const b = correct.split('\n');
  const out = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] === b[i]) {
      out.push('  ' + (a[i] ?? ''));
    } else {
      if (a[i] !== undefined) out.push('- ' + a[i]);
      if (b[i] !== undefined) out.push('+ ' + b[i]);
    }
  }
  return out;
}

Object.assign(window, {
  ShapeExercise, BlocksExercise, FillExercise, ReorderExercise, IndexExercise,
  LevelPreview,
  BlocksPreview, FillPreview, ReorderPreview, IndexPreview, ShapePreview,
  FakeDocs, makeDiff
});
