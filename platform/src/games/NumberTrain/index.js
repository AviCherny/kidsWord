import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import { getGameDifficulty, saveGameDifficulty } from '../../lib/settings';
import './NumberTrain.css';

// ─── Strings ────────────────────────────────────────────────────────────────
const S = {
  he: {
    prompt:      'מצא את המספר החסר!',
    promptWrong: 'לא מדויק! נסה שוב 💪',
    pickLabel:   'בחר מספר:',
    correct:     (n) => `${n}! כל הכבוד!`,
    doneTitle:   'כל הכבוד! 🎉',
    doneBody:    'מצאת את כל המספרים החסרים!',
    sticker:     'קבל מדבקה 🌟',
    back:        'חזור',
    tapHint:     'לחץ על קרון לשמוע מספר',
    difficulty:  'רמת קושי',
    difficultyNames: ['קל', 'בינוני', 'מתקדם', 'קשה'],
  },
  en: {
    prompt:      'Find the missing number!',
    promptWrong: 'Not quite! Try again 💪',
    pickLabel:   'Pick the missing number:',
    correct:     (n) => `${n}! Correct!`,
    doneTitle:   'All Aboard! 🎉',
    doneBody:    'You found all the missing numbers!',
    sticker:     'Collect Sticker 🌟',
    back:        'Back',
    tapHint:     'Tap a wagon to hear its number',
    difficulty:  'Difficulty',
    difficultyNames: ['Easy', 'Medium', 'Advanced', 'Hard'],
  },
};

// ─── Audio ───────────────────────────────────────────────────────────────────
function getAudioCtx() {
  if (!window._ntAudioCtx) {
    window._ntAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return window._ntAudioCtx;
}

function playTrainWhistle() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    // Steam train whistle: two harmonics with slight vibrato
    const t = ctx.currentTime;
    [[480, 0.18], [640, 0.12], [960, 0.06]].forEach(([freq, vol]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const vibr = ctx.createOscillator();
      const vibrGain = ctx.createGain();
      vibr.frequency.value = 6;
      vibrGain.gain.value  = 8;
      vibr.connect(vibrGain);
      vibrGain.connect(osc.frequency);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * 0.8, t);
      osc.frequency.linearRampToValueAtTime(freq, t + 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.08);
      gain.gain.setValueAtTime(vol, t + 0.5);
      gain.gain.linearRampToValueAtTime(0, t + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      vibr.start(t); vibr.stop(t + 0.9);
      osc.start(t);  osc.stop(t + 0.9);
    });
  } catch (e) { /* silent fail */ }
}

function playClickTick() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(400, t + 0.06);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.06);
  } catch (e) {}
}

function playWrongBuzz() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    [[0, 180], [0.12, 160], [0.24, 140]].forEach(([delay, freq]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t + delay);
      gain.gain.linearRampToValueAtTime(0, t + delay + 0.10);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + delay); osc.stop(t + delay + 0.10);
    });
  } catch (e) {}
}

