import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { t } from '../i18n/translations';
import { TOTAL_STICKERS } from '../data/stickers';

const GAMES = [
  {
    id: 'bigvssmall',
    emoji: '🐘🐭',
    nameKey: 'bigVsSmallName',
    descKey: 'bigVsSmallDesc',
    color: '#FF8C00',
    bg: 'linear-gradient(135deg, #FF8C00, #FFB347)',
  },
  {
    id: 'memory',
    emoji: '🧠',
    nameKey: 'memoryGameName',
    descKey: 'memoryGameDesc',
    color: '#7B2D8B',
    bg: 'linear-gradient(135deg, #7B2D8B, #AB47BC)',
  },
  {
    id: 'social',
    emoji: '💬',
    nameKey: 'socialSkillsName',
    descKey: 'socialSkillsDesc',
    color: '#009688',
    bg: 'linear-gradient(135deg, #009688, #4DB6AC)',
  },
  {
    id: 'shooter',
    emoji: '🦸',
    nameKey: 'wordShooterName',
    descKey: 'wordShooterDesc',
    color: '#D32F2F',
    bg: 'linear-gradient(135deg, #D32F2F, #EF5350)',
  },
];

export default function Hub({ onLaunch, earnedCount, onOpenCollection }) {
  const { lang, setLang, dir } = useLanguage();

  const collectionLabel = lang === 'he'
    ? `🌿 ${earnedCount}/${TOTAL_STICKERS} מדבקות`
    : `🌿 ${earnedCount}/${TOTAL_STICKERS} stickers`;

  return (
    <div className="hub" dir={dir}>
      {/* Top bar */}
      <header className="hub-topbar">
        <h1 className="hub-title">{t(lang, 'appTitle')}</h1>
        <div className="hub-topbar-right">
          <button
            className="hub-collection-btn"
            onClick={onOpenCollection}
          >
            {collectionLabel}
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
          >
            {t(lang, 'langToggle')}
          </button>
        </div>
      </header>

      {/* Game cards */}
      <div className="hub-grid">
        {GAMES.map(game => (
          <button
            key={game.id}
            className="hub-card"
            style={{ background: game.bg }}
            onClick={() => onLaunch(game.id)}
          >
            <div className="hub-card-emoji">{game.emoji}</div>
            <div className="hub-card-name">{t(lang, game.nameKey)}</div>
            <div className="hub-card-desc">{t(lang, game.descKey)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
