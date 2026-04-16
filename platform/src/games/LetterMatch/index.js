import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { speak } from '../../speak';
import { getGameDifficulty, saveGameDifficulty } from '../../lib/settings';
import './LetterMatch.css';

const GAME_ID = 'letter-match';

const ITEMS = [
  {
    emoji: '🍎', isAnimal: false,
    en: { word: 'Apple', answer: 'A', choices: ['A', 'B', 'C', 'D'] },
    he: { word: 'תפוח', answer: 'ת', choices: ['ש', 'ת', 'א', 'ב'] },
  },
  {
    emoji: '🐶', isAnimal: true,
    en: { word: 'Dog', answer: 'D', choices: ['B', 'C', 'D', 'E'] },
    he: { word: 'כלב', answer: 'כ', choices: ['י', 'כ', 'ל', 'מ'] },
  },
  {
    emoji: '🦁', isAnimal: true,
    en: { word: 'Lion', answer: 'L', choices: ['J', 'K', 'L', 'M'] },
    he: { word: 'אריה', answer: 'א', choices: ['א', 'ב', 'ג', 'ד'] },
  },
  {
    emoji: '🌙', isAnimal: false,
    en: { word: 'Moon', answer: 'M', choices: ['K', 'L', 'M', 'N'] },
    he: { word: 'ירח', answer: 'י', choices: ['ט', 'י', 'כ', 'ל'] },
  },
  {
    emoji: '🐘', isAnimal: true,
    en: { word: 'Elephant', answer: 'E', choices: ['C', 'D', 'E', 'F'] },
    he: { word: 'פיל', answer: 'פ', choices: ['נ', 'ס', 'פ', 'צ'] },
  },
  {
    emoji: '🐸', isAnimal: true,
    en: { word: 'Frog', answer: 'F', choices: ['D', 'E', 'F', 'G'] },
    he: { word: 'צפרדע', answer: 'צ', choices: ['פ', 'צ', 'ק', 'ר'] },
  },
  {
    emoji: '🌞', isAnimal: false,
    en: { word: 'Sun', answer: 'S', choices: ['Q', 'R', 'S', 'T'] },
    he: { word: 'שמש', answer: 'ש', choices: ['ש', 'ת', 'א', 'ב'] },
  },
  {
    emoji: '🐱', isAnimal: true,
    en: { word: 'Cat', answer: 'C', choices: ['A', 'B', 'C', 'D'] },
    he: { word: 'חתול', answer: 'ח', choices: ['ו', 'ז', 'ח', 'ט'] },
  },
];

const CONFETTI_EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💫'];

const DIFFICULTY_PRESETS = [
  { itemCount: 4, choiceCount: 2, label: { en: 'Easy', he: 'קל' } },
  { itemCount: 5, choiceCount: 3, label: { en: 'Medium', he: 'בינוני' } },
  { itemCount: 6, choiceCount: 3, label: { en: 'Advanced', he: 'מתקדם' } },
  { itemCount: ITEMS.length, choiceCount: 4, label: { en: 'Hard', he: 'קשה' } },
];

