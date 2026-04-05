import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { Capacitor } from '@capacitor/core';

const PAIRS = [
  { big: { emoji: '🐘', name: 'Elephant' }, small: { emoji: '🐭', name: 'Mouse' } },
  { big: { emoji: '🦒', name: 'Giraffe' }, small: { emoji: '🐕', name: 'Dog' } },
  { big: { emoji: '🐄', name: 'Cow' }, small: { emoji: '🐱', name: 'Cat' } },
  { big: { emoji: '🦁', name: 'Lion' }, small: { emoji: '🐇', name: 'Rabbit' } },
  { big: { emoji: '🐊', name: 'Crocodile' }, small: { emoji: '🐸', name: 'Frog' } },
  { big: { emoji: '🦓', name: 'Zebra' }, small: { emoji: '🐿', name: 'Squirrel' } },
  { big: { emoji: '🐻', name: 'Bear' }, small: { emoji: '🐹', name: 'Hamster' } },
  { big: { emoji: '🦅', name: 'Eagle' }, small: { emoji: '🐦', name: 'Bird' } },
  { big: { emoji: '🐴', name: 'Horse' }, small: { emoji: '🐰', name: 'Bunny' } },
  { big: { emoji: '🦏', name: 'Rhino' }, small: { emoji: '🐝', name: 'Bee' } },
];

const isAndroid = Capacitor.getPlatform() === 'android';

function speak(text, enabled) {
  if (!enabled) return;
  if (!window.speechSynthesis) return;
  // Cancel any ongoing speech — wrapped because it throws on some Android WebViews
  try { window.speechSynthesis.cancel(); } catch (e) {}
  // On Android, cancel() is async; a small delay prevents silent failures
  const delay = isAndroid ? 60 : 0;
  setTimeout(() => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.85;
      u.lang = 'en-US'; // Required for Samsung TTS to select a voice
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }, delay);
}

// Call once from a user-gesture to unlock Android WebView's TTS engine
function unlockTTS() {
  if (!window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

function randomSides() {
  return PAIRS.map(() => (Math.random() < 0.5 ? 'left' : 'right'));
}

export default function App() {
  const [pairIndex, setPairIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false); // ref so useEffect always reads current value
  const [sides] = useState(randomSides);
  const idleTimer = useRef(null);

  const done = pairIndex >= PAIRS.length;
  const safeIndex = Math.min(pairIndex, PAIRS.length - 1);
  const pairData = PAIRS[safeIndex];
  const bigSide = sides[safeIndex];
  const left = bigSide === 'left' ? pairData.big : pairData.small;
  const right = bigSide === 'left' ? pairData.small : pairData.big;

  // Keep ref in sync so effects always see the latest soundOn
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked) return;
    idleTimer.current = setTimeout(() => {
      setHighlight(bigSide);
    }, 3000);
  }, [locked, bigSide]);

  useEffect(() => {
    if (done) {
      speak('Amazing! You finished! Great job!', soundOnRef.current);
      return;
    }
    speak('Who is bigger?', soundOnRef.current);
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

    if (side === bigSide) {
      setWinner(side);
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      speak('Correct!', soundOn);
      setTimeout(() => {
        setPairIndex(i => i + 1);
      }, 700);
    } else {
      setHighlight(bigSide);
      speak('This one is bigger', soundOn);
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
        <button
          className="play-again-btn"
          onClick={() => { setPairIndex(0); setStars(0); setBalloons(0); }}
        >
          Play Again
        </button>
      </div>
    );
  }

  function exitGame() {
    clearTimeout(idleTimer.current);
    setPairIndex(0);
    setStars(0);
    setBalloons(0);
    setWinner(null);
    setHighlight(null);
    setLocked(false);
  }

  return (
    <div className="game">
      <header className="hud">
        <div className="hud-top">
          <div className="star-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`star-pip ${i < starsInRow ? 'filled' : ''}`}>⭐</span>
            ))}
          </div>
          <div className="hud-controls">
            <button
              className={`sound-btn ${soundOn ? 'on' : 'off'}`}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                // Unlock Android WebView's TTS engine from this user gesture
                if (next) unlockTTS();
              }}
              aria-label={soundOn ? 'Sound on' : 'Sound off'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="exit-btn" onClick={exitGame} aria-label="Exit game">
              ✕
            </button>
          </div>
        </div>
        {balloons > 0 && (
          <div className="balloon-row">{'🎈'.repeat(balloons)}</div>
        )}
      </header>

      <h1 className="prompt">Who is bigger?</h1>

      <div className="arena">
        {[{ side: 'left', animal: left }, { side: 'right', animal: right }].map(({ side, animal }) => {
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
