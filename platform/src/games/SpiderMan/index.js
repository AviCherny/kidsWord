import React, { useCallback, useEffect, useRef, useState } from 'react';
import './SpiderMan.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const WORDS = [
  { word: 'CAT', heWord: 'חתול', hint: '🐱', level: 'easy' },
  { word: 'DOG', heWord: 'כלב', hint: '🐶', level: 'easy' },
  { word: 'COW', heWord: 'פרה', hint: '🐮', level: 'easy' },
  { word: 'PIG', heWord: 'חזיר', hint: '🐷', level: 'easy' },
  { word: 'BEE', heWord: 'דבורה', hint: '🐝', level: 'easy' },
  { word: 'ANT', heWord: 'נמלה', hint: '🐜', level: 'easy' },
  { word: 'FROG', heWord: 'צפרדע', hint: '🐸', level: 'easy' },
  { word: 'DUCK', heWord: 'ברווז', hint: '🦆', level: 'easy' },
  { word: 'BEAR', heWord: 'דוב', hint: '🐻', level: 'easy' },
  { word: 'FISH', heWord: 'דג', hint: '🐟', level: 'easy' },
  { word: 'BIRD', heWord: 'ציפור', hint: '🐦', level: 'easy' },
  { word: 'CRAB', heWord: 'סרטן', hint: '🦀', level: 'easy' },
  { word: 'TIGER', heWord: 'נמר', hint: '🐯', level: 'medium' },
  { word: 'SHARK', heWord: 'כריש', hint: '🦈', level: 'medium' },
  { word: 'EAGLE', heWord: 'נשר', hint: '🦅', level: 'medium' },
  { word: 'WHALE', heWord: 'לוויתן', hint: '🐋', level: 'medium' },
  { word: 'HORSE', heWord: 'סוס', hint: '🐴', level: 'medium' },
  { word: 'SNAKE', heWord: 'נחש', hint: '🐍', level: 'medium' },
  { word: 'CAMEL', heWord: 'גמל', hint: '🐪', level: 'medium' },
  { word: 'KOALA', heWord: 'קואלה', hint: '🐨', level: 'medium' },
  { word: 'PANDA', heWord: 'פנדה', hint: '🐼', level: 'medium' },
  { word: 'SHEEP', heWord: 'כבש', hint: '🐑', level: 'medium' },
  { word: 'PENGUIN', heWord: 'פינגווין', hint: '🐧', level: 'hard' },
  { word: 'GORILLA', heWord: 'גורילה', hint: '🦍', level: 'hard' },
  { word: 'DOLPHIN', heWord: 'דולפין', hint: '🐬', level: 'hard' },
  { word: 'OCTOPUS', heWord: 'תמנון', hint: '🐙', level: 'hard' },
  { word: 'KANGAROO', heWord: 'קנגורו', hint: '🦘', level: 'hard' },
  { word: 'CROCODILE', heWord: 'תנין', hint: '🐊', level: 'hard' },
];

const HE_LETTER_NAMES = {
  א: 'אלף',
  ב: 'בית',
  ג: 'גימל',
  ד: 'דלת',
  ה: 'הא',
  ו: 'וו',
  ז: 'זין',
  ח: 'חית',
  ט: 'טית',
  י: 'יוד',
  כ: 'כף',
  ל: 'למד',
  מ: 'מם',
  נ: 'נון',
  ס: 'סמך',
  ע: 'עין',
  פ: 'פא',
  צ: 'צדיק',
  ק: 'קוף',
  ר: 'ריש',
  ש: 'שין',
  ת: 'תו',
};

const HE_LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const EN_LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ'.split('');

const DIFFICULTY_CONFIG = {
  1: { level: 'easy', choiceCount: 4, allowHint: true },
  2: { level: 'medium', choiceCount: 4, allowHint: true },
  3: { level: 'hard', choiceCount: 4, allowHint: true },
  4: { level: 'hard', choiceCount: 5, allowHint: false },
};

