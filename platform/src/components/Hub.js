import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { TOTAL_STICKERS } from '../data/stickers';
import ParentSettings from './ParentSettings';
import { getSettings } from '../lib/settings';

const ALL_GAMES = [
  {
    id: 'bigvssmall',
    emoji: '🐘🐭',
    nameKey: 'bigVsSmallName',
    descKey: 'bigVsSmallDesc',
    bg: 'linear-gradient(145deg, #FF8C00, #FFB347)',
    glow: 'rgba(255, 140, 0, 0.35)',
  },
  {
    id: 'memory',
    emoji: '🧠',
    nameKey: 'memoryGameName',
    descKey: 'memoryGameDesc',
    bg: 'linear-gradient(145deg, #7B2D8B, #C06DC8)',
    glow: 'rgba(123, 45, 139, 0.35)',
  },
  {
    id: 'social',
    emoji: '💬',
    nameKey: 'socialSkillsName',
    descKey: 'socialSkillsDesc',
    bg: 'linear-gradient(145deg, #009688, #4DB6AC)',
    glow: 'rgba(0, 150, 136, 0.35)',
  },
  {
    id: 'shooter',
    emoji: '🦸',
    nameKey: 'wordShooterName',
    descKey: 'wordShooterDesc',
    bg: 'linear-gradient(145deg, #D32F2F, #EF5350)',
    glow: 'rgba(211, 47, 47, 0.35)',
  },
];

// Rotate daily so the mascot feels fresh
const MASCOTS = ['🌟', '🦊', '🐸', '🦄', '🐻', '🌈', '🎯'];

export default function Hub({ onLaunch, earnedCount, onOpenCollection, onSettingsChange }) {
  const { lang, setLang, dir } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getSettings);
  const [gearHeld, setGearHeld] = useState(false);
  const pressTimer = useRef(null);
  const HOLD_MS = 1400;

  const isRTL = lang === 'he';
  const mascot = MASCOTS[new Date().getDay() % MASCOTS.length];
  const pct = Math.round((earnedCount / TOTAL_STICKERS) * 100);
  const games = ALL_GAMES.filter(g => !settings.hiddenGames.includes(g.id));

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

  return (
    <div className="hub" dir={dir}>

      {/* Decorative blobs */}
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

      {/* Game grid */}
      <div className={`hub-grid hub-grid--${games.length}`}>
        {games.map((game, i) => (
          <button
            key={game.id}
            className="hub-card"
            style={{
              background: game.bg,
              '--card-glow': game.glow,
              animationDelay: `${i * 80}ms`,
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
