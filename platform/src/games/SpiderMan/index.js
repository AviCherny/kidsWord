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
  const [wordIdx, setWordIdx]     = useState(0);
  const [letterIdx, setLetterIdx] = useState(0);
  const [typed, setTyped]         = useState('');
  const [flash, setFlash]         = useState(null); // 'good' | 'bad'
  const [locked, setLocked]       = useState(false);
  const [stars, setStars]         = useState(0);
  const [balloons, setBalloons]   = useState(0);
  const [webShot, setWebShot]     = useState(null); // {fromX, fromY, toX, toY}
  const [spiderState, setSpiderState] = useState('idle'); // 'idle' | 'shoot'
  const soundOnRef  = useRef(true);
  const spiderRef   = useRef(null);
  const bubbleRefs  = useRef([]);

  const done = wordIdx >= wordList.length;
  const currentWord   = wordList[Math.min(wordIdx, wordList.length - 1)];
  const targetLetter  = currentWord.word[letterIdx];
  const starsInCycle  = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  const handleLetter = useCallback((letter, bubbleIdx) => {
    if (locked) return;

    if (letter === targetLetter) {
      // Shoot web at this bubble
      const spiderEl = spiderRef.current;
      const bubbleEl = bubbleRefs.current[bubbleIdx];
      if (spiderEl && bubbleEl) {
        const sr = spiderEl.getBoundingClientRect();
        const br = bubbleEl.getBoundingClientRect();
        setWebShot({
          fromX: sr.left + sr.width / 2,
          fromY: sr.top + sr.height / 3,
          toX: br.left + br.width / 2,
          toY: br.top + br.height / 2,
        });
        setSpiderState('shoot');
      }

      setFlash('good');
      setLocked(true);
      if (soundOnRef.current) speak(letter, lang);
      const newTyped = typed + letter;

      setTimeout(() => {
        setWebShot(null);
        setSpiderState('idle');
        setFlash(null);
        setLocked(false);

        if (letterIdx + 1 >= currentWord.word.length) {
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
      }, 650);
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
        <p className="spider-win-sub">{lang === 'he' ? 'איתת את כל המילים!' : 'You webbed all the words!'}</p>
        <div className="spider-win-stars">
          {Array.from({ length: wordList.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="spider-collect-btn" onClick={onSuccess}>
          {lang === 'he' ? 'קבל מדבקה! 🌟' : 'Collect Sticker! 🌟'}
        </button>
        <button className="spider-play-again" onClick={() => {
          setWordIdx(0); setLetterIdx(0); setTyped('');
          setStars(0); setBalloons(0); setFlash(null);
          setWebShot(null); setSpiderState('idle');
        }}>
          {lang === 'he' ? 'שחק שוב' : 'Play Again'}
        </button>
        <button className="spider-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  return (
    <div className="spider-game" dir={dir}>
      {/* City buildings silhouette */}
      <div className="spider-city" aria-hidden="true">
        {[65,110,80,130,70,95,85,115,75].map((h, i) => (
          <div key={i} className="spider-building" style={{ height: h }} />
        ))}
      </div>

      <header className="spider-hud">
        <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        <button className="spider-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
      </header>

      {/* Word display */}
      <div className="spider-word-area">
        <div className="spider-hint-emoji">{currentWord.hint}</div>
        <div className="spider-word-display">
          {currentWord.word.split('').map((l, i) => (
            <span
              key={i}
              className={[
                'spider-letter-slot',
                i < letterIdx  ? 'spider-slot-filled' : '',
                i === letterIdx ? 'spider-slot-active' : '',
              ].join(' ')}
            >
              {i < letterIdx ? typed[i] : i === letterIdx ? '?' : '_'}
            </span>
          ))}
        </div>
        <p className="spider-letter-count">
          {lang === 'he'
            ? `אות ${letterIdx + 1} מתוך ${currentWord.word.length}`
            : `Letter ${letterIdx + 1} of ${currentWord.word.length}`}
        </p>
      </div>

      {/* Web bubble letter choices */}
      <div className={`spider-bubbles${flash === 'bad' ? ' spider-shake' : ''}`}>
        {choices[wordIdx][letterIdx].map((letter, i) => (
          <button
            key={letter}
            ref={el => bubbleRefs.current[i] = el}
            className={`spider-bubble${flash === 'good' && letter === targetLetter ? ' spider-bubble-hit' : ''}`}
            onClick={() => handleLetter(letter, i)}
            aria-label={letter}
          >
            <span className="spider-web-ring r1" aria-hidden="true" />
            <span className="spider-web-ring r2" aria-hidden="true" />
            <span className="spider-web-ring r3" aria-hidden="true" />
            <span className="spider-bubble-letter">{letter}</span>
          </button>
        ))}
      </div>

      {/* Spider-Man character */}
      <div className="spider-man-area">
        <div ref={spiderRef} className={`spider-man-char spider-man-${spiderState}`}>
          🕷️
        </div>
        <p className="spider-web-cue">
          {lang === 'he' ? '🕸️ ירה ברשת לאות הנכונה!' : '🕸️ Web the right letter!'}
        </p>
      </div>

      {/* Web line */}
      {webShot && <WebLine pos={webShot} />}
    </div>
  );
}

function WebLine({ pos }) {
  const dx = pos.toX - pos.fromX;
  const dy = pos.toY - pos.fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle  = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <div
      className="spider-web-line-wrap"
      style={{
        left: pos.fromX,
        top: pos.fromY,
        width: length,
        transform: `translate(0, -50%) rotate(${angle}deg)`,
      }}
    >
      <div className="spider-web-line" />
    </div>
  );
}
