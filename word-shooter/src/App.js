import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { LEVELS, DISTRACTOR_POOL } from './levels';
import { speak } from './speak';

// ─── helpers ────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Randomly select words from the pool for this game session
function pickLevelWords(level) {
  return shuffle([...level.wordPool]).slice(0, level.wordsPerGame);
}

// Build objects for one round.
// selectedWords: the subset of wordPool chosen for this session.
// lastTargetWord: word string to avoid repeating as the new target.
function buildRound(level, selectedWords, lastTargetWord) {
  const { objectCount, distractors } = level;

  // Avoid the same target two rounds in a row (confuses pattern-seeking kids)
  const available = lastTargetWord
    ? selectedWords.filter(w => w.word !== lastTargetWord)
    : selectedWords;
  const target = pickRandom(available.length > 0 ? available : selectedWords);

  const foils = shuffle(selectedWords.filter(w => w.word !== target.word)).slice(0, objectCount - 1);
  let objects = [target, ...foils];

  // Level 3+: replace last foil slot with a visual distractor (non-clickable)
  if (distractors && objects.length >= 3) {
    const distractor = pickRandom(DISTRACTOR_POOL);
    objects[objects.length - 1] = { ...distractor, word: null, isDistractor: true };
  }

  return { target, objects: shuffle(objects) };
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('start');      // start | game | levelup | end
  const [levelIndex, setLevelIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSidekick, setShowSidekick] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  // round
  const [round, setRound] = useState(null);
  const [phase, setPhase] = useState('idle');          // idle|speaking|waiting|shooting|feedback
  const [correct, setCorrect] = useState(null);
  const [laserAnim, setLaserAnim] = useState(null);    // {fromX,fromY,toX,toY}
  const [glowIndex, setGlowIndex] = useState(null);
  const [explosionIndex, setExplosionIndex] = useState(null);
  const [distractorShake, setDistractorShake] = useState(false);

  const idleTimer = useRef(null);
  const heroRef = useRef(null);
  const objectRefs = useRef([]);
  const selectedWordsRef = useRef([]);   // words chosen for this session
  const lastTargetRef = useRef(null);    // avoid same target two rounds in a row
  const level = LEVELS[levelIndex];

  // ── new round ──────────────────────────────────────────────────────────
  const startRound = useCallback(() => {
    clearTimeout(idleTimer.current);
    const r = buildRound(level, selectedWordsRef.current, lastTargetRef.current);
    lastTargetRef.current = r.target.word;
    setRound(r);
    setPhase('speaking');
    setCorrect(null);
    setLaserAnim(null);
    setGlowIndex(null);
    setExplosionIndex(null);
    setDistractorShake(false);
    setShowSidekick(false);

    setTimeout(() => {
      speak(r.target.word, () => {
        setPhase('waiting');
        // Keep repeating the word every 4 s until the child taps
        const scheduleRepeat = () => {
          idleTimer.current = setTimeout(() => speak(r.target.word, scheduleRepeat), 3000);
        };
        scheduleRepeat();
      });
    }, 500);
  }, [level]);

  // ── start / level change ───────────────────────────────────────────────
  useEffect(() => {
    if (screen === 'game') {
      // Pick a fresh word subset from the pool for this session/level
      selectedWordsRef.current = pickLevelWords(level);
      lastTargetRef.current = null;
      startRound();
    }
    return () => clearTimeout(idleTimer.current);
  }, [screen, levelIndex]); // eslint-disable-line

  // ── tap ────────────────────────────────────────────────────────────────
  const handleTap = useCallback((obj, idx) => {
    // Retry phase: child must tap the glowing correct answer to continue
    if (phase === 'retry') {
      if (obj.isDistractor || obj.word !== round.target.word) return;
      setGlowIndex(null);
      setShowSidekick(false);
      startRound();
      return;
    }

    if (phase !== 'waiting') return;
    if (obj.isDistractor) {
      setDistractorShake(true);
      setTimeout(() => setDistractorShake(false), 450);
      return;
    }
    clearTimeout(idleTimer.current);
    setPhase('shooting');

    // laser trajectory
    const heroEl = heroRef.current;
    const objEl = objectRefs.current[idx];
    if (heroEl && objEl) {
      const hr = heroEl.getBoundingClientRect();
      const or = objEl.getBoundingClientRect();
      setLaserAnim({
        fromX: hr.left + hr.width / 2,
        fromY: hr.top + hr.height * 0.25,
        toX: or.left + or.width / 2,
        toY: or.top + or.height / 2,
      });
    }

    const isCorrect = obj.word === round.target.word;

    setTimeout(() => {
      setLaserAnim(null);
      setCorrect(isCorrect);
      setExplosionIndex(idx);

      if (isCorrect) {
        speak('Great!');
        const newStars = stars + 1;
        setStars(newStars);
        if (newStars % 5 === 0) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2200);
        }
        const newCount = correctCount + 1;
        setCorrectCount(newCount);

        setTimeout(() => {
          setExplosionIndex(null);
          if (newCount >= level.targetCorrect) {
            if (levelIndex < LEVELS.length - 1) {
              setScreen('levelup');
            } else {
              setScreen('end');
            }
          } else {
            startRound();
          }
        }, 1200);
      } else {
        const correctIdx = round.objects.findIndex(o => o.word === round.target.word);
        setGlowIndex(correctIdx);
        speak(`This is ${round.target.word}`);
        setShowSidekick(true);
        // Enter retry mode — child must tap the glowing correct answer
        setTimeout(() => {
          setExplosionIndex(null);
          setPhase('retry');
        }, 700);
      }
    }, 450);
  }, [phase, round, stars, correctCount, level, levelIndex, startRound]);

  // ── level up actions ───────────────────────────────────────────────────
  const goNextLevel = () => {
    setLevelIndex(l => l + 1);
    setCorrectCount(0);
    setScreen('game');
  };
  const replayLevel = () => {
    setCorrectCount(0);
    setScreen('game');
  };

  const floatClass =
    level?.floatSpeed === 0 ? '' :
    level?.floatSpeed === 1 ? 'float-slow' : 'float-fast';

  const progress = level ? Math.min(correctCount / level.targetCorrect, 1) : 0;

  // ── screens ────────────────────────────────────────────────────────────
  if (screen === 'start') return (
    <div className="screen start-screen">
      <div className="game-title">Word<br/>Shooter</div>
      <div className="hero-icon hero-idle">🦸</div>
      <button className="btn-primary" onClick={() => setScreen('game')}>Play!</button>
    </div>
  );

  if (screen === 'levelup') return (
    <div className="screen levelup-screen">
      <div className="big-emoji">🎉</div>
      <div className="result-title">Great job!</div>
      <div className="result-sub">{LEVELS[levelIndex + 1]?.name} — ready?</div>
      <button className="btn-primary" onClick={goNextLevel}>Next Level →</button>
      <button className="btn-secondary" onClick={replayLevel}>Play Again</button>
    </div>
  );

  if (screen === 'end') return (
    <div className="screen end-screen">
      <div className="big-emoji">🏆</div>
      <div className="result-title">You Win!</div>
      <div className="stars-total">🌟 {stars} stars!</div>
      <button className="btn-primary" onClick={() => { setStars(0); setLevelIndex(0); setCorrectCount(0); setScreen('start'); }}>
        Play Again
      </button>
    </div>
  );

  // game screen
  return (
    <div className="screen game-screen">
      {/* HUD */}
      <div className="hud">
        <span className="hud-stars">🌟 {stars}</span>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="hud-level">{level?.name}</span>
      </div>

      {/* Word prompt — tappable to repeat */}
      {round && (
        <button className="word-prompt" onClick={() => speak(round.target.word)}>
          {round.target.word} 🔊
        </button>
      )}

      {/* EN label toggle */}
      <button
        className={`lang-toggle ${showLabels ? 'active' : ''}`}
        onClick={() => setShowLabels(v => !v)}
        aria-label="Toggle English labels"
      >
        EN
      </button>

      {/* Objects */}
      <div className="objects-area">
        {round?.objects.map((obj, i) => (
          <div
            key={`${round.target.word}-${i}`}
            ref={el => objectRefs.current[i] = el}
            className={[
              'obj-card',
              floatClass,
              obj.isDistractor ? 'obj-distractor' : '',
              obj.isDistractor && distractorShake ? 'obj-distractor-shake' : '',
              glowIndex === i ? 'obj-glow' : '',
              explosionIndex === i && correct === true  ? 'obj-explode-correct' : '',
              explosionIndex === i && correct === false ? 'obj-explode-wrong'   : '',
            ].join(' ')}
            style={{ animationDelay: `${i * 0.35}s` }}
            onClick={() => handleTap(obj, i)}
          >
            <span className="obj-emoji">{obj.emoji}</span>
            {showLabels && <span className="obj-label">{obj.label}</span>}
          </div>
        ))}
      </div>

      {/* Hero */}
      <div className="hero-area">
        <div ref={heroRef} className={`hero-wrap ${phase === 'shooting' ? 'hero-shooting' : 'hero-idle-anim'}`}>
          <span className="hero-emoji">🦸</span>
          {phase === 'shooting' && <span className="chest-burst">✨</span>}
        </div>
      </div>

      {/* Missile */}
      {laserAnim && <Missile pos={laserAnim} />}

      {/* Sidekick — appears after wrong answer, prompts retry */}
      {showSidekick && round && <Sidekick word={round.target.word} />}

      {/* Celebration */}
      {showCelebration && <Celebration />}
    </div>
  );
}

