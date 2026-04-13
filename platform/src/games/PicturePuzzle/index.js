import React, { useState, useCallback } from 'react';
import { speak } from '../../speak';
import './PicturePuzzle.css';

// Each puzzle: 9 UNIQUE emoji pieces that form a scene
const PUZZLES = [
  {
    name: 'Garden',   emoji: '🌻',
    pieces: ['🌸','☀️','🌺','🦋','🌻','🌿','🐝','🌱','🌼'],
  },
  {
    name: 'Space',    emoji: '🚀',
    pieces: ['⭐','🌙','✨','🪐','🚀','☄️','🌟','💫','🌌'],
  },
  {
    name: 'Ocean',    emoji: '🐠',
    pieces: ['🌊','🐬','🦭','🐠','🐙','🦀','🐡','🦑','🐳'],
  },
  {
    name: 'Cars',     emoji: '🏎️',
    pieces: ['🏁','🏎️','🚧','🚗','🚦','🏍️','🚕','⛽','🔧'],
  },
  {
    name: 'Forest',   emoji: '🦊',
    pieces: ['🌲','🐦','🐿️','🦊','🍄','🌿','🦔','🍂','🌳'],
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function initPool(puzzleIdx) {
  return shuffle(PUZZLES[puzzleIdx].pieces.map((emoji, idx) => ({ emoji, idx })));
}

export default function PicturePuzzle({ onSuccess, onExit }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [pool, setPool]           = useState(() => initPool(0));
  const [placed, setPlaced]       = useState(Array(9).fill(null)); // piece objects
  const [selected, setSelected]   = useState(null); // pool slot index
  const [flashSlot, setFlashSlot] = useState(null);
  const [wrongSlot, setWrongSlot] = useState(null);
  const [stars, setStars]         = useState(0);
  const [done, setDone]           = useState(false);

  const puzzle = PUZZLES[puzzleIdx];

  function handlePoolTap(i) {
    if (pool[i] === null) return;
    setSelected(selected === i ? null : i);
  }

  function handleSlotTap(slotIdx) {
    if (placed[slotIdx]) return; // already filled
    if (selected === null) return;

    const piece = pool[selected];
    if (!piece) return;

    if (piece.idx === slotIdx) {
      // Correct placement!
      const newPool = [...pool];
      newPool[selected] = null;
      setPool(newPool);
      setSelected(null);

      const newPlaced = [...placed];
      newPlaced[slotIdx] = piece;
      setPlaced(newPlaced);

      setFlashSlot(slotIdx);
      setTimeout(() => setFlashSlot(null), 500);

      speak(puzzle.pieces[slotIdx], 'en');

      // Check level complete
      if (newPlaced.every(p => p !== null)) {
        speak(`${puzzle.name}! Amazing!`, 'en');
        setStars(s => s + 1);
        setTimeout(() => {
          const next = puzzleIdx + 1;
          if (next >= PUZZLES.length) {
            setDone(true);
          } else {
            setPuzzleIdx(next);
            setPool(initPool(next));
            setPlaced(Array(9).fill(null));
          }
        }, 1200);
      }
    } else {
      // Wrong placement — shake the slot
      setWrongSlot(slotIdx);
      setTimeout(() => setWrongSlot(null), 500);
      setSelected(null);
      speak('Try again!', 'en');
    }
  }

  if (done) {
    return (
      <div className="pp-root">
        <div className="pp-done">
          <div>🧩✨🧩</div>
          <h2>Puzzle Master! 🎉</h2>
          <p>You completed all {PUZZLES.length} puzzles!</p>
          <div>{'⭐'.repeat(stars)}</div>
          <button className="pp-btn pp-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="pp-btn pp-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const filledCount = placed.filter(p => p !== null).length;
  const progress = ((puzzleIdx * 9 + filledCount) / (PUZZLES.length * 9)) * 100;

  return (
    <div className="pp-root">
      <div className="pp-header">
        <button className="pp-back" onClick={onExit}>←</button>
        <h1 className="pp-title">🧩 {puzzle.name}</h1>
        <div className="pp-stars">{'⭐'.repeat(stars)}</div>
      </div>

      <div className="pp-progress">
        <div className="pp-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Target picture */}
      <div className="pp-target-label">Build this picture:</div>
      <div className="pp-target-grid">
        {puzzle.pieces.map((e, i) => (
          <div key={i} className="pp-target-cell">{e}</div>
        ))}
      </div>

      {/* Hint */}
      <div className="pp-hint">
        {selected !== null ? '👆 Now tap a slot in the grid below!' : '👆 Pick a piece first!'}
      </div>

      {/* Board */}
      <div className="pp-board">
        {placed.map((piece, i) => (
          <button
            key={i}
            className={[
              'pp-slot',
              piece      ? 'pp-slot--filled' : 'pp-slot--empty',
              flashSlot === i ? 'pp-slot--flash' : '',
              wrongSlot === i ? 'pp-slot--wrong' : '',
            ].join(' ')}
            onClick={() => handleSlotTap(i)}
          >
            {piece ? piece.emoji : ''}
          </button>
        ))}
      </div>

      {/* Piece pool */}
      <div className="pp-pool-label">{9 - filledCount} pieces left</div>
      <div className="pp-pool">
        {pool.map((piece, i) => (
          piece ? (
            <button
              key={i}
              className={`pp-piece ${selected === i ? 'pp-piece--selected' : ''}`}
              onClick={() => handlePoolTap(i)}
            >
              {piece.emoji}
            </button>
          ) : (
            <div key={i} className="pp-piece-gone" />
          )
        ))}
      </div>
    </div>
  );
}
