import React, { useState, useEffect, useCallback } from 'react';
import './NumberTrain.css';

// Generate a round: a number sequence with one gap
function buildRound(levelIdx) {
  const configs = [
    { start: 1,  step: 1,  len: 5,  gapIdx: 3  }, // 1 2 3 _ 5
    { start: 2,  step: 2,  len: 5,  gapIdx: 2  }, // 2 4 _ 8 10
    { start: 5,  step: 5,  len: 5,  gapIdx: 1  }, // 5 _ 15 20 25
    { start: 10, step: 10, len: 6,  gapIdx: 4  }, // 10 20 30 40 _ 60
    { start: 1,  step: 3,  len: 5,  gapIdx: 2  }, // 1 4 _ 10 13
    { start: 3,  step: 4,  len: 6,  gapIdx: 3  }, // 3 7 11 _ 19 23
    { start: 100,step: 10, len: 5,  gapIdx: 3  }, // 100 110 120 _ 140
    { start: 0,  step: 7,  len: 5,  gapIdx: 2  }, // 0 7 _ 21 28
  ];
  const cfg = configs[levelIdx % configs.length];
  const seq = Array.from({ length: cfg.len }, (_, i) => cfg.start + i * cfg.step);
  const answer = seq[cfg.gapIdx];

  // Wrong choices: answer ± small offsets that aren't in the sequence
  const wrongs = [];
  for (let d = 1; wrongs.length < 3; d++) {
    if (!seq.includes(answer + d))   wrongs.push(answer + d);
    if (!seq.includes(answer - d) && answer - d >= 0) wrongs.push(answer - d);
  }
  const choices = [answer, ...wrongs.slice(0, 2)].sort(() => Math.random() - 0.5);

  return { seq, gapIdx: cfg.gapIdx, answer, choices };
}

const WAGONS = ['🚂', '🚃', '🚃', '🚃', '🚃', '🚃'];

export default function NumberTrain({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [round, setRound]       = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [stars, setStars]       = useState(0);
  const [done, setDone]         = useState(false);
  const [shake, setShake]       = useState(false);

  const MAX_LEVELS = 8;

  const startRound = useCallback((idx) => {
    setRound(buildRound(idx));
    setFeedback(null);
  }, []);

  useEffect(() => { startRound(0); }, [startRound]);

  function handleChoice(choice) {
    if (feedback) return;
    if (choice === round.answer) {
      setFeedback('correct');
      setStars(s => s + 1);
      setTimeout(() => {
        const next = levelIdx + 1;
        if (next >= MAX_LEVELS) {
          setDone(true);
        } else {
          setLevelIdx(next);
          startRound(next);
        }
      }, 1000);
    } else {
      setFeedback('wrong');
      setShake(true);
      setTimeout(() => { setShake(false); setFeedback(null); }, 800);
    }
  }

  if (!round) return null;

  if (done) {
    return (
      <div className="nt-root">
        <div className="nt-done">
          <div className="nt-done-emoji">🚂✨</div>
          <h2>All Aboard! 🎉</h2>
          <p>You found all the missing numbers!</p>
          <div className="nt-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="nt-btn nt-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="nt-btn nt-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = (levelIdx / MAX_LEVELS) * 100;

  return (
    <div className="nt-root">
      {/* Sky decorations */}
      <div className="nt-cloud nt-cloud--1">☁️</div>
      <div className="nt-cloud nt-cloud--2">☁️</div>

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

      <p className="nt-prompt">Fill in the missing number!</p>

      {/* Train wagons */}
      <div className={`nt-train ${shake ? 'nt-shake' : ''}`}>
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
            {i < round.seq.length - 1 && <div className="nt-link">—</div>}
          </div>
        ))}
      </div>

      {/* Choices */}
      <div className="nt-choices">
        {round.choices.map((choice, i) => (
          <button
            key={i}
            className={`nt-choice ${feedback === 'correct' && choice === round.answer ? 'nt-choice--correct' : ''}`}
            onClick={() => handleChoice(choice)}
          >
            {choice}
          </button>
        ))}
      </div>

      {feedback === 'correct' && <div className="nt-feedback nt-feedback--good">🎉 Correct! Choo choo!</div>}
      {feedback === 'wrong'   && <div className="nt-feedback nt-feedback--bad">Not quite! Try again 💪</div>}
    </div>
  );
}
