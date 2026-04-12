import React from 'react';

// Shared star progress bar: 5 pips (filled/empty) + balloon count
export default function StarBar({ starsInCycle, balloons }) {
  return (
    <div className="starbar">
      <div className="starbar-pips">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`starbar-pip${i < starsInCycle ? ' filled' : ''}`}
          >
            ⭐
          </span>
        ))}
      </div>
      {balloons > 0 && (
        <div className="starbar-balloons">{'🎈'.repeat(balloons)}</div>
      )}
    </div>
  );
}