// ─── Missile ─────────────────────────────────────────────────────────────────
function Missile({ pos }) {
  const dx = pos.toX - pos.fromX;
  const dy = pos.toY - pos.fromY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <div
      className="missile-wrap"
      style={{
        left: pos.fromX,
        top: pos.fromY,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--angle': `${angle + 90}deg`,
      }}
    >
      🚀
    </div>
  );
}

// ─── Sidekick ─────────────────────────────────────────────────────────────────
function Sidekick({ word }) {
  return (
    <div className="sidekick-wrap">
      <div className="sidekick-bubble">
        <span className="sidekick-line">Find it!</span>
        <span className="sidekick-word">{word}</span>
        <span className="sidekick-line">👆 Tap!</span>
      </div>
      <span className="sidekick-emoji">🤖</span>
    </div>
  );
}

// ─── Celebration ─────────────────────────────────────────────────────────────
const CONFETTI = ['🎉', '⭐', '🌟', '🎊', '✨', '🎈'];
function Celebration() {
  return (
    <div className="celebration-layer" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i / 14) * 100 + (Math.random() * 6 - 3)}%`,
            animationDelay: `${Math.random() * 0.4}s`,
            fontSize: `${1.4 + Math.random() * 1.2}rem`,
          }}
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}
    </div>
  );
}
