import React, { useState, useCallback, useRef } from 'react';
import './PJMasks.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const HEROES = [
  { id: 'catboy',  name: 'Catboy',  heName: 'חתולד',   emoji: '🐱', mask: '😼', color: '#1565c0', bg: 'linear-gradient(135deg,#1565c0,#42a5f5)', colorName: 'Blue',  heColorName: 'כחול' },
  { id: 'owlette', name: 'Owlette', heName: 'ינשופית', emoji: '🦉', mask: '🦉', color: '#c62828', bg: 'linear-gradient(135deg,#c62828,#ef5350)',  colorName: 'Red',   heColorName: 'אדום' },
  { id: 'gekko',   name: 'Gekko',   heName: 'גקו',     emoji: '🦎', mask: '🦎', color: '#2e7d32', bg: 'linear-gradient(135deg,#2e7d32,#66bb6a)',  colorName: 'Green', heColorName: 'ירוק' },
];

const ITEMS = [
  { emoji: '🔵', en: 'Blue circle',   he: 'עיגול כחול',  hero: 'catboy'  },
  { emoji: '🔴', en: 'Red circle',    he: 'עיגול אדום',  hero: 'owlette' },
  { emoji: '🟢', en: 'Green circle',  he: 'עיגול ירוק',  hero: 'gekko'   },
  { emoji: '💙', en: 'Blue heart',    he: 'לב כחול',     hero: 'catboy'  },
  { emoji: '❤️', en: 'Red heart',     he: 'לב אדום',     hero: 'owlette' },
  { emoji: '💚', en: 'Green heart',   he: 'לב ירוק',     hero: 'gekko'   },
  { emoji: '🌊', en: 'Blue wave',     he: 'גל כחול',     hero: 'catboy'  },
  { emoji: '🍎', en: 'Red apple',     he: 'תפוח אדום',   hero: 'owlette' },
  { emoji: '🌿', en: 'Green plant',   he: 'צמח ירוק',    hero: 'gekko'   },
  { emoji: '💎', en: 'Blue diamond',  he: 'יהלום כחול',  hero: 'catboy'  },
  { emoji: '🌹', en: 'Red rose',      he: 'ורד אדום',    hero: 'owlette' },
  { emoji: '🐢', en: 'Green turtle',  he: 'צב ירוק',     hero: 'gekko'   },
];

function shuffleItems(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function PJMasks({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [items] = useState(() => shuffleItems(ITEMS));
  const [itemIdx, setItemIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const soundOnRef = useRef(true);

  const done = itemIdx >= items.length;
  const current = items[Math.min(itemIdx, items.length - 1)];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  const handleHero = useCallback((heroId) => {
    if (locked) return;
    setLocked(true);
    setSelected(heroId);

    if (heroId === current.hero) {
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      const hero = HEROES.find(h => h.id === heroId);
      if (soundOnRef.current) speak(lang === 'he' ? 'נכון!' : `${hero.name}!`, lang);
      setTimeout(() => {
        setItemIdx(i => i + 1);
        setSelected(null);
        setLocked(false);
      }, 800);
    } else {
      if (soundOnRef.current) speak(lang === 'he' ? 'נסה שוב!' : 'Try again!', lang);
      setTimeout(() => {
        setSelected(null);
        setLocked(false);
      }, 1000);
    }
  }, [locked, current, stars, lang]);

  if (done) {
    return (
      <div className="pj-game pj-win" dir={dir}>
        <div className="pj-win-top">🐱🦉🦎</div>
        <h1 className="pj-win-title">{lang === 'he' ? 'כל הכבוד!' : 'PJ Masks are the best!'}</h1>
        <p className="pj-win-sub">{lang === 'he' ? 'מיינת את כל הפריטים!' : 'You sorted all the items!'}</p>
        <div className="pj-win-stars">
          {Array.from({ length: items.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="pj-collect-btn" onClick={onSuccess}>
          {lang === 'he' ? 'קבל מדבקה! 🌟' : 'Collect Sticker! 🌟'}
        </button>
        <button className="pj-play-again" onClick={() => { setItemIdx(0); setStars(0); setBalloons(0); }}>
          {lang === 'he' ? 'שחק שוב' : 'Play Again'}
        </button>
        <button className="pj-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  return (
    <div className="pj-game" dir={dir}>
      <header className="pj-hud">
        <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        <button className="pj-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
      </header>

      <div className="pj-night-sky" aria-hidden="true">
        <span>⭐</span><span>✨</span><span>🌙</span><span>✨</span><span>⭐</span>
      </div>

      <div className="pj-item-card">
        <div className="pj-item-emoji">{current.emoji}</div>
        <h2 className="pj-item-name">{lang === 'he' ? current.he : current.en}</h2>
        <p className="pj-item-prompt">{lang === 'he' ? 'לאיזה גיבור שייך?' : 'Which hero\'s color?'}</p>
      </div>

      <div className="pj-heroes-row">
        {HEROES.map(hero => {
          const isCorrect = selected === hero.id && hero.id === current.hero;
          const isWrong = selected === hero.id && hero.id !== current.hero;
          return (
            <button
              key={hero.id}
              className={`pj-hero-btn${isCorrect ? ' pj-correct' : ''}${isWrong ? ' pj-wrong' : ''}`}
              style={{ background: hero.bg, '--hero-glow': hero.color }}
              onClick={() => handleHero(hero.id)}
              aria-label={hero.name}
            >
              <span className="pj-hero-mask">{hero.mask}</span>
              <span className="pj-hero-name">{lang === 'he' ? hero.heName : hero.name}</span>
              <span className="pj-hero-color">{lang === 'he' ? hero.heColorName : hero.colorName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
