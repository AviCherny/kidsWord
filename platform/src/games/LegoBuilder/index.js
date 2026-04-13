import React, { useState, useCallback } from 'react';
import { LEGO_LEVELS, COLOR_MAP } from './levels';
import { speak } from '../../speak';
import './LegoBuilder.css';

function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function gridsMatch(a, b) {
  return a.every((row, r) => row.every((cell, c) => cell === b[r][c]));
}

export default function LegoBuilder({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx]       = useState(0);
  const [selectedColor, setSelected]  = useState(null);
  const [playerGrid, setPlayerGrid]   = useState(() => {
    const l = LEGO_LEVELS[0];
    return emptyGrid(l.rows, l.cols);
  });
  const [showTarget, setShowTarget]   = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [done, setDone]               = useState(false);
  const [stars, setStars]             = useState(0);

  const level = LEGO_LEVELS[levelIdx];

  const handleCell = useCallback((r, c) => {
    if (celebrating) return;
    const targetCell = level.grid[r][c];
    if (targetCell === null) return; // non-buildable cell

    setPlayerGrid(prev => {
      const next = prev.map(row => [...row]);
      if (next[r][c] === selectedColor) {
        next[r][c] = null; // toggle off
      } else {
        next[r][c] = selectedColor;
      }

      // Check win
      setTimeout(() => {
        setPlayerGrid(pg => {
          if (gridsMatch(pg, level.grid)) {
            setCelebrating(true);
            setStars(s => s + 1);
            speak(`Amazing! You built the ${level.name}!`, 'en');
            setTimeout(() => {
              setCelebrating(false);
              const next2 = levelIdx + 1;
              if (next2 >= LEGO_LEVELS.length) {
                setDone(true);
              } else {
                setLevelIdx(next2);
                const nl = LEGO_LEVELS[next2];
                setPlayerGrid(emptyGrid(nl.rows, nl.cols));
                setSelected(null);
              }
            }, 1800);
          }
          return pg;
        });
      }, 50);

      return next;
    });
  }, [selectedColor, celebrating, level, levelIdx]);

  function handleReset() {
    setPlayerGrid(emptyGrid(level.rows, level.cols));
    setCelebrating(false);
  }

  if (done) {
    return (
      <div className="lb-root">
        <div className="lb-done">
          <div className="lb-done-emoji">🧱✨</div>
          <h2>Master Builder! 🏆</h2>
          <p>You built all {LEGO_LEVELS.length} figures!</p>
          <div className="lb-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="lb-btn lb-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="lb-btn lb-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = (levelIdx / LEGO_LEVELS.length) * 100;

  return (
    <div className={`lb-root ${celebrating ? 'lb-root--celebrate' : ''}`}>
      {/* Confetti */}
      {celebrating && (
        <div className="lb-confetti" aria-hidden="true">
          {['🎉','⭐','🎊','✨','🌟','🎈'].map((e,i) => (
            <span key={i} className="lb-confetti-piece" style={{ '--i': i }}>{e}</span>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="lb-header">
        <button className="lb-back" onClick={onExit}>←</button>
        <div className="lb-title-wrap">
          <h1 className="lb-title">🧱 Lego Builder</h1>
          <span className="lb-level-name">{level.name}</span>
        </div>
        <div className="lb-star-count">{'⭐'.repeat(stars)}</div>
      </div>

      {/* Progress */}
      <div className="lb-progress">
        <div className="lb-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Two panels: Target + Build area */}
      <div className="lb-panels">
        {/* Target */}
        <div className="lb-panel lb-panel--target">
          <div className="lb-panel-label">🎯 Target</div>
          <div
            className="lb-grid"
            style={{
              gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
              gridTemplateRows:    `repeat(${level.rows}, 1fr)`,
            }}
          >
            {level.grid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`t-${r}-${c}`}
                  className={`lb-cell lb-cell--target ${cell ? 'lb-cell--filled' : 'lb-cell--empty'}`}
                  style={cell ? { background: COLOR_MAP[cell].fill } : {}}
                />
              ))
            )}
          </div>
        </div>

        {/* Player build */}
        <div className="lb-panel lb-panel--build">
          <div className="lb-panel-label">🧱 Build it!</div>
          <div
            className={`lb-grid ${celebrating ? 'lb-grid--win' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
              gridTemplateRows:    `repeat(${level.rows}, 1fr)`,
            }}
          >
            {playerGrid.map((row, r) =>
              row.map((cell, c) => {
                const targetCell = level.grid[r][c];
                const isBuildable = targetCell !== null;
                return (
                  <div
                    key={`p-${r}-${c}`}
                    className={`lb-cell ${isBuildable ? 'lb-cell--buildable' : 'lb-cell--empty'} ${
                      cell ? 'lb-cell--filled' : ''
                    } ${
                      cell && cell === targetCell ? 'lb-cell--correct' : ''
                    } ${
                      cell && cell !== targetCell ? 'lb-cell--wrong' : ''
                    }`}
                    style={cell ? { background: COLOR_MAP[cell].fill } : {}}
                    onClick={() => isBuildable && handleCell(r, c)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Color palette */}
      <div className="lb-palette-wrap">
        <div className="lb-palette-label">Pick a color:</div>
        <div className="lb-palette">
          {level.palette.map(colorKey => (
            <button
              key={colorKey}
              className={`lb-color-btn ${selectedColor === colorKey ? 'lb-color-btn--active' : ''}`}
              style={{ background: COLOR_MAP[colorKey].fill }}
              onClick={() => setSelected(colorKey)}
              aria-label={COLOR_MAP[colorKey].label}
            />
          ))}
          {/* Eraser */}
          <button
            className={`lb-color-btn lb-color-btn--eraser ${selectedColor === null ? 'lb-color-btn--active' : ''}`}
            onClick={() => setSelected(null)}
            aria-label="Eraser"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="lb-actions">
        <button className="lb-btn lb-btn--ghost" onClick={handleReset}>🔄 Reset</button>
      </div>

      {celebrating && (
        <div className="lb-celebrate-msg">
          <span>🎉 Amazing! You built it!</span>
        </div>
      )}
    </div>
  );
}
