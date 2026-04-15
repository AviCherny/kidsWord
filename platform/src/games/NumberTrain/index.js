import React, { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '../../speak';
import './NumberTrain.css';

function buildRound(levelIdx) {
  const configs = [
    { start: 1,  step: 1,  len: 5,  gapIdx: 3  },
    { start: 2,  step: 2,  len: 5,  gapIdx: 2  },
    { start: 5,  step: 5,  len: 5,  gapIdx: 1  },
    { start: 10, step: 10, len: 6,  gapIdx: 4  },
    { start: 1,  step: 3,  len: 5,  gapIdx: 2  },
    { start: 3,  step: 4,  len: 6,  gapIdx: 3  },
    { start: 100,step: 10, len: 5,  gapIdx: 3  },
    { start: 0,  step: 7,  len: 5,  gapIdx: 2  },
  ];
  const cfg = configs[levelIdx % configs.length];
  const seq = Array.from({ length: cfg.len }, (_, i) => cfg.start + i * cfg.step);
  const answer = seq[cfg.gapIdx];

  const wrongs = [];
  for (let d = 1; wrongs.length < 3; d++) {
    if (!seq.includes(answer + d))   wrongs.push(answer + d);
    if (!seq.includes(answer - d) && answer - d >= 0) wrongs.push(answer - d);
  }
  const choices = [answer, ...wrongs.slice(0, 2)].sort(() => Math.random() - 0.5);

  return { seq, gapIdx: cfg.gapIdx, answer, choices };
}

const CONFETTI_COLORS = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff922b','#cc5de8'];

function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 40 + Math.random() * 20,
      vx: (Math.random() - 0.5) * 260,
      vy: -(180 + Math.random() * 140),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 8 + Math.random() * 8,
      rot: Math.random() * 360,
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
            width: p.size,
            height: p.size,
            '--vx': `${p.vx}px`,
            '--vy': `${p.vy}px`,
            '--rot': `${p.rot}deg`,
            animationDelay: `${Math.random() * 80}ms`,
          }}
        />
      ))}
    </div>
  );
}

function SteamPuff({ active }) {
  if (!active) return null;
  return (
    <div className="nt-steam-wrap" aria-hidden="true">
      {[0,1,2].map(i => (
        <div key={i} className="nt-steam-puff" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

export default function NumberTrain({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx]   = useState(0);
  const [round, setRound]         = useState(null);
  const [feedback, setFeedback]   = useState(null); // null | 'correct' | 'wrong'
  const [stars, setStars]         = useState(0);
  const [done, setDone]           = useState(false);
  const [shake, setShake]         = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSteam, setShowSteam]       = useState(false);
  const [trainMoving, setTrainMoving]   = useState(false);

  const MAX_LEVELS = 8;

  const startRound = useCallback((idx) => {
    setRound(buildRound(idx));
    setFeedback(null);
    setShowConfetti(false);
    setShowSteam(false);
    speak('Find the missing number!', 'en');
  }, []);

  useEffect(() => { startRound(0); }, [startRound]);

  function handleChoice(choice) {
    if (feedback) return;
    if (choice === round.answer) {
      setFeedback('correct');
      setStars(s => s + 1);
      setShowConfetti(true);
      setShowSteam(true);
      setTrainMoving(true);
      speak(`${choice}! Correct! Choo choo!`, 'en', () => {
        setTimeout(() => {
          setShowConfetti(false);
          setShowSteam(false);
          setTrainMoving(false);
          const next = levelIdx + 1;
          if (next >= MAX_LEVELS) {
            setDone(true);
          } else {
            setLevelIdx(next);
            startRound(next);
          }
        }, 900);
      });
    } else {
      setFeedback('wrong');
      setShake(true);
      speak('Try again!', 'en', () => {
        setTimeout(() => { setShake(false); setFeedback(null); }, 400);
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
          <h2>All Aboard! 🎉</h2>
          <p>You found all the missing numbers!</p>
          <div className="nt-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="nt-btn nt-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="nt-btn nt-btn--ghost" onClick={onExit}>Back</button>
        </div>
        <div className="nt-landscape">
          <div className="nt-hills" />
          <div className="nt-track" />
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
        <h1 className="nt-title">🚂 Number Train</h1>
        <div className="nt-star-count">{'⭐'.repeat(stars)}</div>
      </div>

      {/* Progress */}
      <div className="nt-progress">
        <div className="nt-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <p className="nt-prompt">
        {feedback === 'wrong' ? '🤔 Not quite! Try again 💪' : '🔍 Find the missing number!'}
      </p>

      {/* Steam from locomotive */}
      <SteamPuff active={showSteam} />

      {/* Train wagons */}
      <div className={`nt-train ${shake ? 'nt-shake' : ''} ${trainMoving ? 'nt-train--moving' : ''}`}>
        {round.seq.map((num, i) => (
          <div key={i} className="nt-wagon-wrap">
            <div className={`nt-wagon ${i === round.gapIdx ? 'nt-wagon--gap' : ''} ${
              i === round.gapIdx && feedback === 'correct' ? 'nt-wagon--filled' : ''
            }`}>
              <span className="nt-wagon-emoji">{i === 0 ? '🚂' : '🚃'}</span>
              <span className="nt-wagon-num">
                {i === round.gapIdx
                  ? (feedback === 'correct' ? num : '?')
                  : num}
              </span>
            </div>
            {i < round.seq.length - 1 && <div className="nt-link">🔗</div>}
          </div>
        ))}
      </div>

      {/* Choices */}
      <p className="nt-choices-label">Pick the missing number:</p>
      <div className="nt-choices">
        {round.choices.map((choice, i) => (
          <button
            key={i}
            className={`nt-choice ${
              feedback === 'correct' && choice === round.answer ? 'nt-choice--correct' : ''
            } ${feedback === 'wrong' ? 'nt-choice--dim' : ''}`}
            onClick={() => handleChoice(choice)}
            disabled={!!feedback}
          >
            <span className="nt-choice-num">{choice}</span>
          </button>
        ))}
      </div>

      {/* Confetti */}
      <Confetti active={showConfetti} />

      {/* Landscape at bottom */}
      <div className="nt-landscape">
        <div className="nt-hills" />
        <div className="nt-track">
          <div className="nt-track-ties" />
        </div>
      </div>
    </div>
  );
}
