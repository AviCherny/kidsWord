import React, { useState, useEffect, useCallback } from 'react';
import { speak } from '../../speak';
import './LetterMatch.css';

// Phase 1: uppercase → lowercase, Phase 2: picture → starting letter
const ROUNDS = [
  { type: 'ul', display: 'A', hint: '🍎 Apple',  answer: 'a', choices: ['a','b','c','d'] },
  { type: 'ul', display: 'B', hint: '🐝 Bee',    answer: 'b', choices: ['a','b','c','d'] },
  { type: 'ul', display: 'C', hint: '🐱 Cat',    answer: 'c', choices: ['b','c','d','e'] },
  { type: 'ul', display: 'D', hint: '🐶 Dog',    answer: 'd', choices: ['b','c','d','e'] },
  { type: 'ul', display: 'E', hint: '🥚 Egg',    answer: 'e', choices: ['d','e','f','g'] },
  { type: 'ul', display: 'F', hint: '🐸 Frog',   answer: 'f', choices: ['d','e','f','g'] },
  { type: 'ul', display: 'G', hint: '🍇 Grapes', answer: 'g', choices: ['f','g','h','i'] },
  { type: 'ul', display: 'H', hint: '🎩 Hat',    answer: 'h', choices: ['f','g','h','i'] },
  // Phase 2: picture → starting letter
  { type: 'pl', display: '🦁', hint: 'Lion',    answer: 'L', choices: ['K','L','M','N'] },
  { type: 'pl', display: '🌙', hint: 'Moon',    answer: 'M', choices: ['K','L','M','N'] },
  { type: 'pl', display: '🐙', hint: 'Octopus', answer: 'O', choices: ['N','O','P','Q'] },
  { type: 'pl', display: '⭐', hint: 'Star',    answer: 'S', choices: ['Q','R','S','T'] },
];

export default function LetterMatch({ onSuccess, onExit }) {
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [stars, setStars]       = useState(0);
  const [done, setDone]         = useState(false);
  const [shake, setShake]       = useState(false);

  const round = ROUNDS[roundIdx];

  const askQuestion = useCallback((idx) => {
    const r = ROUNDS[idx];
    if (r.type === 'ul') {
      speak(`Find the lowercase letter ${r.display}. ${r.hint}`, 'en');
    } else {
      speak(`What letter does ${r.hint} start with?`, 'en');
    }
  }, []);

  useEffect(() => { askQuestion(roundIdx); }, [roundIdx, askQuestion]);

  function handleChoice(choice) {
    if (feedback) return;
    if (choice === round.answer) {
      setFeedback('correct');
      setStars(s => s + 1);
      speak('Great job!', 'en', () => {
        setTimeout(() => {
          const next = roundIdx + 1;
          if (next >= ROUNDS.length) { setDone(true); }
          else { setRoundIdx(next); setFeedback(null); }
        }, 300);
      });
    } else {
      setFeedback('wrong');
      setShake(true);
      speak('Try again!', 'en', () => {
        setTimeout(() => { setShake(false); setFeedback(null); }, 400);
      });
    }
  }

  if (done) {
    return (
      <div className="lm-root">
        <div className="lm-done">
          <div className="lm-done-emoji">🌟🔤🌟</div>
          <h2>Letters Expert! 🎉</h2>
          <p>You matched all the letters!</p>
          <div className="lm-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="lm-btn lm-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="lm-btn lm-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = (roundIdx / ROUNDS.length) * 100;
  const isPhase2 = round.type === 'pl';

  return (
    <div className="lm-root">
      <div className="lm-header">
        <button className="lm-back" onClick={onExit}>←</button>
        <h1 className="lm-title">🔤 Letter Match</h1>
        <div className="lm-stars">{'⭐'.repeat(stars)}</div>
      </div>

      <div className="lm-progress">
        <div className="lm-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="lm-phase-badge">
        {isPhase2 ? '🖼️ Find the Starting Letter' : '🔡 Match the Lowercase'}
      </div>

      {/* Main display */}
      <div className={`lm-display ${shake ? 'lm-shake' : ''}`}>
        <div className="lm-big-letter">{round.display}</div>
        <div className="lm-hint">{round.hint}</div>
      </div>

      <div className="lm-prompt">
        {isPhase2
          ? `Which letter does ${round.hint} start with?`
          : `Which one is the lowercase ${round.display}?`}
      </div>

      {/* Choices */}
      <div className="lm-choices">
        {round.choices.map((choice, i) => (
          <button
            key={i}
            className={[
              'lm-choice',
              feedback === 'correct' && choice === round.answer ? 'lm-choice--correct' : '',
              feedback === 'wrong'   && choice === round.answer ? 'lm-choice--reveal'  : '',
            ].join(' ')}
            onClick={() => handleChoice(choice)}
          >
            {choice}
          </button>
        ))}
      </div>

      <button className="lm-replay" onClick={() => askQuestion(roundIdx)}>🔊 Hear Again</button>

      {feedback === 'correct' && <div className="lm-feedback lm-feedback--good">✅ Correct!</div>}
      {feedback === 'wrong'   && <div className="lm-feedback lm-feedback--bad">Try again! 💪</div>}
    </div>
  );
}
