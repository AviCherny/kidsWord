import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import { SCENARIOS } from './scenarios';
import { speak } from './speak';

const SESSION_SIZE = 8; // scenarios per session — enough variety, not overwhelming

export default function App() {
  // ── Screens: 'start' | 'game' | 'end' ──────────────────────────────────
  const [screen, setScreen] = useState('start');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  // Shuffled subset of scenario indices — repicked every session so order is always different
  const [shuffledOrder, setShuffledOrder] = useState(() => SCENARIOS.map((_, i) => i));

  // ── Rewards ─────────────────────────────────────────────────────────────
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);

  // ── Interaction state ────────────────────────────────────────────────────
  const [tapped, setTapped] = useState(null);         // null | 'best' | 'notGood'
  const [showHint, setShowHint] = useState(false);    // green glow on best — only after wrong tap
  const [showIdlePrompt, setShowIdlePrompt] = useState(false); // yellow pulse on BOTH — after 8s idle
  const [showContinueBtn, setShowContinueBtn] = useState(false); // "הבנתי ✓" after correct
  const [locked, setLocked] = useState(false);

  // ── Display order — randomized per scenario (FIX: was always best=top) ──
  const [displayOrder, setDisplayOrder] = useState([0, 1]);

  // ── Sound (OFF by default — sensory sensitivity) ─────────────────────────
  const [soundOn, setSoundOn] = useState(false);
  const soundOnRef = useRef(false);

  // ── Facilitator mode — disables all auto-timers for therapist-led sessions
  const [facilitator, setFacilitator] = useState(false);

  // ── Video error state (falls back to emoji strip) ────────────────────────
  const [videoError, setVideoError] = useState(false);

  // ── Timers ────────────────────────────────────────────────────────────────
  const idleTimer = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const resetTimer = useRef(null);

  const scenario = SCENARIOS[shuffledOrder[scenarioIndex]];

  // Sync ref so closures always read current soundOn
  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  // resetIdle: clears and restarts the idle hint timer
  // 8s — gives child enough time to hear all options read aloud before prompt appears
  // In facilitator mode: no idle timer (therapist controls pacing)
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked || facilitator) return;
    idleTimer.current = setTimeout(() => {
      setShowIdlePrompt(true);
    }, 8000);
  }, [locked, facilitator]);

  // advance to next scenario or end screen
  function advanceScenario() {
    clearTimeout(autoAdvanceTimer.current);
    if (scenarioIndex + 1 >= shuffledOrder.length) {
      setScreen('end');
    } else {
      setScenarioIndex(i => i + 1);
    }
  }

  // On each new scenario: reset state, shuffle option order, read situation aloud, start idle timer
  useEffect(() => {
    if (screen !== 'game') return;
    setTapped(null);
    setShowHint(false);
    setShowIdlePrompt(false);
    setShowContinueBtn(false);
    setLocked(false);
    setVideoError(false);
    // Randomize which option appears on top — prevents pattern exploitation by autism/ADHD children
    setDisplayOrder(Math.random() < 0.5 ? [0, 1] : [1, 0]);

    // Read situation + both options so non-readers hear all choices before deciding
    const opts = scenario.options;
    const fullTts = `${scenario.tts} אפשרות אחת: ${opts[0].text}. אפשרות שתיים: ${opts[1].text}.`;
    speak(fullTts, scenario.ttsFallback, soundOnRef.current);

    resetIdle();
    return () => {
      clearTimeout(idleTimer.current);
      clearTimeout(autoAdvanceTimer.current);
      clearTimeout(resetTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioIndex, screen]);

  function handleTap(opt) {
    if (locked) return;
    clearTimeout(idleTimer.current);
    setShowIdlePrompt(false);
    setLocked(true);
    setTapped(opt.quality);

    if (opt.quality === 'best') {
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) {
        setBalloons(b => b + 1);
        speak(`${opt.text}. יפה מאוד! קיבלת בלון!`, null, soundOnRef.current);
      } else {
        // Read chosen option + lesson so non-readers hear the lesson too
        speak(`${opt.text}. ${scenario.lesson}`, scenario.lessonFallback, soundOnRef.current);
      }

      // Show "הבנתי ✓" — child controls when to advance after reading lesson
      // Auto-advance after 15s as fallback (gives time to read at own pace)
      // In facilitator mode: no auto-advance, therapist taps when ready
      setShowContinueBtn(true);
      if (!facilitator) {
        autoAdvanceTimer.current = setTimeout(advanceScenario, 15000);
      }
    } else {
      // notGood: read chosen option + lesson, reveal correct option with hint glow
      // "נסה שוב" button provides clear signal; auto-resets after 3.5s in normal mode
      speak(`${opt.text}. ${scenario.lesson}`, scenario.lessonFallback, soundOnRef.current);
      setShowHint(true);
      if (!facilitator) {
        resetTimer.current = setTimeout(handleRetry, 3500);
      }
    }
  }

  // Child taps "הבנתי ✓" to advance after reading the lesson
  function handleContinue() {
    clearTimeout(autoAdvanceTimer.current);
    advanceScenario();
  }

  // Child (or facilitator) taps "נסה שוב" to retry after a wrong answer
  function handleRetry() {
    clearTimeout(resetTimer.current);
    setTapped(null);
    setShowHint(false);
    setShowContinueBtn(false);
    setLocked(false);
    resetIdle();
  }

  function exitGame() {
    clearTimeout(idleTimer.current);
    clearTimeout(autoAdvanceTimer.current);
    clearTimeout(resetTimer.current);
    setScreen('start');
    setScenarioIndex(0);
    setStars(0);
    setBalloons(0);
    setTapped(null);
    setShowHint(false);
    setShowIdlePrompt(false);
    setShowContinueBtn(false);
    setLocked(false);
    setVideoError(false);
  }

  function startGame() {
    // Fisher-Yates shuffle then take first SESSION_SIZE
    const indices = SCENARIOS.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledOrder(indices.slice(0, SESSION_SIZE));
    setScenarioIndex(0);
    setStars(0);
    setBalloons(0);
    setTapped(null);
    setShowHint(false);
    setShowIdlePrompt(false);
    setShowContinueBtn(false);
    setLocked(false);
    setVideoError(false);
    setScreen('game');
  }

  // Stars progress within current balloon cycle (0–5)
  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  // ── START SCREEN ─────────────────────────────────────────────────────────
  if (screen === 'start') {
    return (
      <div className="game start-screen" dir="rtl">
        <div className="start-emoji">🧠💬</div>
        <h1 className="start-title">מה אני עושה?</h1>
        <p className="start-subtitle">נלמד יחד איך להתמודד עם מצבים עם חברים</p>
        {/* Session length — helps routine-dependent children know what to expect */}
        <div className="scenario-count">{SESSION_SIZE} סיפורים ⭐</div>
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
            {scenarioIndex + 1} / {shuffledOrder.length}
          </div>
          <div className="star-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`star-pip ${i < starsInCycle ? 'filled' : ''}`}>
                ⭐
              </span>
            ))}
          </div>
          <div className="hud-controls">
            {/* Facilitator mode — disables all auto-timers for therapist-led sessions */}
            <button
              className={`facilitator-btn ${facilitator ? 'on' : ''}`}
              onClick={() => setFacilitator(f => !f)}
              aria-label={facilitator ? 'כבה מצב מטפל' : 'הפעל מצב מטפל'}
              title="מצב מטפל"
            >
              🧑‍🏫
            </button>
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

      {/* Prompt — changes to a nudge when idle; does NOT reveal which option is correct */}
      <p className={`prompt${showIdlePrompt ? ' prompt-nudge' : ''}`}>
        {showIdlePrompt ? '👆 בחר אחת!' : 'מה אתה עושה?'}
      </p>

      {/* Response options — rendered in randomized order per scenario */}
      <div className="options">
        {displayOrder.map(i => {
          const opt = scenario.options[i];
          const isBest = opt.quality === 'best';
          const isChosen = tapped === opt.quality;
          // hint-glow only after a wrong tap — reveals the correct option
          const isHinted = showHint && isBest;
          // idle-prompt pulses BOTH options — nudges without revealing answer
          const isIdlePrompted = showIdlePrompt && !tapped;

          let rowClass = 'option-row';
          if (isChosen && tapped === 'best') rowClass += ' chosen-best';
          if (isChosen && tapped === 'notGood') rowClass += ' chosen-not-good';
          if (isHinted) rowClass += ' hint-glow';
          if (isIdlePrompted) rowClass += ' idle-prompt';

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
              {/* Read-aloud button — speaks the option WITHOUT selecting it */}
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
          <div className="lesson-content">
            <span className="lesson-icon">{tapped === 'best' ? '✅' : '💡'}</span>
            <span className="lesson-text">{scenario.lesson}</span>
            {/* Speak button on lesson — for non-readers when sound is off */}
            <button
              className="lesson-speak-btn"
              onClick={() => speak(scenario.lesson, scenario.lessonFallback, true)}
              aria-label="שמע את השיעור"
            >
              🔊
            </button>
          </div>

          {/* "הבנתי ✓" — child taps when done reading; auto-advances after 15s */}
          {tapped === 'best' && showContinueBtn && (
            <button className="continue-btn" onClick={handleContinue}>
              הבנתי ✓
            </button>
          )}

          {/* "נסה שוב" — visible signal that retry is coming; tappable for early reset */}
          {tapped === 'notGood' && (
            <button className="retry-btn" onClick={handleRetry}>
              נסה שוב 🔄
            </button>
          )}
        </div>
      )}
    </div>
  );
}
