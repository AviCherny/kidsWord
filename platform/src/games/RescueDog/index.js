import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';

const SCENES = [
  {
    id: 'forest',
    emoji: '🌲',
    title: { en: 'Forest Search', he: 'חיפוש ביער' },
    subtitle: { en: 'Tap where the person is hiding.', he: 'לחצו איפה שהאדם מתחבא.' },
    sky: 'linear-gradient(180deg, #7ed6ff 0%, #b7f6c1 60%, #7fcf6b 100%)',
    ground: '#5cb85c',
    objects: [
      { id: 'bush', emoji: '🌿', label: { en: 'bush', he: 'שיח' } },
      { id: 'log', emoji: '🪵', label: { en: 'log', he: 'גזע' } },
      { id: 'tent', emoji: '⛺', label: { en: 'tent', he: 'אוהל' } },
    ],
  },
  {
    id: 'storm',
    emoji: '🚒',
    title: { en: 'Rescue Area', he: 'אזור חילוץ' },
    subtitle: { en: 'Look carefully and find the person.', he: 'חפשו היטב ומצאו את האדם.' },
    sky: 'linear-gradient(180deg, #b6d3ff 0%, #fce38a 58%, #f7b267 100%)',
    ground: '#d98a4e',
    objects: [
      { id: 'box', emoji: '📦', label: { en: 'box', he: 'קופסה' } },
      { id: 'rock', emoji: '🪨', label: { en: 'rock', he: 'סלע' } },
      { id: 'barrel', emoji: '🛢️', label: { en: 'barrel', he: 'חבית' } },
    ],
  },
];

const WORDS = ['person', 'help', 'water'];
const GOAL_STARS = 3;

const TEXT = {
  en: {
    title: 'Rescue Dog',
    prompt: 'Find the person!',
    success: 'Good job!',
    tryAgain: 'Try again!',
    helpCue: 'Help!',
    thanksCue: 'Thank you!',
    hint: 'The glowing place has the person.',
    stars: 'Stars',
    round: 'Round',
    hero: 'You are a rescue hero!',
    heroSub: 'Three people were found safely.',
    collect: 'Collect Sticker',
    playAgain: 'Play Again',
    exit: 'Exit',
    vocab: 'Words to learn',
    found: 'Person found',
    wordPrompt: 'Say the word',
    dogLine: 'Ruff! I can help!',
  },
  he: {
    title: 'כלב חילוץ',
    prompt: 'מצאו את האדם!',
    success: 'כל הכבוד!',
    tryAgain: 'נסו שוב!',
    helpCue: 'הצילו!',
    thanksCue: 'תודה!',
    hint: 'המקום הזוהר הוא המקום הנכון.',
    stars: 'כוכבים',
    round: 'סיבוב',
    hero: 'אתם גיבורי חילוץ!',
    heroSub: 'מצאתם שלושה אנשים בבטחה.',
    collect: 'קבלו מדבקה',
    playAgain: 'שחקו שוב',
    exit: 'יציאה',
    vocab: 'מילים באנגלית',
    found: 'האדם נמצא',
    wordPrompt: 'אמרו את המילה',
    dogLine: 'הב! אני יכול לעזור!',
  },
};

function createRound(previousSceneId) {
  const availableScenes = SCENES.filter((scene) => scene.id !== previousSceneId);
  const scenePool = availableScenes.length ? availableScenes : SCENES;
  const scene = scenePool[Math.floor(Math.random() * scenePool.length)];

  return {
    scene,
    survivorIndex: Math.floor(Math.random() * scene.objects.length),
    focusWord: WORDS[Math.floor(Math.random() * WORDS.length)],
  };
}

function playTone(kind) {
  if (typeof window === 'undefined') return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const notes = {
      success: [523.25, 659.25, 783.99],
      miss: [240, 210],
      hint: [392, 440],
    }[kind] || [];

    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = ctx.currentTime + index * 0.14;

      osc.type = kind === 'miss' ? 'triangle' : 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.12, startAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startAt);
      osc.stop(startAt + 0.2);
    });

    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch (e) {
    // Continue silently if Web Audio is unavailable.
  }
}

