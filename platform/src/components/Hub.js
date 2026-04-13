import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { TOTAL_STICKERS } from '../data/stickers';
import ParentSettings from './ParentSettings';
import { getSettings } from '../lib/settings';

const CATEGORIES = [
  {
    id: 'language',
    labelKey: 'catLanguage',
    emoji: '📚',
    color: '#e8f5e9',
    accent: '#2e7d32',
    games: [
      {
        id: 'bigvssmall',
        emoji: '🐘🐭',
        nameKey: 'bigVsSmallName',
        descKey: 'bigVsSmallDesc',
        bg: 'linear-gradient(145deg, #FF8C00, #FFB347)',
        glow: 'rgba(255,140,0,0.4)',
      },
      {
        id: 'memory',
        emoji: '🧠',
        nameKey: 'memoryGameName',
        descKey: 'memoryGameDesc',
        bg: 'linear-gradient(145deg, #7B2D8B, #C06DC8)',
        glow: 'rgba(123,45,139,0.4)',
      },
      {
        id: 'social',
        emoji: '💬',
        nameKey: 'socialSkillsName',
        descKey: 'socialSkillsDesc',
        bg: 'linear-gradient(145deg, #009688, #4DB6AC)',
        glow: 'rgba(0,150,136,0.4)',
      },
      {
        id: 'shooter',
        emoji: '🦸',
        nameKey: 'wordShooterName',
        descKey: 'wordShooterDesc',
        bg: 'linear-gradient(145deg, #D32F2F, #EF5350)',
        glow: 'rgba(211,47,47,0.4)',
      },
    ],
  },
  {
    id: 'logic',
    labelKey: 'catLogic',
    emoji: '🧩',
    color: '#e8eaf6',
    accent: '#3949ab',
    games: [
      {
        id: 'pattern',
        emoji: '⭐🔴⭐',
        nameKey: 'patternGameName',
        descKey: 'patternGameDesc',
        bg: 'linear-gradient(145deg, #1565c0, #42a5f5)',
        glow: 'rgba(21,101,192,0.4)',
      },
      {
        id: 'numbertrain',
        emoji: '🚂',
        nameKey: 'numberTrainName',
        descKey: 'numberTrainDesc',
        bg: 'linear-gradient(145deg, #1a237e, #5c6bc0)',
        glow: 'rgba(26,35,126,0.4)',
      },
      {
        id: 'shapesorter',
        emoji: '🔴⬜🔺',
        nameKey: 'shapeSorterName',
        descKey: 'shapeSorterDesc',
        bg: 'linear-gradient(145deg, #6a1b9a, #ab47bc)',
        glow: 'rgba(106,27,154,0.4)',
      },
    ],
  },
  {
    id: 'creative',
    labelKey: 'catCreative',
    emoji: '🎨',
    color: '#fff8e1',
    accent: '#e65100',
    games: [
      {
        id: 'lego',
        emoji: '🧱',
        nameKey: 'legoBuilderName',
        descKey: 'legoBuilderDesc',
        bg: 'linear-gradient(145deg, #bf360c, #ff8a65)',
        glow: 'rgba(191,54,12,0.4)',
      },
    ],
  },
];

const MASCOTS = ['🌟', '🦊', '🐸', '🦄', '🐻', '🌈', '🎯'];

