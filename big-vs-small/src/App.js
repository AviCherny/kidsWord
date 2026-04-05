import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const PAIRS = [
  { left: { emoji: '🐘', name: 'Elephant' }, right: { emoji: '🐭', name: 'Mouse' }, bigger: 'left' },
  { left: { emoji: '🦒', name: 'Giraffe' }, right: { emoji: '🐕', name: 'Dog' }, bigger: 'left' },
  { left: { emoji: '🐄', name: 'Cow' }, right: { emoji: '🐱', name: 'Cat' }, bigger: 'left' },
  { left: { emoji: '🦁', name: 'Lion' }, right: { emoji: '🐇', name: 'Rabbit' }, bigger: 'left' },
  { left: { emoji: '🐊', name: 'Crocodile' }, right: { emoji: '🐸', name: 'Frog' }, bigger: 'left' },
  { left: { emoji: '🦓', name: 'Zebra' }, right: { emoji: '🐿', name: 'Squirrel' }, bigger: 'left' },
  { left: { emoji: '🐻', name: 'Bear' }, right: { emoji: '🐹', name: 'Hamster' }, bigger: 'left' },
  { left: { emoji: '🦅', name: 'Eagle' }, right: { emoji: '🐦', name: 'Bird' }, bigger: 'left' },
  { left: { emoji: '🐴', name: 'Horse' }, right: { emoji: '🐰', name: 'Bunny' }, bigger: 'left' },
  { left: { emoji: '🦏', name: 'Rhino' }, right: { emoji: '🐝', name: 'Bee' }, bigger: 'left' },
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

  const done = pairIndex >= PAIRS.length;
  const pair = PAIRS[Math.min(pairIndex, PAIRS.length - 1)];

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked) return;
    idleTimer.current = setTimeout(() => {
      setHighlight(pair.bigger);
    }, 3000);
  }, [locked, pair.bigger]);

  useEffect(() => {
    if (done) {
      speak('Amazing! You finished! Great job!');
      return;
    }
    speak('Who is bigger?');
    setWinner(null);
    setHighlight(null);
    setLocked(false);
  }, [pairIndex, done]);

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

  if (done) {
    return (
      <div className="game win-screen">
        <div className="win-emoji">🏆</div>
        <h1 className="win-title">Amazing!</h1>
        <p className="win-subtitle">You finished all the animals!</p>
        <div className="win-balloons">{'🎈'.repeat(Math.max(balloons, 1))}</div>
        <button className="play-again-btn" onClick={() => { setPairIndex(0); setStars(0); setBalloons(0); }}>
          Play Again
        </button>
      </div>
    );
  }

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
