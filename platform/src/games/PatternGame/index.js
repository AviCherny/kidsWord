import React, { useState, useEffect, useCallback } from 'react';
import { speak } from '../../speak';
import './PatternGame.css';

const SHAPES = ['⭐', '🔴', '🔵', '🟡', '🟢', '🟠', '💜', '🔶', '🔷', '🌸'];
const ANIMALS = ['🐶', '🐱', '🐸', '🐻', '🦊', '🐨', '🐯', '🐰', '🐼', '🦁'];
const FRUITS  = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🍉', '🍑', '🥝', '🍒'];

const LEVELS = [
  // Level 1 — 2-element repeat, length 4+?
  { length: 5, patternLen: 2, pool: SHAPES,  missingIdx: 4, label: 'Easy' },
  { length: 6, patternLen: 2, pool: ANIMALS, missingIdx: 5, label: 'Easy' },
  { length: 6, patternLen: 3, pool: FRUITS,  missingIdx: 5, label: 'Medium' },
  { length: 7, patternLen: 2, pool: SHAPES,  missingIdx: 4, label: 'Medium' },
  { length: 7, patternLen: 3, pool: ANIMALS, missingIdx: 6, label: 'Hard' },
  { length: 8, patternLen: 4, pool: FRUITS,  missingIdx: 7, label: 'Hard' },
  { length: 8, patternLen: 3, pool: SHAPES,  missingIdx: 5, label: 'Expert' },
];

function buildRound(levelCfg) {
  const { length, patternLen, pool, missingIdx } = levelCfg;

  // Pick pattern elements (no duplicates within pattern)
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const pattern  = shuffled.slice(0, patternLen);

  // Build full sequence
  const sequence = Array.from({ length }, (_, i) => pattern[i % patternLen]);
  const answer   = sequence[missingIdx];

  // Build distractors (wrong choices from pool)
  const distractors = pool
    .filter(e => e !== answer)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const choices = [...distractors, answer].sort(() => Math.random() - 0.5);

  return { sequence, missingIdx, answer, choices };
}

export default function PatternGame({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx]   = useState(0);
  const [round, setRound]         = useState(null);
  const [feedback, setFeedback]   = useState(null); // 'correct' | 'wrong'
  const [stars, setStars]         = useState(0);
  const [done, setDone]           = useState(false);
  const [shake, setShake]         = useState(false);

  const startRound = useCallback((idx) => {
    setRound(buildRound(LEVELS[idx]));
    setFeedback(null);
    speak('What comes next?', 'en');
  }, []);

  useEffect(() => { startRound(0); }, [startRound]);

  function handleChoice(choice) {
    if (feedback) return;
    if (choice === round.answer) {
      setFeedback('correct');
      setStars(s => s + 1);
      speak('Great job!', 'en', () => {
        setTimeout(() => {
          const next = levelIdx + 1;
          if (next >= LEVELS.length) {
            setDone(true);
          } else {
            setLevelIdx(next);
            startRound(next);
          }
        }, 300);
      });
    } else {
      setFeedback('wrong');
      setShake(true);
      speak('Try again!', 'en', () => {
        setTimeout(() => { setShake(false); setFeedback(null); }, 300);
      });
    }
  }

  if (!round) return null;

  if (done) {
    return (
      <div className="pg-root">
        <div className="pg-done">
          <div className="pg-done-stars">{'⭐'.repeat(stars)}</div>
          <h2>Amazing! 🎉</h2>
          <p>You finished all patterns!</p>
          <button className="pg-btn pg-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="pg-btn pg-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const level = LEVELS[levelIdx];
  const progress = ((levelIdx) / LEVELS.length) * 100;

  return (
    <div className="pg-root">
      {/* Header */}
      <div className="pg-header">
        <button className="pg-back" onClick={onExit}>←</button>
        <div className="pg-title-wrap">
          <span className="pg-title">Pattern Finder</span>
          <span className="pg-badge">{level.label}</span>
        </div>
        <div className="pg-stars-count">{'⭐'.repeat(stars)}</div>
      </div>

      {/* Progress */}
      <div className="pg-progress">
        <div className="pg-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Prompt */}
      <div className="pg-prompt">What comes next?</div>

      {/* Sequence */}
      <div className={`pg-sequence ${shake ? 'pg-shake' : ''}`}>
        {round.sequence.map((emoji, i) => (
          <div
            key={i}
            className={`pg-tile ${i === round.missingIdx ? 'pg-tile--missing' : ''} ${
              i === round.missingIdx && feedback === 'correct' ? 'pg-tile--filled' : ''
            }`}
          >
            {i === round.missingIdx
              ? feedback === 'correct' ? round.answer : '?'
              : emoji}
          </div>
        ))}
      </div>

      {/* Choices */}
      <div className="pg-choices">
        {round.choices.map((choice, i) => (
          <button
            key={i}
            className={`pg-choice ${
              feedback === 'correct' && choice === round.answer ? 'pg-choice--correct' : ''
            } ${feedback === 'wrong' && choice === round.answer ? 'pg-choice--reveal' : ''}`}
            onClick={() => handleChoice(choice)}
          >
            {choice}
          </button>
        ))}
      </div>

      {feedback === 'correct' && (
        <div className="pg-feedback pg-feedback--correct">✅ Great job!</div>
      )}
      {feedback === 'wrong' && (
        <div className="pg-feedback pg-feedback--wrong">Try again! 💪</div>
      )}
    </div>
  );
}
