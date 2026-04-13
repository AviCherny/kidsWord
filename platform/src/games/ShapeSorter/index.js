import React, { useState, useCallback } from 'react';
import './ShapeSorter.css';

// Items to sort: shape + color combinations
const SHAPES = [
  { id: 'circle',   emoji: '⭕', label: 'Circle'   },
  { id: 'square',   emoji: '⬜', label: 'Square'   },
  { id: 'triangle', emoji: '🔺', label: 'Triangle' },
  { id: 'star',     emoji: '⭐', label: 'Star'     },
];

const COLORS = [
  { id: 'red',    emoji: '🔴', label: 'Red',    fill: '#ef5350' },
  { id: 'blue',   emoji: '🔵', label: 'Blue',   fill: '#42a5f5' },
  { id: 'yellow', emoji: '🟡', label: 'Yellow', fill: '#ffd54f' },
  { id: 'green',  emoji: '🟢', label: 'Green',  fill: '#66bb6a' },
];

const LEVELS = [
  // Sort by color only (2 bins)
  {
    type: 'color',
    items: ['🔴', '🔵', '🔴', '🔵', '🔴', '🔵'],
    bins: [
      { id: 'red',  label: 'Red 🔴',  matches: (e) => ['🔴'].includes(e) },
      { id: 'blue', label: 'Blue 🔵', matches: (e) => ['🔵'].includes(e) },
    ],
    prompt: 'Sort by COLOR!',
  },
  {
    type: 'color',
    items: ['🟡', '🟢', '🔴', '🟡', '🟢', '🔴'],
    bins: [
      { id: 'yellow', label: 'Yellow 🟡', matches: (e) => e === '🟡' },
      { id: 'green',  label: 'Green 🟢',  matches: (e) => e === '🟢' },
      { id: 'red',    label: 'Red 🔴',    matches: (e) => e === '🔴' },
    ],
    prompt: 'Sort by COLOR!',
  },
  // Sort by shape (emoji shape)
  {
    type: 'shape',
    items: ['⭕', '⭐', '⭕', '⭐', '⭕', '⭐'],
    bins: [
      { id: 'circle', label: 'Circles ⭕', matches: (e) => e === '⭕' },
      { id: 'star',   label: 'Stars ⭐',   matches: (e) => e === '⭐' },
    ],
    prompt: 'Sort by SHAPE!',
  },
  {
    type: 'shape',
    items: ['🔺', '⬜', '⭕', '🔺', '⬜', '⭕'],
    bins: [
      { id: 'triangle', label: 'Triangles 🔺', matches: (e) => e === '🔺' },
      { id: 'square',   label: 'Squares ⬜',   matches: (e) => e === '⬜' },
      { id: 'circle',   label: 'Circles ⭕',   matches: (e) => e === '⭕' },
    ],
    prompt: 'Sort by SHAPE!',
  },
  // Mixed sort (big emoji with color hint)
  {
    type: 'size',
    items: ['🐘', '🐭', '🐘', '🐭', '🐘', '🐭'],
    bins: [
      { id: 'big',   label: 'BIG 🐘',   matches: (e) => e === '🐘' },
      { id: 'small', label: 'Small 🐭', matches: (e) => e === '🐭' },
    ],
    prompt: 'Sort by SIZE!',
  },
  {
    type: 'size',
    items: ['🌍', '🔵', '🌍', '🔵', '🌍', '🔵'],
    bins: [
      { id: 'big',   label: 'BIG 🌍',   matches: (e) => e === '🌍' },
      { id: 'small', label: 'Small 🔵', matches: (e) => e === '🔵' },
    ],
    prompt: 'Sort by SIZE!',
  },
];

export default function ShapeSorter({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [remaining, setRemaining] = useState(LEVELS[0].items);
  const [binContents, setBinContents] = useState({});
  const [lastResult, setLastResult] = useState(null); // 'correct' | 'wrong'
  const [stars, setStars]   = useState(0);
  const [done, setDone]     = useState(false);
  const [shake, setShake]   = useState(false);

  const level = LEVELS[levelIdx];

  function handleDrop(emoji, binId) {
    if (!remaining.includes(emoji)) return;
    const bin = level.bins.find(b => b.id === binId);
    if (bin.matches(emoji)) {
      // correct
      setLastResult('correct');
      setBinContents(prev => ({
        ...prev,
        [binId]: [...(prev[binId] || []), emoji],
      }));
      setRemaining(prev => {
        const idx = prev.indexOf(emoji);
        const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        // Check level complete
        if (next.length === 0) {
          setStars(s => s + 1);
          setTimeout(() => {
            const nextIdx = levelIdx + 1;
            if (nextIdx >= LEVELS.length) {
              setDone(true);
            } else {
              setLevelIdx(nextIdx);
              setRemaining(LEVELS[nextIdx].items);
              setBinContents({});
              setLastResult(null);
            }
          }, 800);
        }
        return next;
      });
    } else {
      // wrong
      setLastResult('wrong');
      setShake(true);
      setTimeout(() => { setShake(false); setLastResult(null); }, 700);
    }
  }

  // The current item to sort (first in remaining)
  const currentItem = remaining[0] || null;

  if (done) {
    return (
      <div className="ss-root">
        <div className="ss-done">
          <div className="ss-done-emoji">🎯✨</div>
          <h2>Perfect Sorting! 🎉</h2>
          <p>You sorted everything correctly!</p>
          <div className="ss-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="ss-btn ss-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="ss-btn ss-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = ((LEVELS.length - 1 - (LEVELS.length - 1 - levelIdx)) / LEVELS.length +
    (1 - remaining.length / LEVELS[levelIdx].items.length) / LEVELS.length) * 100;

  return (
    <div className="ss-root">
      {/* Header */}
      <div className="ss-header">
        <button className="ss-back" onClick={onExit}>←</button>
        <h1 className="ss-title">🎯 Shape Sorter</h1>
        <div className="ss-stars">{'⭐'.repeat(stars)}</div>
      </div>

      {/* Progress */}
      <div className="ss-progress">
        <div className="ss-progress-fill" style={{ width: `${(levelIdx / LEVELS.length) * 100}%` }} />
      </div>

      {/* Prompt */}
      <div className="ss-prompt">{level.prompt}</div>

      {/* Current item to sort */}
      <div className={`ss-current-wrap ${shake ? 'ss-shake' : ''}`}>
        <div className="ss-current-label">Tap the right bin!</div>
        <div className="ss-current-item">
          {currentItem || '✅'}
        </div>
        <div className="ss-remaining-count">
          {remaining.length} left
        </div>
      </div>

      {/* Bins */}
      <div className="ss-bins">
        {level.bins.map(bin => (
          <button
            key={bin.id}
            className={`ss-bin ${lastResult === 'correct' && bin.matches(currentItem) ? 'ss-bin--flash' : ''}`}
            onClick={() => currentItem && handleDrop(currentItem, bin.id)}
          >
            <div className="ss-bin-label">{bin.label}</div>
            <div className="ss-bin-contents">
              {(binContents[bin.id] || []).map((e, i) => (
                <span key={i} className="ss-bin-item">{e}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      {lastResult === 'correct' && <div className="ss-feedback ss-feedback--good">✅ Correct!</div>}
      {lastResult === 'wrong'   && <div className="ss-feedback ss-feedback--bad">❌ Wrong bin!</div>}
    </div>
  );
}
