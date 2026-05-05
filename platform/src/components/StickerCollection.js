import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { STICKERS, TOTAL_STICKERS } from '../data/stickers';
import { CANDY, TOTAL_CANDY } from '../data/candy';
import { TOYS, TOTAL_TOYS } from '../data/toys';

export default function StickerCollection({ earnedIds, earnedCandyIds = [], earnedToyIds = [], onBack }) {
  const { lang } = useLanguage();
  const dir = lang === 'he' ? 'rtl' : 'ltr';
  const [tab, setTab] = useState('stickers');

  const earnedCount     = earnedIds.filter(id => STICKERS.some(s => s.id === id)).length;
  const earnedCandyCount = earnedCandyIds.filter(id => CANDY.some(c => c.id === id)).length;
  const earnedToyCount  = earnedToyIds.filter(id => TOYS.some(t => t.id === id)).length;

  const backBtn  = lang === 'he' ? '→ חזרה' : '← Back';
  const title    = lang === 'he' ? '⭐ האוסף שלי' : '⭐ My Collection';

  const stickerTabLabel = lang === 'he' ? '🌿 מדבקות' : '🌿 Stickers';
  const candyTabLabel   = lang === 'he' ? '🍭 ממתקים' : '🍭 Candy';
  const toysTabLabel    = lang === 'he' ? '🚗 צעצועים' : '🚗 Toys';
  const motivate = lang === 'he' ? '🎁 פריט חדש מחכה לך אחרי כל משחק!' : '🎁 A new item waits after every game!';

  const items      = tab === 'stickers' ? STICKERS : tab === 'candy' ? CANDY : TOYS;
  const earnedList = tab === 'stickers' ? earnedIds : tab === 'candy' ? earnedCandyIds : earnedToyIds;
  const total      = tab === 'stickers' ? TOTAL_STICKERS : tab === 'candy' ? TOTAL_CANDY : TOTAL_TOYS;
  const earned     = tab === 'stickers' ? earnedCount : tab === 'candy' ? earnedCandyCount : earnedToyCount;
  const progress   = tab === 'stickers'
    ? (lang === 'he' ? `${earned} / ${total} מדבקות יער` : `${earned} / ${total} forest stickers`)
    : tab === 'candy'
    ? (lang === 'he' ? `${earned} / ${total} ממתקים`     : `${earned} / ${total} candies`)
    : (lang === 'he' ? `${earned} / ${total} צעצועים`    : `${earned} / ${total} toys`);
  const complete   = tab === 'stickers'
    ? (lang === 'he' ? '🎉 אספת את כל המדבקות!' : '🎉 You collected them all!')
    : tab === 'candy'
    ? (lang === 'he' ? '🎉 אספת את כל הממתקים!' : '🎉 You collected all the candy!')
    : (lang === 'he' ? '🎉 אספת את כל הצעצועים!' : '🎉 You collected all the toys!');

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
        <button
          className={`sticker-collection-tab${tab === 'toys' ? ' sticker-collection-tab--active' : ''}`}
          onClick={() => setTab('toys')}
        >
          {toysTabLabel}
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
