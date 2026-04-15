import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
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
function buildRound(levelIdx) {
  const configs = [
    { start: 1,   step: 1,  len: 5, gapIdx: 3 },
    { start: 2,   step: 2,  len: 5, gapIdx: 2 },
    { start: 5,   step: 5,  len: 5, gapIdx: 1 },
    { start: 10,  step: 10, len: 6, gapIdx: 4 },
    { start: 1,   step: 3,  len: 5, gapIdx: 2 },
    { start: 3,   step: 4,  len: 6, gapIdx: 3 },
    { start: 100, step: 10, len: 5, gapIdx: 3 },
    { start: 0,   step: 7,  len: 5, gapIdx: 2 },
  ];
  const cfg    = configs[levelIdx % configs.length];
  const seq    = Array.from({ length: cfg.len }, (_, i) => cfg.start + i * cfg.step);
  const answer = seq[cfg.gapIdx];
  const wrongs = [];
  for (let d = 1; wrongs.length < 3; d++) {
    if (!seq.includes(answer + d)) wrongs.push(answer + d);
    if (!seq.includes(answer - d) && answer - d >= 0) wrongs.push(answer - d);
  }
  const choices = [answer, ...wrongs.slice(0, 2)].sort(() => Math.random() - 0.5);
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

// ─── SteamPuff ───────────────────────────────────────────────────────────────
function SteamPuff({ active }) {
  if (!active) return null;
  return (
    <div className="nt-steam-wrap" aria-hidden="true">
      {[0,1,2,3].map(i => (
        <div key={i} className="nt-steam-puff" style={{ animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
const MAX_LEVELS = 8;

export default function NumberTrain({ onSuccess, onExit }) {
  const { lang } = useLanguage();
  const s = S[lang] || S.en;

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

  const startRound = useCallback((idx) => {
    setRound(buildRound(idx));
    setFeedback(null);
    setShowConfetti(false);
    setShowSteam(false);
    setGapHint(false);
    clearTimeout(hintTimer.current);
    // Speak prompt after short delay
    setTimeout(() => speak(lang === 'he' ? 'מצא את המספר החסר' : 'Find the missing number!', lang), 200);
    // Gap hint wiggle after 4s of no answer
    hintTimer.current = setTimeout(() => setGapHint(true), 4000);
  }, [lang]);

  useEffect(() => { startRound(0); }, [startRound]);
  useEffect(() => () => clearTimeout(hintTimer.current), []);

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
              else { setLevelIdx(next); startRound(next); }
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

      <p className="nt-prompt">
        {feedback === 'wrong' ? s.promptWrong : s.prompt}
      </p>

      {/* Steam */}
      <SteamPuff active={showSteam} />

      {/* ── Train ── */}
      <div className={`nt-train-scene ${shake ? 'nt-shake' : ''} ${trainMoving ? 'nt-train--moving' : ''}`}>
        {/* Track rail behind wagons */}
        <div className="nt-inline-rail" />

        <div className="nt-wagons-row">
          {round.seq.map((num, i) => {
            const isGap   = i === round.gapIdx;
            const filled  = isGap && feedback === 'correct';
            const isLoco  = i === 0;

            return (
              <React.Fragment key={i}>
                <button
                  className={[
                    'nt-wagon',
                    isLoco  ? 'nt-wagon--loco'   : '',
                    isGap   ? 'nt-wagon--gap'     : '',
                    filled  ? 'nt-wagon--filled'  : '',
                    isGap && gapHint ? 'nt-wagon--hint' : '',
                    tappedWagon === i ? 'nt-wagon--tapped' : '',
                  ].join(' ')}
                  onClick={() => handleWagonTap(num, i, isGap)}
                  aria-label={isGap ? '?' : String(num)}
                >
                  <span className="nt-wagon-icon">{isLoco ? '🚂' : '🚃'}</span>
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
