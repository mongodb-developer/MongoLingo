/* MongoLingo — root App. State, persistence, view routing. */

const { useState: useState_, useEffect: useEffect_, useMemo: useMemo_ } = React;

const STORAGE_KEY = 'mongolingo.progress.v1';
const PROFILE_KEY = 'mongolingo.profile.v1';

function defaultProfile() {
  return {
    learnerName: '',
    company: '',
    pathType: 'general',
    selectedPackId: 'general',
    onboardingComplete: false
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();
    return { ...defaultProfile(), ...JSON.parse(raw) };
  } catch (e) {
    return defaultProfile();
  }
}

function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch (e) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return { ...defaultProgress(), ...parsed };
  } catch (e) {
    return defaultProgress();
  }
}
function defaultProgress() {
  return {
    progress: {
    },
    xp: 0,
    streak: 0,
    leaves: 0
  };
}
function saveProgress(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

function hasAnyProgress(state) {
  return !!(
    state && (
      Object.keys(state.progress || {}).length > 0 ||
      (state.xp || 0) > 0 ||
      (state.leaves || 0) > 0 ||
      (state.streak || 0) > 0
    )
  );
}

function getWorldSkillBadges(worldId) {
  return (window.WORLD_SKILL_BADGES && window.WORLD_SKILL_BADGES[worldId]) || [];
}

/* world: { name, skillBadges, xp? } — xp is set only when the modal opens as
 * the reward for finishing the world, so the earned XP isn't swallowed by the
 * modal replacing the usual Celebrate toast. Re-opened from the map, it's omitted. */
function SkillBadgeModal({ world, onClose }) {
  const closeRef = React.useRef(null);
  useEffect_(() => {
    if (!world) return;
    closeRef.current && closeRef.current.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [world]);

  if (!world) return null;
  const justCompleted = world.xp != null;
  return (
    <div className="ml-skill-badges" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="ml-skill-badges-title">
      <div className="ml-skill-badges__panel" onClick={(e) => e.stopPropagation()}>
        <div className="ml-skill-badges__icon" aria-hidden="true">✦</div>
        <div className="ml-skill-badges__eyebrow">{justCompleted ? 'WORLD COMPLETE' : 'NEXT STEPS'}</div>
        <h2 id="ml-skill-badges-title">Keep learning with a Skill Badge</h2>
        <p>
          {justCompleted ? <>You finished <b>{world.name}</b>. </> : <>You've completed <b>{world.name}</b>. </>}
          Deepen what you learned with free MongoDB Skill Badges.
        </p>
        {justCompleted && world.xp > 0 && (
          <div className="ml-skill-badges__xp">+{world.xp} XP</div>
        )}
        <div className="ml-skill-badges__list" aria-label={`${world.name} Skill Badges`}>
          {world.skillBadges.map((badge) => (
            <a key={badge.title} href={badge.url} target="_blank" rel="noopener noreferrer" className="ml-skill-badges__link">
              <span className="ml-skill-badges__title">
                {badge.title}
                <small>{badge.type || 'Skill Badge'}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <button ref={closeRef} className="ml-btn ml-btn--primary" onClick={onClose}>Back to map</button>
      </div>
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "accent": "#00ED64",
    "showHints": true,
    "denseMap":  false,
    "unlockAllLevels": false
  }/*EDITMODE-END*/);

  const [state, setState] = useState_(loadProgress());
  const [view, setView]   = useState_({ name: 'home' });
  const [celebrate, setCelebrate] = useState_(null); // { xp, leaf, perfect }
  const [skillBadgeWorld, setSkillBadgeWorld] = useState_(null);
  const [unlockAll, setUnlockAll] = useState_(false);
  const [profile, setProfile] = useState_(loadProfile());
  const [industryId, setIndustryId] = useState_(() => {
    try {
      const savedProfile = loadProfile();
      return savedProfile.onboardingComplete
        ? savedProfile.selectedPackId
        : (localStorage.getItem('mongolingo.industry') || 'general');
    } catch(e) { return 'general'; }
  });

  useEffect_(() => { saveProfile(profile); }, [profile]);

  // When industry changes, swap active WORLDS/HINTS synchronously (useMemo runs during render)
  useMemo_(() => {
    const pack = window.MONGOLINGO_INDUSTRIES[industryId];
    if (pack) {
      window.WORLDS = pack.worlds;
      window.HINTS = pack.hints || window.HINTS;
    }
    try { localStorage.setItem('mongolingo.industry', industryId); } catch(e) {}
  }, [industryId]);

  // Persist
  useEffect_(() => { saveProgress(state); }, [state]);

  // Apply tweak accent
  useEffect_(() => {
    document.documentElement.style.setProperty('--lg-spring', tweaks.accent || '#00ED64');
  }, [tweaks.accent]);

  function completeLevel({ worldId, levelId, xp, leaf, clean }) {
    // Show Skill Badges when this completion is the one that finishes the world
    // (every level done), regardless of the order levels were cleared in.
    const world = window.WORLDS.find(w => w.id === worldId);
    const skillBadges = getWorldSkillBadges(worldId);
    const wasDone = state.progress[`${worldId}:${levelId}`]?.done;
    const finishesWorld = !!world && !wasDone && world.levels.every(l =>
      l.id === levelId || state.progress[`${worldId}:${l.id}`]?.done
    );
    setState(prev => {
      const key = `${worldId}:${levelId}`;
      const previouslyDone = prev.progress[key]?.done;
      const next = {
        ...prev,
        progress: {
          ...prev.progress,
          [key]: { done: true, leaf: leaf || prev.progress[key]?.leaf }
        },
        xp:     prev.xp     + (previouslyDone ? 0 : xp),
        streak: clean && !previouslyDone ? (prev.streak || 0) + 1 : prev.streak || 0,
        leaves: prev.leaves + (leaf && !prev.progress[key]?.leaf ? 1 : 0)
      };
      return next;
    });
    if (finishesWorld && skillBadges.length) {
      setSkillBadgeWorld({ name: world.name, skillBadges, xp });
    } else {
      setCelebrate({ xp, leaf, perfect: leaf });
      setTimeout(() => setCelebrate(null), 1900);
    }
  }

  function showSkillBadges(worldId) {
    const world = window.WORLDS.find(w => w.id === worldId);
    const skillBadges = getWorldSkillBadges(worldId);
    if (world && skillBadges.length) setSkillBadgeWorld({ name: world.name, skillBadges });
  }

  const hud = {
    xp: state.xp,
    streak: state.streak || 0,
    leaves: state.leaves
  };

  function resetStreak() {
    setState(prev => ({ ...prev, streak: 0 }));
  }
  // Stages are locked by default. The small header button is the source of truth
  // for temporarily opening every level during testing.
  const debugUnlockAll = unlockAll;

  function startAssignment(nextProfile) {
    const completeProfile = { ...nextProfile, onboardingComplete: true };
    setProfile(completeProfile);
    setIndustryId(completeProfile.selectedPackId || 'general');
    setView({ name: 'home' });
    // Register the learner with the optional backend (no-op if API_BASE unset).
    if (window.MongoLingoAPI) {
      window.MongoLingoAPI.registerUser({
        name: completeProfile.learnerName,
        company: completeProfile.company,
        pack: completeProfile.selectedPackId || 'general'
      });
    }
  }

  // Debounced score sync to the optional backend whenever progress changes.
  useEffect_(() => {
    if (!window.MongoLingoAPI || !window.MongoLingoAPI.apiEnabled()) return;
    if (!profile.onboardingComplete) return;
    const t = setTimeout(() => {
      window.MongoLingoAPI.submitScore({
        xp: state.xp,
        leaves: state.leaves,
        streak: state.streak || 0,
        pack: industryId,
        name: profile.learnerName,
        company: profile.company
      });
    }, 800);
    return () => clearTimeout(t);
  }, [state.xp, state.leaves, state.streak, industryId, profile.onboardingComplete]);

  function changeAssignment() {
    if (hasAnyProgress(state)) {
      const discard = window.confirm('Changing learner or assignment will discard all current progress and start fresh. Continue?');
      if (!discard) return;
      try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
      setState(defaultProgress());
    }
    setProfile(prev => ({ ...prev, onboardingComplete: false }));
    setView({ name: 'landing' });
  }

  let screen;
  switch (view.name) {
    case 'landing':
      screen = <LandingScreen profile={profile} packs={window.MONGOLINGO_INDUSTRIES || {}} onStart={startAssignment} />;
      break;
    case 'home':
      if (!profile.onboardingComplete) {
        screen = <LandingScreen profile={profile} packs={window.MONGOLINGO_INDUSTRIES || {}} onStart={startAssignment} />;
      } else {
        screen = <HomeScreen progress={state.progress} setView={setView} totalXp={state.xp} debugUnlockAll={debugUnlockAll} industryId={industryId} setIndustryId={setIndustryId} profile={profile} onChangeAssignment={changeAssignment} onShowSkillBadges={showSkillBadges} />;
      }
      break;
    case 'level':
      screen = <LevelScreen
                 worldId={view.worldId} levelId={view.levelId}
                 setView={setView}
                 onComplete={completeLevel}
                 onMistake={resetStreak}
                 progress={state.progress} />;
      break;
    case 'challenge':
      screen = <ChallengeScreen
                 worldId={view.worldId}
                 setView={setView}
                 onChallengeWin={({ worldId, score }) => {
                   const isFinal = worldId === 'atlas';
                   setState(prev => ({
                     ...prev,
                     xp: prev.xp + 200 + Math.floor(score / 10),
                     leaves: prev.leaves + (isFinal ? 5 : 1),
                     progress: { ...prev.progress, [`challenge:${worldId}`]: { done: true, score } }
                   }));
                   setCelebrate({ xp: 200 + Math.floor(score / 10), perfect: true, final: isFinal });
                 }} />;
      break;
    case 'leaderboard':
      screen = <LeaderboardScreen totalXp={state.xp} leaves={state.leaves} name={profile.learnerName || 'You'} pack={industryId} />;
      break;
    default:
      screen = profile.onboardingComplete
        ? <HomeScreen progress={state.progress} setView={setView} totalXp={state.xp} debugUnlockAll={debugUnlockAll} industryId={industryId} setIndustryId={setIndustryId} profile={profile} onChangeAssignment={changeAssignment} onShowSkillBadges={showSkillBadges} />
        : <LandingScreen profile={profile} packs={window.MONGOLINGO_INDUSTRIES || {}} onStart={startAssignment} />;
  }

  return (
    <div className="ml-app">
      <TopBar
        view={view}
        setView={setView}
        hud={hud}
        unlockAll={debugUnlockAll}
        profile={profile.onboardingComplete ? profile : null}
        onToggleUnlockAll={() => setUnlockAll(v => !v)}
        onProfileClick={changeAssignment}
      />
      <main className="ml-main">{screen}</main>

      <Celebrate
        visible={!!celebrate}
        xp={celebrate?.xp ?? 0}
        leaves={state.leaves}
        perfect={!!celebrate?.perfect}
        final={!!celebrate?.final}
        onClose={() => setCelebrate(null)}
      />
      <SkillBadgeModal
        world={skillBadgeWorld}
        onClose={() => setSkillBadgeWorld(null)}
      />

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme accent">
          <TweakColor
            label="Brand accent"
            value={tweaks.accent}
            onChange={(v) => setTweak('accent', v)}
            options={['#00ED64', '#71F6BA', '#016BF8', '#FFC76A', '#C390DF', '#FF7DBB']}
          />
        </TweakSection>
        <TweakSection label="Behavior">
          <TweakToggle
            label="Show hint tooltips on hover"
            value={tweaks.showHints}
            onChange={(v) => setTweak('showHints', v)}
          />
        </TweakSection>
        <TweakSection label="Progress (debug)">
          <TweakToggle
            label="Unlock all levels for testing"
            value={debugUnlockAll}
            onChange={(v) => setUnlockAll(v)}
          />
          <TweakButton
            label="Reset progress"
            onClick={() => { localStorage.removeItem(STORAGE_KEY); setState(loadProgress()); setView({ name: 'home' }); }}
          />
          <TweakButton
            label="Demo: complete all"
            onClick={() => {
              const p = {};
              window.WORLDS.forEach(w => w.levels.forEach(l => p[`${w.id}:${l.id}`] = { done: true, leaf: true }));
              setState(s => ({ ...s, progress: p, xp: 2400, leaves: 20 }));
            }}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
