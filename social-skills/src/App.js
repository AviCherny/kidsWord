import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { SCENARIOS } from './scenarios';
import { speak } from './speak';

export default function App() {
  // ── Screens: 'start' | 'game' | 'end' ──────────────────────────────────
  const [screen, setScreen] = useState('start');
  const [scenarioIndex, setScenarioIndex] = useState(0);

  // ── Rewards ─────────────────────────────────────────────────────────────
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);

  // ── Interaction state ────────────────────────────────────────────────────
  const [tapped, setTapped] = useState(null);    // null | 'best' | 'notGood'
  const [showHint, setShowHint] = useState(false);
  const [locked, setLocked] = useState(false);

  // ── Sound (OFF by default — sensory sensitivity) ─────────────────────────
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false);

  // ── Video error state (falls back to emoji strip) ────────────────────────
  const [videoError, setVideoError] = useState(false);

  // ── Timers ────────────────────────────────────────────────────────────────
  const idleTimer = useRef(null);

  const scenario = SCENARIOS[scenarioIndex];

  // Sync ref so closures always read current soundOn
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  // resetIdle: clears and restarts the idle hint timer
  // 8s — gives child enough time to hear all options read aloud before hint appears
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked) return;
    idleTimer.current = setTimeout(() => {
      setShowHint(true);
    }, 8000);
  }, [locked]);

  // On each new scenario: reset state, read situation + both options aloud, start idle timer
  useEffect(() => {
    if (screen !== 'game') return;
    setTapped(null);
    setShowHint(false);
    setLocked(false);
    setVideoError(false);

    // Read situation + both options so non-readers hear all choices before deciding
    const opts = scenario.options;
    const fullTts = `${scenario.tts} אפשרות אחת: ${opts[0].text}. אפשרות שתיים: ${opts[1].text}.`;
    speak(fullTts, scenario.ttsFallback, soundOnRef.current);

    resetIdle();
    return () => clearTimeout(idleTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIndex, screen]);

  function handleTap(opt) {
    if (locked) return;
    clearTimeout(idleTimer.current);
    setLocked(true);
    setTapped(opt.quality);

    if (opt.quality === 'best') {
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) {
        setBalloons(b => b + 1);
        // Read: chosen option text + balloon celebration
        speak(`${opt.text}. יפה מאוד! קיבלת בלון!`, null, soundOnRef.current);
      } else {
        // Read: chosen option text + lesson — non-readers hear what they picked and why it's good
        speak(`${opt.text}. ${scenario.lesson}`, scenario.lessonFallback, soundOnRef.current);
      }

      setTimeout(() => {
        if (scenarioIndex + 1 >= SCENARIOS.length) {
          setScreen('end');
        } else {
          setScenarioIndex(i => i + 1);
        }
      }, 4500); // 1.5s feedback + 3s for TTS to finish speaking
    } else {
      // notGood: read chosen option + lesson, show hint on best option, then reset so child can retry
      speak(`${opt.text}. ${scenario.lesson}`, scenario.lessonFallback, soundOnRef.current);
      setShowHint(true);
      setTimeout(() => {
        setTapped(null);
        setShowHint(false);
        setLocked(false);
      }, 3500);
    }
  }

  function exitGame() {
    clearTimeout(idleTimer.current);
    setScreen('start');
    setScenarioIndex(0);
    setStars(0);
    setBalloons(0);
    setTapped(null);
    setShowHint(false);
    setLocked(false);
    setVideoError(false);
  }

  function startGame() {
    setScenarioIndex(0);
    setStars(0);
    setBalloons(0);
    setTapped(null);
    setShowHint(false);
    setLocked(false);
    setVideoError(false);
    setScreen('game');
  }

  // Stars progress within current balloon cycle (0-5)
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  // ── START SCREEN ─────────────────────────────────────────────────────────
  if (screen === 'start') {
    return (
      <div className="game start-screen" dir="rtl">
        <div className="start-emoji">🧠💬</div>
        <h1 className="start-title">מה אני עושה?</h1>
        <p className="start-subtitle">נלמד יחד איך להתמודד עם מצבים עם חברים</p>
        <div className="model-steps">
          <div className="model-step">👀 מה קורה?</div>
          <div className="model-step">❤️ איך אני מרגיש?</div>
          <div className="model-step">🛡️ בטוח / לא בטוח?</div>
          <div className="model-step">💡 מה אני עושה?</div>
        </div>
        <button className="start-btn" onClick={startGame}>
          בואו נתחיל! 🚀
        </button>
      </div>
    );
  }

  // ── END SCREEN ────────────────────────────────────────────────────────────
  if (screen === 'end') {
    return (
      <div className="game end-screen" dir="rtl">
        <div className="end-trophy">🌟</div>
        <h1 className="end-title">כל הכבוד!</h1>
        <p className="end-subtitle">סיימת את כל הסיפורים!</p>
        <div className="end-stars">{'⭐'.repeat(stars)}</div>
        {balloons > 0 && (
          <div className="end-balloons">{'🎈'.repeat(balloons)}</div>
        )}
        <button className="play-again-btn" onClick={exitGame}>
          שחק שוב 🎮
        </button>
      </div>
    );
  }

  // ── GAME SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="game" dir="rtl">

      {/* HUD */}
      <header className="hud">
        <div className="hud-top">
          <div className="progress-indicator">
            {scenarioIndex + 1} / {SCENARIOS.length}
          </div>
          <div className="star-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`star-pip ${i < starsInCycle ? 'filled' : ''}`}>
                ⭐
              </span>
            ))}
          </div>
          <div className="hud-controls">
            <button
              className={`sound-btn ${soundOn ? 'on' : 'off'}`}
              onClick={() => setSoundOn(s => !s)}
              aria-label={soundOn ? 'כבה סאונד' : 'הפעל סאונד'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="exit-btn" onClick={exitGame} aria-label="יציאה">
              ✕
            </button>
          </div>
        </div>
        {balloons > 0 && (
          <div className="balloon-row">{'🎈'.repeat(balloons)}</div>
        )}
      </header>

      {/* Video scene (or emoji fallback if video missing/errored) */}
      <div className="scene-area">
        {!videoError ? (
          <video
            key={scenario.video}
            src={scenario.video}
            className="scene-video"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="scene-strip">{scenario.scene}</div>
        )}
      </div>

      {/* Situation text + read-aloud button */}
      <div className="situation-row">
        <p className="situation-text">{scenario.situation}</p>
        <button
          className="situation-speak-btn"
          onClick={() => speak(scenario.tts, scenario.ttsFallback, true)}
          aria-label="שמע את השאלה"
        >
          🔊
        </button>
      </div>
      <p className="prompt">מה אתה עושה?</p>

      {/* Response options */}
      <div className="options">
        {scenario.options.map((opt) => {
          const isBest = opt.quality === 'best';
          const isChosen = tapped === opt.quality;
          const isHinted = showHint && isBest && tapped !== 'best';

          let rowClass = 'option-row';
          if (isChosen && tapped === 'best') rowClass += ' chosen-best';
          if (isChosen && tapped === 'notGood') rowClass += ' chosen-not-good';
          if (isHinted) rowClass += ' hint-glow';

          return (
            <div key={opt.quality} className={rowClass}>
              {/* Main tap area — selects this answer */}
              <button
                className="option-main"
                onClick={() => handleTap(opt)}
              >
                <span className="option-emoji">{opt.emoji}</span>
                <span className="option-text">{opt.text}</span>
              </button>
              {/* Read-aloud button — speaks the option text WITHOUT selecting it */}
              <button
                className="option-speak-btn"
                onClick={() => speak(opt.text, null, true)}
                aria-label="שמע את התשובה"
              >
                🔊
              </button>
            </div>
          );
        })}
      </div>

      {/* Lesson bar — shown after any tap */}
      {tapped && (
        <div className={`lesson-bar ${tapped === 'best' ? 'lesson-success' : 'lesson-hint'}`}>
          {tapped === 'best' ? '✅ ' : '💡 '}
          {scenario.lesson}
        </div>
      )}
    </div>
  );
}
