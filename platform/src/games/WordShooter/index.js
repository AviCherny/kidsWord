import React, { useState, useEffect, useRef, useCallback } from 'react';
import './WordShooter.css';
import { LEVELS, DISTRACTOR_POOL } from './levels';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';
import { getGameDifficulty, saveGameDifficulty } from '../../lib/settings';

const GAME_ID = 'shooter';

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

function buildRound(level, selectedWords, target) {
  const { objectCount, distractors } = level;
  const foils = shuffle(selectedWords.filter(w => w.word !== target.word)).slice(0, objectCount - 1);
  let objects = [target, ...foils];
  if (distractors && objects.length >= 3) {
    const distractor = pickRandom(DISTRACTOR_POOL);
    objects[objects.length - 1] = { ...distractor, word: null, isDistractor: true };
  }
  return { target, objects: shuffle(objects) };
}

// Animation class per word — each icon gets a unique motion
const EMOJI_ANIM = {
  // bounce
  Apple: 'ws-anim-bounce', Ball: 'ws-anim-bounce',
  Frog: 'ws-anim-bounce', Rabbit: 'ws-anim-bounce', Penguin: 'ws-anim-bounce',
  // sway
  Dog: 'ws-anim-sway', Cat: 'ws-anim-sway', Fox: 'ws-anim-sway',
  Pig: 'ws-anim-sway', Hen: 'ws-anim-sway',
  Monkey: 'ws-anim-sway', Sheep: 'ws-anim-sway', Flamingo: 'ws-anim-sway',
  // rock (water/slow creatures)
  Ship: 'ws-anim-rock', Shark: 'ws-anim-rock', Crab: 'ws-anim-rock',
  Turtle: 'ws-anim-rock', Snail: 'ws-anim-rock',
  // pulse (objects that glow/breathe)
  Crown: 'ws-anim-pulse', Cactus: 'ws-anim-pulse',
  Grapes: 'ws-anim-pulse', Cup: 'ws-anim-pulse', Hat: 'ws-anim-pulse',
  Unicorn: 'ws-anim-pulse', Peacock: 'ws-anim-pulse',
  // roll (vehicles)
  Car: 'ws-anim-roll', Bus: 'ws-anim-roll', Truck: 'ws-anim-roll',
  // shake (noisy objects)
  Pan: 'ws-anim-shake', Drum: 'ws-anim-shake',
  // spin
  Rocket: 'ws-anim-spin',
  // write
  Pen: 'ws-anim-write',
  // specific — meaningful logical motion per creature/object
  Bat: 'ws-anim-bat', Box: 'ws-anim-box', Cap: 'ws-anim-cap',
  Tiger: 'ws-anim-tiger',
  Dragon: 'ws-anim-dragon',
  Dinosaur: 'ws-anim-dino',
  Bee: 'ws-anim-bee',
  Fish: 'ws-anim-fish',
  Bird: 'ws-anim-bird',
  Eagle: 'ws-anim-bird',
  Duck: 'ws-anim-duck',
  Whale: 'ws-anim-whale',
  Volcano: 'ws-anim-volcano',
  Flame: 'ws-anim-flame',
  Bell: 'ws-anim-bell',
  Elephant: 'ws-anim-elephant',
  Kangaroo: 'ws-anim-kangaroo',
  Jellyfish: 'ws-anim-jellyfish',
  Sun: 'ws-anim-sun',
  Star: 'ws-anim-star',
  Helicopter: 'ws-anim-helicopter',
  Octopus: 'ws-anim-octopus',
  Crocodile: 'ws-anim-croc',
};

