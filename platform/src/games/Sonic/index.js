import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Sonic.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

// Help Sonic collect the RIGHT ring!
const ROUNDS = [
  { prompt: { en: 'Which is a color?',       he: 'מה זה צבע?' },       correct: 'RED',     options: ['RED',   'CAT',   'RUN',   'JUMP'] },
  { prompt: { en: 'Which is an animal?',     he: 'מה זה חיה?' },       correct: 'DOG',     options: ['DOG',   'BIG',   'FAST',  'RING'] },
  { prompt: { en: 'Which is a number?',      he: 'מה זה מספר?' },      correct: 'THREE',   options: ['THREE', 'BLUE',  'SPIN',  'SHOE'] },
  { prompt: { en: 'Which is a fruit?',       he: 'מה זה פרי?' },       correct: 'APPLE',   options: ['APPLE', 'CHAIR', 'SPEED', 'GOLD'] },
  { prompt: { en: 'Which is a vehicle?',     he: 'מה זה רכב?' },       correct: 'CAR',     options: ['CAR',   'HAPPY', 'RING',  'COLD'] },
  { prompt: { en: 'Which animal can fly?',   he: 'איזה חיה עפה?' },    correct: 'BIRD',    options: ['BIRD',  'FISH',  'CAT',   'DOG'] },
  { prompt: { en: 'Which is a shape?',       he: 'מה זה צורה?' },      correct: 'CIRCLE',  options: ['CIRCLE','FAST',  'ZOOM',  'STAR'] },
  { prompt: { en: 'Which is a body part?',   he: 'מה זה חלק בגוף?' },  correct: 'HAND',    options: ['HAND',  'TREE',  'RINGS', 'DASH'] },
  { prompt: { en: "Sonic's favorite thing?", he: 'מה סוניק אוהב?' },   correct: 'RINGS',   options: ['RINGS', 'SLOW',  'WALK',  'NAPS'] },
  { prompt: { en: 'Which is fast?',          he: 'מה מהיר?' },         correct: 'CHEETAH', options: ['CHEETAH','TABLE','CHAIR','CLOUD'] },
];

const RING_TIME = 4500;

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
  const [sonicState, setSonicState] = useState('run'); // 'run' | 'jump' | 'hit'
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const soundOnRef = useRef(true);

  const done = roundIdx >= ROUNDS.length;
  const round = ROUNDS[Math.min(roundIdx, ROUNDS.length - 1)];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  const advance = useCallback((gotIt) => {
    clearInterval(timerRef.current);
    if (gotIt) {
      setSonicState('jump');
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      if (soundOnRef.current) speak(lang === 'he' ? 'יופי!' : 'Got it!', lang);
    } else {
      setSonicState('hit');
      if (soundOnRef.current) speak(lang === 'he' ? 'נסה שוב!' : 'Try again!', lang);
    }
    setTimeout(() => {
      setSonicState('run');
      setRoundIdx(i => i + 1);
      setSelected(null);
      setLocked(false);
      setMissed(false);
      setTimeLeft(RING_TIME);
      startRef.current = Date.now();
    }, 950);
  }, [stars, lang]);

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
        <div className="sonic-win-rings">💍💍💍</div>
        <h1 className="sonic-win-title">{lang === 'he' ? 'מהיר כסוניק! 🦔' : 'Fast as Sonic! 🦔'}</h1>
        <p className="sonic-win-sub">{lang === 'he' ? 'איספת את כל הטבעות!' : 'You collected all the rings!'}</p>
        <div className="sonic-win-stars">
          {Array.from({ length: ROUNDS.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="sonic-collect-btn" onClick={onSuccess}>
          {lang === 'he' ? 'קבל מדבקה! 🌟' : 'Collect Sticker! 🌟'}
        </button>
        <button className="sonic-play-again" onClick={() => {
          setRoundIdx(0); setStars(0); setBalloons(0);
          setSelected(null); setLocked(false); setMissed(false);
          setTimeLeft(RING_TIME); startRef.current = Date.now();
          setSonicState('run');
        }}>
          {lang === 'he' ? 'שחק שוב' : 'Play Again'}
        </button>
        <button className="sonic-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  const boostPct = (timeLeft / RING_TIME) * 100;

  return (
    <div className="sonic-game" dir={dir}>
      {/* Sky speed lines */}
      <div className="sonic-speed-lines" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="sonic-speed-line" style={{ top: `${10 + i * 14}%`, animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>

      {/* HUD */}
      <header className="sonic-hud">
        <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        <div className="sonic-boost-wrap" title="Boost!">
          <div
            className="sonic-boost-fill"
            style={{ width: `${boostPct}%`, background: boostPct > 40 ? 'linear-gradient(90deg,#FFD700,#FFA500)' : boostPct > 20 ? 'linear-gradient(90deg,#FFA500,#ff6600)' : 'linear-gradient(90deg,#ff4444,#cc0000)' }}
          />
        </div>
        <button className="sonic-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
      </header>

      {/* Question */}
      <div className="sonic-question-area">
        <p className="sonic-collect-cue">
          {lang === 'he' ? '🔔 איסוף הטבעת הנכונה!' : '🔔 Collect the right ring!'}
        </p>
        <h2 className="sonic-prompt">{lang === 'he' ? round.prompt.he : round.prompt.en}</h2>
      </div>

      {/* Ring options */}
      <div className="sonic-rings-grid">
        {options[roundIdx].map((opt, i) => {
          const isCorrect = selected === opt && opt === round.correct;
          const isWrong   = selected === opt && opt !== round.correct;
          return (
            <button
              key={opt}
              className={[
                'sonic-ring-btn',
                isCorrect ? 'sonic-ring-correct' : '',
                isWrong   ? 'sonic-ring-wrong'   : '',
                missed && !selected ? 'sonic-ring-missed' : '',
              ].join(' ')}
              style={{ animationDelay: `${i * 0.2}s` }}
              onClick={() => handlePick(opt)}
              aria-label={opt}
            >
              <span className="sonic-ring-shine" aria-hidden="true" />
              <span className="sonic-ring-text">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Sonic character */}
      <div className="sonic-ground-zone" aria-hidden="true">
        <div className="sonic-hills" />
        <div className={`sonic-char sonic-char-${sonicState}`}>🦔</div>
      </div>
    </div>
  );
}
