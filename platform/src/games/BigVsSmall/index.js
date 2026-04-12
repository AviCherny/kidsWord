import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BigVsSmall.css';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const PAIRS = [
  { big: { emoji: '🐘', name: 'Elephant', heName: 'פיל' },   small: { emoji: '🐭', name: 'Mouse',    heName: 'עכבר' } },
  { big: { emoji: '🦒', name: 'Giraffe',  heName: "ג'ירף" }, small: { emoji: '🐕', name: 'Dog',      heName: 'כלב' } },
  { big: { emoji: '🐄', name: 'Cow',      heName: 'פרה' },   small: { emoji: '🐱', name: 'Cat',      heName: 'חתול' } },
  { big: { emoji: '🦁', name: 'Lion',     heName: 'אריה' },  small: { emoji: '🐇', name: 'Rabbit',   heName: 'ארנב' } },
  { big: { emoji: '🐊', name: 'Crocodile',heName: 'תנין' },  small: { emoji: '🐸', name: 'Frog',     heName: 'צפרדע' } },
  { big: { emoji: '🦓', name: 'Zebra',    heName: 'זברה' },  small: { emoji: '🐿', name: 'Squirrel', heName: 'סנאי' } },
  { big: { emoji: '🐻', name: 'Bear',     heName: 'דוב' },   small: { emoji: '🐹', name: 'Hamster',  heName: 'אוגר' } },
  { big: { emoji: '🦅', name: 'Eagle',    heName: 'נשר' },   small: { emoji: '🐦', name: 'Bird',     heName: 'ציפור' } },
  { big: { emoji: '🐴', name: 'Horse',    heName: 'סוס' },   small: { emoji: '🐰', name: 'Bunny',    heName: 'ארנב' } },
  { big: { emoji: '🦏', name: 'Rhino',    heName: 'קרנף' },  small: { emoji: '🐝', name: 'Bee',      heName: 'דבורה' } },
];

function randomSides() {
  return PAIRS.map(() => (Math.random() < 0.5 ? 'left' : 'right'));
}

export default function BigVsSmall({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [pairIndex, setPairIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false);
  const [sides] = useState(randomSides);
  const idleTimer = useRef(null);

  const done = pairIndex >= PAIRS.length;
  const safeIndex = Math.min(pairIndex, PAIRS.length - 1);
  const pairData = PAIRS[safeIndex];
  const bigSide = sides[safeIndex];
  const left = bigSide === 'left' ? pairData.big : pairData.small;
  const right = bigSide === 'left' ? pairData.small : pairData.big;

  const animalName = (animal) => lang === 'he' ? animal.heName : animal.name;

  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked) return;
    idleTimer.current = setTimeout(() => {
      setHighlight(bigSide);
    }, 3000);
  }, [locked, bigSide]);

  useEffect(() => {
    if (done) {
      if (soundOnRef.current) speak(t(lang, 'amazing'), lang);
      return;
    }
    if (soundOnRef.current) speak(t(lang, 'whoIsBigger'), lang);
    setWinner(null);
    setHighlight(null);
    setLocked(false);
  }, [pairIndex, done, lang]);

  useEffect(() => {
    resetIdle();
    return () => clearTimeout(idleTimer.current);
  }, [resetIdle, pairIndex]);

  function handleTap(side) {
    if (locked) return;
    clearTimeout(idleTimer.current);
    setLocked(true);

    if (side === bigSide) {
      setWinner(side);
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      if (soundOnRef.current) speak(t(lang, 'correct'), lang);
      setTimeout(() => {
        const nextIndex = pairIndex + 1;
        if (nextIndex >= PAIRS.length) {
          setPairIndex(nextIndex);
          // trigger onSuccess after showing done screen briefly
          setTimeout(() => onSuccess(), 1200);
        } else {
          setPairIndex(nextIndex);
        }
      }, 700);
    } else {
      setHighlight(bigSide);
      if (soundOnRef.current) speak(t(lang, 'thisOneIsBigger'), lang);
      setTimeout(() => {
        setHighlight(null);
        setLocked(false);
      }, 2000);
    }
  }

  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  if (done) {
    return (
      <div className="bvs-game bvs-win" dir={dir}>
        <div className="bvs-win-emoji">🏆</div>
        <h1 className="bvs-win-title">{t(lang, 'amazing')}</h1>
        <p className="bvs-win-sub">{t(lang, 'youFinishedAll')}</p>
        <div className="bvs-win-balloons">{'🎈'.repeat(Math.max(balloons, 1))}</div>
        <button
          className="bvs-play-again"
          onClick={() => { setPairIndex(0); setStars(0); setBalloons(0); }}
        >
          {t(lang, 'playAgain')}
        </button>
        <button className="bvs-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  return (
    <div className="bvs-game" dir={dir}>
      <header className="bvs-hud">
        <div className="bvs-hud-top">
          <StarBar starsInCycle={starsInCycle} balloons={balloons} />
          <div className="bvs-hud-controls">
            <button
              className={`bvs-sound-btn${soundOn ? ' on' : ''}`}
              onClick={() => setSoundOn(s => !s)}
              aria-label={soundOn ? 'Sound on' : 'Sound off'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="bvs-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
          </div>
        </div>
      </header>

      <h1 className="bvs-prompt">{t(lang, 'whoIsBigger')}</h1>

      <div className="bvs-arena">
        {[{ side: 'left', animal: left }, { side: 'right', animal: right }].map(({ side, animal }) => {
          const isWinner = winner === side;
          const isHighlighted = highlight === side;
          return (
            <button
              key={side}
              className={`bvs-animal-btn${isWinner ? ' grow' : ''}${isHighlighted ? ' pulse' : ''}`}
              onClick={() => handleTap(side)}
              aria-label={animalName(animal)}
            >
              <span className="bvs-animal-emoji">{animal.emoji}</span>
              <span className="bvs-animal-name">{animalName(animal)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
