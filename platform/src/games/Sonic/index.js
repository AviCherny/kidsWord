import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Sonic.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

// Tap the correct answer before the ring disappears — gotta go fast!
const ROUNDS = [
  { prompt: { en: 'Which is a color?',      he: 'מה זה צבע?' },      correct: 'RED',     options: ['RED',   'CAT',   'RUN',   'JUMP'] },
  { prompt: { en: 'Which is an animal?',    he: 'מה זה חיה?' },      correct: 'DOG',     options: ['DOG',   'BIG',   'FAST',  'RING'] },
  { prompt: { en: 'Which is a number?',     he: 'מה זה מספר?' },     correct: 'THREE',   options: ['THREE', 'BLUE',  'SPIN',  'SHOE'] },
  { prompt: { en: 'Which is a fruit?',      he: 'מה זה פרי?' },      correct: 'APPLE',   options: ['APPLE', 'CHAIR', 'SPEED', 'GOLD'] },
  { prompt: { en: 'Which is a vehicle?',    he: 'מה זה רכב?' },      correct: 'CAR',     options: ['CAR',   'HAPPY', 'RING',  'COLD'] },
  { prompt: { en: 'Which animal can fly?',  he: 'איזה חיה עפה?' },   correct: 'BIRD',    options: ['BIRD',  'FISH',  'CAT',   'DOG'] },
  { prompt: { en: 'Which is a shape?',      he: 'מה זה צורה?' },     correct: 'CIRCLE',  options: ['CIRCLE','FAST',  'ZOOM',  'STAR'] },
  { prompt: { en: 'Which is a body part?',  he: 'מה זה חלק בגוף?' }, correct: 'HAND',    options: ['HAND',  'TREE',  'RINGS', 'DASH'] },
  { prompt: { en: 'Sonic\'s favorite thing?', he: 'מה סוניק אוהב?' }, correct: 'RINGS',  options: ['RINGS', 'SLOW',  'WALK',  'NAPS'] },
  { prompt: { en: 'Which is fast?',         he: 'מה מהיר?' },        correct: 'CHEETAH', options: ['CHEETAH','TABLE','CHAIR','CLOUD'] },
];

const RING_TIME = 4000; // ms to answer before ring vanishes

function shuffleOptions(options) {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function Sonic({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [roundIdx, setRoundIdx] = useState(0);
  const [options] = useState(() => ROUNDS.map(r => shuffleOptions(r.options)));
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(RING_TIME);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [missed, setMissed] = useState(false);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const soundOnRef = useRef(true);

  const done = roundIdx >= ROUNDS.length;
  const round = ROUNDS[Math.min(roundIdx, ROUNDS.length - 1)];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  const advance = useCallback((gotIt) => {
    clearInterval(timerRef.current);
    if (gotIt) {
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      if (soundOnRef.current) speak(lang === 'he' ? 'מהיר!' : 'Sonic speed!', lang);
    } else {
      if (soundOnRef.current) speak(lang === 'he' ? 'נסה שוב!' : 'Try again!', lang);
    }
    setTimeout(() => {
      setRoundIdx(i => i + 1);
      setSelected(null);
      setLocked(false);
      setMissed(false);
      setTimeLeft(RING_TIME);
      startRef.current = Date.now();
    }, 900);
  }, [stars, lang]);

  // Countdown timer
  useEffect(() => {
    if (done || locked) return;
    startRef.current = Date.now();
    setTimeLeft(RING_TIME);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, RING_TIME - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        setMissed(true);
        setLocked(true);
        advance(false);
      }
    }, 50);
    return () => clearInterval(timerRef.current);
    // advance is intentionally excluded — it's re-created each render but we only want the timer reset on round/done change
    // eslint-disable-next-line
  }, [roundIdx, done]);

  const handlePick = useCallback((opt) => {
    if (locked) return;
    setLocked(true);
    setSelected(opt);
    advance(opt === round.correct);
  }, [locked, round, advance]);

  if (done) {
    return (
      <div className="sonic-game sonic-win" dir={dir}>
        <div className="sonic-win-top">💨🏆💨</div>
        <h1 className="sonic-win-title">{lang === 'he' ? 'מהיר כסוניק!' : 'Fast as Sonic!'}</h1>
        <p className="sonic-win-sub">{lang === 'he' ? 'ענית על כל השאלות!' : 'You answered all rounds!'}</p>
        <div className="sonic-win-stars">
          {Array.from({ length: ROUNDS.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="sonic-collect-btn" onClick={onSuccess}>
          {lang === 'he' ? 'קבל מדבקה! 🌟' : 'Collect Sticker! 🌟'}
        </button>
        <button className="sonic-play-again" onClick={() => { setRoundIdx(0); setStars(0); setBalloons(0); setSelected(null); setLocked(false); setMissed(false); setTimeLeft(RING_TIME); startRef.current = Date.now(); }}>
          {lang === 'he' ? 'שחק שוב' : 'Play Again'}
        </button>
        <button className="sonic-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  const ringPct = (timeLeft / RING_TIME) * 100;
  const circumference = 2 * Math.PI * 22;
  const dashOffset = circumference * (1 - ringPct / 100);

  return (
    <div className="sonic-game" dir={dir}>
      <header className="sonic-hud">
        <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        <button className="sonic-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
      </header>

      <div className="sonic-speed-lines" aria-hidden="true">
        {[...Array(6)].map((_, i) => <div key={i} className="sonic-speed-line" style={{ top: `${15 + i * 12}%`, animationDelay: `${i * 0.15}s` }} />)}
      </div>

      <div className="sonic-ring-wrap">
        <svg className="sonic-ring-svg" viewBox="0 0 50 50">
          <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,215,0,0.2)" strokeWidth="4" />
          <circle
            cx="25" cy="25" r="22"
            fill="none"
            stroke={ringPct > 40 ? '#FFD700' : ringPct > 20 ? '#FFA500' : '#ff4444'}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 25 25)"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="sonic-ring-icon">💍</div>
      </div>

      <div className="sonic-prompt-card">
        <h2 className="sonic-prompt">{lang === 'he' ? round.prompt.he : round.prompt.en}</h2>
        <p className="sonic-speed-label">{lang === 'he' ? 'מהר! לפני שהטבעת נעלמת! 💨' : 'Quick! Before the ring vanishes! 💨'}</p>
      </div>

      <div className={`sonic-options${missed ? ' sonic-missed' : ''}`}>
        {options[roundIdx].map(opt => {
          const isCorrect = selected === opt && opt === round.correct;
          const isWrong = selected === opt && opt !== round.correct;
          return (
            <button
              key={opt}
              className={`sonic-opt-btn${isCorrect ? ' sonic-correct' : ''}${isWrong ? ' sonic-wrong' : ''}`}
              onClick={() => handlePick(opt)}
              aria-label={opt}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