export default function Hub({ onLaunch, earnedCount, onOpenCollection, onSettingsChange }) {
  const { lang, setLang, dir } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [gearHeld, setGearHeld] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const pressTimer = useRef(null);
  const HOLD_MS = 1400;

  const isRTL = lang === 'he';
  const mascot = MASCOTS[new Date().getDay() % MASCOTS.length];
  const pct = Math.round((earnedCount / TOTAL_STICKERS) * 100);

  const handleGearDown = useCallback((e) => {
    e.preventDefault();
    pressTimer.current = setTimeout(() => {
      setShowSettings(true);
      setGearHeld(false);
    }, HOLD_MS);
    setGearHeld(true);
  }, []);

  const handleGearUp = useCallback(() => {
    clearTimeout(pressTimer.current);
    setGearHeld(false);
  }, []);

  useEffect(() => () => clearTimeout(pressTimer.current), []);

  function handleSettingsChange(s) {
    setSettings(s);
    if (onSettingsChange) onSettingsChange(s);
  }

  const visibleCategories = CATEGORIES.map(cat => ({
    ...cat,
    games: cat.games.filter(g => !settings.hiddenGames.includes(g.id)),
  })).filter(cat => cat.games.length > 0);

  const displayedCategories = activeCategory === null
    ? visibleCategories
    : visibleCategories.filter(c => c.id === activeCategory);

  return (
    <div className="hub" dir={dir}>
      {/* Background blobs */}
      <div className="hub-blob hub-blob--tl" />
      <div className="hub-blob hub-blob--br" />

      {/* Header */}
      <header className="hub-header">
        <span className="hub-mascot" aria-hidden="true">{mascot}</span>
        <div className="hub-header-text">
          <h1 className="hub-title">{t(lang, 'appTitle')}</h1>
          <p className="hub-subtitle">
            {isRTL ? 'מה רוצים לשחק היום?' : 'What do you want to play?'}
          </p>
        </div>
        <button
          className="hub-collection-btn"
          onClick={onOpenCollection}
          aria-label={isRTL ? 'אוסף מדבקות' : 'Sticker collection'}
        >
          <span className="hub-collection-icon">🌿</span>
          <span className="hub-collection-count">{earnedCount}/{TOTAL_STICKERS}</span>
        </button>
      </header>

      {/* Sticker progress bar */}
      <div className="hub-progress-wrap">
        <div className="hub-progress-bar">
          <div className="hub-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="hub-progress-label">
          {isRTL ? `${earnedCount} מדבקות` : `${earnedCount} stickers`}
        </span>
      </div>

      {/* Category filter tabs */}
      <div className="hub-cat-tabs" role="tablist">
        <button
          className={`hub-cat-tab ${activeCategory === null ? 'hub-cat-tab--active' : ''}`}
          onClick={() => setActiveCategory(null)}
          role="tab"
          aria-selected={activeCategory === null}
        >
          {isRTL ? 'הכל' : 'All'} 🎮
        </button>
        {visibleCategories.map(cat => (
          <button
            key={cat.id}
            className={`hub-cat-tab ${activeCategory === cat.id ? 'hub-cat-tab--active' : ''}`}
            style={activeCategory === cat.id ? { borderColor: cat.accent, color: cat.accent, background: cat.color } : {}}
            onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
            role="tab"
            aria-selected={activeCategory === cat.id}
          >
            {cat.emoji} {t(lang, cat.labelKey)}
          </button>
        ))}
      </div>

      {/* Scrollable game sections */}
      <div className="hub-scroll">
        {displayedCategories.map(cat => (
          <section key={cat.id} className="hub-section">
            <div className="hub-section-pill" style={{ background: cat.color }}>
              <span className="hub-section-emoji">{cat.emoji}</span>
              <span className="hub-section-name" style={{ color: cat.accent }}>
                {t(lang, cat.labelKey)}
              </span>
            </div>

            <div className={`hub-grid hub-grid--${Math.min(cat.games.length, 2)}`}>
              {cat.games.map((game, i) => (
                <button
                  key={game.id}
                  className="hub-card"
                  style={{
                    background: game.bg,
                    '--card-glow': game.glow,
                    animationDelay: `${i * 70}ms`,
                  }}
                  onClick={() => onLaunch(game.id)}
                  aria-label={t(lang, game.nameKey)}
                >
                  <div className="hub-card-shine" />
                  <div className="hub-card-emoji">{game.emoji}</div>
                  <div className="hub-card-name">{t(lang, game.nameKey)}</div>
                  <div className="hub-card-desc">{t(lang, game.descKey)}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <footer className="hub-footer">
        <button
          className="hub-lang-btn"
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          aria-label={isRTL ? 'Switch to English' : 'עברית'}
        >
          {lang === 'he' ? '🇬🇧 EN' : '🇮🇱 עב'}
        </button>

        <button
          className={`hub-gear-btn ${gearHeld ? 'hub-gear-btn--held' : ''}`}
          onPointerDown={handleGearDown}
          onPointerUp={handleGearUp}
          onPointerLeave={handleGearUp}
          onPointerCancel={handleGearUp}
          aria-label={isRTL ? 'הגדרות הורים' : 'Parent settings'}
        >
          <span className="hub-gear-icon">⚙️</span>
          {gearHeld && (
            <svg className="hub-gear-ring" viewBox="0 0 40 40">
              <circle
                cx="20" cy="20" r="17"
                fill="none"
                stroke="rgba(124,58,237,0.6)"
                strokeWidth="3"
                strokeDasharray="107"
                strokeDashoffset="107"
                strokeLinecap="round"
                style={{ animation: `gearRingFill ${HOLD_MS}ms linear forwards` }}
              />
            </svg>
          )}
        </button>
      </footer>

      {showSettings && (
        <ParentSettings
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  );
}
