import React, { useState, useEffect, useRef, useCallback } from 'react';
import './WordShooter.css';
import { LEVELS, DISTRACTOR_POOL } from './levels';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';

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

function pickLevelWords(level) {
  return shuffle([...level.wordPool]).slice(0, level.wordsPerGame);
}

// Accepts a pre-chosen target so the caller controls the deck
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

// CSS animation class per word — simulates GIF-like motion
const EMOJI_ANIM = {
  Bat:  'ws-anim-bat',
  Box:  'ws-anim-box',
  Cap:  'ws-anim-cap',
  Bird: 'ws-anim-bat', // reuse wing-flap
};

export default function WordShooter({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [screen, setScreen] = useState('start');
  const [levelIndex, setLevelIndex] = useState(0);
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
  // EN toggle: forces English labels regardless of app language
  const [showEnglish, setShowEnglish] = useState(false);

  const idleTimer = useRef(null);
  const heroRef = useRef(null);
  const objectRefs = useRef([]);
  const selectedWordsRef = useRef([]);
  const lastTargetRef = useRef(null);
  const wordDeckRef = useRef([]); // deck shuffle — each word plays once before repeating
  const level = LEVELS[levelIndex];

  const objLabel = (obj) => {
    if (obj.isDistractor) return showEnglish ? obj.label : (lang === 'he' ? (obj.heLabel || obj.label) : obj.label);
    return showEnglish ? obj.label : (lang === 'he' ? obj.heLabel : obj.label);
  };

  // Pick next target from the deck, avoiding immediate repeats
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

    // Use heSpeech if available (corrected TTS pronunciation), else heWord
    const spokenWord = lang === 'he' ? (target.heSpeech || target.heWord) : target.word;
    setTimeout(() => {
      speak(spokenWord, lang, () => {
        setPhase('waiting');
        const scheduleRepeat = () => {
          idleTimer.current = setTimeout(() => {
            speak(lang === 'he' ? (r.target.heSpeech || r.target.heWord) : r.target.word, lang, scheduleRepeat);
          }, 3000);
        };
        scheduleRepeat();
      });
    }, 500);
  }, [level, lang, pickFromDeck]);

  useEffect(() => {
    if (screen === 'game') {
      selectedWordsRef.current = pickLevelWords(level);
      lastTargetRef.current = null;
      wordDeckRef.current = [];
      startRound();
    }
    return () => clearTimeout(idleTimer.current);
  }, [screen, levelIndex]); // eslint-disable-line

  const handleTap = useCallback((obj, idx) => {
    // Retry phase: child taps the glowing correct answer — launch missile then next round
    if (phase === 'retry') {
      if (obj.isDistractor || obj.word !== round.target.word) return;
      setPhase('shooting');
      launchMissile(idx);
      setGlowIndex(null);
      setShowSidekick(false);
      setTimeout(() => {
        setMissileAnim(null);
        startRound();
      }, 1100);
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
            if (levelIndex < LEVELS.length - 1) {
              setScreen('levelup');
            } else {
              setScreen('end');
              onSuccess();
            }
          } else {
            startRound();
          }
        }, 1200);
      } else {
        const correctIdx = round.objects.findIndex(o => o.word === round.target.word);
        setGlowIndex(correctIdx);
        const thisWord = lang === 'he' ? (round.target.heSpeech || round.target.heWord) : round.target.word;
        speak(thisWord, lang);
        setShowSidekick(true);
        setTimeout(() => {
          setExplosionIndex(null);
          setPhase('retry');
        }, 700);
      }
    }, 1100);
  }, [phase, round, stars, correctCount, level, levelIndex, lang, startRound, launchMissile, onSuccess]); // eslint-disable-line

  const goNextLevel = () => { setLevelIndex(l => l + 1); setCorrectCount(0); setScreen('game'); };
  const replayLevel = () => { setCorrectCount(0); setScreen('game'); };

  const floatClass =
    level?.floatSpeed === 0 ? '' :
    level?.floatSpeed === 1 ? 'ws-float-slow' : 'ws-float-fast';

  const progress = level ? Math.min(correctCount / level.targetCorrect, 1) : 0;

  if (screen === 'start') return (
    <div className="ws-screen ws-start" dir={dir}>
      <div className="ws-game-title">{t(lang, 'wordShooterTitle').replace('\\n', '\n')}</div>
      <div className="ws-hero-icon ws-hero-idle">🦸</div>
      <button className="ws-btn-primary" onClick={() => setScreen('game')}>{t(lang, 'play')}</button>
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
      <button className="ws-btn-primary" onClick={() => { setStars(0); setLevelIndex(0); setCorrectCount(0); setScreen('start'); }}>
        {t(lang, 'playAgain')}
      </button>
      <button className="ws-exit-link" onClick={onExit}>←</button>
    </div>
  );

  const targetWord = round ? (lang === 'he' ? round.target.heWord : round.target.word) : '';

  return (
    <div className="ws-screen ws-game" dir={dir}>
      <div className="ws-hud">
        <span className="ws-hud-stars">🌟 {stars}</span>
        <div className="ws-progress-bar-wrap">
          <div className="ws-progress-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <span className="ws-hud-level">{t(lang, level?.nameKey)}</span>
        <button className="ws-exit-small" onClick={onExit}>✕</button>
      </div>

      {round && (
        <button className="ws-word-prompt" onClick={() => speak(lang === 'he' ? (round.target.heSpeech || round.target.heWord) : round.target.word, lang)}>
          {targetWord} 🔊
        </button>
      )}

      {/* EN label toggle — forces English labels regardless of app language */}
      <button
        className={`ws-lang-toggle ${showEnglish ? 'active' : ''}`}
        onClick={() => setShowEnglish(v => !v)}
        aria-label="Toggle English labels"
      >
        EN
      </button>

      <div className="ws-objects-area">
        {round?.objects.map((obj, i) => (
          <div
            key={`${round.target.word}-${i}`}
            ref={el => objectRefs.current[i] = el}
            className={[
              'ws-obj-card',
              floatClass,
              obj.isDistractor ? 'ws-obj-distractor' : '',
              obj.isDistractor && distractorShake ? 'ws-obj-distractor-shake' : '',
              glowIndex === i ? 'ws-obj-glow' : '',
              explosionIndex === i && correct === true  ? 'ws-obj-explode-correct' : '',
              explosionIndex === i && correct === false ? 'ws-obj-explode-wrong'   : '',
            ].join(' ')}
            style={{ animationDelay: `${i * 0.35}s` }}
            onClick={() => handleTap(obj, i)}
          >
            <span className={`ws-obj-emoji ${EMOJI_ANIM[obj.word] || ''}`}>{obj.emoji}</span>
            <span className="ws-obj-label">{objLabel(obj)}</span>
          </div>
        ))}
      </div>

      <div className="ws-hero-area">
        <div ref={heroRef} className={`ws-hero-wrap${phase === 'shooting' ? ' ws-hero-shooting' : ' ws-hero-idle-anim'}`}>
          <span className="ws-hero-emoji">🦸</span>
          {phase === 'shooting' && <span className="ws-chest-burst">✨</span>}
        </div>
      </div>

      {missileAnim && <Missile pos={missileAnim} />}
      {showSidekick && round && (
        <Sidekick
          word={lang === 'he' ? round.target.heWord : round.target.word}
          lang={lang}
        />
      )}
    </div>
  );
}

function Sidekick({ word, lang }) {
  const findIt = lang === 'he' ? '!מצא את' : 'Find it!';
  const tapIt  = lang === 'he' ? '👆 !לחץ'  : '👆 Tap!';
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

function Missile({ pos }) {
  const dx = pos.toX - pos.fromX;
  const dy = pos.toY - pos.fromY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  return (
    <div
      className="ws-missile"
      style={{
        left: pos.fromX - 18,
        top: pos.fromY - 18,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--rot': `${angle}deg`,
      }}
    >
      <span>🚀</span>
      <span className="ws-missile-flame">🔥</span>
    </div>
  );
}