export default function WordShooter({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [screen, setScreen] = useState('start');
  const [difficulty, setDifficulty] = useState(() => getGameDifficulty(GAME_ID, 1));
  const [levelIndex, setLevelIndex] = useState(() => getGameDifficulty(GAME_ID, 1) - 1);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);

  const [round, setRound] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [correct, setCorrect] = useState(null);
  const [missileAnim, setMissileAnim] = useState(null);
  const [glowIndex, setGlowIndex] = useState(null);
  const [explosionIndex, setExplosionIndex] = useState(null);
  const [distractorShake, setDistractorShake] = useState(false);
  const [showSidekick, setShowSidekick] = useState(false);
  const idleTimer = useRef(null);
  const heroRef = useRef(null);
  const objectRefs = useRef([]);
  const selectedWordsRef = useRef([]);
  const lastTargetRef = useRef(null);
  const wordDeckRef = useRef([]);
  const level = LEVELS[levelIndex];

  function handleDifficultyChange(nextDifficulty) {
    if (nextDifficulty === difficulty) return;
    const savedDifficulty = saveGameDifficulty(GAME_ID, nextDifficulty);
    setDifficulty(savedDifficulty);
    setLevelIndex(savedDifficulty - 1);
    setCorrectCount(0);
  }

  function startGame() {
    setLevelIndex(difficulty - 1);
    setCorrectCount(0);
    setScreen('game');
  }

  const objLabel = (obj) => {
    if (obj.isDistractor) return lang === 'he' ? (obj.heLabel || obj.label) : obj.label;
    return lang === 'he' ? obj.heLabel : obj.label;
  };

  const pickFromDeck = useCallback(() => {
    if (wordDeckRef.current.length === 0) {
      wordDeckRef.current = shuffle([...selectedWordsRef.current]);
    }
    let idx = wordDeckRef.current.findIndex(w => w.word !== lastTargetRef.current);
    if (idx === -1) idx = 0;
    const [target] = wordDeckRef.current.splice(idx, 1);
    return target;
  }, []);

  const launchMissile = useCallback((targetIdx) => {
    const heroEl = heroRef.current;
    const objEl = objectRefs.current[targetIdx];
    if (!heroEl || !objEl) return;
    const hr = heroEl.getBoundingClientRect();
    const or = objEl.getBoundingClientRect();
    setMissileAnim({
      fromX: hr.left + hr.width / 2,
      fromY: hr.top + hr.height * 0.25,
      toX: or.left + or.width / 2,
      toY: or.top + or.height / 2,
    });
  }, []);

  const startRound = useCallback(() => {
    clearTimeout(idleTimer.current);
    const target = pickFromDeck();
    lastTargetRef.current = target.word;
    const r = buildRound(level, selectedWordsRef.current, target);
    setRound(r);
    setPhase('speaking');
    setCorrect(null);
    setMissileAnim(null);
    setGlowIndex(null);
    setExplosionIndex(null);
    setDistractorShake(false);
    setShowSidekick(false);

    const spokenWord = lang === 'en' ? target.word : (target.heSpeech || target.heWord);

    setTimeout(() => {
      speak(spokenWord, lang, () => {
        setPhase('waiting');
        const scheduleRepeat = () => {
          idleTimer.current = setTimeout(() => {
            speak(lang === 'en' ? r.target.word : (r.target.heSpeech || r.target.heWord), lang, scheduleRepeat);
          }, 3000);
        };
        scheduleRepeat();
      });
    }, 500);
  }, [level, lang, pickFromDeck]);

  useEffect(() => {
    if (screen === 'game') {
      // Use ALL words from the pool — deck handles variety
      selectedWordsRef.current = shuffle([...level.wordPool]);
      lastTargetRef.current = null;
      wordDeckRef.current = [];
      startRound();
    }
    return () => clearTimeout(idleTimer.current);
  }, [screen, levelIndex]); // eslint-disable-line

  const handleTap = useCallback((obj, idx) => {
    if (phase === 'retry') {
      if (obj.isDistractor || obj.word !== round.target.word) return;
      setPhase('shooting');
      launchMissile(idx);
      setGlowIndex(null);
      setShowSidekick(false);
      setTimeout(() => { setMissileAnim(null); startRound(); }, 1100);
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
    launchMissile(idx);

    const isCorrect = obj.word === round.target.word;

    setTimeout(() => {
      setMissileAnim(null);
      setCorrect(isCorrect);
      setExplosionIndex(idx);

      if (isCorrect) {
        speak(t(lang, 'great'), lang);
        const newStars = stars + 1;
        setStars(newStars);
        const newCount = correctCount + 1;
        setCorrectCount(newCount);
        setTimeout(() => {
          setExplosionIndex(null);
          if (newCount >= level.targetCorrect) {
            if (levelIndex < LEVELS.length - 1) { setScreen('levelup'); }
            else { setScreen('end'); onSuccess(); }
          } else { startRound(); }
        }, 1200);
      } else {
        const correctIdx = round.objects.findIndex(o => o.word === round.target.word);
        setGlowIndex(correctIdx);
        speak(lang === 'en' ? round.target.word : (round.target.heSpeech || round.target.heWord), lang);
        setShowSidekick(true);
        setTimeout(() => { setExplosionIndex(null); setPhase('retry'); }, 700);
      }
    }, 1100);
  }, [phase, round, stars, correctCount, level, levelIndex, lang, startRound, launchMissile, onSuccess]); // eslint-disable-line

  const goNextLevel = () => { setLevelIndex(l => l + 1); setCorrectCount(0); setScreen('game'); };
  const replayLevel = () => { setCorrectCount(0); setScreen('game'); };

  const floatClass = level?.floatSpeed === 0 ? '' : level?.floatSpeed === 1 ? 'ws-float-slow' : 'ws-float-fast';
  const progress = level ? Math.min(correctCount / level.targetCorrect, 1) : 0;

  if (screen === 'start') return (
    <div className="ws-screen ws-start" dir={dir}>
      <div className="ws-game-title">{t(lang, 'wordShooterTitle').replace('\\n', '\n')}</div>
      <div className="ws-hero-icon ws-hero-idle"><Cannon /></div>
      <div className="ws-level-picker" role="group" aria-label="Word Shooter level">
        {LEVELS.map((item, idx) => (
          <button
            key={item.id}
            className={`ws-level-pill${difficulty === idx + 1 ? ' active' : ''}`}
            onClick={() => handleDifficultyChange(idx + 1)}
            aria-pressed={difficulty === idx + 1}
            type="button"
          >
            <span className="ws-level-pill-stars">{'⭐'.repeat(idx + 1)}</span>
            <span className="ws-level-pill-label">{t(lang, item.nameKey)}</span>
          </button>
        ))}
      </div>
      <button className="ws-btn-primary" onClick={startGame}>{t(lang, 'play')}</button>
      <button className="ws-exit-link" onClick={onExit}>←</button>
    </div>
  );

  if (screen === 'levelup') return (
    <div className="ws-screen ws-levelup" dir={dir}>
      <div className="ws-big-emoji">🎉</div>
      <div className="ws-result-title">{t(lang, 'great')}</div>
      <div className="ws-result-sub">{t(lang, LEVELS[levelIndex + 1]?.nameKey)} — {t(lang, 'readyForNext')}</div>
      <button className="ws-btn-primary" onClick={goNextLevel}>{t(lang, 'nextLevel')}</button>
      <button className="ws-btn-secondary" onClick={replayLevel}>{t(lang, 'playAgain')}</button>
    </div>
  );

  if (screen === 'end') return (
    <div className="ws-screen ws-end" dir={dir}>
      <div className="ws-big-emoji">🏆</div>
      <div className="ws-result-title">{t(lang, 'youWin')}</div>
      <div className="ws-stars-total">🌟 {stars} {t(lang, 'totalStars')}</div>
      <button className="ws-btn-primary" onClick={() => { setStars(0); setLevelIndex(difficulty - 1); setCorrectCount(0); setScreen('start'); }}>
        {t(lang, 'playAgain')}
      </button>
      <button className="ws-exit-link" onClick={onExit}>←</button>
    </div>
  );

  const targetWord = round ? (lang === 'he' ? round.target.heWord : round.target.word) : '';

  return (
    <div className="ws-screen ws-game" dir={dir}>
      <div className="ws-road-overlay" aria-hidden="true">
        <div className="ws-road-center" />
        <div className="ws-road-edge ws-road-edge-left" />
        <div className="ws-road-edge ws-road-edge-right" />
      </div>

      <div className="ws-hud">
        <span className="ws-hud-stars">🌟 {stars}</span>
        <div className="ws-progress-bar-wrap">
          <div className="ws-progress-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="ws-hud-level">{t(lang, level?.nameKey)}</span>
        <button className="ws-exit-small" onClick={onExit}>✕</button>
      </div>

      {round && (
        <button className="ws-word-prompt" onClick={() => {
          speak(lang === 'en' ? round.target.word : (round.target.heSpeech || round.target.heWord), lang);
        }}>
          {targetWord} 🔊
        </button>
      )}

      <div className="ws-objects-area">
        {round?.objects.map((obj, i) => (
          <div
            key={`${round.target.word}-${i}`}
            className="ws-obj-lane"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div
              ref={el => objectRefs.current[i] = el}
              className={[
                'ws-obj-card', floatClass,
                obj.isDistractor ? 'ws-obj-distractor' : '',
                obj.isDistractor && distractorShake ? 'ws-obj-distractor-shake' : '',
                glowIndex === i ? 'ws-obj-glow' : '',
                explosionIndex === i && correct === true  ? 'ws-obj-explode-correct' : '',
                explosionIndex === i && correct === false ? 'ws-obj-explode-wrong' : '',
              ].join(' ')}
              style={{ animationDelay: `${i * 0.35}s` }}
              onClick={() => handleTap(obj, i)}
            >
              <span className={`ws-obj-emoji ${EMOJI_ANIM[obj.word] || 'ws-anim-pulse'}`}>{obj.emoji}</span>
              <span className="ws-obj-label">{objLabel(obj)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ws-hero-area">
        <div ref={heroRef} className={`ws-hero-wrap${phase === 'shooting' ? ' ws-hero-shooting' : ' ws-hero-idle-anim'}`}>
          <Cannon shooting={phase === 'shooting'} />
        </div>
      </div>

      {missileAnim && <Missile pos={missileAnim} />}
      {showSidekick && round && <Sidekick word={lang === 'he' ? round.target.heWord : round.target.word} lang={lang} />}
    </div>
  );
}

function Sidekick({ word, lang }) {
  const findIt = lang === 'en' ? 'Find it!' : '!מצא את';
  const tapIt  = lang === 'en' ? '👆 Tap!'  : '!לחץ 👆';
  return (
    <div className="ws-sidekick-wrap">
      <div className="ws-sidekick-bubble">
        <span className="ws-sidekick-line">{findIt}</span>
        <span className="ws-sidekick-word">{word}</span>
        <span className="ws-sidekick-line">{tapIt}</span>
      </div>
      <span className="ws-sidekick-emoji">🤖</span>
    </div>
  );
}

function Cannon({ shooting }) {
  const spokes = [0, 60, 120];
  return (
    <svg
      className={`ws-cannon${shooting ? ' ws-cannon-fire' : ''}`}
      width="160" height="130" viewBox="0 0 160 130"
      aria-hidden="true"
    >
      {/* Barrel — angled slightly right, pointing upward */}
      <g transform="translate(72, 72) rotate(12)">
        <rect x="-14" y="-62" width="28" height="66" rx="9" fill="#2e2e2e" stroke="#111" strokeWidth="2.5"/>
        {/* ring bands */}
        <rect x="-15" y="-64" width="30" height="11" rx="5" fill="#222" stroke="#111" strokeWidth="2"/>
        <rect x="-14" y="-34" width="28" height="7" rx="3" fill="#444"/>
        <rect x="-14" y="-12" width="28" height="7" rx="3" fill="#444"/>
        {/* muzzle flash ring when firing */}
        {shooting && <circle cx="0" cy="-64" r="14" fill="rgba(255,200,50,0.85)" className="ws-cannon-flash"/>}
      </g>

      {/* Body / carriage */}
      <ellipse cx="72" cy="90" rx="50" ry="21" fill="#8B4513" stroke="#5D2E0C" strokeWidth="3"/>

      {/* Axle */}
      <rect x="12" y="95" width="116" height="10" rx="5" fill="#5D2E0C"/>

      {/* Left wheel */}
      <circle cx="32" cy="100" r="26" fill="#7B3F00" stroke="#4A2000" strokeWidth="4"/>
      <circle cx="32" cy="100" r="10" fill="#4A2000"/>
      {spokes.map(a => {
        const r = a * Math.PI / 180;
        return <line key={a}
          x1={32 + 10 * Math.cos(r)} y1={100 + 10 * Math.sin(r)}
          x2={32 + 23 * Math.cos(r)} y2={100 + 23 * Math.sin(r)}
          stroke="#4A2000" strokeWidth="4" strokeLinecap="round"/>;
      })}

      {/* Right wheel */}
      <circle cx="112" cy="100" r="26" fill="#7B3F00" stroke="#4A2000" strokeWidth="4"/>
      <circle cx="112" cy="100" r="10" fill="#4A2000"/>
      {spokes.map(a => {
        const r = a * Math.PI / 180;
        return <line key={a}
          x1={112 + 10 * Math.cos(r)} y1={100 + 10 * Math.sin(r)}
          x2={112 + 23 * Math.cos(r)} y2={100 + 23 * Math.sin(r)}
          stroke="#4A2000" strokeWidth="4" strokeLinecap="round"/>;
      })}
    </svg>
  );
}

function Missile({ pos }) {
  const dx = pos.toX - pos.fromX;
  const dy = pos.toY - pos.fromY;
  const dist = Math.hypot(dx, dy);
  // parabola height — upward arc above the straight-line path
  const h = Math.min(dist * 0.45, 130);
  // tangent angle at time t: x velocity is constant (dx), y velocity is dy minus arc derivative
  const rotAt = t => Math.atan2(dy - h * 4 * (1 - 2 * t), dx) * (180 / Math.PI) + 90;
  return (
    <div
      className="ws-missile"
      style={{
        left: pos.fromX - 16,
        top: pos.fromY - 16,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--h':   `${h}px`,
        '--r0':  `${rotAt(0)}deg`,
        '--r50': `${rotAt(0.5)}deg`,
        '--r1':  `${rotAt(1)}deg`,
      }}
    >
      <span className="ws-missile-rocket">🚀</span>
    </div>
  );
}
