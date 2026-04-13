import React, { useState, useCallback, useRef } from 'react';
import './App.css';
import { CARD_POOL, BOARD_SIZES } from './cards';
import { speak } from './speak';

// ─── helpers ─────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick `pairs` unique cards from pool, duplicate them, assign unique instance ids, shuffle
function buildDeck(pairs) {
  const picked = shuffle([...CARD_POOL]).slice(0, pairs);
  const deck = [];
  picked.forEach(card => {
    deck.push({ ...card, uid: `${card.id}-A` });
    deck.push({ ...card, uid: `${card.id}-B` });
  });
  return shuffle(deck);
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]         = useState('start');   // start | game | win
  const [boardSize, setBoardSize]   = useState(null);
  const [deck, setDeck]             = useState([]);
  const [flipped, setFlipped]       = useState(new Set()); // uids that are face-up
  const [matched, setMatched]       = useState(new Set()); // uids of matched pairs
  const [locked, setLocked]         = useState(false);     // prevent taps during evaluation
  const [moves, setMoves]           = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const firstRef  = useRef(null);  // first flipped card this turn

  // ── start game ─────────────────────────────────────────────────────────
  const startGame = useCallback((size) => {
    setBoardSize(size);
    const newDeck = buildDeck(size.pairs);
    setDeck(newDeck);
    setFlipped(new Set());
    setMatched(new Set());
    setLocked(false);
    setMoves(0);
    firstRef.current = null;
    setScreen('game');
  }, []);

  // ── card tap ───────────────────────────────────────────────────────────
  const handleFlip = useCallback((card) => {
    if (locked) return;
    if (matched.has(card.uid)) return;
    if (flipped.has(card.uid)) return;      // already face-up this turn

    // Speak the label every time a card is flipped
    speak(card.label);

    const newFlipped = new Set(flipped);
    newFlipped.add(card.uid);
    setFlipped(newFlipped);

    if (!firstRef.current) {
      // First card of the turn
      firstRef.current = card;
    } else {
      // Second card — evaluate
      const first = firstRef.current;
      firstRef.current = null;
      setMoves(m => m + 1);
      setLocked(true);

      if (first.id === card.id) {
        // Match!
        setTimeout(() => {
          setMatched(prev => {
            const next = new Set(prev);
            next.add(first.uid);
            next.add(card.uid);
            return next;
          });
          setFlipped(new Set());
          setLocked(false);

          // Check win after state update settles
          setTimeout(() => {
            setMatched(prev => {
              if (prev.size === boardSize.pairs * 2) {
                speak('You win! Amazing!');
                setShowCelebration(true);
                setTimeout(() => {
                  setShowCelebration(false);
                  setScreen('win');
                }, 2500);
              }
              return prev;
            });
          }, 50);
        }, 700);
      } else {
        // No match — flip both back after a pause
        setTimeout(() => {
          setFlipped(new Set());
          setLocked(false);
        }, 1100);
      }
    }
  }, [locked, matched, flipped, boardSize]);

  // ── screens ────────────────────────────────────────────────────────────
  if (screen === 'start') return (
    <div className="screen start-screen">
      <div className="game-title">Memory<br/>Game</div>
      <div className="title-emoji">🧠</div>
      <div className="size-label">Choose board size:</div>
      <div className="size-buttons">
        {BOARD_SIZES.map(size => (
          <button
            key={size.pairs}
            className="btn-size"
            onClick={() => startGame(size)}
          >
            <span className="size-name">{size.name}</span>
            <span className="size-sub">{size.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (screen === 'win') return (
    <div className="screen win-screen">
      <div className="big-emoji">🏆</div>
      <div className="result-title">You did it!</div>
      <div className="result-sub">{moves} moves — {boardSize.pairs} pairs matched!</div>
      <button className="btn-primary" onClick={() => startGame(boardSize)}>Play Again</button>
      <button className="btn-secondary" onClick={() => setScreen('start')}>Change Size</button>
    </div>
  );

  // game screen
  const cols = boardSize?.cols ?? 4;
  return (
    <div className="screen game-screen">
      <div className="hud">
        <button className="btn-back" onClick={() => setScreen('start')}>← Back</button>
        <span className="hud-moves">Moves: {moves}</span>
        <span className="hud-pairs">{matched.size / 2}/{boardSize.pairs} pairs</span>
      </div>

      <div
        className="board"
        style={{ '--cols': cols }}
      >
        {deck.map(card => {
          const isFaceUp = flipped.has(card.uid) || matched.has(card.uid);
          const isMatched = matched.has(card.uid);
          return (
            <div
              key={card.uid}
              className={`card ${isFaceUp ? 'card-flipped' : ''} ${isMatched ? 'card-matched' : ''}`}
              onClick={() => !isFaceUp && handleFlip(card)}
            >
              <div className="card-inner">
                <div className="card-back">❓</div>
                <div className="card-front">
                  <span className="card-emoji">{card.emoji}</span>
                  <span className="card-label">{card.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showCelebration && <Celebration />}
    </div>
  );
}

// ─── Celebration ─────────────────────────────────────────────────────────────
const CONFETTI = ['🎉', '⭐', '🌟', '🎊', '✨', '🎈'];
function Celebration() {
  return (
    <div className="celebration-layer" aria-hidden="true">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="confetti"
          style={{
            left: `${(i / 16) * 100 + (Math.random() * 4 - 2)}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            fontSize: `${1.4 + Math.random() * 1.4}rem`,
          }}
        >
          {CONFETTI[i % CONFETTI.length]}
        </span>
      ))}
    </div>
  );
}
