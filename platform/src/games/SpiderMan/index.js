import React, { useState, useCallback, useRef, useEffect } from 'react';
import './SpiderMan.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const WORDS = [
  // Easy — 3–4 letter English words, all animals
  { word: 'CAT',       heWord: 'חתול',     hint: '🐱', level: 'easy'   },
  { word: 'DOG',       heWord: 'כלב',      hint: '🐶', level: 'easy'   },
  { word: 'COW',       heWord: 'פרה',      hint: '🐮', level: 'easy'   },
  { word: 'PIG',       heWord: 'חזיר',     hint: '🐷', level: 'easy'   },
  { word: 'BEE',       heWord: 'דבורה',    hint: '🐝', level: 'easy'   },
  { word: 'ANT',       heWord: 'נמלה',     hint: '🐜', level: 'easy'   },
  { word: 'FROG',      heWord: 'צפרדע',    hint: '🐸', level: 'easy'   },
  { word: 'DUCK',      heWord: 'ברווז',    hint: '🦆', level: 'easy'   },
  { word: 'BEAR',      heWord: 'דוב',      hint: '🐻', level: 'easy'   },
  { word: 'FISH',      heWord: 'דג',       hint: '🐟', level: 'easy'   },
  { word: 'BIRD',      heWord: 'ציפור',    hint: '🐦', level: 'easy'   },
  { word: 'CRAB',      heWord: 'סרטן',     hint: '🦀', level: 'easy'   },
  // Medium — 5–6 letter English words
  { word: 'TIGER',     heWord: 'נמר',      hint: '🐯', level: 'medium' },
  { word: 'SHARK',     heWord: 'כריש',     hint: '🦈', level: 'medium' },
  { word: 'EAGLE',     heWord: 'נשר',      hint: '🦅', level: 'medium' },
  { word: 'WHALE',     heWord: 'לוויתן',   hint: '🐋', level: 'medium' },
  { word: 'HORSE',     heWord: 'סוס',      hint: '🐴', level: 'medium' },
  { word: 'SNAKE',     heWord: 'נחש',      hint: '🐍', level: 'medium' },
  { word: 'CAMEL',     heWord: 'גמל',      hint: '🐪', level: 'medium' },
  { word: 'KOALA',     heWord: 'קואלה',    hint: '🐨', level: 'medium' },
  { word: 'PANDA',     heWord: 'פנדה',     hint: '🐼', level: 'medium' },
  { word: 'SHEEP',     heWord: 'כבש',      hint: '🐑', level: 'medium' },
  // Hard — 7+ letter English words
  { word: 'PENGUIN',   heWord: 'פינגווין', hint: '🐧', level: 'hard'   },
  { word: 'GORILLA',   heWord: 'גורילה',   hint: '🦍', level: 'hard'   },
  { word: 'DOLPHIN',   heWord: 'דולפין',   hint: '🐬', level: 'hard'   },
  { word: 'OCTOPUS',   heWord: 'תמנון',    hint: '🐙', level: 'hard'   },
  { word: 'KANGAROO',  heWord: 'קנגורו',   hint: '🦘', level: 'hard'   },
  { word: 'CROCODILE', heWord: 'תנין',     hint: '🐊', level: 'hard'   },
];

const HE_LETTER_NAMES = {
  'א': 'אלף', 'ב': 'בית', 'ג': 'גימל', 'ד': 'דלת',
  'ה': 'הא',  'ו': 'וו',  'ז': 'זין',  'ח': 'חית',
  'ט': 'טית', 'י': 'יוד', 'כ': 'כף',   'ל': 'למד',
  'מ': 'מם',  'נ': 'נון', 'ס': 'סמך',  'ע': 'עין',
  'פ': 'פא',  'צ': 'צדיק','ק': 'קוף',  'ר': 'ריש',
  'ש': 'שין', 'ת': 'תו',
};

const HE_LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
const EN_LETTERS = 'ABCDEFGHIJKLMNOPRSTUVWXYZ'.split('');