export default function LetterMatch({ onSuccess, onExit }) {
  const [showHebrew, setShowHebrew] = useState(false);
  const [difficulty, setDifficulty] = useState(() => getGameDifficulty(GAME_ID, 1));
  const [roundIdx, setRoundIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const [wrongChoice, setWrongChoice] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [mascotMood, setMascotMood] = useState('neutral');
  const [roundKey, setRoundKey] = useState(0);
  const [shooting, setShooting] = useState(null);
  const [displayShake, setDisplayShake] = useState(false);

  const displayRef = useRef(null);
  const lang = showHebrew ? 'he' : 'en';
  const preset = DIFFICULTY_PRESETS[difficulty - 1] || DIFFICULTY_PRESETS[0];
  const activeItems = useMemo(
    () => ITEMS.slice(0, preset.itemCount).map((entry) => ({
      ...entry,
      en: { ...entry.en, choices: entry.en.choices.slice(0, preset.choiceCount) },
      he: { ...entry.he, choices: entry.he.choices.slice(0, preset.choiceCount) },
    })),
    [preset]
  );
  const item = activeItems[roundIdx];
  const data = item[lang];

  const askQuestion = useCallback((idx, isHebrew) => {
    const currentItem = activeItems[idx];
    if (!currentItem) return;
    const currentData = currentItem[isHebrew ? 'he' : 'en'];
    speak(currentData.word, isHebrew ? 'he' : 'en');
  }, [activeItems]);

  useEffect(() => {
    askQuestion(roundIdx, showHebrew);
  }, [roundIdx, showHebrew, askQuestion]);

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

  function clearRoundState() {
    setFeedback(null);
    setWrongChoice(null);
    setMascotMood('neutral');
    setShooting(null);
    setDisplayShake(false);
  }

  function resetGame(nextDifficulty = difficulty) {
    setDifficulty(nextDifficulty);
    setRoundIdx(0);
    setStars(0);
    setDone(false);
    setConfetti([]);
    clearRoundState();
    setRoundKey((key) => key + 1);
  }

  function evaluateChoice(choice) {
    if (choice === data.answer) {
      setFeedback('correct');
      setMascotMood('happy');
      setStars((value) => value + 1);
      spawnConfetti();
      speak(showHebrew ? 'כל הכבוד' : 'Great job!', showHebrew ? 'he' : 'en', () => {
        setTimeout(() => {
          const next = roundIdx + 1;
          if (next >= activeItems.length) {
            setDone(true);
            return;
          }

          setRoundIdx(next);
          clearRoundState();
          setRoundKey((key) => key + 1);
        }, 300);
      });
      return;
    }

    setWrongChoice(choice);
    setFeedback('wrong');
    setMascotMood('sad');
    setDisplayShake(true);
    speak(showHebrew ? 'נסה שוב' : 'Try again!', showHebrew ? 'he' : 'en', () => {
      setTimeout(() => {
        clearRoundState();
      }, 400);
    });
  }

  function handleChoice(choice, event) {
    if (feedback || shooting) return;

    const btnRect = event.currentTarget.getBoundingClientRect();
    const displayRect = displayRef.current?.getBoundingClientRect();
    if (!displayRect) return;

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

    setTimeout(() => {
      setShooting(null);
      evaluateChoice(choice);
    }, 480);
  }

  function handleLangToggle() {
    setShowHebrew((value) => !value);
    setRoundIdx(0);
    setDone(false);
    clearRoundState();
    setRoundKey((key) => key + 1);
  }

  function handleDifficultyChange(nextDifficulty) {
    if (nextDifficulty === difficulty) return;
    const savedDifficulty = saveGameDifficulty(GAME_ID, nextDifficulty);
    resetGame(savedDifficulty);
  }

  if (done) {
    return (
      <div className="lm-root">
        <div className="lm-done">
          <div className="lm-done-emoji">🌟🔤🌟</div>
          <h2>{showHebrew ? 'אלוף האותיות! 🎉' : 'Letters Expert! 🎉'}</h2>
          <p>{showHebrew ? 'התאמת את כל האותיות ברמה הזאת!' : 'You matched all the letters in this level!'}</p>
          <div className="lm-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="lm-btn lm-btn--primary" onClick={onSuccess}>
            {showHebrew ? 'קבל מדבקה 🌟' : 'Collect Sticker 🌟'}
          </button>
          <button className="lm-btn lm-btn--ghost" onClick={() => resetGame(difficulty)}>
            {showHebrew ? 'שחק שוב' : 'Play Again'}
          </button>
          <button className="lm-btn lm-btn--ghost" onClick={onExit}>
            {showHebrew ? 'חזור' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  const isHe = showHebrew;
  const progress = (roundIdx / activeItems.length) * 100;

  return (
    <div className="lm-root">
      <div className="lm-confetti-container">
        {confetti.map((particle) => (
          <div
            key={particle.id}
            className="lm-confetti-star"
            style={{ '--cx': `${particle.x}px`, animationDelay: `${particle.delay}s`, fontSize: `${particle.size}px` }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>

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
            {mascotMood === 'happy' ? '🥳' : mascotMood === 'sad' ? '😬' : '🐨'}
          </div>
        </div>
      </div>

      <div className="lm-progress">
        <div className="lm-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="lm-difficulty" role="group" aria-label={isHe ? 'רמת קושי' : 'Difficulty'}>
        <span className="lm-difficulty-label">{isHe ? 'רמת קושי' : 'Difficulty'}</span>
        <div className="lm-difficulty-pills">
          {DIFFICULTY_PRESETS.map((level, idx) => {
            const value = idx + 1;
            return (
              <button
                key={value}
                type="button"
                className={`lm-difficulty-pill${value === difficulty ? ' active' : ''}`}
                onClick={() => handleDifficultyChange(value)}
                aria-pressed={value === difficulty}
              >
                <span className="lm-difficulty-pill-num">{value}</span>
                <span className="lm-difficulty-pill-text">{level.label[isHe ? 'he' : 'en']}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        ref={displayRef}
        key={`display-${roundKey}`}
        className={`lm-display ${displayShake ? 'lm-shake' : ''}`}
      >
        {item.isAnimal ? (
          <div className="lm-animal-wrap">
            <span className="lm-animal-talking">{item.emoji}</span>
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

      <div key={`choices-${roundKey}`} className="lm-choices">
        {data.choices.map((choice, idx) => (
          <button
            key={choice}
            className={[
              'lm-choice',
              feedback === 'correct' && choice === data.answer ? 'lm-choice--correct' : '',
              feedback === 'wrong' && choice === data.answer ? 'lm-choice--reveal' : '',
              wrongChoice === choice ? 'lm-choice--wrong' : '',
            ].join(' ')}
            style={{ animationDelay: `${idx * 0.07}s` }}
            onClick={(event) => handleChoice(choice, event)}
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
          {isHe ? '✨ כל הכבוד!' : '✨ Correct!'}
        </div>
      )}
      {feedback === 'wrong' && (
        <div className="lm-feedback lm-feedback--bad">
          {isHe ? 'נסה שוב! ✖' : 'Try again! ✖'}
        </div>
      )}
    </div>
  );
}
