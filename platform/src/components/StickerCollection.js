import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { STICKERS, TOTAL_STICKERS } from '../data/stickers';
import { CANDY, TOTAL_CANDY } from '../data/candy';

export default function StickerCollection({ earnedIds, earnedCandyIds = [], onBack }) {
  const { lang } = useLanguage();
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const [tab, setTab] = useState('stickers');

  const earnedCount = earnedIds.filter(id => STICKERS.some(s => s.id === id)).length;
  const earnedCandyCount = earnedCandyIds.filter(id => CANDY.some(c => c.id === id)).length;

  const backBtn  = lang === 'he' ? '→ חזרה' : '← Back';
  const title    = lang === 'he' ? '⭐ האוסף שלי' : '⭐ My Collection';

  const stickerTabLabel = lang === 'he' ? '🌿 מדבקות' : '🌿 Stickers';
  const candyTabLabel   = lang === 'he' ? '🍭 ממתקים' : '🍭 Candy';
  const motivate = lang === 'he' ? '🎁 פריט חדש מחכה לך אחרי כל משחק!' : '🎁 A new item waits after every game!';

  const isStickers = tab === 'stickers';
  const items       = isStickers ? STICKERS : CANDY;
  const earnedList  = isStickers ? earnedIds : earnedCandyIds;
  const total       = isStickers ? TOTAL_STICKERS : TOTAL_CANDY;
  const earned      = isStickers ? earnedCount : earnedCandyCount;
  const progress    = isStickers
    ? (lang === 'he' ? `${earned} / ${total} מדבקות יער` : `${earned} / ${total} forest stickers`)
    : (lang === 'he' ? `${earned} / ${total} ממתקים`     : `${earned} / ${total} candies`);
  const complete    = isStickers
    ? (lang === 'he' ? '🎉 אספת את כל המדבקות!' : '🎉 You collected them all!')
    : (lang === 'he' ? '🎉 אספת את כל הממתקים!' : '🎉 You collected all the candy!');

  return (
    <div className="sticker-collection" dir={dir}>
      {/* Header */}
      <div className="sticker-collection-header">
        <button className="sticker-collection-back" onClick={onBack}>{backBtn}</button>
        <h1 className="sticker-collection-title">{title}</h1>
        <div style={{ width: 64 }} />
      </div>

      {/* Tabs */}
      <div className="sticker-collection-tabs">
        <button
          className={`sticker-collection-tab${tab === 'stickers' ? ' sticker-collection-tab--active' : ''}`}
          onClick={() => setTab('stickers')}
        >
          {stickerTabLabel}
        </button>
        <button
          className={`sticker-collection-tab${tab === 'candy' ? ' sticker-collection-tab--active' : ''}`}
          onClick={() => setTab('candy')}
        >
          {candyTabLabel}
        </button>
      </div>

      {/* Progress banner */}
      <div className="sticker-collection-banner">
        <p className="sticker-collection-progress">{progress}</p>
        <div className="sticker-collection-bar">
          <div
            className="sticker-collection-bar-fill"
            style={{ width: `${(earned / total) * 100}%` }}
          />
        </div>
        {earned === total && (
          <p className="sticker-collection-complete">{complete}</p>
        )}
      </div>

      {/* Grid */}
      <div className="sticker-collection-grid">
        {items.map(item => {
          const isEarned = earnedList.includes(item.id);
          const name = lang === 'he' ? item.he : item.en;
          return (
            <div
              key={item.id}
              className={`sticker-cell ${isEarned ? 'sticker-cell--earned' : 'sticker-cell--locked'}`}
            >
              <span className="sticker-cell-emoji">
                {isEarned ? item.emoji : '❓'}
              </span>
              {isEarned && (
                <span className="sticker-cell-name">{name}</span>
              )}
            </div>
          );
        })}
      </div>

      {earned < total && (
        <p className="sticker-collection-motivate">{motivate}</p>
      )}
    </div>
  );
}
