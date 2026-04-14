import React, { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '../../speak';
import './LetterMatch.css';

// Each item has emoji, isAnimal flag, and data per language
const ITEMS = [
  {
    emoji: '🍎', isAnimal: false,
    en: { word: 'Apple',    answer: 'A', choices: ['A','B','C','D'] },
    he: { word: 'תפוח',     answer: 'ת', choices: ['ש','ת','א','ב'] },
  },
  {
    emoji: '🐶', isAnimal: true,
    en: { word: 'Dog',      answer: 'D', choices: ['B','C','D','E'] },
    he: { word: 'כלב',      answer: 'כ', choices: ['י','כ','ל','מ'] },
  },
  {
    emoji: '🦁', isAnimal: true,
    en: { word: 'Lion',     answer: 'L', choices: ['J','K','L','M'] },
    he: { word: 'אריה',     answer: 'א', choices: ['א','ב','ג','ד'] },
  },
  {
    emoji: '🌙', isAnimal: false,
    en: { word: 'Moon',     answer: 'M', choices: ['K','L','M','N'] },
    he: { word: 'ירח',      answer: 'י', choices: ['ט','י','כ','ל'] },
  },
  {
    emoji: '🐘', isAnimal: true,
    en: { word: 'Elephant', answer: 'E', choices: ['C','D','E','F'] },
    he: { word: 'פיל',      answer: 'פ', choices: ['נ','ס','פ','צ'] },
  },
  {
    emoji: '🐸', isAnimal: true,
    en: { word: 'Frog',     answer: 'F', choices: ['D','E','F','G'] },
    he: { word: 'צפרדע',    answer: 'צ', choices: ['פ','צ','ק','ר'] },
  },
  {
    emoji: '🌞', isAnimal: false,
    en: { word: 'Sun',      answer: 'S', choices: ['Q','R','S','T'] },
    he: { word: 'שמש',      answer: 'ש', choices: ['ש','ת','א','ב'] },
  },
  {
    emoji: '🐱', isAnimal: true,
    en: { word: 'Cat',      answer: 'C', choices: ['A','B','C','D'] },
    he: { word: 'חתול',     answer: 'ח', choices: ['ו','ז','ח','ט'] },
  },
];

const CONFETTI_EMOJIS = ['⭐','🌟','✨','🎉','🎊','💫'];

export default function LetterMatch({ onSuccess, onExit }) {
  const [showHebrew, setShowHebrew] = useState(false);
  const [roundIdx, setRoundIdx]     = useState(0);
  const [feedback, setFeedback]     = useState(null); // 'correct' | 'wrong'
  const [stars, setStars]           = useState(0);
  const [done, setDone]             = useState(false);
  const [wrongChoice, setWrongChoice] = useState(null);
  const [confetti, setConfetti]     = useState([]);
  const [mascotMood, setMascotMood] = useState('neutral');
  const [roundKey, setRoundKey]     = useState(0);
  const [shooting, setShooting]     = useState(null); // { letter, fromX, fromY, deltaX, deltaY }
  const [displayShake, setDisplayShake] = useState(false);

  const displayRef = useRef(null);
  const item = ITEMS[roundIdx];
  const lang = showHebrew ? 'he' : 'en';
  const data = item[lang];

  const askQuestion = useCallback((idx, isHebrew) => {
    const it = ITEMS[idx];
    const d = it[isHebrew ? 'he' : 'en'];
    speak(d.word, isHebrew ? 'he' : 'en');
  }, []);

  useEffect(() => { askQuestion(roundIdx, showHebrew); }, [roundIdx, showHebrew, askQuestion]);

  function spawnConfetti() {
    const particles = Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: Math.random() * 340 - 170,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      delay: Math.random() * 0.35,
      size: 22 + Math.random() * 16,
    }));
    setConfetti(particles);
    setTimeout(() => setConfetti([]), 1600);
  }

  function evaluateChoice(choice) {
    if (choice === data.answer) {
      setFeedback('correct');
      setMascotMood('happy');
      setStars(s => s + 1);
      spawnConfetti();
      speak('Great job!', 'en', () => {
        setTimeout(() => {
          const next = roundIdx + 1;
          if (next >= ITEMS.length) {
            setDone(true);
          } else {
            setRoundIdx(next);
            setFeedback(null);
            setWrongChoice(null);
            setMascotMood('neutral');
            setRoundKey(k => k + 1);
          }
        }, 300);
      });
    } else {
      setWrongChoice(choice);
      setFeedback('wrong');
      setMascotMood('sad');
      setDisplayShake(true);
      speak('Try again!', 'en', () => {
        setTimeout(() => {
          setWrongChoice(null);
          setFeedback(null);
          setMascotMood('neutral');
          setDisplayShake(false);
        }, 400);
      });
    }
  }

  function handleChoice(choice, event) {
    if (feedback || shooting) return;

    const btn = event.currentTarget;
    const btnRect = btn.getBoundingClientRect();
    const displayRect = displayRef.current.getBoundingClientRect();

    const fromX = btnRect.left + btnRect.width / 2;
    const fromY = btnRect.top + btnRect.height / 2;
    const toX = displayRect.left + displayRect.width / 2;
    const toY = displayRect.top + displayRect.height / 2;

    setShooting({
      letter: choice,
      fromX,
      fromY,
      deltaX: toX - fromX,
      deltaY: toY - fromY,
    });

    // Evaluate after bullet reaches target
    setTimeout(() => {
      setShooting(null);
      evaluateChoice(choice);
    }, 480);
  }

  function handleLangToggle() {
    setShowHebrew(h => !h);
    setRoundIdx(0);
    setFeedback(null);
    setWrongChoice(null);
    setMascotMood('neutral');
    setShooting(null);
    setDisplayShake(false);
    setRoundKey(k => k + 1);
  }

  if (done) {
    return (
      <div className="lm-root">
        <div className="lm-done">
          <div className="lm-done-emoji">🌟🔤🌟</div>
          <h2>Letters Expert! 🎉</h2>
          <p>You matched all the letters!</p>
          <div className="lm-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="lm-btn lm-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="lm-btn lm-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const progress = (roundIdx / ITEMS.length) * 100;
  const isHe = showHebrew;

  return (
    <div className="lm-root">
      {/* Confetti */}
      <div className="lm-confetti-container">
        {confetti.map(p => (
          <div
            key={p.id}
            className="lm-confetti-star"
            style={{ '--cx': `${p.x}px`, animationDelay: `${p.delay}s`, fontSize: `${p.size}px` }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Flying letter bullet */}
      {shooting && (
        <div
          className="lm-bullet"
          style={{
            left: shooting.fromX,
            top: shooting.fromY,
            '--dx': `${shooting.deltaX}px`,
            '--dy': `${shooting.deltaY}px`,
          }}
        >
          {shooting.letter}
        </div>
      )}

      <div className="lm-header">
        <button className="lm-back" onClick={onExit}>←</button>
        <h1 className="lm-title">🔤 Letter Match</h1>
        <div className="lm-header-right">
          <button
            className={`lm-lang-toggle ${isHe ? 'lm-lang-toggle--active' : ''}`}
            onClick={handleLangToggle}
          >
            {isHe ? 'עב' : 'EN'}
          </button>
          <div className={`lm-mascot lm-mascot--${mascotMood}`}>
            {mascotMood === 'happy' ? '🤩' : mascotMood === 'sad' ? '😬' : '🐨'}
          </div>
        </div>
      </div>

      <div className="lm-progress">
        <div className="lm-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Display card */}
      <div
        ref={displayRef}
        key={`display-${roundKey}`}
        className={`lm-display ${displayShake ? 'lm-shake' : ''}`}
      >
        {item.isAnimal ? (
          <div className="lm-animal-wrap">
            <span className="lm-animal-layer lm-animal-top">{item.emoji}</span>
            <span className="lm-animal-layer lm-animal-bottom">{item.emoji}</span>
          </div>
        ) : (
          <div className="lm-big-emoji">{item.emoji}</div>
        )}
        <div className="lm-word" dir={isHe ? 'rtl' : 'ltr'}>{data.word}</div>
      </div>

      <div className="lm-prompt" dir={isHe ? 'rtl' : 'ltr'}>
        {isHe
          ? `מה האות הראשונה של "${data.word}"?`
          : `What letter does "${data.word}" start with?`}
      </div>

      {/* Choice buttons */}
      <div key={`choices-${roundKey}`} className="lm-choices">
        {data.choices.map((choice, i) => (
          <button
            key={i}
            className={[
              'lm-choice',
              feedback === 'correct' && choice === data.answer ? 'lm-choice--correct' : '',
              feedback === 'wrong'   && choice === data.answer ? 'lm-choice--reveal'  : '',
              wrongChoice === choice ? 'lm-choice--wrong' : '',
            ].join(' ')}
            style={{ animationDelay: `${i * 0.07}s` }}
            onClick={e => handleChoice(choice, e)}
          >
            {choice}
          </button>
        ))}
      </div>

      <button className="lm-replay" onClick={() => askQuestion(roundIdx, showHebrew)}>
        🔊 {isHe ? 'שמע שוב' : 'Hear Again'}
      </button>

      {feedback === 'correct' && (
        <div className="lm-feedback lm-feedback--good">
          {isHe ? '✅ כל הכבוד!' : '✅ Correct!'}
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="lm-feedback lm-feedback--bad">
          {isHe ? 'נסה שוב! 💪' : 'Try again! 💪'}
        </div>
      )}
    </div>
  );
}