// ─── Round builder ───────────────────────────────────────────────────────────
const DIFFICULTY_PRESETS = [
  [
    { start: 1, step: 1, len: 4, gapIdx: 1, choiceCount: 2 },
    { start: 1, step: 1, len: 5, gapIdx: 2, choiceCount: 2 },
    { start: 2, step: 1, len: 5, gapIdx: 3, choiceCount: 2 },
    { start: 3, step: 1, len: 5, gapIdx: 1, choiceCount: 3 },
    { start: 1, step: 2, len: 4, gapIdx: 2, choiceCount: 3 },
    { start: 2, step: 2, len: 5, gapIdx: 1, choiceCount: 3 },
    { start: 4, step: 2, len: 5, gapIdx: 3, choiceCount: 3 },
    { start: 5, step: 2, len: 6, gapIdx: 2, choiceCount: 3 },
  ],
  [
    { start: 1, step: 2, len: 5, gapIdx: 2, choiceCount: 3 },
    { start: 2, step: 2, len: 6, gapIdx: 3, choiceCount: 3 },
    { start: 5, step: 5, len: 4, gapIdx: 1, choiceCount: 3 },
    { start: 10, step: 5, len: 5, gapIdx: 3, choiceCount: 3 },
    { start: 3, step: 3, len: 5, gapIdx: 2, choiceCount: 3 },
    { start: 6, step: 3, len: 6, gapIdx: 4, choiceCount: 4 },
    { start: 10, step: 10, len: 5, gapIdx: 2, choiceCount: 4 },
    { start: 15, step: 10, len: 5, gapIdx: 3, choiceCount: 4 },
  ],
  [
    { start: 1, step: 3, len: 5, gapIdx: 2, choiceCount: 4 },
    { start: 3, step: 4, len: 6, gapIdx: 3, choiceCount: 4 },
    { start: 5, step: 5, len: 6, gapIdx: 4, choiceCount: 4 },
    { start: 12, step: 6, len: 5, gapIdx: 1, choiceCount: 4 },
    { start: 20, step: 10, len: 5, gapIdx: 2, choiceCount: 4 },
    { start: 35, step: 5, len: 6, gapIdx: 4, choiceCount: 4 },
    { start: 50, step: 10, len: 6, gapIdx: 3, choiceCount: 4 },
    { start: 100, step: 10, len: 5, gapIdx: 3, choiceCount: 4 },
  ],
  [
    { start: 0, step: 7, len: 5, gapIdx: 2, choiceCount: 4 },
    { start: 4, step: 6, len: 6, gapIdx: 4, choiceCount: 4 },
    { start: 8, step: 8, len: 5, gapIdx: 1, choiceCount: 4 },
    { start: 12, step: 12, len: 5, gapIdx: 3, choiceCount: 4 },
    { start: 25, step: 15, len: 5, gapIdx: 2, choiceCount: 4 },
    { start: 40, step: 20, len: 6, gapIdx: 4, choiceCount: 4 },
    { start: 90, step: 25, len: 5, gapIdx: 1, choiceCount: 4 },
    { start: 120, step: 30, len: 6, gapIdx: 3, choiceCount: 4 },
  ],
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildRound(levelIdx, difficulty) {
  const presets = DIFFICULTY_PRESETS[difficulty - 1] || DIFFICULTY_PRESETS[0];
  const cfg = presets[levelIdx % presets.length];
  const seq    = Array.from({ length: cfg.len }, (_, i) => cfg.start + i * cfg.step);
  const answer = seq[cfg.gapIdx];
  const wrongs = [];
  for (let d = 1; wrongs.length < Math.max(5, cfg.choiceCount + 1); d++) {
    const plus = answer + (d * cfg.step);
    const minus = answer - (d * cfg.step);
    if (!seq.includes(plus)) wrongs.push(plus);
    if (!seq.includes(minus) && minus >= 0) wrongs.push(minus);
  }
  const choices = shuffle([answer, ...wrongs.slice(0, cfg.choiceCount - 1)]);
  return { seq, gapIdx: cfg.gapIdx, answer, choices };
}

// ─── Confetti ────────────────────────────────────────────────────────────────
const CONF_COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8','#ff4081'];

function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x:   38 + Math.random() * 24,
      vx:  (Math.random() - 0.5) * 320,
      vy:  -(160 + Math.random() * 160),
      color: CONF_COLORS[i % CONF_COLORS.length],
      size:  7 + Math.random() * 9,
      rot:   Math.random() * 360,
      shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '0% 50%',
    }))
  );
  if (!active) return null;
  return (
    <div className="nt-confetti-root" aria-hidden="true">
      {pieces.current.map(p => (
        <div
          key={p.id}
          className="nt-confetti-piece"
          style={{
            left: `${p.x}%`,
            background: p.color,
            width: p.size, height: p.size,
            borderRadius: p.shape,
            '--vx': `${p.vx}px`,
            '--vy': `${p.vy}px`,
            '--rot': `${p.rot}deg`,
            animationDelay: `${Math.random() * 100}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Locomotive ──────────────────────────────────────────────────────────────
function Locomotive({ moving, showSteam }) {
  return (
    <div className={`nt-locomotive${moving ? ' nt-locomotive--moving' : ''}`} aria-hidden="true">
      {showSteam && (
        <div className="nt-loco-steam">
          {[0,1,2,3].map(i => (
            <div key={i} className="nt-steam-puff" style={{ animationDelay: `${i * 110}ms` }} />
          ))}
        </div>
      )}
      <svg viewBox="0 0 140 90" width="116" height="75" xmlns="http://www.w3.org/2000/svg">
        {/* Chimney */}
        <rect x="18" y="7" width="13" height="23" rx="3" fill="#37474f"/>
        <rect x="13" y="7" width="23" height="6" rx="3" fill="#546e7a"/>

        {/* Boiler */}
        <rect x="10" y="28" width="88" height="32" rx="10" fill="#e65100"/>
        <rect x="14" y="30" width="80" height="12" rx="8" fill="rgba(255,255,255,0.13)"/>

        {/* Steam dome */}
        <ellipse cx="48" cy="28" rx="12" ry="6.5" fill="#ef6c00"/>
        <ellipse cx="48" cy="26" rx="8" ry="3" fill="rgba(255,255,255,0.18)"/>

        {/* Headlight */}
        <circle cx="10" cy="44" r="6.5" fill="#ffd54f"/>
        <circle cx="10" cy="44" r="3.5" fill="#fffde7"/>

        {/* Cab body */}
        <rect x="90" y="14" width="40" height="46" rx="4" fill="#c62828"/>
        {/* Cab roof */}
        <rect x="86" y="12" width="46" height="8" rx="3" fill="#b71c1c"/>
        {/* Cab highlight */}
        <rect x="92" y="14" width="38" height="6" rx="3" fill="rgba(255,255,255,0.1)"/>
        {/* Cab windows */}
        <rect x="94" y="22" width="13" height="15" rx="3" fill="#b3e5fc" fillOpacity="0.9"/>
        <rect x="113" y="22" width="12" height="15" rx="3" fill="#b3e5fc" fillOpacity="0.9"/>

        {/* Chassis */}
        <rect x="8" y="58" width="124" height="7" rx="2" fill="#455a64"/>
        <rect x="8" y="58" width="124" height="3" rx="2" fill="rgba(255,255,255,0.1)"/>

        {/* Big drive wheels */}
        {[34, 68].map((cx, wi) => (
          <g key={wi}>
            <circle cx={cx} cy={72} r="15" fill="#212121" stroke="#37474f" strokeWidth="2.5"/>
            <circle cx={cx} cy={72} r="6" fill="#37474f"/>
            <circle cx={cx} cy={72} r="2.2" fill="#90a4ae"/>
            <line x1={cx} y1={57} x2={cx} y2={87} stroke="#455a64" strokeWidth="1.5"/>
            <line x1={cx-15} y1={72} x2={cx+15} y2={72} stroke="#455a64" strokeWidth="1.5"/>
            <line x1={cx-10.6} y1={61.4} x2={cx+10.6} y2={82.6} stroke="#455a64" strokeWidth="1.5"/>
            <line x1={cx+10.6} y1={61.4} x2={cx-10.6} y2={82.6} stroke="#455a64" strokeWidth="1.5"/>
          </g>
        ))}

        {/* Small trailing wheel (under cab) */}
        <circle cx="110" cy="75" r="10" fill="#212121" stroke="#37474f" strokeWidth="2"/>
        <circle cx="110" cy="75" r="4" fill="#37474f"/>
        <circle cx="110" cy="75" r="1.5" fill="#90a4ae"/>

        {/* Connecting rod */}
        <rect x="32" y="70" width="38" height="4" rx="2" fill="#607d8b"/>

        {/* Cowcatcher */}
        <polygon points="10,59 0,78 10,73" fill="#607d8b"/>
        <line x1="1" y1="70" x2="10" y2="61" stroke="#546e7a" strokeWidth="1.2"/>
        <line x1="1" y1="76" x2="10" y2="67" stroke="#546e7a" strokeWidth="1.2"/>
      </svg>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
const MAX_LEVELS = 8;
const GAME_ID = 'numbertrain';

export default function NumberTrain({ onSuccess, onExit }) {
  const { lang } = useLanguage();
  const s = S[lang] || S.en;

  const [difficulty,  setDifficulty]   = useState(() => getGameDifficulty(GAME_ID, 1));
  const [levelIdx,     setLevelIdx]     = useState(0);
  const [round,        setRound]        = useState(null);
  const [feedback,     setFeedback]     = useState(null); // null | 'correct' | 'wrong'
  const [stars,        setStars]        = useState(0);
  const [done,         setDone]         = useState(false);
  const [shake,        setShake]        = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSteam,    setShowSteam]    = useState(false);
  const [trainMoving,  setTrainMoving]  = useState(false);
  const [tappedWagon,  setTappedWagon]  = useState(null); // index of flashing wagon
  const [gapHint,      setGapHint]      = useState(false);
  const hintTimer = useRef(null);

  const resetGame = useCallback((nextDifficulty) => {
    setLevelIdx(0);
    setRound(buildRound(0, nextDifficulty));
    setStars(0);
    setDone(false);
    setFeedback(null);
    setShake(false);
    setShowConfetti(false);
    setShowSteam(false);
    setTrainMoving(false);
    setTappedWagon(null);
    setGapHint(false);
    clearTimeout(hintTimer.current);
    setTimeout(() => speak(lang === 'he' ? 'מצא את המספר החסר' : 'Find the missing number!', lang), 200);
    hintTimer.current = setTimeout(() => setGapHint(true), 4000);
  }, [lang]);

  const startRound = useCallback((idx, nextDifficulty = difficulty) => {
    setRound(buildRound(idx, nextDifficulty));
    setFeedback(null);
    setShowConfetti(false);
    setShowSteam(false);
    setTrainMoving(false);
    setTappedWagon(null);
    setGapHint(false);
    clearTimeout(hintTimer.current);
    setTimeout(() => speak(lang === 'he' ? 'מצא את המספר החסר' : 'Find the missing number!', lang), 200);
    hintTimer.current = setTimeout(() => setGapHint(true), 4000);
  }, [difficulty, lang]);

  useEffect(() => { resetGame(difficulty); }, [difficulty, resetGame]);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

  function handleDifficultyChange(nextDifficulty) {
    if (nextDifficulty === difficulty) return;
    const saved = saveGameDifficulty(GAME_ID, nextDifficulty);
    setDifficulty(saved);
  }

  function handleWagonTap(num, idx, isGap) {
    if (isGap) {
      // Tap gap → wiggle hint + speak "?"
      setGapHint(true);
      setTimeout(() => setGapHint(false), 600);
      return;
    }
    playClickTick();
    setTappedWagon(idx);
    speak(String(num), lang);
    setTimeout(() => setTappedWagon(null), 400);
  }

  function handleChoice(choice) {
    if (feedback) return;
    clearTimeout(hintTimer.current);
    setGapHint(false);
    playClickTick();

    if (choice === round.answer) {
      setFeedback('correct');
      setStars(s => s + 1);
      setShowSteam(true);
      setTrainMoving(true);
      // Whistle first, then TTS
      playTrainWhistle();
      setTimeout(() => {
        speak(s.correct(choice), lang, () => {
          setTimeout(() => {
            setShowConfetti(true);
            setTimeout(() => {
              setShowConfetti(false);
              setShowSteam(false);
              setTrainMoving(false);
              const next = levelIdx + 1;
              if (next >= MAX_LEVELS) { setDone(true); }
              else { setLevelIdx(next); startRound(next, difficulty); }
            }, 1200);
          }, 100);
        });
      }, 400);
    } else {
      setFeedback('wrong');
      setShake(true);
      playWrongBuzz();
      speak(lang === 'he' ? 'נסה שוב' : 'Try again!', lang, () => {
        setTimeout(() => {
          setShake(false);
          setFeedback(null);
          hintTimer.current = setTimeout(() => setGapHint(true), 4000);
        }, 400);
      });
    }
  }

  if (!round) return null;

  if (done) {
    return (
      <div className="nt-root">
        <Confetti active />
        <div className="nt-sky-decor">
          <div className="nt-sun">☀️</div>
          <div className="nt-cloud nt-cloud--1">☁️</div>
          <div className="nt-cloud nt-cloud--2">☁️</div>
          <div className="nt-cloud nt-cloud--3">⛅</div>
        </div>
        <div className="nt-done">
          <div className="nt-done-emoji">🚂✨</div>
          <h2>{s.doneTitle}</h2>
          <p>{s.doneBody}</p>
          <div className="nt-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="nt-btn nt-btn--primary" onClick={onSuccess}>{s.sticker}</button>
          <button className="nt-btn nt-btn--ghost" onClick={onExit}>{s.back}</button>
        </div>
        <div className="nt-landscape">
          <div className="nt-hills" />
          <div className="nt-track"><div className="nt-track-ties" /></div>
        </div>
      </div>
    );
  }

  const progress = (levelIdx / MAX_LEVELS) * 100;

  return (
    <div className="nt-root">
      {/* Sky */}
      <div className="nt-sky-decor">
        <div className="nt-sun">☀️</div>
        <div className="nt-cloud nt-cloud--1">☁️</div>
        <div className="nt-cloud nt-cloud--2">☁️</div>
        <div className="nt-cloud nt-cloud--3">⛅</div>
        <div className="nt-bird nt-bird--1">🐦</div>
        <div className="nt-bird nt-bird--2">🐦</div>
      </div>

      {/* Header */}
      <div className="nt-header">
        <button className="nt-back" onClick={onExit}>←</button>
        <h1 className="nt-title">🚂 {lang === 'he' ? 'רכבת המספרים' : 'Number Train'}</h1>
        <div className="nt-star-count">{'⭐'.repeat(stars)}</div>
      </div>

      {/* Progress */}
      <div className="nt-progress">
        <div className="nt-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="nt-difficulty" role="group" aria-label={s.difficulty}>
        <span className="nt-difficulty-label">{s.difficulty}</span>
        <div className="nt-difficulty-pills">
          {[1, 2, 3, 4].map((value) => (
            <button
              key={value}
              className={`nt-difficulty-pill${value === difficulty ? ' active' : ''}`}
              onClick={() => handleDifficultyChange(value)}
              aria-pressed={value === difficulty}
              type="button"
            >
              <span className="nt-difficulty-pill-num">{value}</span>
              <span className="nt-difficulty-pill-text">{s.difficultyNames[value - 1]}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="nt-prompt">
        {feedback === 'wrong' ? s.promptWrong : s.prompt}
      </p>

      {/* ── Train ── */}
      <div className={`nt-train-scene ${shake ? 'nt-shake' : ''} ${trainMoving ? 'nt-train--moving' : ''}`}>
        {/* Track rail behind wagons */}
        <div className="nt-inline-rail" />

        <div className="nt-wagons-row">
          <Locomotive moving={trainMoving} showSteam={showSteam} />
          <div className="nt-coupler" />

          {round.seq.map((num, i) => {
            const isGap  = i === round.gapIdx;
            const filled = isGap && feedback === 'correct';

            return (
              <React.Fragment key={i}>
                <button
                  className={[
                    'nt-wagon',
                    isGap   ? 'nt-wagon--gap'     : '',
                    filled  ? 'nt-wagon--filled'  : '',
                    isGap && gapHint ? 'nt-wagon--hint' : '',
                    tappedWagon === i ? 'nt-wagon--tapped' : '',
                  ].join(' ')}
                  onClick={() => handleWagonTap(num, i, isGap)}
                  aria-label={isGap ? '?' : String(num)}
                >
                  <span className="nt-wagon-num">
                    {isGap ? (filled ? num : '?') : num}
                  </span>
                  <div className="nt-wagon-wheels">
                    <div className="nt-wheel" />
                    <div className="nt-wheel" />
                  </div>
                </button>
                {i < round.seq.length - 1 && (
                  <div className="nt-coupler" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Choices */}
      <p className="nt-choices-label">{s.pickLabel}</p>
      <div className="nt-choices">
        {round.choices.map((choice, i) => (
          <button
            key={i}
            className={[
              'nt-choice',
              feedback === 'correct' && choice === round.answer ? 'nt-choice--correct' : '',
              feedback === 'wrong'   ? 'nt-choice--dim'          : '',
            ].join(' ')}
            onClick={() => handleChoice(choice)}
            disabled={!!feedback}
          >
            <span className="nt-choice-num">{choice}</span>
          </button>
        ))}
      </div>

      <Confetti active={showConfetti} />

      {/* Landscape */}
      <div className="nt-landscape">
        <div className="nt-hills" />
        <div className="nt-track"><div className="nt-track-ties" /></div>
      </div>
    </div>
  );
}
