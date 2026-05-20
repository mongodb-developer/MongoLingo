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
function LevelPreview({ level, userState }) {
  if (!userState) return <div className="ml-empty">Start solving — results appear here.</div>;
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

  if (level.id === 'q1' && completeAll) {
    return <FakeDocs docs={[
      { _id: '64e...', email: 'ada@analytical.dev', role: 'admin' },
      { _id: '64f...', email: 'grace@hopper.dev',   role: 'admin' }
    ]} note="2 docs matched" />;
  }
  if (level.id === 'q2' && completeAll) {
    return <FakeDocs docs={[
      { _id: 'ord_881', customer: 'Ada L.',   total: 142.50 },
      { _id: 'ord_894', customer: 'Grace H.', total: 220.00 },
      { _id: 'ord_902', customer: 'Linus T.', total: 305.99 }
    ]} note="3 docs matched (of 8,412 scanned)" />;
  }
  if (level.id === 'd2' && completeAll) {
    return <FakeDocs docs={[
      { _id: '64ed1c...', name: 'Espresso', price: 24.99, inStock: true }
    ]} note="acknowledged: true · insertedId: ObjectId(...)" />;
  }
  if (level.id === 'a4' && completeAll) {
    return <FakeDocs docs={[
      { _id: 'p_3091', title: 'Compound indexes deep-dive', createdAt: '2026-05-18T10:14Z' },
      { _id: 'p_3088', title: 'Atlas vector search basics',  createdAt: '2026-05-17T22:01Z' },
      { _id: 'p_3084', title: 'Why $match goes first',       createdAt: '2026-05-17T08:45Z' }
    ]} note="3 docs · sorted by createdAt: -1" />;
  }
  if (level.id === 'v2' && completeAll) {
    return <FakeDocs docs={[
      { _id: 'post_91', title: 'The aggregation pipeline, end to end', score: 1.42 },
      { _id: 'post_77', title: 'Pipelines vs subqueries', score: 1.18 }
    ]} note="2 text matches" />;
  }
  return <div className="ml-empty">Fill the blanks to see the query result.</div>;
}

function FillPreview({ level, filled }) {
  const choices = level.choices || {};
  const filledValues = filled || {};
  const allKnown = Object.keys(choices).length > 0 &&
    Object.keys(choices).every(k => filledValues[k] === choices[k].answer);
  if (!allKnown) return <div className="ml-empty">Fill all blanks to see the live result.</div>;

  if (level.id === 'd3') return <FakeDocs docs={[{ _id: '...', orderId: 1042, status: 'shipped', shippedAt: '2026-05-19' }]} note="matchedCount: 1 · modifiedCount: 1" highlight="status" />;
  if (level.id === 'd4') return <FakeDocs docs={[]} note="deletedCount: 1 · removed orderId 1187 (cancelled)" />;
  if (level.id === 'q3') return <FakeDocs docs={[
    { _id: '...', name: 'House Blend',   category: 'coffee', price: 14.50 },
    { _id: '...', name: 'Genmaicha',     category: 'tea',    price:  9.00 },
    { _id: '...', name: 'Single Origin', category: 'coffee', price: 18.50 }
  ]} note="3 of 412 docs matched" />;
  if (level.id === 'q4') return <FakeDocs docs={[
    { _id: '...', name: 'Ada L.',   age: 22, active: true },
    { _id: '...', name: 'Linus T.', age: 19, active: true }
  ]} note="2 active users in age range" />;
  if (level.id === 'a2') return <FakeDocs docs={[
    { customer: 'Ada L.',   total: 1842.50 },
    { customer: 'Grace H.', total: 1620.00 }
  ]} note="_id hidden · projection applied" />;
  if (level.id === 'i3') return <pre className="mono" style={{ color: '#9DD6B5', margin: 0 }}>
{`✓ index built
  ns:     app.sessions
  key:    { lastSeen: 1 }
  expireAfterSeconds: 86400
  background: true`}
  </pre>;
  if (level.id === 'i4') return (
    <div className="ml-explain">
      <div className="ml-explain__col">
        <h5>Docs examined</h5>
        <div className="stat">0</div>
        <div className="sub">covered query · index only</div>
      </div>
      <div className="ml-explain__col">
        <h5>Keys examined</h5>
        <div className="stat">1</div>
        <div className="sub">{`SKU lookup · 0.4 ms`}</div>
      </div>
    </div>
  );
  if (level.id === 'v1') return <FakeDocs docs={[
    { _id: 'p_22', title: 'Wool socks',    score: 0.94 },
    { _id: 'p_07', title: 'Hiking boots',  score: 0.91 },
    { _id: 'p_45', title: 'Rain jacket',   score: 0.88 },
    { _id: 'p_91', title: 'Trail map',     score: 0.83 },
    { _id: 'p_12', title: 'Compass',       score: 0.79 }
  ]} note="5 nearest neighbors · cosine similarity" />;
  if (level.id === 'v3') return <pre className="mono" style={{ color: '#9DD6B5', margin: 0 }}>
{`✓ trigger created
  app.users · onInsert → sendWelcomeEmail()
  enabled: true`}
  </pre>;
  return <div className="ml-empty">Looks right!</div>;
}

function ReorderPreview({ level, order, stageMap }) {
  const currentOrder = order || [];
  const stagesById = stageMap || {};
  const inOrder = currentOrder.length > 0 && currentOrder.every((id, i) => stagesById[id]?.correct === i);
  if (!inOrder) return <div className="ml-empty">Pipeline isn't in order yet — preview waiting.</div>;
  if (level.id === 'a1') return <FakeDocs docs={[
    { _id: 'Ada L.',   total: 4820.50 },
    { _id: 'Grace H.', total: 3902.00 },
    { _id: 'Linus T.', total: 2418.99 },
    { _id: 'Edsger D.',total: 1981.20 },
    { _id: 'Donald K.',total: 1502.10 }
  ]} note="top 5 customers by 2024 revenue" />;
  if (level.id === 'a3') return <FakeDocs docs={[
    { name: 'Ada L.' }, { name: 'Grace H.' }, { name: 'Linus T.' }
  ]} note="orders joined to customer.name" />;
  if (level.id === 'v4') return <FakeDocs docs={[
    { title: 'Onboarding playbook',     chunk: '…tenants are isolated…', score: 0.93 },
    { title: 'Customer success guide',  chunk: '…activation patterns…',  score: 0.86 },
    { title: 'Pricing FAQ',             chunk: '…tier comparisons…',     score: 0.81 }
  ]} note="3 chunks ready to send to the LLM" />;
  return <div className="ml-empty">Order looks right.</div>;
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
          <div className="sub">userId_1 and userId_1_createdAt_-1</div>
        </div>
        <div className="ml-explain__col">
          <h5>Search index</h5>
          <div className="stat">$search</div>
          <div className="sub">title analyzed by Atlas Search</div>
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
