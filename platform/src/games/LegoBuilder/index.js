import React, { useCallback, useState } from 'react';
import { LEGO_LEVELS, COLOR_MAP } from './levels';
import { speak } from '../../speak';
import './LegoBuilder.css';

const DIFFICULTY_CONFIG = {
  1: { levelCount: 2, showTargetByDefault: true },
  2: { levelCount: 4, showTargetByDefault: true },
  3: { levelCount: LEGO_LEVELS.length, showTargetByDefault: true },
  4: { levelCount: LEGO_LEVELS.length, showTargetByDefault: false },
};

function emptyGrid(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(null));
}

function gridsMatch(a, b) {
  return a.every((row, rowIndex) => row.every((cell, colIndex) => cell === b[rowIndex][colIndex]));
}

export default function LegoBuilder({ onSuccess, onExit, sharedDifficulty = 1 }) {
  const difficulty = DIFFICULTY_CONFIG[sharedDifficulty] || DIFFICULTY_CONFIG[1];
  const activeLevels = LEGO_LEVELS.slice(0, difficulty.levelCount);

  const [levelIdx, setLevelIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [playerGrid, setPlayerGrid] = useState(() => emptyGrid(activeLevels[0].rows, activeLevels[0].cols));
  const [showTarget, setShowTarget] = useState(difficulty.showTargetByDefault);
  const [celebrating, setCelebrating] = useState(false);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);

  const level = activeLevels[levelIdx];

  const resetBoard = useCallback((nextLevel = level) => {
    setPlayerGrid(emptyGrid(nextLevel.rows, nextLevel.cols));
    setCelebrating(false);
    setSelectedColor(null);
    setShowTarget(difficulty.showTargetByDefault);
  }, [difficulty.showTargetByDefault, level]);

  const handleCell = useCallback((rowIndex, colIndex) => {
    if (celebrating) return;

    const targetCell = level.grid[rowIndex][colIndex];
    if (targetCell === null) return;

    setPlayerGrid((currentGrid) => {
      const nextGrid = currentGrid.map((row) => [...row]);
      nextGrid[rowIndex][colIndex] = nextGrid[rowIndex][colIndex] === selectedColor ? null : selectedColor;

      setTimeout(() => {
        setPlayerGrid((latestGrid) => {
          if (!gridsMatch(latestGrid, level.grid)) {
            return latestGrid;
          }

          setCelebrating(true);
          setStars((value) => value + 1);
          speak(`Amazing! You built the ${level.name}!`, 'en');

          setTimeout(() => {
            const nextLevelIdx = levelIdx + 1;
            if (nextLevelIdx >= activeLevels.length) {
              setDone(true);
              setCelebrating(false);
              return;
            }

            const nextLevel = activeLevels[nextLevelIdx];
            setCelebrating(false);
            setLevelIdx(nextLevelIdx);
            setSelectedColor(null);
            setShowTarget(difficulty.showTargetByDefault);
            setPlayerGrid(emptyGrid(nextLevel.rows, nextLevel.cols));
          }, 1800);

          return latestGrid;
        });
      }, 50);

      return nextGrid;
    });
  }, [activeLevels, celebrating, difficulty.showTargetByDefault, level, levelIdx, selectedColor]);

  if (done) {
    return (
      <div className="lb-root">
        <div className="lb-done">
          <div className="lb-done-emoji">🧱✨</div>
          <h2>Master Builder! 🏆</h2>
          <p>You built all {activeLevels.length} figures!</p>
          <div className="lb-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="lb-btn lb-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="lb-btn lb-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = (levelIdx / activeLevels.length) * 100;

  return (
    <div className={`lb-root ${celebrating ? 'lb-root--celebrate' : ''}`}>
      {celebrating && (
        <div className="lb-confetti" aria-hidden="true">
          {['🎉', '⭐', '🎊', '✨', '🌟', '🎈'].map((entry, index) => (
            <span key={index} className="lb-confetti-piece" style={{ '--i': index }}>{entry}</span>
          ))}
        </div>
      )}

      <div className="lb-header">
        <button className="lb-back" onClick={onExit}>←</button>
        <div className="lb-title-wrap">
          <h1 className="lb-title">🧱 Lego Builder</h1>
          <span className="lb-level-name">{level.name}</span>
        </div>
        <div className="lb-star-count">{'⭐'.repeat(stars)}</div>
      </div>

      <div className="lb-progress">
        <div className="lb-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="lb-panels">
        <div className="lb-panel lb-panel--target">
          <div className="lb-panel-head">
            <div className="lb-panel-label">🎯 Target</div>
            {!difficulty.showTargetByDefault && (
              <button
                className="lb-target-toggle"
                onClick={() => setShowTarget((value) => !value)}
                type="button"
              >
                {showTarget ? 'Hide' : 'Show'}
              </button>
            )}
          </div>

          {showTarget ? (
            <div
              className="lb-grid"
              style={{
                gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
                gridTemplateRows: `repeat(${level.rows}, 1fr)`,
              }}
            >
              {level.grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`target-${rowIndex}-${colIndex}`}
                    className={`lb-cell lb-cell--target ${cell ? 'lb-cell--filled' : 'lb-cell--empty'}`}
                    style={cell ? { background: COLOR_MAP[cell].fill } : {}}
                  />
                ))
              )}
            </div>
          ) : (
            <div className="lb-target-hidden">
              Memorize the build, then recreate it from memory.
            </div>
          )}
        </div>

        <div className="lb-panel lb-panel--build">
          <div className="lb-panel-label">🧱 Build it!</div>
          <div
            className={`lb-grid ${celebrating ? 'lb-grid--win' : ''}`}
            style={{
              gridTemplateColumns: `repeat(${level.cols}, 1fr)`,
              gridTemplateRows: `repeat(${level.rows}, 1fr)`,
            }}
          >
            {playerGrid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const targetCell = level.grid[rowIndex][colIndex];
                const isBuildable = targetCell !== null;

                return (
                  <div
                    key={`player-${rowIndex}-${colIndex}`}
                    className={`lb-cell ${isBuildable ? 'lb-cell--buildable' : 'lb-cell--empty'} ${
                      cell ? 'lb-cell--filled' : ''
                    } ${cell && cell === targetCell ? 'lb-cell--correct' : ''} ${
                      cell && cell !== targetCell ? 'lb-cell--wrong' : ''
                    }`}
                    style={cell ? { background: COLOR_MAP[cell].fill } : {}}
                    onClick={() => isBuildable && handleCell(rowIndex, colIndex)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="lb-palette-wrap">
        <div className="lb-palette-label">Pick a color:</div>
        <div className="lb-palette">
          {level.palette.map((colorKey) => (
            <button
              key={colorKey}
              className={`lb-color-btn ${selectedColor === colorKey ? 'lb-color-btn--active' : ''}`}
              style={{ background: COLOR_MAP[colorKey].fill }}
              onClick={() => setSelectedColor(colorKey)}
              aria-label={COLOR_MAP[colorKey].label}
            />
          ))}
          <button
            className={`lb-color-btn lb-color-btn--eraser ${selectedColor === null ? 'lb-color-btn--active' : ''}`}
            onClick={() => setSelectedColor(null)}
            aria-label="Eraser"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="lb-actions">
        <button className="lb-btn lb-btn--ghost" onClick={() => resetBoard()}>🔄 Reset</button>
      </div>

      {celebrating && (
        <div className="lb-celebrate-msg">
          <span>🎉 Amazing! You built it!</span>
        </div>
      )}
    </div>
  );
}