const COPY = {
  en: {
    letterOf: (i, n) => `Letter ${i} of ${n}`,
    amazing: 'Amazing, Spider-Kid!',
    webAll: 'You webbed all the words!',
    collectSticker: 'Collect Sticker! 🌟',
    playAgain: 'Play Again',
    webCue: '🕸️ Web the right letter!',
    hint: '💡 Hint',
  },
  he: {
    letterOf: (i, n) => `אות ${i} מתוך ${n}`,
    amazing: 'מדהים!',
    webAll: 'איתרת את כל המילים!',
    collectSticker: 'קבל מדבקה! 🌟',
    playAgain: 'שחק שוב',
    webCue: '🕸️ ירה ברשת לאות הנכונה!',
    hint: '💡 רמז',
  },
};

function shuffleArray(arr) {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getChoices(correctLetter, isHebrew, choiceCount) {
  const pool = (isHebrew ? HE_LETTERS : EN_LETTERS).filter((letter) => letter !== correctLetter);
  const distractors = [];
  const used = new Set();

  while (distractors.length < choiceCount - 1 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const letter = pool[idx];
    if (!used.has(letter)) {
      used.add(letter);
      distractors.push(letter);
    }
  }

  return shuffleArray([correctLetter, ...distractors]);
}

function buildSession(level, lang, choiceCount) {
  const isHebrew = lang === 'he';
  const wordList = shuffleArray(WORDS.filter((entry) => entry.level === level));
  const choices = wordList.map((entry) => {
    const letters = (isHebrew ? entry.heWord : entry.word).split('');
    return letters.map((letter) => getChoices(letter, isHebrew, choiceCount));
  });
  return { wordList, choices };
}

function makeBlankState() {
  return {
    wordIdx: 0,
    letterIdx: 0,
    typed: '',
    flash: null,
    locked: false,
    stars: 0,
    balloons: 0,
    webShot: null,
    spiderState: 'idle',
  };
}

export default function SpiderMan({ onSuccess, onExit, sharedDifficulty = 1 }) {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang] || COPY.en;
  const difficulty = DIFFICULTY_CONFIG[sharedDifficulty] || DIFFICULTY_CONFIG[1];

  const [session, setSession] = useState(() => buildSession(difficulty.level, lang, difficulty.choiceCount));
  const [wordIdx, setWordIdx] = useState(0);
  const [letterIdx, setLetterIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState(null);
  const [locked, setLocked] = useState(false);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [webShot, setWebShot] = useState(null);
  const [spiderState, setSpiderState] = useState('idle');
  const [showHint, setShowHint] = useState(false);

  const spiderRef = useRef(null);
  const bubbleRefs = useRef([]);
  const prevLangRef = useRef(lang);

  const resetSession = useCallback((nextLang = lang) => {
    const blank = makeBlankState();
    setSession(buildSession(difficulty.level, nextLang, difficulty.choiceCount));
    setWordIdx(blank.wordIdx);
    setLetterIdx(blank.letterIdx);
    setTyped(blank.typed);
    setFlash(blank.flash);
    setLocked(blank.locked);
    setStars(blank.stars);
    setBalloons(blank.balloons);
    setWebShot(blank.webShot);
    setSpiderState(blank.spiderState);
    setShowHint(false);
  }, [difficulty.choiceCount, difficulty.level, lang]);

  useEffect(() => {
    if (prevLangRef.current === lang) return;
    prevLangRef.current = lang;
    resetSession(lang);
  }, [lang, resetSession]);

  useEffect(() => {
    setShowHint(false);
  }, [wordIdx]);

  const { wordList, choices } = session;
  const done = wordIdx >= wordList.length;
  const currentWord = wordList[Math.min(wordIdx, Math.max(0, wordList.length - 1))];
  const spelledWord = currentWord ? (lang === 'he' ? currentWord.heWord : currentWord.word) : '';
  const targetLetter = spelledWord[letterIdx];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;
  const currentChoices = choices[wordIdx]?.[letterIdx] || [];

  const handleLetter = useCallback((letter, bubbleIdx) => {
    if (locked || !currentWord) return;

    if (letter === targetLetter) {
      const spiderEl = spiderRef.current;
      const bubbleEl = bubbleRefs.current[bubbleIdx];
      if (spiderEl && bubbleEl) {
        const spiderRect = spiderEl.getBoundingClientRect();
        const bubbleRect = bubbleEl.getBoundingClientRect();
        setWebShot({
          fromX: spiderRect.left + spiderRect.width / 2,
          fromY: spiderRect.top + spiderRect.height / 3,
          toX: bubbleRect.left + bubbleRect.width / 2,
          toY: bubbleRect.top + bubbleRect.height / 2,
        });
        setSpiderState('shoot');
      }

      setFlash('good');
      setLocked(true);
      const nextTyped = typed + letter;

      setTimeout(() => {
        setWebShot(null);
        setSpiderState('idle');
      }, 600);

      let settled = false;
      const afterLetter = () => {
        if (settled) return;
        settled = true;
        if (letterIdx + 1 >= spelledWord.length) {
          const newStars = stars + 1;
          setStars(newStars);
          if (newStars % 5 === 0) {
            setBalloons((value) => value + 1);
          }
          setFlash('word-done');
          const speakText = lang === 'he' ? currentWord.heWord : currentWord.word.toLowerCase();
          speak(speakText, lang, () => {
            setTimeout(() => {
              setFlash(null);
              setLocked(false);
              setWordIdx((value) => value + 1);
              setLetterIdx(0);
              setTyped('');
            }, 800);
          });
        } else {
          setFlash(null);
          setLetterIdx((value) => value + 1);
          setTyped(nextTyped);
          setLocked(false);
        }
      };

      const fallbackTimer = setTimeout(afterLetter, 1000);
      const spokenLetter = lang === 'he' ? (HE_LETTER_NAMES[letter] || letter) : letter;
      speak(spokenLetter, lang, () => {
        clearTimeout(fallbackTimer);
        afterLetter();
      });
      return;
    }

    setFlash('bad');
    setLocked(true);
    speak(lang === 'he' ? 'נסה שוב' : 'Try again', lang);
    setTimeout(() => {
      setFlash(null);
      setLocked(false);
    }, 700);
  }, [currentWord, lang, letterIdx, locked, spelledWord, stars, targetLetter, typed]);

  if (!currentWord && !done) {
    return null;
  }

  if (done) {
    return (
      <div className="spider-game spider-win" dir={dir}>
        <div className="spider-win-top">🕷️🏆🕷️</div>
        <h1 className="spider-win-title">{copy.amazing}</h1>
        <p className="spider-win-sub">{copy.webAll}</p>
        <div className="spider-win-stars">
          {Array.from({ length: wordList.length }).map((_, index) => (
            <span key={index}>{index < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="spider-collect-btn" onClick={onSuccess}>{copy.collectSticker}</button>
        <button className="spider-play-again" onClick={() => resetSession(lang)}>{copy.playAgain}</button>
      </div>
    );
  }

  return (
    <div className="spider-game" dir={dir}>
      <svg className="spider-web-corner spider-web-corner-tl" aria-hidden="true" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <WebCornerPaths />
      </svg>
      <svg className="spider-web-corner spider-web-corner-tr" aria-hidden="true" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <WebCornerPaths />
      </svg>

      <div className="spider-city" aria-hidden="true">
        {[65, 110, 80, 130, 70, 95, 85, 115, 75].map((height, index) => (
          <div key={index} className="spider-building" style={{ height }} />
        ))}
      </div>

      <header className="spider-hud" dir="ltr">
        <div className="spider-hud-stars">
          <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        </div>
      </header>

      <div className="spider-word-area">
        <div className="spider-hint-emoji">{currentWord.hint}</div>

        {flash === 'word-done' ? (
          <div className="spider-word-done">
            <div className="spider-word-display" dir={dir}>
              {spelledWord.split('').map((letter, index) => (
                <span key={index} className="spider-letter-slot spider-slot-filled spider-slot-done">{letter}</span>
              ))}
            </div>
            <div className="spider-animal-label">
              {lang === 'he' ? `${currentWord.heWord} · ${currentWord.word}` : currentWord.word}
            </div>
          </div>
        ) : (
          <>
            <div className="spider-word-controls">
              <button
                className="spider-speak-btn"
                onClick={() => {
                  const speakText = lang === 'he' ? currentWord.heWord : currentWord.word.toLowerCase();
                  speak(speakText, lang);
                }}
                aria-label={lang === 'he' ? 'השמע מילה' : 'Hear word'}
              >
                🔊
              </button>
              {difficulty.allowHint && (
                <button
                  className={`spider-hint-btn${showHint ? ' spider-hint-btn-on' : ''}`}
                  onClick={() => setShowHint((v) => !v)}
                >
                  {copy.hint}
                </button>
              )}
            </div>
            {showHint && (
              <div className="spider-animal-label">
                {lang === 'he' ? `${currentWord.heWord} · ${currentWord.word}` : currentWord.word}
              </div>
            )}
            <div className="spider-word-display" dir={dir}>
              {spelledWord.split('').map((letter, index) => (
                <span
                  key={index}
                  className={[
                    'spider-letter-slot',
                    index < letterIdx ? 'spider-slot-filled' : '',
                    index === letterIdx ? 'spider-slot-active' : '',
                  ].join(' ')}
                >
                  {index < letterIdx ? typed[index] : index === letterIdx ? '?' : '_'}
                </span>
              ))}
            </div>
            <p className="spider-letter-count">{copy.letterOf(letterIdx + 1, spelledWord.length)}</p>
          </>
        )}
      </div>

      <div className={`spider-bubbles${flash === 'bad' ? ' spider-shake' : ''}`}>
        {currentChoices.map((letter, index) => (
          <button
            key={`${wordIdx}-${letterIdx}-${index}`}
            ref={(element) => { bubbleRefs.current[index] = element; }}
            className={`spider-bubble${flash === 'good' && letter === targetLetter ? ' spider-bubble-hit' : ''}`}
            onClick={() => handleLetter(letter, index)}
            aria-label={letter}
          >
            <span className="spider-web-ring r1" aria-hidden="true" />
            <span className="spider-web-ring r2" aria-hidden="true" />
            <span className="spider-web-ring r3" aria-hidden="true" />
            <span className="spider-bubble-letter">{letter}</span>
          </button>
        ))}
      </div>

      <div className="spider-man-area">
        <div ref={spiderRef} className={`spider-man-char spider-man-${spiderState}`}>🕷️</div>
        <p className="spider-web-cue">{copy.webCue}</p>
      </div>

      {webShot && <WebLine pos={webShot} />}
    </div>
  );
}

function WebCornerPaths() {
  const angles = [0, 15, 30, 45, 60, 75, 90];
  const radii = [35, 60, 85, 110];

  return (
    <>
      {angles.map((deg, index) => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line
            key={index}
            x1="0"
            y1="0"
            x2={Math.cos(rad) * 115}
            y2={Math.sin(rad) * 115}
            stroke="rgba(255,255,255,0.13)"
            strokeWidth="0.8"
          />
        );
      })}
      {radii.map((radius, index) => (
        <path
          key={index}
          d={`M${radius},0 A${radius},${radius} 0 0,1 0,${radius}`}
          stroke="rgba(255,255,255,0.11)"
          strokeWidth="0.8"
          fill="none"
        />
      ))}
    </>
  );
}

function WebLine({ pos }) {
  const dx = pos.toX - pos.fromX;
  const dy = pos.toY - pos.fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

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
