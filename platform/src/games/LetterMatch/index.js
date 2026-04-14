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

const CONFETTI_EMOJIS = ['⭐','🌟','✨','🎉','🎊','💫'];

export default function LetterMatch({ onSuccess, onExit }) {
  const [roundIdx, setRoundIdx]     = useState(0);
  const [feedback, setFeedback]     = useState(null); // 'correct' | 'wrong'
  const [stars, setStars]           = useState(0);
  const [done, setDone]             = useState(false);
  const [wrongChoice, setWrongChoice] = useState(null);
  const [confetti, setConfetti]     = useState([]);
  const [mascotMood, setMascotMood] = useState('neutral');
  const [roundKey, setRoundKey]     = useState(0); // triggers re-animation each round

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

  function spawnConfetti() {
    const particles = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 340 - 170,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      delay: Math.random() * 0.35,
      size: 22 + Math.random() * 16,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 1600);
  }

  function handleChoice(choice) {
    if (feedback) return;
    if (choice === round.answer) {
      setFeedback('correct');
      setMascotMood('happy');
      setStars(s => s + 1);
      spawnConfetti();
      speak('Great job!', 'en', () => {
        setTimeout(() => {
          const next = roundIdx + 1;
          if (next >= ROUNDS.length) {
            setDone(true);
          } else {
            setRoundIdx(next);
            setFeedback(null);
            setWrongChoice(null);
            setMascotMood('neutral');
            setRoundKey(k => k + 1);
          }
        }, 300);
      });
    } else {
      setWrongChoice(choice);
      setFeedback('wrong');
      setMascotMood('sad');
      speak('Try again!', 'en', () => {
        setTimeout(() => {
          setWrongChoice(null);
          setFeedback(null);
          setMascotMood('neutral');
        }, 400);
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
      {/* Confetti layer */}
      <div className="lm-confetti-container">
        {confetti.map(p => (
          <div
            key={p.id}
            className="lm-confetti-star"
            style={{
              '--cx': `${p.x}px`,
              animationDelay: `${p.delay}s`,
              fontSize: `${p.size}px`,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      <div className="lm-header">
        <button className="lm-back" onClick={onExit}>←</button>
        <h1 className="lm-title">🔤 Letter Match</h1>
        <div className={`lm-mascot lm-mascot--${mascotMood}`}>
          {mascotMood === 'happy' ? '🤩' : mascotMood === 'sad' ? '😬' : '🐨'}
        </div>
      </div>

      <div className="lm-progress">
        <div className="lm-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="lm-phase-badge">
        {isPhase2 ? '🖼️ Find the Starting Letter' : '🔡 Match the Lowercase'}
      </div>

      {/* Main display — re-keyed each round to replay bounce-in */}
      <div key={`display-${roundKey}`} className="lm-display">
        <div className="lm-big-letter">{round.display}</div>
        <div className="lm-hint">{round.hint}</div>
      </div>

      <div className="lm-prompt">
        {isPhase2
          ? `Which letter does ${round.hint} start with?`
          : `Which one is the lowercase ${round.display}?`}
      </div>

      {/* Choices — re-keyed each round to replay bounce-in */}
      <div key={`choices-${roundKey}`} className="lm-choices">
        {round.choices.map((choice, i) => (
          <button
            key={i}
            className={[
              'lm-choice',
              feedback === 'correct' && choice === round.answer ? 'lm-choice--correct' : '',
              feedback === 'wrong'   && choice === round.answer ? 'lm-choice--reveal'  : '',
              wrongChoice === choice ? 'lm-choice--wrong' : '',
            ].join(' ')}
            style={{ animationDelay: `${i * 0.07}s` }}
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
