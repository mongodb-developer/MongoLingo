/* MongoLingo — screens: Home (world map), Level, Leaderboard. */

const { useState: u_s, useEffect: u_e, useRef: u_r, useMemo: u_m, useCallback: u_c } = React;

/* ============================================================
 * Home / world map
 * ============================================================ */
function HomeScreen({ progress, setView, totalXp, debugUnlockAll = false, industryId, setIndustryId }) {
  const industries = window.MONGOLINGO_INDUSTRIES || {};
  const currentPack = industries[industryId] || industries.general || {};
  return (
    <div className="ml-home">
      <div className="ml-hero">
        <h1>
          From documents to vector search.<br/>
          <span className="accent">One micro-challenge at a time.</span>
        </h1>
        <p>
          Welcome back, Ada. Pick up where you left off — or jump ahead if
          you're feeling brave. Each level is a 2-minute drag, drop, or fill-the-blank.
        </p>
        {setIndustryId && Object.keys(industries).length > 1 && (
          <div className="ml-industry-picker">
            <label htmlFor="industry-select" style={{ fontSize: 12, color: 'var(--ml-text-faint)', marginRight: 8 }}>
              Industry path:
            </label>
            <select
              id="industry-select"
              className="ml-industry-select"
              value={industryId}
              onChange={(e) => setIndustryId(e.target.value)}
            >
              {Object.values(industries).map(pack => (
                <option key={pack.id} value={pack.id}>{pack.shortName || pack.name}</option>
              ))}
            </select>
            {currentPack.description && (
              <p style={{ fontSize: 12, color: 'var(--ml-text-dim)', marginTop: 8, maxWidth: 520 }}>
                {currentPack.description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="ml-trail">
        {/* SVG snaking background line — single path under all nodes. */}
        <TrailBackline />

        {window.WORLDS.map((w, wi) => {
          const prevDone = wi === 0 || isWorldDone(window.WORLDS[wi - 1], progress);
          const worldLocked = !debugUnlockAll && !prevDone;
          const cleared = w.levels.filter(l => progress[`${w.id}:${l.id}`]?.done).length;
          const challengeUnlocked = debugUnlockAll || (!worldLocked && cleared === w.levels.length);
          const leaves = w.levels.reduce((a, l) => a + (progress[`${w.id}:${l.id}`]?.leaf ? 1 : 0), 0);

          return (
            <React.Fragment key={w.id}>
              <div className="ml-trail-banner" data-locked={worldLocked}
                   style={{ '--world-tint': w.tint, '--world-tint-solid': w.tintSolid }}>
                <div className="ml-trail-banner__badge">World {wi + 1}{worldLocked && ' · locked'}</div>
                <h2 className="ml-trail-banner__title">{w.name}</h2>
                <p className="ml-trail-banner__desc">{w.blurb}</p>
                <div className="ml-trail-banner__progress">
                  <div className="ml-trail-banner__bar">
                    <div style={{ width: `${(cleared/w.levels.length)*100}%` }} />
                  </div>
                  <span>{cleared}/{w.levels.length} levels · {leaves} 🌿</span>
                </div>
              </div>

              {w.levels.map((l, li) => {
                const key = `${w.id}:${l.id}`;
                const status = progress[key]?.done ? 'done'
                             : (debugUnlockAll || (!worldLocked && isLevelUnlocked(w, li, progress))) ? 'current'
                             : 'locked';
                return (
                  <TrailNode
                    key={l.id}
                    side={trailSide(wi, li)}
                    status={status}
                    sub={`L${li + 1} · ${l.kind}`}
                    title={l.title}
                    leaf={progress[key]?.leaf}
                    onClick={() => status !== 'locked' && setView({ name: 'level', worldId: w.id, levelId: l.id })}
                  />
                );
              })}

              <TrailNode
                special
                side={trailSide(wi, w.levels.length)}
                status={progress[`challenge:${w.id}`]?.done ? 'done'
                       : challengeUnlocked ? 'current' : 'locked'}
                sub="CHALLENGE · TIMED"
                title={w.tagline}
                meta={progress[`challenge:${w.id}`]?.done
                  ? `score ${progress[`challenge:${w.id}`].score}`
                  : '+200 XP · 90s'}
                onClick={() => challengeUnlocked && setView({ name: 'challenge', worldId: w.id })}
              />
            </React.Fragment>
          );
        })}

        <div className="ml-trail-end">
          <LeafIcon size={28} color="var(--lg-spring)" />
          <span>You did it. From here, the real Atlas console awaits.</span>
        </div>
      </div>
    </div>
  );
}

/* Position the snake — alternates with smoother sine-ish swing.
   Side is "left", "center", or "right". */
function trailSide(worldIdx, levelIdx) {
  // pattern repeats every 4 nodes per world, reset per world so each
  // world starts on the same side
  const pattern = ['center', 'right', 'far-right', 'right', 'center', 'left', 'far-left', 'left'];
  return pattern[levelIdx % pattern.length];
}

function TrailNode({ side, status, sub, title, leaf, meta, special, onClick }) {
  return (
    <div className={`ml-trail-row ml-trail-row--${side}`}>
      <button
        className={`ml-trail-node${special ? ' is-special' : ''}`}
        data-status={status}
        disabled={status === 'locked'}
        onClick={onClick}
        aria-label={`${sub}: ${title}${status === 'locked' ? ' (locked)' : ''}`}
      >
        {status === 'done' && (
          leaf
            ? <LeafIcon size={36} color="var(--lg-black)" />
            : <Icon name="Checkmark" size={32} color="var(--lg-black)" />
        )}
        {status === 'current' && (
          special
            ? <Icon name="Sparkle" size={28} color="var(--lg-black)" />
            : <span className="ml-trail-node__play">▶</span>
        )}
        {status === 'locked' && <Icon name="Lock" size={24} color="currentColor" />}
        {status === 'current' && <span className="ml-trail-node__pulse" />}
      </button>
      <div className="ml-trail-label">
        <div className="ml-trail-label__sub">{sub}</div>
        <div className="ml-trail-label__title">{title}</div>
        {meta && <div className="ml-trail-label__meta">{meta}</div>}
      </div>
    </div>
  );
}

/* A single snaking SVG path drawn under the column. Decorative only. */
function TrailBackline() {
  // Positions match the .ml-trail-row--<side> offsets; this is a vertical
  // dashed wave that lives behind the nodes.
  return (
    <svg className="ml-trail-back" aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 200 1000">
      <path
        d="M 100 0
           C 160 80, 180 120, 100 200
           S 20 320, 100 400
           S 180 520, 100 600
           S 20 720, 100 800
           S 180 920, 100 1000"
        fill="none"
        stroke="rgba(0,237,100,0.18)"
        strokeWidth="2"
        strokeDasharray="6 8"
      />
    </svg>
  );
}

function isLevelUnlocked(world, levelIdx, progress) {
  if (levelIdx === 0) return true;
  const prev = world.levels[levelIdx - 1];
  return progress[`${world.id}:${prev.id}`]?.done;
}
function isWorldDone(world, progress) {
  return world.levels.every(l => progress[`${world.id}:${l.id}`]?.done);
}

/* ============================================================
 * Level screen — split pane.
 * ============================================================ */
function LevelScreen({ worldId, levelId, setView, onComplete, progress }) {
  const world = window.WORLDS.find(w => w.id === worldId);
  const levelIdx = world.levels.findIndex(l => l.id === levelId);
  const level = world.levels[levelIdx];

  const [exState, setExState] = u_s({});       // ready/check/reset/userState from the active exercise
  const [hintsUsed, setHintsUsed] = u_s(0);
  const [resultBanner, setResultBanner] = u_s(null);
  const previewState = exState.levelId === level.id ? exState.userState : null;
  const handleExerciseState = u_c((state) => {
    setExState({ ...state, levelId: level.id });
  }, [level.id]);

  function handleResult({ correct, perfect }) {
    setResultBanner({ correct, perfect });
  }

  function handleNext() {
    if (resultBanner?.correct) {
      onComplete({
        worldId, levelId,
        xp: level.kind === 'reorder' ? 30 : 25,
        leaf: !!resultBanner.perfect && hintsUsed === 0
      });
      const nextIdx = levelIdx + 1;
      if (nextIdx < world.levels.length) {
        setView({ name: 'level', worldId, levelId: world.levels[nextIdx].id });
      } else {
        setView({ name: 'home' });
      }
    }
  }

  // Reset per-level state when level changes
  u_e(() => { setExState({}); setHintsUsed(0); setResultBanner(null); }, [worldId, levelId]);

  // Progress: levels in world cleared
  const cleared = world.levels.filter(l => progress[`${world.id}:${l.id}`]?.done).length;
  const progressPct = ((levelIdx + (resultBanner?.correct ? 1 : 0)) / world.levels.length) * 100;

  let ExerciseComp;
  switch (level.kind) {
    case 'shape':   ExerciseComp = ShapeExercise;   break;
    case 'blocks':  ExerciseComp = BlocksExercise;  break;
    case 'fill':    ExerciseComp = FillExercise;    break;
    case 'reorder': ExerciseComp = ReorderExercise; break;
    case 'index':   ExerciseComp = IndexExercise;   break;
    default: ExerciseComp = () => <div>Unsupported.</div>;
  }

  return (
    <div className="ml-level-screen">
      <div className="ml-level__head">
        <div className="ml-level__crumb">
          <span style={{ color: world.tintSolid }}>●</span>
          <b>{world.name}</b>
          <span style={{ color: 'var(--ml-text-faint)', margin: '0 4px' }}>·</span>
          <span>Level {levelIdx + 1} / {world.levels.length}</span>
        </div>
        <div className="ml-level__progress" aria-label="world progress">
          <div style={{ width: progressPct + '%' }} />
        </div>
        <button
          className="ml-level__close"
          aria-label="Close level"
          onClick={() => setView({ name: 'home' })}
        ><Icon name="X" size={14} color="currentColor" /></button>
      </div>

      <div className="ml-level">
        <div className="ml-pane">
          <div className="ml-pane__label">L{levelIdx + 1} · {level.kind}</div>
          <h2 className="ml-prompt">{level.title}</h2>
          <p className="ml-prompt-sub">{level.prompt}</p>
          {level.sub && (
            <p style={{ color: 'var(--ml-text-faint)', fontSize: 12.5, marginTop: -10, marginBottom: 18 }}>
              {level.sub}
            </p>
          )}

          <ExerciseComp
            key={level.id}
            level={level}
            onResult={handleResult}
            onState={handleExerciseState}
          />

          <ConceptCard>
            <ConceptBody text={level.why} />
          </ConceptCard>

          {/* AHA moment — revealed after correct answer */}
          {resultBanner?.correct && level.aha && (
            <div className="ml-aha-moment">
              <div className="ml-aha-moment__icon">💡</div>
              <div className="ml-aha-moment__content">
                <div className="ml-aha-moment__title">{level.aha.title}</div>
                <div className="ml-aha-moment__message">{level.aha.message}</div>
              </div>
            </div>
          )}

          <div className="ml-actions">
            <div className="ml-actions__left">
              <button
                className="ml-btn ml-btn--ghost"
                onClick={() => exState.reset && exState.reset()}
              >
                <Icon name="Refresh" size={13} color="currentColor" /> Reset
              </button>
              <button
                className="ml-btn ml-btn--ghost"
                onClick={() => setHintsUsed(h => h + 1)}
                title="Reveal the next hint"
              >
                <Icon name="Bulb" size={13} color="currentColor" /> Hint ({hintsUsed})
              </button>
            </div>
            <div className="ml-actions__right">
              {resultBanner?.correct ? (
                <button className="ml-btn ml-btn--primary ml-btn--lg" onClick={handleNext}>
                  Continue <Icon name="ChevronRight" size={13} color="currentColor" />
                </button>
              ) : (
                <button
                  className="ml-btn ml-btn--primary ml-btn--lg"
                  disabled={!exState.ready}
                  onClick={() => exState.check && exState.check()}
                >
                  Check answer
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="ml-pane">
          <div className="ml-pane__label">Live preview</div>
          <div className="ml-preview">
            <div className="ml-preview__title">db.{guessCollection(level)} · result</div>
            <div className="ml-preview__body">
              <LevelPreview level={level} userState={previewState} />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', fontSize: 11, color: 'var(--ml-text-faint)' }}>
              <span style={{
                display: 'inline-block', width: 6, height: 6, borderRadius: 50,
                background: 'var(--lg-spring)', boxShadow: '0 0 6px var(--lg-spring)'
              }}/>
              Connected to MongoLingo sandbox · cluster atlas-free-tier
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function guessCollection(level) {
  // crude — just sniff db.<x> from the snippet/skeleton
  if (level.kind === 'index')   return level.collection;
  if (level.kind === 'reorder') return 'orders';
  if (level.kind === 'shape')   return 'users';
  const text = (level.snippet || []).filter(p => typeof p === 'string').join('');
  const m = text.match(/db\.(\w+)/);
  return m ? m[1] : 'sandbox';
}

/* ============================================================
 * Timed challenge — uses the world's levels as questions,
 * with a clock, no hints, and a time penalty per mistake.
 * ============================================================ */
function ChallengeScreen({ worldId, setView, onChallengeWin }) {
  const world = window.WORLDS.find(w => w.id === worldId);
  const [phase, setPhase]   = u_s('intro');   // intro · running · won · lost
  const [qIdx, setQIdx]     = u_s(0);
  const [secs, setSecs]     = u_s(90);
  const [score, setScore]   = u_s(0);
  const [exState, setExState] = u_s({});
  const [shake, setShake]   = u_s(false);

  // Cap at 4 questions, randomized order each session
  const order = u_m(() => {
    const arr = [...world.levels];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, Math.min(4, arr.length));
  }, [worldId, phase === 'intro']);
  const current = order[qIdx];
  const handleExerciseState = u_c((state) => {
    setExState({ ...state, levelId: current?.id });
  }, [current?.id]);

  // Timer
  u_e(() => {
    if (phase !== 'running') return;
    if (secs <= 0) { setPhase('lost'); return; }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs, phase]);

  // Auto-advance when current exercise resolves
  function handleResult({ correct }) {
    if (correct) {
      setScore(s => s + 60);
      setTimeout(() => {
        if (qIdx + 1 < order.length) {
          setQIdx(i => i + 1);
          setExState({});
        } else {
          setPhase('won');
          onChallengeWin && onChallengeWin({ worldId, score: score + 60 + secs * 4 });
        }
      }, 550);
    } else {
      setSecs(s => Math.max(0, s - 10));
      setShake(true);
      setTimeout(() => setShake(false), 280);
    }
  }

  let ExerciseComp = null;
  if (current) {
    switch (current.kind) {
      case 'shape':   ExerciseComp = ShapeExercise;   break;
      case 'blocks':  ExerciseComp = BlocksExercise;  break;
      case 'fill':    ExerciseComp = FillExercise;    break;
      case 'reorder': ExerciseComp = ReorderExercise; break;
      case 'index':   ExerciseComp = IndexExercise;   break;
    }
  }

  /* ---------- intro ---------- */
  if (phase === 'intro') {
    return (
      <div className="ml-challenge-card">
        <div className="ml-challenge-card__icon">
          <Icon name="Sparkle" size={36} color="var(--lg-yellow-base)" />
        </div>
        <div className="ml-challenge-card__badge">CHALLENGE · TIMED</div>
        <h2>{world.name}</h2>
        <p>Four random questions from this world. <b>90 seconds.</b> No hints, no resets.<br/>
        Mistakes cost <b>10 seconds</b>. Each correct answer: +60 points + time bonus.</p>
        <div className="ml-challenge-card__rules">
          <span>⏱ 90s</span>
          <span>· 4 questions</span>
          <span>· -10s per miss</span>
        </div>
        <div className="ml-row" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button className="ml-btn ml-btn--ghost" onClick={() => setView({ name: 'home' })}>Back</button>
          <button className="ml-btn ml-btn--primary ml-btn--lg" onClick={() => setPhase('running')}>
            Start <Icon name="ChevronRight" size={13} color="currentColor" />
          </button>
        </div>
      </div>
    );
  }

  /* ---------- end states ---------- */
  if (phase === 'won' || phase === 'lost') {
    const finalScore = score + (phase === 'won' ? secs * 4 : 0);
    return (
      <div className="ml-challenge-card">
        <div className="ml-challenge-card__icon">
          {phase === 'won'
            ? <LeafIcon size={48} color="var(--lg-spring)" />
            : <Icon name="X" size={36} color="var(--lg-red-light2)" />}
        </div>
        <h2>{phase === 'won' ? 'Challenge complete!' : "Time's up"}</h2>
        <p>
          {phase === 'won'
            ? `${qIdx + 1} of ${order.length} correct · ${secs} seconds left on the clock.`
            : `You got ${qIdx} of ${order.length} before the clock ran out.`}
        </p>
        <div className="ml-challenge-card__score">
          <span className="num">{finalScore}</span> points
        </div>
        <div className="ml-row" style={{ justifyContent: 'center', marginTop: 14 }}>
          <button className="ml-btn ml-btn--ghost" onClick={() => setView({ name: 'home' })}>Back to map</button>
          <button className="ml-btn ml-btn--primary"
                  onClick={() => { setPhase('intro'); setQIdx(0); setSecs(90); setScore(0); setExState({}); }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ---------- running ---------- */
  if (!current || !ExerciseComp) return null;
  const timerLow = secs <= 15;

  return (
    <div className={'ml-challenge' + (shake ? ' is-shake' : '')}>
      <div className="ml-challenge__hud">
        <div className="ml-challenge__crumb">
          <span style={{ color: world.tintSolid }}>●</span>
          <b>{world.name}</b>
          <span style={{ color: 'var(--ml-text-faint)' }}>· timed</span>
        </div>
        <div className="ml-challenge__progress">
          {order.map((_, i) => (
            <span key={i} data-state={i < qIdx ? 'done' : i === qIdx ? 'active' : 'pending'} />
          ))}
        </div>
        <div className={'ml-challenge__timer' + (timerLow ? ' is-low' : '')}>
          <span className="num">{String(Math.floor(secs / 60)).padStart(2, '0')}:{String(secs % 60).padStart(2, '0')}</span>
        </div>
        <div className="ml-challenge__score">
          <span className="num">{score}</span><small>pts</small>
        </div>
        <button className="ml-level__close" aria-label="Abandon" onClick={() => setView({ name: 'home' })}>
          <Icon name="X" size={14} color="currentColor" />
        </button>
      </div>

      <div className="ml-pane">
        <div className="ml-pane__label">Q{qIdx + 1} · {current.kind}</div>
        <h2 className="ml-prompt">{current.title}</h2>
        <p className="ml-prompt-sub">{current.prompt}</p>

        <ExerciseComp
          key={current.id}
          level={current}
          onResult={handleResult}
          onState={handleExerciseState}
        />

        <div className="ml-actions">
          <div className="ml-actions__left">
            <span style={{ fontSize: 12, color: 'var(--ml-text-dim)' }}>
              No hints in challenge mode. Skip wastes seconds.
            </span>
          </div>
          <div className="ml-actions__right">
            <button className="ml-btn ml-btn--ghost"
                    onClick={() => {
                      setSecs(s => Math.max(0, s - 20));
                      if (qIdx + 1 < order.length) { setQIdx(i => i + 1); setExState({}); }
                      else setPhase('lost');
                    }}>
              Skip −20s
            </button>
            <button
              className="ml-btn ml-btn--primary"
              disabled={!exState.ready}
              onClick={() => exState.check && exState.check()}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * Leaderboard
 * ============================================================ */
const STUB_LEADERS = [
  { name: 'Grace H.',   xp: 4820, leaves: 18 },
  { name: 'Linus T.',   xp: 3702, leaves: 14 },
  { name: 'Edsger D.',  xp: 2901, leaves: 11 },
  { name: 'Donald K.',  xp: 2018, leaves: 9  }
];

function LeaderboardScreen({ totalXp, leaves, name = 'Ada L.' }) {
  const me = { name: 'You (' + name + ')', xp: totalXp, leaves, me: true };
  const board = [...STUB_LEADERS, me]
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  return (
    <div className="ml-leaderboard">
      <h2>Weekly leaderboard</h2>
      <p>Top five MongoLingo learners this week. Resets every Monday.</p>
      <div className="ml-lb-list">
        {board.map((row, i) => (
          <div key={row.name} className="ml-lb-row" data-rank={i + 1} data-me={!!row.me}>
            <div className="ml-lb-rank">#{i + 1}</div>
            <div className="ml-lb-name">{row.name}</div>
            <div className="ml-lb-leaves"><LeafIcon size={12} color="var(--lg-spring)" /> {row.leaves}</div>
            <div className="ml-lb-xp">{row.xp.toLocaleString()} XP</div>
          </div>
        ))}
      </div>
      <div className="ml-invite">
        <h3>Climb faster with friends.</h3>
        <p>Pair-program through a world. Compare leaf counts. Bragging rights included.</p>
        <button className="ml-btn ml-btn--primary">
          <Icon name="Person" size={13} color="currentColor" /> Invite a teammate
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, LevelScreen, ChallengeScreen, LeaderboardScreen });
