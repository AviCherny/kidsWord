import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TOTAL_STICKERS } from '../data/stickers';

export default function StickerReveal({ sticker, earnedCount, isNew, onDone }) {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay so the overlay fades in after creature exits
    const t = setTimeout(() => setVisible(true), 80);
    // Play sticker sound when reveal appears
    const audio = new Audio('/audio/medabeka.m4a');
    audio.play().catch(() => {});
    return () => clearTimeout(t);
  }, []);

  const name = lang === 'he' ? sticker.he : sticker.en;
  const newLabel  = lang === 'he' ? '🎁 מדבקה חדשה!' : '🎁 New Sticker!';
  const dupeLabel = lang === 'he' ? '✨ מדבקה לאוסף!' : '✨ Sticker collected!';
  const countLine = lang === 'he'
    ? `${earnedCount}/${TOTAL_STICKERS} מדבקות באוסף שלך 🌿`
    : `${earnedCount}/${TOTAL_STICKERS} stickers in your collection 🌿`;
  const btnLabel = lang === 'he' ? 'כל הכבוד! 🎉' : 'Awesome! 🎉';

  return (
    <div
      className={`sticker-reveal-backdrop ${visible ? 'sticker-reveal-backdrop--visible' : ''}`}
      onClick={onDone}
    >
      <div
        className={`sticker-reveal-card ${visible ? 'sticker-reveal-card--visible' : ''}`}
        onClick={e => e.stopPropagation()}
        dir={lang === 'he' ? 'rtl' : 'ltr'}
      >
        <p className="sticker-reveal-label">{isNew ? newLabel : dupeLabel}</p>

        <div className="sticker-reveal-emoji">{sticker.emoji}</div>

        <div className="sticker-reveal-info">
          <p className="sticker-reveal-name">{name}</p>
          <p className="sticker-reveal-count">{countLine}</p>
        </div>

        <button className="sticker-reveal-btn" onClick={onDone}>
          {btnLabel}
        </button>
      </div>
    </div>
  );
}