function getChoices(correctLetter, isHebrew) {
  const pool = (isHebrew ? HE_LETTERS : EN_LETTERS).filter(l => l !== correctLetter);
  const distractors = [];
  const used = new Set();
  while (distractors.length < 3 && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const l = pool[idx];
    if (!used.has(l)) { used.add(l); distractors.push(l); }
  }
  const result = [correctLetter, ...distractors];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSession(level, lang) {
  const isHebrew = lang === 'he';
  const pool = shuffleArray(WORDS.filter(w => w.level === level));
  const choices = pool.map(w => {
    const letters = (isHebrew ? w.heWord : w.word).split('');
    return letters.map(l => getChoices(l, isHebrew));
  });
  return { wordList: pool, choices };
}

const COPY = {
  en: {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    letterOf: (i, n) => `Letter ${i} of ${n}`,
    amazing: 'Amazing, Spider-Kid!',
    webAll: 'You webbed all the words!',
    collectSticker: 'Collect Sticker! 🌟',
    playAgain: 'Play Again',
    webCue: '🕸️ Web the right letter!',
    hint: '💡 Hint',
  },
  he: {
    easy: 'קל',
    medium: 'בינוני',
    hard: 'קשה',
    letterOf: (i, n) => `אות ${i} מתוך ${n}`,
    amazing: 'מדהים!',
    webAll: 'איתת את כל המילים!',
    collectSticker: 'קבל מדבקה! 🌟',
    playAgain: 'שחק שוב',
    webCue: '🕸️ ירה ברשת לאות הנכונה!',
    hint: '💡 רמז',

  },
};

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

export default function SpiderMan({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang] || COPY.en;

  const [level, setLevel] = useState('easy');
  const [session, setSession] = useState(() => buildSession('easy', lang));
  const [wordIdx, setWordIdx] = useState(0);
  const [letterIdx, setLetterIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [flash, setFlash] = useState(null); // null | 'good' | 'bad' | 'word-done'
  const [locked, setLocked] = useState(false);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [webShot, setWebShot] = useState(null);
  const [spiderState, setSpiderState] = useState('idle');
  const [showHint, setShowHint] = useState(false);

  const spiderRef = useRef(null);
  const bubbleRefs = useRef([]);
  const prevLangRef = useRef(lang);
  const levelRef = useRef(level);
  levelRef.current = level;

  // Reset when language changes
  useEffect(() => {
    if (prevLangRef.current === lang) return;
    prevLangRef.current = lang;
    const s = makeBlankState();
    setSession(buildSession(levelRef.current, lang));
    setWordIdx(s.wordIdx);
    setLetterIdx(s.letterIdx);
    setTyped(s.typed);
    setFlash(s.flash);
    setLocked(s.locked);
    setStars(s.stars);
    setBalloons(s.balloons);
    setWebShot(s.webShot);
    setSpiderState(s.spiderState);
  }, [lang]);

  // Reset hint whenever we move to a new word
  useEffect(() => { setShowHint(false); }, [wordIdx]);

  const startLevel = useCallback((newLevel, currentLang) => {
    const s = makeBlankState();
    setLevel(newLevel);
    setSession(buildSession(newLevel, currentLang));
    setWordIdx(s.wordIdx);
    setLetterIdx(s.letterIdx);
    setTyped(s.typed);
    setFlash(s.flash);
    setLocked(s.locked);
    setStars(s.stars);
    setBalloons(s.balloons);
    setWebShot(s.webShot);
    setSpiderState(s.spiderState);
    setShowHint(false);
  }, []);

  const { wordList, choices } = session;
  const done = wordIdx >= wordList.length;
  const currentWord = wordList[Math.min(wordIdx, wordList.length - 1)];
  const spelledWord = lang === 'he' ? currentWord.heWord : currentWord.word;
  const targetLetter = spelledWord[letterIdx];
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;
  const currentChoices = choices[wordIdx]?.[letterIdx] || [];

  const handleLetter = useCallback((letter, bubbleIdx) => {
    if (locked) return;

    if (letter === targetLetter) {
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
      const newTyped = typed + letter;

      // Clear web shot visual after 600ms (cosmetic only)
      setTimeout(() => {
        setWebShot(null);
        setSpiderState('idle');
      }, 600);

      // Proceed only after letter speech finishes; 1s fallback in case onEnd doesn't fire
      let letterDone = false;
      const afterLetter = () => {
        if (letterDone) return;
        letterDone = true;
        clearTimeout(letterFallback); // eslint-disable-line no-use-before-define

        if (letterIdx + 1 >= spelledWord.length) {
          // Word complete — show celebration
          const newStars = stars + 1;
          setStars(newStars);
          if (newStars % 5 === 0) setBalloons(b => b + 1);
          setFlash('word-done');
          const speakText = lang === 'he' ? currentWord.heWord : currentWord.word.toLowerCase();
          speak(speakText, lang, () => {
            setTimeout(() => {
              setFlash(null);
              setLocked(false);
              setWordIdx(i => i + 1);
              setLetterIdx(0);
              setTyped('');
            }, 800);
          });
        } else {
          setFlash(null);
          setLetterIdx(l => l + 1);
          setTyped(newTyped);
          setLocked(false);
        }
      };
      const letterFallback = setTimeout(afterLetter, 1000);
      const letterToSpeak = lang === 'he' ? (HE_LETTER_NAMES[letter] || letter) : letter;
      speak(letterToSpeak, lang, afterLetter);

    } else {
      // Wrong — brief lock to prevent spam, shake feedback
      setFlash('bad');
      setLocked(true);
      speak(lang === 'he' ? 'נסה שוב' : 'Try again', lang);
      setTimeout(() => {
        setFlash(null);
        setLocked(false);
      }, 700);
    }
  }, [locked, targetLetter, letterIdx, typed, spelledWord, currentWord, stars, lang]);

  if (done) {
    return (
      <div className="spider-game spider-win" dir={dir}>
        <div className="spider-win-top">🕷️🏆🕷️</div>
        <h1 className="spider-win-title">{copy.amazing}</h1>
        <p className="spider-win-sub">{copy.webAll}</p>
        <div className="spider-win-stars">
          {Array.from({ length: wordList.length }).map((_, i) => (
            <span key={i}>{i < stars ? '⭐' : '☆'}</span>
          ))}
        </div>
        <button className="spider-collect-btn" onClick={onSuccess}>{copy.collectSticker}</button>
        <button className="spider-play-again" onClick={() => startLevel(level, lang)}>{copy.playAgain}</button>
        <button className="spider-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  return (
    <div className="spider-game" dir={dir}>
      {/* Decorative spider webs — four corners */}
      <svg className="spider-web-deco spider-web-deco-tl" aria-hidden="true" viewBox="0 0 480 480" fill="none">
        <WebCornerPaths size={480} />
      </svg>
      <svg className="spider-web-deco spider-web-deco-tr" aria-hidden="true" viewBox="0 0 480 480" fill="none">
        <WebCornerPaths size={480} />
      </svg>
      <svg className="spider-web-deco spider-web-deco-bl" aria-hidden="true" viewBox="0 0 360 360" fill="none">
        <WebCornerPaths size={360} />
      </svg>
      <svg className="spider-web-deco spider-web-deco-br" aria-hidden="true" viewBox="0 0 360 360" fill="none">
        <WebCornerPaths size={360} />
      </svg>

      <div className="spider-city" aria-hidden="true">
        {[65,110,80,130,70,95,85,115,75].map((h, i) => (
          <div key={i} className="spider-building" style={{ height: h }} />
        ))}
      </div>

      {/* HUD: exit left | stars center | spacer right — language btn is fixed to the right, so exit goes left */}
      <header className="spider-hud" dir="ltr">
        <button className="spider-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
        <div className="spider-hud-stars">
          <StarBar starsInCycle={starsInCycle} balloons={balloons} />
        </div>
        <div className="spider-hud-end" aria-hidden="true" />
      </header>

      {/* Difficulty pills */}
      <div className="spider-levels">
        {['easy', 'medium', 'hard'].map(l => (
          <button
            key={l}
            className={`spider-level-pill${level === l ? ' is-active' : ''}`}
            onClick={() => startLevel(l, lang)}
          >
            {copy[l]}
          </button>
        ))}
      </div>

      {/* Word area */}
      <div className="spider-word-area">
        <div className="spider-hint-emoji">{currentWord.hint}</div>

        {flash === 'word-done' ? (
          <div className="spider-word-done">
            <div className="spider-word-display" dir={dir}>
              {spelledWord.split('').map((l, i) => (
                <span key={i} className="spider-letter-slot spider-slot-filled spider-slot-done">{l}</span>
              ))}
            </div>
            <div className="spider-animal-label">
              {lang === 'he'
                ? `${currentWord.heWord} · ${currentWord.word}`
                : currentWord.word}
            </div>
          </div>
        ) : (
          <>
            <div className="spider-word-actions">
              <button
                className="spider-sound-btn"
                aria-label="Say word"
                onClick={() => {
                  const speakText = lang === 'he' ? currentWord.heWord : currentWord.word.toLowerCase();
                  speak(speakText, lang);
                }}
              >
                🔊
              </button>
              <button
                className={`spider-hint-btn${showHint ? ' spider-hint-btn-on' : ''}`}
                onClick={() => setShowHint(h => !h)}
              >
                {copy.hint}
              </button>
            </div>
            {showHint && (
              <div className="spider-animal-label">
                {lang === 'he'
                  ? `${currentWord.heWord} · ${currentWord.word}`
                  : currentWord.word}
              </div>
            )}
            <div className="spider-word-display" dir={dir}>
              {spelledWord.split('').map((l, i) => (
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
              {copy.letterOf(letterIdx + 1, spelledWord.length)}
            </p>
          </>
        )}
      </div>

      {/* Letter choice bubbles */}
      <div className={`spider-bubbles${flash === 'bad' ? ' spider-shake' : ''}`}>
        {currentChoices.map((letter, i) => (
          <button
            key={`${wordIdx}-${letterIdx}-${i}`}
            ref={el => { bubbleRefs.current[i] = el; }}
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

      {/* Spider-Man */}
      <div className="spider-man-area">
        <div ref={spiderRef} className={`spider-man-char spider-man-${spiderState}`}>
          🕷️
        </div>
        <p className="spider-web-cue">{copy.webCue}</p>
      </div>

      {webShot && <WebLine pos={webShot} />}
    </div>
  );
}

function WebCornerPaths({ size = 160 }) {
  // Spider web radiating from corner (0,0)
  // 7 spoke angles covering the quadrant
  const angles = [0, 13, 26, 40, 54, 67, 80, 90];
  // Concentric arc radii
  const arcRadii = [
    size * 0.22,
    size * 0.38,
    size * 0.54,
    size * 0.70,
    size * 0.87,
  ];
  const spokeLen = size * 1.05;

  // Pre-compute spoke endpoints
  const spokes = angles.map(deg => {
    const rad = (deg * Math.PI) / 180;
    return { x: Math.cos(rad) * spokeLen, y: Math.sin(rad) * spokeLen };
  });

  return (
    <>
      {/* Radial spokes */}
      {spokes.map((pt, i) => (
        <line key={`s${i}`} x1="0" y1="0" x2={pt.x} y2={pt.y}
          stroke="rgba(255,255,255,0.18)" strokeWidth="0.9" />
      ))}
      {/* Concentric arcs */}
      {arcRadii.map((r, ri) => (
        <path key={`a${ri}`}
          d={`M${r},0 A${r},${r} 0 0,1 0,${r}`}
          stroke="rgba(255,255,255,0.14)" strokeWidth="0.9" fill="none" />
      ))}
      {/* Cross-threads between adjacent spokes at each arc radius */}
      {arcRadii.map((r, ri) =>
        spokes.slice(0, -1).map((sp, si) => {
          // Point on spoke si at radius r
          const t1 = r / spokeLen;
          const t2 = r / spokeLen;
          const x1 = sp.x * t1;
          const y1 = sp.y * t1;
          const x2 = spokes[si + 1].x * t2;
          const y2 = spokes[si + 1].y * t2;
          return (
            <line key={`c${ri}-${si}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="rgba(255,255,255,0.10)" strokeWidth="0.7" />
          );
        })
      )}
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
