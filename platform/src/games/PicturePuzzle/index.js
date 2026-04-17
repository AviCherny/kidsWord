import React, { useState } from 'react';
import { speak } from '../../speak';
import './PicturePuzzle.css';

const PUZZLES = [
  {
    name: 'Garden',
    emoji: '🌻',
    pieces: ['🌸', '☀️', '🌷', '🦋', '🌻', '🌿', '🐝', '🌱', '🌼', '🍄', '🪻', '🌹', '🐞', '🌳', '🐛', '🍀'],
  },
  {
    name: 'Space',
    emoji: '🚀',
    pieces: ['⭐', '🌙', '✨', '🪐', '🚀', '☄️', '🌟', '💫', '🌌', '🛰️', '👩‍🚀', '🌍', '🔭', '👽', '☀️', '🛸'],
  },
  {
    name: 'Ocean',
    emoji: '🐠',
    pieces: ['🌊', '🐬', '🦭', '🐠', '🐙', '🦀', '🐡', '🦑', '🐳', '🐚', '🪸', '🦞', '🐟', '🐋', '🪼', '🦈'],
  },
  {
    name: 'Cars',
    emoji: '🏎️',
    pieces: ['🏁', '🏎️', '🚧', '🚗', '🚦', '🏍️', '🚕', '🛞', '🔧', '🚓', '🚑', '⛽', '🚘', '🛻', '🚌', '🛵'],
  },
  {
    name: 'Forest',
    emoji: '🦊',
    pieces: ['🌲', '🐦', '🍄', '🦊', '🌿', '🦔', '🍂', '🌳', '🐿️', '🦉', '🪵', '🐞', '🍁', '🐻', '🐇', '🌾'],
  },
];

const DIFFICULTY_CONFIG = {
  1: { cols: 2, pieceCount: 4, puzzleCount: 3 },
  2: { cols: 3, pieceCount: 9, puzzleCount: 3 },
  3: { cols: 3, pieceCount: 9, puzzleCount: 5 },
  4: { cols: 4, pieceCount: 16, puzzleCount: 3 },
};

function shuffle(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getPuzzlePack(sharedDifficulty) {
  const difficulty = DIFFICULTY_CONFIG[sharedDifficulty] || DIFFICULTY_CONFIG[1];
  return PUZZLES.slice(0, difficulty.puzzleCount).map((entry) => ({
    ...entry,
    cols: difficulty.cols,
    pieces: entry.pieces.slice(0, difficulty.pieceCount),
  }));
}

function initPool(puzzle) {
  return shuffle(puzzle.pieces.map((emoji, index) => ({ emoji, index })));
}

export default function PicturePuzzle({ onSuccess, onExit, sharedDifficulty = 1 }) {
  const puzzles = getPuzzlePack(sharedDifficulty);
  const firstPuzzle = puzzles[0];

  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [pool, setPool] = useState(() => initPool(firstPuzzle));
  const [placed, setPlaced] = useState(() => Array(firstPuzzle.pieces.length).fill(null));
  const [selected, setSelected] = useState(null);
  const [flashSlot, setFlashSlot] = useState(null);
  const [wrongSlot, setWrongSlot] = useState(null);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);

  const puzzle = puzzles[puzzleIdx];
  const filledCount = placed.filter((piece) => piece !== null).length;
  const completedPieces = puzzles
    .slice(0, puzzleIdx)
    .reduce((total, entry) => total + entry.pieces.length, 0) + filledCount;
  const totalPieces = puzzles.reduce((total, entry) => total + entry.pieces.length, 0);
  const progress = (completedPieces / totalPieces) * 100;
  const previewSize = puzzle.cols === 4 ? '28px' : puzzle.cols === 3 ? '36px' : '50px';
  const boardCellSize = puzzle.cols === 4 ? '54px' : puzzle.cols === 3 ? '72px' : '92px';

  function handlePoolTap(index) {
    if (pool[index] === null) return;
    setSelected((current) => (current === index ? null : index));
  }

  function handleSlotTap(slotIdx) {
    if (placed[slotIdx] || selected === null) return;

    const piece = pool[selected];
    if (!piece) return;

    if (piece.index === slotIdx) {
      const nextPool = [...pool];
      nextPool[selected] = null;
      setPool(nextPool);
      setSelected(null);

      const nextPlaced = [...placed];
      nextPlaced[slotIdx] = piece;
      setPlaced(nextPlaced);

      setFlashSlot(slotIdx);
      setTimeout(() => setFlashSlot(null), 500);
      speak(puzzle.pieces[slotIdx], 'en');

      if (nextPlaced.every((entry) => entry !== null)) {
        speak(`${puzzle.name}! Amazing!`, 'en');
        setStars((value) => value + 1);
        setTimeout(() => {
          const nextPuzzleIdx = puzzleIdx + 1;
          if (nextPuzzleIdx >= puzzles.length) {
            setDone(true);
            return;
          }

          const nextPuzzle = puzzles[nextPuzzleIdx];
          setPuzzleIdx(nextPuzzleIdx);
          setPool(initPool(nextPuzzle));
          setPlaced(Array(nextPuzzle.pieces.length).fill(null));
          setSelected(null);
        }, 1200);
      }
      return;
    }

    setWrongSlot(slotIdx);
    setTimeout(() => setWrongSlot(null), 500);
    setSelected(null);
    speak('Try again!', 'en');
  }

  if (done) {
    return (
      <div className="pp-root">
        <div className="pp-done">
          <div>🧩✨🧩</div>
          <h2>Puzzle Master! 🎉</h2>
          <p>You completed all {puzzles.length} puzzles!</p>
          <div>{'⭐'.repeat(stars)}</div>
          <button className="pp-btn pp-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="pp-btn pp-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

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

      <div className="pp-target-label">Build this picture:</div>
      <div
        className="pp-target-grid"
        style={{
          gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
          '--pp-preview-size': previewSize,
        }}
      >
        {puzzle.pieces.map((piece, index) => (
          <div key={index} className="pp-target-cell">{piece}</div>
        ))}
      </div>

      <div className="pp-hint">
        {selected !== null ? '👆 Now tap the matching slot below!' : '👆 Pick a piece first!'}
      </div>

      <div
        className="pp-board"
        style={{
          gridTemplateColumns: `repeat(${puzzle.cols}, 1fr)`,
          '--pp-cell-size': boardCellSize,
        }}
      >
        {placed.map((piece, index) => (
          <button
            key={index}
            className={[
              'pp-slot',
              piece ? 'pp-slot--filled' : 'pp-slot--empty',
              flashSlot === index ? 'pp-slot--flash' : '',
              wrongSlot === index ? 'pp-slot--wrong' : '',
            ].join(' ')}
            onClick={() => handleSlotTap(index)}
          >
            {piece ? piece.emoji : ''}
          </button>
        ))}
      </div>

      <div className="pp-pool-label">{puzzle.pieces.length - filledCount} pieces left</div>
      <div className="pp-pool">
        {pool.map((piece, index) => (
          piece ? (
            <button
              key={index}
              className={`pp-piece ${selected === index ? 'pp-piece--selected' : ''}`}
              onClick={() => handlePoolTap(index)}
            >
              {piece.emoji}
            </button>
          ) : (
            <div key={index} className="pp-piece-gone" />
          )
        ))}
      </div>
    </div>
  );
}
