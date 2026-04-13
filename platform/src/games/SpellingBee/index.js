import React, { useState, useEffect, useCallback } from 'react';
import { speak } from '../../speak';
import './SpellingBee.css';

const WORDS = [
  // Easy (3-4 letters)
  { word: 'cat',       wrong: ['kat',         'cet'],         level: 'Easy'   },
  { word: 'dog',       wrong: ['bog',         'dag'],         level: 'Easy'   },
  { word: 'sun',       wrong: ['san',         'sin'],         level: 'Easy'   },
  { word: 'hat',       wrong: ['hit',         'hap'],         level: 'Easy'   },
  // Medium (4-5 letters)
  { word: 'cake',      wrong: ['caek',        'cak'],         level: 'Medium' },
  { word: 'frog',      wrong: ['frogg',       'flug'],        level: 'Medium' },
  { word: 'jump',      wrong: ['jamp',        'jupm'],        level: 'Medium' },
  { word: 'bird',      wrong: ['brid',        'birrd'],       level: 'Medium' },
  // Hard (5-6 letters)
  { word: 'smile',     wrong: ['smail',       'smiel'],       level: 'Hard'   },
  { word: 'beach',     wrong: ['beech',       'beatch'],      level: 'Hard'   },
  { word: 'cloud',     wrong: ['claud',       'cloued'],      level: 'Hard'   },
  // Expert (7+ letters)
  { word: 'elephant',  wrong: ['elefant',     'elephent'],    level: 'Expert' },
  { word: 'butterfly', wrong: ['butterflye',  'buttefly'],    level: 'Expert' },
  { word: 'rainbow',   wrong: ['ranbow',      'rainbo'],      level: 'Expert' },
];

const LEVEL_COLORS = {
  Easy:   { bg: '#e8f5e9', text: '#2e7d32', bar: '#66bb6a' },
  Medium: { bg: '#fff8e1', text: '#f57f17', bar: '#ffb300' },
  Hard:   { bg: '#fce4ec', text: '#c62828', bar: '#ef5350' },
  Expert: { bg: '#ede7f6', text: '#4527a0', bar: '#7c4dff' },
};

function buildChoices(w) {
  return [w.word, ...w.wrong].sort(() => Math.random() - 0.5);
}

export default function SpellingBee({ onSuccess, onExit }) {
  const [wordIdx, setWordIdx]   = useState(0);
  const [choices, setChoices]   = useState(() => buildChoices(WORDS[0]));
  const [feedback, setFeedback] = useState(null);
  const [stars, setStars]       = useState(0);
  const [done, setDone]         = useState(false);
  const [shake, setShake]       = useState(false);
  const [beeHop, setBeeHop]     = useState(false);

  const current = WORDS[wordIdx];
  const colors  = LEVEL_COLORS[current.level];

  const sayWord = useCallback((word) => {
    setBeeHop(true);
    setTimeout(() => setBeeHop(false), 700);
    speak(word, 'en');
  }, []);

  useEffect(() => {
    setChoices(buildChoices(WORDS[wordIdx]));
    // slight delay so the new round is visible before speaking
    const t = setTimeout(() => sayWord(WORDS[wordIdx].word), 400);
    return () => clearTimeout(t);
  }, [wordIdx, sayWord]);

  function handleChoice(choice) {
    if (feedback) return;
    if (choice === current.word) {
      setFeedback('correct');
      setStars(s => s + 1);
      speak(`${current.word}! Correct!`, 'en', () => {
        setTimeout(() => {
          const next = wordIdx + 1;
          if (next >= WORDS.length) { setDone(true); }
          else { setWordIdx(next); setFeedback(null); }
        }, 400);
      });
    } else {
      setFeedback('wrong');
      setShake(true);
      speak(`Try again! The word is ${current.word}`, 'en', () => {
        setTimeout(() => { setShake(false); setFeedback(null); }, 400);
      });
    }
  }

  if (done) {
    return (
      <div className="sb-root">
        <div className="sb-done">
          <div className="sb-done-bees">🐝🏆🐝</div>
          <h2>Spelling Champion! 🎉</h2>
          <p>You spelled all {WORDS.length} words!</p>
          <div className="sb-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="sb-btn sb-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="sb-btn sb-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = (wordIdx / WORDS.length) * 100;

  return (
    <div className="sb-root" style={{ background: `linear-gradient(160deg, ${colors.bg} 0%, white 100%)` }}>
      <div className="sb-header">
        <button className="sb-back" onClick={onExit}>←</button>
        <h1 className="sb-title">🐝 Spelling Bee</h1>
        <div className="sb-stars">{'⭐'.repeat(stars)}</div>
      </div>

      <div className="sb-progress">
        <div className="sb-progress-fill" style={{ width: `${progress}%`, background: colors.bar }} />
      </div>

      <div className="sb-level-badge" style={{ background: colors.bar, color: 'white' }}>
        {current.level} — Word {wordIdx + 1} of {WORDS.length}
      </div>

      {/* Bee animation + tap to hear */}
      <button className={`sb-bee-btn ${beeHop ? 'sb-bee-hop' : ''}`} onClick={() => sayWord(current.word)}>
        <span className="sb-bee-emoji">🐝</span>
        <span className="sb-bee-label">Tap to hear!</span>
      </button>

      <div className="sb-prompt">Which spelling is correct?</div>

      {/* Spelling choices */}
      <div className={`sb-choices ${shake ? 'sb-shake' : ''}`}>
        {choices.map((choice, i) => (
          <button
            key={i}
            className={[
              'sb-choice',
              feedback === 'correct' && choice === current.word ? 'sb-choice--correct' : '',
              feedback === 'wrong'   && choice === current.word ? 'sb-choice--reveal'  : '',
            ].join(' ')}
            onClick={() => handleChoice(choice)}
          >
            {choice}
          </button>
        ))}
      </div>

      {feedback === 'correct' && <div className="sb-feedback sb-feedback--good">🐝 Correct! Buzzz!</div>}
      {feedback === 'wrong'   && <div className="sb-feedback sb-feedback--bad">Not quite! Try again 🍯</div>}
    </div>
  );
}