export default function RescueDog({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const copy = TEXT[lang] || TEXT.en;
  const timersRef = useRef([]);
  const [stars, setStars] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [roundData, setRoundData] = useState(() => createRound());
  const [wrongIndex, setWrongIndex] = useState(null);
  const [hintIndex, setHintIndex] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [heroMode, setHeroMode] = useState(false);
  const [message, setMessage] = useState(copy.prompt);

  const { scene, survivorIndex, focusWord } = roundData;

  useEffect(() => {
    setMessage(copy.prompt);
  }, [copy.prompt]);

  useEffect(() => {
    speak(copy.prompt, lang);
  }, [roundData, copy.prompt, lang]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  function queue(action, delay) {
    const timer = setTimeout(action, delay);
    timersRef.current.push(timer);
  }

  function startNextRound(nextStars) {
    if (nextStars >= GOAL_STARS) {
      setHeroMode(true);
      return;
    }

    setRoundNumber((value) => value + 1);
    setWrongIndex(null);
    setHintIndex(null);
    setRevealed(false);
    setLocked(false);
    setMessage(copy.prompt);
    setRoundData(createRound(scene.id));
  }

  function handleWrongPick(index) {
    setLocked(true);
    setWrongIndex(index);
    setMessage(copy.tryAgain);
    playTone('miss');
    speak(copy.tryAgain, lang);

    queue(() => {
      setWrongIndex(null);
      setHintIndex(survivorIndex);
      setLocked(false);
      setMessage(copy.hint);
      playTone('hint');
      speak('help', 'en');
    }, 2000);
  }

  function handleCorrectPick() {
    const nextStars = stars + 1;
    setLocked(true);
    setHintIndex(survivorIndex);
    setRevealed(true);
    setWrongIndex(null);
    setStars(nextStars);
    setMessage(copy.success);
    playTone('success');
    speak(nextStars >= GOAL_STARS ? copy.thanksCue : copy.helpCue, lang);

    queue(() => {
      startNextRound(nextStars);
    }, 1500);
  }

  function handlePick(index) {
    if (locked || heroMode) return;
    if (index === survivorIndex) {
      handleCorrectPick();
      return;
    }
    handleWrongPick(index);
  }

  function handlePlayAgain() {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];
    setStars(0);
    setRoundNumber(1);
    setWrongIndex(null);
    setHintIndex(null);
    setRevealed(false);
    setLocked(false);
    setHeroMode(false);
    setMessage(copy.prompt);
    setRoundData(createRound());
  }

  const css = `
    .rescue-dog-game {
      min-height: 100vh;
      box-sizing: border-box;
      padding: 14px 14px 28px;
      display: flex;
      justify-content: center;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.9), transparent 28%),
        linear-gradient(180deg, #fdf6c9 0%, #ffe0a3 28%, #a7dd8d 100%);
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      color: #183153;
    }

    .rescue-shell {
      width: min(100%, 520px);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .rescue-topbar,
    .rescue-panel,
    .rescue-scene,
    .rescue-dog-card,
    .rescue-hero {
      border-radius: 28px;
      box-shadow: 0 10px 30px rgba(24, 49, 83, 0.16);
    }

    .rescue-topbar,
    .rescue-panel,
    .rescue-dog-card,
    .rescue-hero {
      background: rgba(255, 255, 255, 0.92);
    }

    .rescue-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
    }

    .rescue-title {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      line-height: 1;
      color: #f15a29;
    }

    .rescue-stars {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 800;
    }

    .rescue-star-row {
      display: flex;
      gap: 4px;
      font-size: 26px;
    }

    .rescue-exit {
      border: 0;
      border-radius: 999px;
      background: #183153;
      color: #fff;
      padding: 10px 16px;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
    }

    .rescue-panel {
      padding: 16px;
      text-align: center;
    }

    .rescue-scene-title {
      margin: 0;
      font-size: 26px;
      font-weight: 900;
      color: #183153;
    }

    .rescue-scene-subtitle,
    .rescue-message {
      margin: 8px 0 0;
      font-size: 18px;
      font-weight: 800;
    }

    .rescue-message {
      color: #f15a29;
    }

    .rescue-vocab {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }

    .rescue-vocab-label {
      font-size: 14px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #3f5c7a;
    }

    .rescue-vocab-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }

    .rescue-word-chip {
      border: 0;
      border-radius: 999px;
      background: #e7f4ff;
      color: #183153;
      padding: 10px 16px;
      font-size: 18px;
      font-weight: 900;
      cursor: pointer;
    }

    .rescue-word-chip.active {
      background: #fff0a8;
      box-shadow: 0 0 0 4px rgba(255, 221, 87, 0.45);
    }

    .rescue-scene {
      position: relative;
      overflow: hidden;
      min-height: 350px;
      padding: 18px;
      background: var(--scene-sky);
    }

    .rescue-sun,
    .rescue-cloud,
    .rescue-cloud-two {
      position: absolute;
      border-radius: 999px;
      pointer-events: none;
    }

    .rescue-sun {
      top: 20px;
      right: 28px;
      width: 72px;
      height: 72px;
      background: rgba(255, 234, 120, 0.95);
      box-shadow: 0 0 24px rgba(255, 214, 83, 0.7);
    }

    .rescue-cloud,
    .rescue-cloud-two {
      background: rgba(255, 255, 255, 0.78);
      width: 94px;
      height: 28px;
    }

    .rescue-cloud {
      top: 42px;
      left: 24px;
    }

    .rescue-cloud-two {
      top: 78px;
      left: 98px;
    }

    .rescue-ground {
      position: absolute;
      inset-inline: 0;
      bottom: 0;
      height: 38%;
      background: linear-gradient(180deg, rgba(255,255,255,0.1), var(--scene-ground));
      border-top-left-radius: 48px;
      border-top-right-radius: 48px;
    }

    .rescue-object-row {
      position: absolute;
      inset-inline: 14px;
      bottom: 52px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      z-index: 2;
    }

    .rescue-object {
      position: relative;
      min-height: 164px;
      border: 0;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.18);
      box-shadow: inset 0 -8px 0 rgba(0, 0, 0, 0.08);
      cursor: pointer;
      padding: 12px 8px;
      transition: transform 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;
      touch-action: manipulation;
    }

    .rescue-object:active {
      transform: scale(0.96);
    }

    .rescue-object.hint {
      box-shadow: 0 0 0 6px rgba(255, 235, 59, 0.55), inset 0 -8px 0 rgba(0, 0, 0, 0.08);
      background: rgba(255, 255, 255, 0.38);
      animation: rescuePulse 1s infinite;
    }

    .rescue-object.wrong {
      animation: rescueShake 0.4s ease;
      background: rgba(255, 213, 213, 0.85);
    }

    .rescue-object.correct {
      transform: translateY(-8px);
      background: rgba(219, 255, 210, 0.95);
    }

    .rescue-object-art {
      display: block;
      font-size: 64px;
      line-height: 1;
      margin-bottom: 10px;
    }

    .rescue-object-label {
      display: block;
      font-size: 18px;
      font-weight: 900;
      color: #183153;
      text-transform: capitalize;
    }

    .rescue-person {
      position: absolute;
      inset-inline: 0;
      top: 18px;
      font-size: 42px;
      opacity: 0;
      transform: translateY(22px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .rescue-person.show {
      opacity: 1;
      transform: translateY(0);
    }

    .rescue-person-label {
      position: absolute;
      inset-inline: 10px;
      bottom: 10px;
      font-size: 14px;
      font-weight: 900;
      color: #183153;
      opacity: 0;
      transition: opacity 0.25s ease;
    }

    .rescue-person-label.show {
      opacity: 1;
    }

    .rescue-dog-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px 20px;
    }

    .rescue-dog-emoji {
      font-size: 52px;
      line-height: 1;
      animation: rescueBob 1.4s ease-in-out infinite;
    }

    .rescue-dog-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .rescue-dog-name {
      font-size: 24px;
      font-weight: 900;
      color: #183153;
    }

    .rescue-dog-line {
      font-size: 18px;
      font-weight: 700;
      color: #3f5c7a;
    }

    .rescue-hero {
      padding: 28px 20px 24px;
      text-align: center;
    }

    .rescue-hero h2 {
      margin: 0;
      font-size: 34px;
      color: #f15a29;
    }

    .rescue-hero p {
      margin: 10px 0 0;
      font-size: 19px;
      font-weight: 700;
      color: #183153;
    }

    .rescue-hero-stars {
      margin: 16px 0 18px;
      font-size: 34px;
      letter-spacing: 6px;
    }

    .rescue-action-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }

    .rescue-action {
      border: 0;
      border-radius: 999px;
      padding: 12px 18px;
      font-size: 17px;
      font-weight: 900;
      cursor: pointer;
    }

    .rescue-action.primary {
      background: linear-gradient(135deg, #ff8a00, #ffcf33);
      color: #183153;
    }

    .rescue-action.secondary {
      background: #183153;
      color: #fff;
    }

    @keyframes rescuePulse {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    @keyframes rescueShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-6px); }
      75% { transform: translateX(6px); }
    }

    @keyframes rescueBob {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }

    @media (max-width: 520px) {
      .rescue-title {
        font-size: 23px;
      }

      .rescue-stars {
        font-size: 14px;
      }

      .rescue-object-row {
        gap: 10px;
      }

      .rescue-object {
        min-height: 150px;
      }

      .rescue-object-art {
        font-size: 56px;
      }

      .rescue-object-label {
        font-size: 16px;
      }
    }
  `;

  if (heroMode) {
    return (
      <div className="rescue-dog-game" dir={dir}>
        <style>{css}</style>
        <div className="rescue-shell">
          <div className="rescue-hero">
            <div style={{ fontSize: '64px', lineHeight: 1 }}>🐶⭐🧑</div>
            <h2>{copy.hero}</h2>
            <p>{copy.heroSub}</p>
            <div className="rescue-hero-stars">{'⭐'.repeat(GOAL_STARS)}</div>
            <div className="rescue-action-row">
              <button className="rescue-action primary" onClick={onSuccess}>{copy.collect}</button>
              <button className="rescue-action secondary" onClick={handlePlayAgain}>{copy.playAgain}</button>
              <button className="rescue-action secondary" onClick={onExit}>{copy.exit}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rescue-dog-game" dir={dir}>
      <style>{css}</style>
      <div className="rescue-shell">
        <div className="rescue-topbar">
          <div>
            <h1 className="rescue-title">{copy.title}</h1>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#3f5c7a' }}>
              {copy.round} {roundNumber}
            </div>
          </div>
          <div className="rescue-stars" aria-label={`${copy.stars}: ${stars}`}>
            <span>{copy.stars}</span>
            <div className="rescue-star-row">
              {Array.from({ length: GOAL_STARS }).map((_, index) => (
                <span key={index}>{index < stars ? '⭐' : '☆'}</span>
              ))}
            </div>
          </div>
          <button className="rescue-exit" onClick={onExit}>{copy.exit}</button>
        </div>

        <div className="rescue-panel">
          <h2 className="rescue-scene-title">{scene.emoji} {scene.title[lang] || scene.title.en}</h2>
          <p className="rescue-scene-subtitle">{scene.subtitle[lang] || scene.subtitle.en}</p>
          <p className="rescue-message">{message}</p>

          <div className="rescue-vocab">
            <div className="rescue-vocab-label">{copy.vocab}</div>
            <div className="rescue-vocab-row">
              {WORDS.map((word) => (
                <button
                  key={word}
                  className={`rescue-word-chip${focusWord === word ? ' active' : ''}`}
                  onClick={() => speak(word, 'en')}
                >
                  {word}
                </button>
              ))}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#3f5c7a' }}>
              {copy.wordPrompt}: <strong>{focusWord}</strong>
            </div>
          </div>
        </div>

        <div
          className="rescue-scene"
          style={{ '--scene-sky': scene.sky, '--scene-ground': scene.ground }}
        >
          <div className="rescue-sun" />
          <div className="rescue-cloud" />
          <div className="rescue-cloud-two" />
          <div className="rescue-ground" />

          <div className="rescue-object-row">
            {scene.objects.map((object, index) => {
              const isCorrect = revealed && index === survivorIndex;
              const isWrong = wrongIndex === index;
              const isHinted = hintIndex === index;

              return (
                <button
                  key={object.id}
                  className={[
                    'rescue-object',
                    isCorrect ? 'correct' : '',
                    isWrong ? 'wrong' : '',
                    !isCorrect && isHinted ? 'hint' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handlePick(index)}
                  aria-label={object.label.en}
                >
                  <span className={`rescue-person${isCorrect ? ' show' : ''}`}>🧑💧</span>
                  <span className="rescue-object-art">{object.emoji}</span>
                  <span className="rescue-object-label">{object.label.en}</span>
                  <span className={`rescue-person-label${isCorrect ? ' show' : ''}`}>{copy.found}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rescue-dog-card">
          <div className="rescue-dog-emoji">🐶🦺</div>
          <div className="rescue-dog-text">
            <div className="rescue-dog-name">{copy.title}</div>
            <div className="rescue-dog-line">{copy.dogLine}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
