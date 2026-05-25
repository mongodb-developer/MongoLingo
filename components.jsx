/* MongoLingo — small UI components shared across screens. */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- Icon wrapper (inline SVG; currentColor for tint) ---------- */
const ICONS = window.__ICONS__ || {};
function Icon({ name, size = 16, color = 'currentColor', style }) {
  const inner = ICONS[name];
  if (!inner) {
    // fallback to mask if registry missing (still ok in real browser)
    const url = `url("assets/icons/${name}.svg")`;
    return <span aria-hidden="true" style={{
      display: 'inline-block', width: size, height: size,
      backgroundColor: color,
      WebkitMaskImage: url, maskImage: url,
      WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center', maskPosition: 'center',
      WebkitMaskSize: 'contain', maskSize: 'contain',
      flexShrink: 0, ...style }} />;
  }
  return (
    <svg
      aria-hidden="true"
      width={size} height={size} viewBox="0 0 16 16"
      style={{ color, display: 'inline-block', flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

/* ---------- LeafyGreen leaf as SVG (small inline so it shows even offline) ---------- */
function LeafIcon({ size = 16, color = '#00ED64', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={style}>
      <path
        d="M9 1c-.6 3.4-3 5.3-5 7-2.4 2-3.4 5.4-1.4 8.1.6.8 1.5 1.4 2.5 1.6.2-1.2.6-2.4 1.3-3.4.1-.1.3 0 .3.1-.4 1.1-.6 2.3-.6 3.5 1.4.2 2.8-.2 4-1 3.7-2.6 4.5-7.6 2.8-11.6C11.7 3.5 10.4 2 9 1z"
        fill={color}
      />
    </svg>
  );
}

/* ---------- Brand logo strip ---------- */
function Brand() {
  return (
    <div className="ml-topbar__brand">
      <LeafIcon size={22} color="#00ED64" />
      <span>MongoLingo</span>
      <span className="tag">beta</span>
    </div>
  );
}

/* ---------- HUD: XP, streak, leaves, avatar ---------- */
function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'ML';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function HUD({ xp, streak, leaves, profile, onProfileClick }) {
  const avatarLabel = profile?.learnerName ? initialsFromName(profile.learnerName) : 'ML';
  const profileTitle = profile?.learnerName
    ? `${profile.learnerName} · ${profile.company || 'MongoLingo learner'}`
    : 'Set learner profile';
  return (
    <div className="ml-topbar__hud">
      <div className="ml-stat ml-stat--xp" title="Experience points">
        <Icon name="Sparkle" size={14} color="currentColor" />
        <span className="num">{xp.toLocaleString()}</span>
        <span style={{ color: 'var(--ml-text-faint)', fontWeight: 500, fontSize: 11 }}>XP</span>
      </div>
      <div className="ml-stat ml-stat--streak" title="Clean-submit streak — wrong submits reset this to 0">
        <span style={{ fontSize: 14 }}>🔥</span>
        <span className="num">{streak}</span>
      </div>
      <div className="ml-stat ml-stat--leaf" title="Leaves earned (perfect runs)">
        <LeafIcon size={13} color="currentColor" />
        <span className="num">{leaves}</span>
      </div>
      <button
        className="ml-avatar"
        onClick={onProfileClick}
        aria-label={profileTitle}
        title={profileTitle}
        style={{ border: 0 }}
      >{avatarLabel}</button>
    </div>
  );
}

/* ---------- Top bar with nav ---------- */
function TopBar({ view, setView, hud, unlockAll = false, profile, onToggleUnlockAll, onProfileClick }) {
  return (
    <header className="ml-topbar">
      <Brand />
      <nav className="ml-topbar__nav" aria-label="Primary">
        <button
          onClick={() => setView({ name: 'home' })}
          aria-current={view.name === 'home' ? 'page' : undefined}
        >Learn</button>
        <button
          onClick={() => setView({ name: 'leaderboard' })}
          aria-current={view.name === 'leaderboard' ? 'page' : undefined}
        >Leaderboard</button>
        {onToggleUnlockAll && (
          <button
            onClick={onToggleUnlockAll}
            aria-pressed={unlockAll}
            title={unlockAll ? 'Lock staged progression' : 'Open all levels for testing'}
            style={{
              fontSize: 11,
              padding: '5px 9px',
              borderColor: unlockAll ? 'rgba(0,237,100,0.55)' : undefined,
              color: unlockAll ? 'var(--lg-spring)' : undefined
            }}
          >
            {unlockAll ? 'Lock stages' : 'Open all'}
          </button>
        )}
      </nav>
      {profile && (
        <div className="ml-topbar__profile" title={`${profile.learnerName} · ${profile.company}`}>
          <Icon name="Person" size={13} color="currentColor" />
          <span>{profile.learnerName}</span>
          <span className="dot">·</span>
          <span>{profile.company}</span>
        </div>
      )}
      <HUD {...hud} profile={profile} onProfileClick={onProfileClick || (() => setView({ name: 'home' }))} />
    </header>
  );
}

/* ---------- Code highlighter (lightweight, mongo-flavored) ---------- */
const KEYWORDS = new Set(['db', 'true', 'false', 'null']);
const OPERATORS = new Set([
  '$match', '$group', '$project', '$lookup', '$unwind', '$sort', '$limit',
  '$eq', '$gt', '$gte', '$lt', '$lte', '$in', '$set', '$push', '$inc',
  '$text', '$search', '$vectorSearch', '$sum', '$meta', '$and', '$or'
]);
const FNS = new Set([
  'find', 'insertOne', 'insertMany', 'updateOne', 'deleteOne', 'aggregate',
  'createIndex', 'explain'
]);

/* Tokenizes a string and wraps spans for highlight + hint tooltips. */
function HighlightedCode({ text, hints = window.HINTS || {} }) {
  // Tokenize: capture strings, comments, ops($word), numbers, idents, punctuation, whitespace.
  const tokens = [];
  const re = /(\/\/[^\n]*)|("[^"]*")|(\$[A-Za-z_]\w*)|([A-Za-z_]\w*)|(\d+(?:\.\d+)?)|([\s\n])|([{}()\[\],:.;])/g;
  let m, last = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'raw', val: text.slice(last, m.index) });
    if      (m[1]) tokens.push({ kind: 'c',  val: m[1] });
    else if (m[2]) tokens.push({ kind: 's',  val: m[2] });
    else if (m[3]) tokens.push({ kind: 'f',  val: m[3] });
    else if (m[4]) tokens.push({ kind: 'id', val: m[4] });
    else if (m[5]) tokens.push({ kind: 'n',  val: m[5] });
    else if (m[6]) tokens.push({ kind: 'ws', val: m[6] });
    else if (m[7]) tokens.push({ kind: 'p',  val: m[7] });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: 'raw', val: text.slice(last) });

  return (
    <>
      {tokens.map((t, i) => {
        if (t.kind === 'ws' || t.kind === 'raw') return <React.Fragment key={i}>{t.val}</React.Fragment>;
        if (t.kind === 'f' && hints[t.val]) {
          return <span className="ml-hint" data-hint={hints[t.val]} tabIndex={0} key={i}>{t.val}</span>;
        }
        if (t.kind === 'id') {
          if (KEYWORDS.has(t.val)) return <span className="k" key={i}>{t.val}</span>;
          if (FNS.has(t.val) && hints[t.val]) {
            return <span className="ml-hint" data-hint={hints[t.val]} tabIndex={0} key={i}>{t.val}</span>;
          }
          if (FNS.has(t.val))     return <span className="f" key={i}>{t.val}</span>;
          return <span className="id" key={i}>{t.val}</span>;
        }
        return <span className={t.kind} key={i}>{t.val}</span>;
      })}
    </>
  );
}

