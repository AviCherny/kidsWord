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

function buildRound(level, selectedWords, lastTargetWord) {
  const { objectCount, distractors } = level;
  const available = lastTargetWord
    ? selectedWords.filter(w => w.word !== lastTargetWord)
    : selectedWords;
  const target = pickRandom(available.length > 0 ? available : selectedWords);
  const foils = shuffle(selectedWords.filter(w => w.word !== target.word)).slice(0, objectCount - 1);
  let objects = [target, ...foils];

  if (distractors && objects.length >= 3) {
    const distractor = pickRandom(DISTRACTOR_POOL);
    objects[objects.length - 1] = { ...distractor, word: null, isDistractor: true };
  }

  return { target, objects: shuffle(objects) };
}

export default function WordShooter({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [screen, setScreen] = useState('start');
  const [levelIndex, setLevelIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [stars, setStars] = useState(0);

  const [round, setRound] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [correct, setCorrect] = useState(null);
  const [laserAnim, setLaserAnim] = useState(null);
  const [glowIndex, setGlowIndex] = useState(null);
  const [explosionIndex, setExplosionIndex] = useState(null);
  const [distractorShake, setDistractorShake] = useState(false);

  const idleTimer = useRef(null);
  const heroRef = useRef(null);
  const objectRefs = useRef([]);
  const selectedWordsRef = useRef([]);
  const lastTargetRef = useRef(null);
  const level = LEVELS[levelIndex];

  const objLabel = (obj) => {
    if (obj.isDistractor) return lang === 'he' ? (obj.heLabel || obj.label) : obj.label;
    return lang === 'he' ? obj.heLabel : obj.label;
  };

  const objWord = (obj) => {
    if (obj.isDistractor) return null;
    return lang === 'he' ? obj.heWord : obj.word;
  };

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

    const spokenWord = lang === 'he' ? r.target.heWord : r.target.word;
    setTimeout(() => {
      speak(spokenWord, lang, () => {
        setPhase('waiting');
        const scheduleRepeat = () => {
          idleTimer.current = setTimeout(() => {
            speak(lang === 'he' ? r.target.heWord : r.target.word, lang, scheduleRepeat);
          }, 3000);
        };
        scheduleRepeat();
      });
    }, 500);
  }, [level, lang]);

  useEffect(() => {
    if (screen === 'game') {
      selectedWordsRef.current = pickLevelWords(level);
      lastTargetRef.current = null;
      startRound();
    }
    return () => clearTimeout(idleTimer.current);
  }, [screen, levelIndex]); // eslint-disable-line

  const handleTap = useCallback((obj, idx) => {
    if (phase !== 'waiting') return;
    if (obj.isDistractor) {
      setDistractorShake(true);
      setTimeout(() => setDistractorShake(false), 450);
      return;
    }
    clearTimeout(idleTimer.current);
    setPhase('shooting');

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
        const thisWord = lang === 'he' ? round.target.heWord : round.target.word;
        speak(thisWord, lang);
        setTimeout(() => {
          setExplosionIndex(null);
          setGlowIndex(null);
          startRound();
        }, 2200);
      }
    }, 450);
  }, [phase, round, stars, correctCount, level, levelIndex, lang, startRound, onSuccess]); // eslint-disable-line

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
      <button
        className="ws-btn-primary"
        onClick={() => { setStars(0); setLevelIndex(0); setCorrectCount(0); setScreen('start'); }}
      >
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
        <button className="ws-word-prompt" onClick={() => speak(targetWord, lang)}>
          {targetWord} 🔊
        </button>
      )}

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
            <span className="ws-obj-emoji">{obj.emoji}</span>
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

      {laserAnim && <Laser pos={laserAnim} />}
    </div>
  );
}

function Laser({ pos }) {
  const dx = pos.toX - pos.fromX;
  const dy = pos.toY - pos.fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <div
      className="ws-laser-wrap"
      style={{
        left: pos.fromX,
        top: pos.fromY,
        width: length,
        transform: `translate(0, -50%) rotate(${angle}deg)`,
      }}
    >
      <div className="ws-laser-beam" />
    </div>
  );
}
