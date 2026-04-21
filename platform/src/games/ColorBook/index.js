import React, { useState, useCallback } from 'react';
import { speak } from '../../speak';
import { useLanguage } from '../../context/LanguageContext';
import { PICTURES } from './pictures';
import './ColorBook.css';

const COLORS = [
  { id: 'red',    hex: '#ef5350', en: 'Red',    he: 'אדום'  },
  { id: 'orange', hex: '#ff9800', en: 'Orange',  he: 'כתום'  },
  { id: 'yellow', hex: '#ffeb3b', en: 'Yellow',  he: 'צהוב'  },
  { id: 'green',  hex: '#4caf50', en: 'Green',   he: 'ירוק'  },
  { id: 'blue',   hex: '#2196f3', en: 'Blue',    he: 'כחול'  },
  { id: 'purple', hex: '#9c27b0', en: 'Purple',  he: 'סגול'  },
  { id: 'pink',   hex: '#e91e63', en: 'Pink',    he: 'ורוד'  },
  { id: 'brown',  hex: '#795548', en: 'Brown',   he: 'חום'   },
  { id: 'black',  hex: '#212121', en: 'Black',   he: 'שחור'  },
  { id: 'white',  hex: '#f5f5f5', en: 'White',   he: 'לבן'   },
];

const MIN_COLORS_FOR_DONE = 3;

function playPaintSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.18;

    // Short filtered noise burst — sounds like a soft brush stroke
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.stop(ctx.currentTime + duration);
  } catch (_) {
    // Audio not available — silent fallback
  }
}

// Render a single SVG element (region or decoration)
function SvgElement({ shape, fill, stroke, strokeWidth, onClick, style, className }) {
  const { type, attrs } = shape;
  const commonProps = {
    stroke: stroke || '#333',
    strokeWidth: strokeWidth != null ? strokeWidth : 2.5,
    fill: fill || 'none',
    style,
    className,
    onClick,
    ...attrs,
  };

  // For decorations that supply attrs.d via attrs object (path type)
  switch (type) {
    case 'circle':
      return <circle {...commonProps} />;
    case 'ellipse':
      return <ellipse {...commonProps} />;
    case 'rect':
      return <rect {...commonProps} />;
    case 'path':
      return <path {...commonProps} />;
    case 'line':
      return <line {...commonProps} />;
    default:
      return null;
  }
}

export default function ColorBook({ onSuccess }) {
  const { lang } = useLanguage();
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [pictureIdx, setPictureIdx] = useState(0);
  const [coloredRegions, setColoredRegions] = useState({});

  const picture = PICTURES[pictureIdx];
  const coloredCount = Object.keys(coloredRegions).length;
  const isDone = coloredCount >= MIN_COLORS_FOR_DONE;

  const handleColorSelect = useCallback((color) => {
    setSelectedColor(color);
    speak(lang === 'he' ? color.he : color.en, lang);
  }, [lang]);

  const handleRegionClick = useCallback((regionId) => {
    playPaintSound();
    setColoredRegions((prev) => ({ ...prev, [regionId]: selectedColor.hex }));
  }, [selectedColor]);

  const handlePrev = useCallback(() => {
    setPictureIdx((i) => (i - 1 + PICTURES.length) % PICTURES.length);
    setColoredRegions({});
  }, []);

  const handleNext = useCallback(() => {
    setPictureIdx((i) => (i + 1) % PICTURES.length);
    setColoredRegions({});
  }, []);

  const handleDone = useCallback(() => {
    onSuccess();
  }, [onSuccess]);

  const picLabel = lang === 'he' ? picture.label.he : picture.label.en;

  return (
    <div className="cb-root">
      {/* Header: navigation + picture name */}
      <div className="cb-header">
        <button className="cb-nav-btn" onClick={handlePrev} aria-label="Previous picture">
          ‹
        </button>
        <span className="cb-pic-title">
          <span className="cb-pic-emoji">{picture.emoji}</span>
          {picLabel}
        </span>
        <button className="cb-nav-btn" onClick={handleNext} aria-label="Next picture">
          ›
        </button>
      </div>

      {/* SVG drawing area */}
      <div className="cb-canvas">
        <svg
          viewBox={picture.viewBox}
          xmlns="http://www.w3.org/2000/svg"
          aria-label={picLabel}
        >
          {picture.regions.map((region) => (
            <SvgElement
              key={region.id}
              shape={region}
              fill={coloredRegions[region.id] || '#ffffff'}
              stroke="#333"
              strokeWidth={2.5}
              onClick={() => handleRegionClick(region.id)}
              style={{ cursor: 'pointer', transition: 'fill 0.12s ease' }}
              className="cb-region"
            />
          ))}
          {(picture.decorations || []).map((deco, i) => (
            <SvgElement
              key={`deco-${i}`}
              shape={deco}
              fill={deco.fill !== undefined ? deco.fill : 'none'}
              stroke={deco.stroke || 'none'}
              strokeWidth={deco.strokeWidth != null ? deco.strokeWidth : 0}
              style={{ pointerEvents: 'none' }}
            />
          ))}
        </svg>
      </div>

      {/* Selected color indicator */}
      <div className="cb-color-selected">
        <span
          className="cb-selected-swatch"
          style={{ background: selectedColor.hex }}
        />
        <span className="cb-selected-name">
          {lang === 'he' ? selectedColor.he : selectedColor.en}
        </span>
      </div>

      {/* Color palette */}
      <div className="cb-palette">
        {COLORS.map((color) => (
          <button
            key={color.id}
            className={`cb-swatch${selectedColor.id === color.id ? ' cb-swatch--selected' : ''}`}
            style={{ background: color.hex }}
            onClick={() => handleColorSelect(color)}
            aria-label={lang === 'he' ? color.he : color.en}
            aria-pressed={selectedColor.id === color.id}
          />
        ))}
      </div>

      {/* Done button */}
      {isDone && (
        <button className="cb-done-btn" onClick={handleDone}>
          {lang === 'he' ? 'סיימתי ✓' : 'Done! ✓'}
        </button>
      )}
    </div>
  );
}