/* ---------- Confetti burst ---------- */
function Confetti({ on }) {
  if (!on) return null;
  const COLORS = ['#00ED64', '#FFC76A', '#B6E1FF', '#D5BCE3', '#FF7DBB'];
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 200,
    duration: 1200 + Math.random() * 800,
    color: COLORS[i % COLORS.length],
    rot: Math.random() * 360
  }));
  return (
    <div className="ml-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: p.left + '%',
            background: p.color,
            animationDelay: p.delay + 'ms',
            animationDuration: p.duration + 'ms',
            transform: `rotate(${p.rot}deg)`
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Concept card (collapsible "why does this work?") ---------- */
function ConceptCard({ children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ml-concept" data-open={open}>
      <button className="ml-concept__toggle" onClick={() => setOpen(!open)}>
        <Icon name="Bulb" size={14} color="var(--lg-spring)" />
        Why does this work?
        <span className="ml-spacer" />
        <Icon name="ChevronDown" size={14} className="chev" color="currentColor"
              style={{ transition: 'transform 160ms', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <div className="ml-concept__body">{children}</div>
    </div>
  );
}

/* ---------- Concept body w/ inline `code` wrapping ---------- */
function ConceptBody({ text }) {
  // simple backtick → <code>
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>{parts.map((p, i) =>
      p.startsWith('`') && p.endsWith('`')
        ? <code key={i}>{p.slice(1, -1)}</code>
        : <React.Fragment key={i}>{p}</React.Fragment>
    )}</>
  );
}

/* ---------- Feedback banner ---------- */
function Feedback({ state, title, message, diff }) {
  if (!state) return null;
  return (
    <div className="ml-feedback" data-state={state}>
      <span className="ml-feedback__icon">
        {state === 'correct' ? '✓' : '!'}
      </span>
      <div className="ml-feedback__body">
        <div className="ml-feedback__title">{title}</div>
        <div className="ml-feedback__msg">{message}</div>
        {diff && (
          <div className="ml-feedback__diff">
            {diff.map((line, i) => {
              const cls = line.startsWith('+') ? 'add' :
                          line.startsWith('-') ? 'rem' : '';
              return <div key={i} className={cls}>{line}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Celebrate overlay ---------- */
function Celebrate({ visible, xp, leaves, onClose, perfect, final }) {
  if (!visible) return null;
  return (
    <>
      <Confetti on />
      <div className="ml-celebrate" onClick={onClose} role="dialog" aria-modal="true">
        <div className="ml-celebrate__panel" onClick={(e) => e.stopPropagation()}>
          <div className="ml-celebrate__leaf">
            <LeafIcon size={final ? 96 : 72} color="#00ED64" />
          </div>
          <h2 className="ml-celebrate__title">
            {final ? 'You finished MongoLingo.' :
             perfect ? 'Perfect run!' : 'Level cleared'}
          </h2>
          <p className="ml-celebrate__sub">
            {final
              ? 'From documents to vector search — you covered every world. Atlas is yours to break.'
              : perfect ? 'No hints, no mistakes. That earns you a leaf.'
              : 'Nice work. Keep the pipeline flowing.'}
          </p>
          <div className="ml-celebrate__reward">
            +{xp} XP{perfect && <> · +{final ? 5 : 1} <LeafIcon size={14} color="currentColor" /></>}
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="ml-btn ml-btn--primary ml-btn--lg" onClick={onClose}>
              {final ? 'Take a bow' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, {
  Icon, LeafIcon, Brand, HUD, TopBar,
  HighlightedCode, Confetti,
  ConceptCard, ConceptBody, Feedback, Celebrate
});
