import React, { useState, useCallback, useRef } from 'react';
import './PawPatrol.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const PUPS = [
  { id: 'chase',    emoji: '🐕',     name: 'Chase',    heName: 'צ׳ייס',  badge: '🚔', color: '#1565c0' },
  { id: 'marshall', emoji: '🐶',     name: 'Marshall', heName: 'מרשל',   badge: '🚒', color: '#c62828' },
  { id: 'skye',     emoji: '🐩',     name: 'Skye',     heName: 'סקיי',   badge: '🚁', color: '#e91e63' },
  { id: 'rocky',    emoji: '🦊',     name: 'Rocky',    heName: 'רוקי',   badge: '♻️', color: '#2e7d32' },
  { id: 'rubble',   emoji: '🐾',     name: 'Rubble',   heName: 'ראבל',   badge: '🚜', color: '#e65100' },
  { id: 'zuma',     emoji: '🐕‍🦺', name: 'Zuma',     heName: 'זומה',   badge: '🌊', color: '#0277bd' },
];

const MISSIONS = [
  { emoji: '🏠🔥', en: 'A house is on fire!',          he: 'בית בוער!',                   answer: 'marshall' },
  { emoji: '🚗💥', en: 'There was a car accident!',     he: 'הייתה תאונת דרכים!',          answer: 'chase'    },
  { emoji: '🌊🆘', en: 'Someone is drowning!',          he: 'מישהו טובע!',                 answer: 'zuma'     },
  { emoji: '🐱🌲', en: 'A kitten is stuck in a tree!',  he: 'חתולה תקועה על עץ!',          answer: 'skye'     },
  { emoji: '🏗️🧱', en: 'We need to build a bridge!',   he: 'צריך לבנות גשר!',             answer: 'rubble'   },
  { emoji: '🗑️🌿', en: 'There\'s trash everywhere!',   he: 'יש אשפה בכל מקום!',           answer: 'rocky'    },
  { emoji: '🦹💰', en: 'A thief is running away!',      he: 'גנב ברח!',                    answer: 'chase'    },
  { emoji: '🚑🤕', en: 'Someone is hurt!',              he: 'מישהו נפגע!',                 answer: 'marshall' },
  { emoji: '🌊🏄', en: 'A surfer needs help in the sea!', he: 'גולש צלחות צריך עזרה בים!', answer: 'zuma'     },
  { emoji: '🎈🌤️', en: 'A balloon is stuck in the sky!', he: 'בלון תקוע בשמיים!',          answer: 'skye'     },
];

export default function PawPatrol({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [missionIdx, setMissionIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const soundOnRef = useRef(true);

  const done = missionIdx >= MISSIONS.length;
  const mission = MISSIONS[Math.min(missionIdx, MISSIONS.length - 1)];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  const handlePick = useCallback((pupId) => {
    if (locked) return;
    setLocked(true);
    setSelected(pupId);

    if (pupId === mission.answer) {
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      if (soundOnRef.current) speak(lang === 'he' ? 'כל הכבוד!' : 'Great job!', lang);
      setTimeout(() => {
        setMissionIdx(i => i + 1);
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
  }, [locked, mission, stars, lang]);

  if (done) {
    return (
      <div className="paw-game paw-win" dir={dir}>
        <div className="paw-win-top">🐾🏆🐾</div>
        <h1 className="paw-win-title">{lang === 'he' ? 'כל הכבוד!' : 'Paw Patrol saved the day!'}</h1>
        <p className="paw-win-sub">{lang === 'he' ? 'פתרת את כל המשימות!' : 'You solved all missions!'}</p>
        <div className="paw-win-stars">
          {Array.from({ length: MISSIONS.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="paw-collect-btn" onClick={onSuccess}>
          {lang === 'he' ? 'קבל מדבקה! 🌟' : 'Collect Sticker! 🌟'}
        </button>
        <button className="paw-play-again" onClick={() => { setMissionIdx(0); setStars(0); setBalloons(0); }}>
          {lang === 'he' ? 'שחק שוב' : 'Play Again'}
        </button>
        <button className="paw-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  return (
    <div className="paw-game" dir={dir}>
      <header className="paw-hud">
        <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        <button className="paw-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
      </header>

      <div className="paw-mission-card">
        <div className="paw-mission-emoji">{mission.emoji}</div>
        <h2 className="paw-mission-text">{lang === 'he' ? mission.he : mission.en}</h2>
        <p className="paw-mission-prompt">{lang === 'he' ? 'מי יכול לעזור?' : 'Who can help?'}</p>
      </div>

      <div className="paw-pups-grid">
        {PUPS.map(pup => {
          const isCorrect = selected === pup.id && pup.id === mission.answer;
          const isWrong = selected === pup.id && pup.id !== mission.answer;
          return (
            <button
              key={pup.id}
              className={`paw-pup-btn${isCorrect ? ' paw-correct' : ''}${isWrong ? ' paw-wrong' : ''}`}
              style={{ '--pup-color': pup.color }}
              onClick={() => handlePick(pup.id)}
              aria-label={pup.name}
            >
              <span className="paw-pup-badge">{pup.badge}</span>
              <span className="paw-pup-emoji">{pup.emoji}</span>
              <span className="paw-pup-name">{lang === 'he' ? pup.heName : pup.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
