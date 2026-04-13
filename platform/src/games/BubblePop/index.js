import React, { useState, useCallback } from 'react';
import { speak } from '../../speak';
import './BubblePop.css';

const LEVELS = [
  {
    prompt: 'Pop ALL the letter A bubbles! 🅰️',
    say: 'Pop all the letter A bubbles!',
    isCorrect: b => b === 'A',
    bubbles: ['A','B','A','C','D','A','B','A','C','D','A','B'],
  },
  {
    prompt: 'Pop words that rhyme with CAT! 🐱',
    say: 'Pop words that rhyme with cat!',
    isCorrect: b => ['bat','hat','mat','rat','sat'].includes(b),
    bubbles: ['bat','dog','hat','sun','mat','pig','rat','cup','sat','log','hat','cow'],
  },
  {
    prompt: 'Pop all EVEN numbers! 🔢',
    say: 'Pop all even numbers!',
    isCorrect: b => Number(b) % 2 === 0,
    bubbles: ['2','3','4','5','6','7','8','9','10','11','12','13'],
  },
  {
    prompt: 'Pop 3-letter words! 🔤',
    say: 'Pop 3-letter words!',
    isCorrect: b => b.length === 3,
    bubbles: ['cat','jump','sun','elephant','hat','butterfly','car','rainbow','box','sky','dog','beautiful'],
  },
  {
    prompt: 'Pop words starting with B! 🐝',
    say: 'Pop words starting with B!',
    isCorrect: b => b.toLowerCase().startsWith('b'),
    bubbles: ['Ball','Cat','Bear','Sun','Bird','Hat','Book','Dog','Bee','Frog','Bus','Ant'],
  },
];

const BUBBLE_COLORS = [
  'linear-gradient(135deg, #42a5f5, #1565c0)',
  'linear-gradient(135deg, #ef5350, #b71c1c)',
  'linear-gradient(135deg, #66bb6a, #1b5e20)',
  'linear-gradient(135deg, #ffca28, #f57f17)',
  'linear-gradient(135deg, #ab47bc, #4a148c)',
  'linear-gradient(135deg, #26c6da, #006064)',
  'linear-gradient(135deg, #ff7043, #bf360c)',
];

function makeBubbles(bubbleTexts) {
  return bubbleTexts.map((text, i) => ({
    id: i,
    text,
    color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    delay: `${(i * 0.3) % 2}s`,
    duration: `${2 + (i % 3) * 0.5}s`,
    x: 4 + (i % 6) * 15 + (Math.floor(i / 6) * 7), // percent
    popped: false,
    wrong: false,
  }));
}

export default function BubblePop({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [bubbles, setBubbles]   = useState(() => makeBubbles(LEVELS[0].bubbles));
  const [stars, setStars]       = useState(0);
  const [done, setDone]         = useState(false);

  const level = LEVELS[levelIdx];

  const correctTotal = level.bubbles.filter(b => level.isCorrect(b)).length;
  const poppedCorrect = bubbles.filter(b => b.popped && level.isCorrect(b.text)).length;

  const handleBubbleTap = useCallback((id) => {
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble || bubble.popped || bubble.wrong) return prev;

      const isRight = level.isCorrect(bubble.text);

      if (isRight) {
        speak('Pop!', 'en');
        const updated = prev.map(b => b.id === id ? { ...b, popped: true } : b);

        // Check level complete
        const newPoppedCorrect = updated.filter(b => b.popped && level.isCorrect(b.text)).length;
        if (newPoppedCorrect >= correctTotal) {
          speak('Amazing! Level complete!', 'en');
          setTimeout(() => {
            setStars(s => s + 1);
            const next = levelIdx + 1;
            if (next >= LEVELS.length) {
              setDone(true);
            } else {
              setLevelIdx(next);
              setBubbles(makeBubbles(LEVELS[next].bubbles));
            }
          }, 800);
        }

        return updated;
      } else {
        // Wrong bubble — flash red, then clear
        speak('Oops!', 'en');
        const updated = prev.map(b => b.id === id ? { ...b, wrong: true } : b);
        setTimeout(() => {
          setBubbles(p => p.map(b => b.id === id ? { ...b, wrong: false } : b));
        }, 600);
        return updated;
      }
    });
  }, [level, levelIdx, correctTotal]);

  if (done) {
    return (
      <div className="bp-root">
        <div className="bp-done">
          <div className="bp-done-emoji">🎈🏆🎈</div>
          <h2>Bubble Champion! 🎉</h2>
          <p>You popped through all {LEVELS.length} levels!</p>
          <div>{'⭐'.repeat(stars)}</div>
          <button className="bp-btn bp-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="bp-btn bp-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = ((levelIdx * correctTotal + poppedCorrect) / (LEVELS.length * correctTotal)) * 100;

  return (
    <div className="bp-root">
      <div className="bp-header">
        <button className="bp-back" onClick={onExit}>←</button>
        <h1 className="bp-title">🫧 Bubble Pop</h1>
        <div className="bp-stars">{'⭐'.repeat(stars)}</div>
      </div>

      <div className="bp-progress">
        <div className="bp-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Prompt */}
      <div className="bp-prompt">{level.prompt}</div>

      {/* Score */}
      <div className="bp-score">
        {poppedCorrect} / {correctTotal} popped
      </div>

      {/* Bubble field */}
      <div className="bp-field">
        {bubbles.map(bubble => (
          !bubble.popped && (
            <button
              key={bubble.id}
              className={`bp-bubble ${bubble.wrong ? 'bp-bubble--wrong' : ''}`}
              style={{
                background: bubble.color,
                left: `${bubble.x}%`,
                animationDuration: bubble.duration,
                animationDelay: bubble.delay,
              }}
              onClick={() => handleBubbleTap(bubble.id)}
            >
              <span className="bp-bubble-text">{bubble.text}</span>
            </button>
          )
        ))}
      </div>

      {/* Hear instructions */}
      <button className="bp-hear" onClick={() => speak(level.say, 'en')}>🔊 Hear again</button>
    </div>
  );
}
