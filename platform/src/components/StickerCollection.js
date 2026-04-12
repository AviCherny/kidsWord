import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { STICKERS, TOTAL_STICKERS } from '../data/stickers';

export default function StickerCollection({ earnedIds, onBack }) {
  const { lang } = useLanguage();
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const earnedCount = earnedIds.filter(id => STICKERS.some(s => s.id === id)).length;

  const title    = lang === 'he' ? '⭐ האוסף שלי' : '⭐ My Collection';
  const backBtn  = lang === 'he' ? '→ חזרה'       : '← Back';
  const progress = lang === 'he'
    ? `${earnedCount} / ${TOTAL_STICKERS} מדבקות יער`
    : `${earnedCount} / ${TOTAL_STICKERS} forest stickers`;
  const complete = lang === 'he' ? '🎉 אספת את כל המדבקות!' : '🎉 You collected them all!';
  const motivate = lang === 'he' ? '🎁 מדבקה חדשה מחכה לך אחרי כל משחק!' : '🎁 A new sticker waits after every game!';

  return (
    <div className="sticker-collection" dir={dir}>
      {/* Header */}
      <div className="sticker-collection-header">
        <button className="sticker-collection-back" onClick={onBack}>{backBtn}</button>
        <h1 className="sticker-collection-title">{title}</h1>
        <div style={{ width: 64 }} />
      </div>

      {/* Progress banner */}
      <div className="sticker-collection-banner">
        <p className="sticker-collection-progress">{progress}</p>
        <div className="sticker-collection-bar">
          <div
            className="sticker-collection-bar-fill"
            style={{ width: `${(earnedCount / TOTAL_STICKERS) * 100}%` }}
          />
        </div>
        {earnedCount === TOTAL_STICKERS && (
          <p className="sticker-collection-complete">{complete}</p>
        )}
      </div>

      {/* Grid */}
      <div className="sticker-collection-grid">
        {STICKERS.map(sticker => {
          const earned = earnedIds.includes(sticker.id);
          const name = lang === 'he' ? sticker.he : sticker.en;
          return (
            <div
              key={sticker.id}
              className={`sticker-cell ${earned ? 'sticker-cell--earned' : 'sticker-cell--locked'}`}
            >
              <span className="sticker-cell-emoji">
                {earned ? sticker.emoji : '❓'}
              </span>
              {earned && (
                <span className="sticker-cell-name">{name}</span>
              )}
            </div>
          );
        })}
      </div>

      {earnedCount < TOTAL_STICKERS && (
        <p className="sticker-collection-motivate">{motivate}</p>
      )}
    </div>
  );
}
