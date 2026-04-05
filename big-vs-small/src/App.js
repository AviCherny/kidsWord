import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const PAIRS = [
  { left: { emoji: '🐘', name: 'Elephant' }, right: { emoji: '🐭', name: 'Mouse' }, bigger: 'left' },
  { left: { emoji: '🦒', name: 'Giraffe' }, right: { emoji: '🐕', name: 'Dog' }, bigger: 'left' },
  { left: { emoji: '🐄', name: 'Cow' }, right: { emoji: '🐱', name: 'Cat' }, bigger: 'left' },
];

function speak(text) {
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
}

export default function App() {
  const [pairIndex, setPairIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [locked, setLocked] = useState(false);
  const idleTimer = useRef(null);

  const pair = PAIRS[pairIndex % PAIRS.length];

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked) return;
    idleTimer.current = setTimeout(() => {
      setHighlight(pair.bigger);
    }, 3000);
  }, [locked, pair.bigger]);

  useEffect(() => {
    speak('Who is bigger?');
    setWinner(null);
    setHighlight(null);
    setLocked(false);
  }, [pairIndex]);

  useEffect(() => {
    resetIdle();
    return () => clearTimeout(idleTimer.current);
  }, [resetIdle, pairIndex]);

  function handleTap(side) {
    if (locked) return;
    clearTimeout(idleTimer.current);
    setLocked(true);

    if (side === pair.bigger) {
      setWinner(side);
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      speak('Correct!');
      setTimeout(() => {
        setPairIndex(i => i + 1);
      }, 1500);
    } else {
      setHighlight(pair.bigger);
      speak('This one is bigger');
      setTimeout(() => {
        setHighlight(null);
        setLocked(false);
      }, 2000);
    }
  }

  const starsInRow = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  return (
    <div className="game">
      <header className="hud">
        <div className="star-row">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`star-pip ${i < starsInRow ? 'filled' : ''}`}>⭐</span>
          ))}
        </div>
        {balloons > 0 && (
          <div className="balloon-row">
            {'🎈'.repeat(balloons)}
          </div>
        )}
      </header>

      <h1 className="prompt">Who is bigger?</h1>

      <div className="arena">
        {['left', 'right'].map(side => {
          const animal = side === 'left' ? pair.left : pair.right;
          const isWinner = winner === side;
          const isHighlighted = highlight === side;
          return (
            <button
              key={side}
              className={`animal-btn${isWinner ? ' grow' : ''}${isHighlighted ? ' pulse' : ''}`}
              onClick={() => handleTap(side)}
              aria-label={animal.name}
            >
              <span className="animal-emoji">{animal.emoji}</span>
              <span className="animal-name">{animal.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
