import React, { useState, useCallback, useRef } from 'react';
import './SpiderMan.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const WORDS = [
  { word: 'WEB', hint: '🕸️' },
  { word: 'CAT', hint: '🐱' },
  { word: 'DOG', hint: '🐶' },
  { word: 'SUN', hint: '☀️' },
  { word: 'RUN', hint: '🏃' },
  { word: 'FLY', hint: '🦋' },
  { word: 'HOP', hint: '🐸' },
  { word: 'MAP', hint: '🗺️' },
  { word: 'NET', hint: '🏐' },
  { word: 'ZIP', hint: '⚡' },
  { word: 'BIG', hint: '🦕' },
  { word: 'RED', hint: '🔴' },
];

const ALL_LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ';

function getChoices(correctLetter) {
  const pool = ALL_LETTERS.replace(correctLetter, '').split('');
  const distractors = [];
  while (distractors.length < 3) {
    const idx = Math.floor(Math.random() * pool.length);
    const l = pool.splice(idx, 1)[0];
    if (l !== correctLetter) distractors.push(l);
  }
  const choices = [correctLetter, ...distractors];
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

function shuffleWords(words) {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function SpiderMan({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [{ wordList, choices }] = useState(() => {
    const wl = shuffleWords(WORDS);
    return { wordList: wl, choices: wl.map(w => w.word.split('').map(l => getChoices(l))) };
  });
  const [wordIdx, setWordIdx] = useState(0);
  const [letterIdx, setLetterIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState(null); // 'good' | 'bad'
  const [locked, setLocked] = useState(false);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const soundOnRef = useRef(true);

  const done = wordIdx >= wordList.length;
  const currentWord = wordList[Math.min(wordIdx, wordList.length - 1)];
  const targetLetter = currentWord.word[letterIdx];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  const handleLetter = useCallback((letter) => {
    if (locked) return;
    if (letter === targetLetter) {
      setFlash('good');
      setLocked(true);
      if (soundOnRef.current) speak(letter, lang);
      const newTyped = typed + letter;
      setTimeout(() => {
        setFlash(null);
        setLocked(false);
        if (letterIdx + 1 >= currentWord.word.length) {
          // word complete
          const newStars = stars + 1;
          setStars(newStars);
          if (newStars % 5 === 0) setBalloons(b => b + 1);
          if (soundOnRef.current) speak(currentWord.word, lang);
          setTimeout(() => {
            setWordIdx(i => i + 1);
            setLetterIdx(0);
            setTyped('');
          }, 900);
        } else {
          setLetterIdx(l => l + 1);
          setTyped(newTyped);
        }
      }, 400);
    } else {
      setFlash('bad');
      if (soundOnRef.current) speak(lang === 'he' ? 'נסה שוב' : 'Try again', lang);
      setTimeout(() => setFlash(null), 600);
    }
  }, [locked, targetLetter, letterIdx, typed, currentWord, stars, lang]);

  if (done) {
    return (
      <div className="spider-game spider-win" dir={dir}>
        <div className="spider-win-top">🕷️🏆🕷️</div>
        <h1 className="spider-win-title">{lang === 'he' ? 'מדהים!' : 'Amazing, Spider-Kid!'}</h1>
        <p className="spider-win-sub">{lang === 'he' ? 'איתת את כל המילים!' : 'You spelled all the words!'}</p>
        <div className="spider-win-stars">
          {Array.from({ length: wordList.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="spider-collect-btn" onClick={onSuccess}>
          {lang === 'he' ? 'קבל מדבקה! 🌟' : 'Collect Sticker! 🌟'}
        </button>
        <button className="spider-play-again" onClick={() => { setWordIdx(0); setLetterIdx(0); setTyped(''); setStars(0); setBalloons(0); setFlash(null); }}>
          {lang === 'he' ? 'שחק שוב' : 'Play Again'}
        </button>
        <button className="spider-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  const displayWord = currentWord.word.split('').map((l, i) => {
    if (i < letterIdx) return l;
    if (i === letterIdx) return '_';
    return '_';
  });

  return (
    <div className="spider-game" dir={dir}>
      <header className="spider-hud">
        <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        <button className="spider-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
      </header>

      <div className="spider-header">
        <span className="spider-icon">🕷️</span>
        <h2 className="spider-prompt">{lang === 'he' ? 'איית את המילה!' : 'Spell the word!'}</h2>
      </div>

      <div className="spider-word-card">
        <div className="spider-hint-emoji">{currentWord.hint}</div>
        <div className="spider-word-display">
          {currentWord.word.split('').map((l, i) => (
            <span
              key={i}
              className={`spider-letter-slot${i < letterIdx ? ' spider-slot-filled' : ''}${i === letterIdx ? ' spider-slot-active' : ''}`}
            >
              {i < letterIdx ? typed[i] : i === letterIdx ? '?' : '_'}
            </span>
          ))}
        </div>
        <p className="spider-letter-count">
          {lang === 'he' ? `אות ${letterIdx + 1} מתוך ${currentWord.word.length}` : `Letter ${letterIdx + 1} of ${currentWord.word.length}`}
        </p>
      </div>

      <div className={`spider-choices${flash === 'good' ? ' spider-flash-good' : ''}${flash === 'bad' ? ' spider-flash-bad' : ''}`}>
        {choices[wordIdx][letterIdx].map(letter => (
          <button
            key={letter}
            className="spider-choice-btn"
            onClick={() => handleLetter(letter)}
            aria-label={letter}
          >
            {letter}
          </button>
        ))}
      </div>

      <div className="spider-web-deco" aria-hidden="true">🕸️</div>
    </div>
  );
}
