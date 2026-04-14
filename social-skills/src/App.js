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

  // ── Sound (ON by default) ─────────────────────────────────────────────────
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(true);

  // ── Language: 'he' (Hebrew/RTL) or 'en' (English/LTR) ─────────────────
  const [lang, setLang] = useState('he');
  const langRef = useRef('he');

  // ── Facilitator mode — disables all auto-timers for therapist-led sessions
  const [facilitator, setFacilitator] = useState(false);

  // ── Video error state (falls back to animated emoji scene) ───────────────
  const [videoError, setVideoError] = useState(false);

  // ── Timers ────────────────────────────────────────────────────────────────
  const idleTimer = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const resetTimer = useRef(null);

  const scenario = SCENARIOS[shuffledOrder[scenarioIndex]];
  const isHe = lang === 'he';

  // Sync refs so closures always read current values
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);
  useEffect(() => { langRef.current = lang; }, [lang]);

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
    const he = langRef.current === 'he';
    const fullTts = he
      ? `${scenario.tts} אפשרות אחת: ${opts[0].text}. אפשרות שתיים: ${opts[1].text}.`
      : scenario.ttsFallback;
    speak(fullTts, he ? scenario.ttsFallback : null, soundOnRef.current);

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
        const msg = isHe ? `${opt.text}. יפה מאוד! קיבלת בלון!` : `${opt.text}. Well done! You got a balloon!`;
        speak(msg, null, soundOnRef.current);
      } else {
        // Read chosen option + lesson so non-readers hear the lesson too
        const lesson = isHe ? scenario.lesson : scenario.lessonFallback;
        speak(`${opt.text}. ${lesson}`, isHe ? scenario.lessonFallback : null, soundOnRef.current);
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
      const lesson = isHe ? scenario.lesson : scenario.lessonFallback;
      speak(`${opt.text}. ${lesson}`, isHe ? scenario.lessonFallback : null, soundOnRef.current);
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
      <div className="game start-screen" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="start-emoji">🧠💬</div>
        <h1 className="start-title">{isHe ? 'מה אני עושה?' : 'What Do I Do?'}</h1>
        <p className="start-subtitle">
          {isHe
            ? 'נלמד יחד איך להתמודד עם מצבים עם חברים'
            : 'Let\'s learn together how to handle situations with friends'}
        </p>
        {/* Session length — helps routine-dependent children know what to expect */}
        <div className="scenario-count">{SESSION_SIZE} {isHe ? 'סיפורים ⭐' : 'stories ⭐'}</div>
        <div className="model-steps">
          <div className="model-step">👀 {isHe ? 'מה קורה?' : 'What\'s happening?'}</div>
          <div className="model-step">❤️ {isHe ? 'איך אני מרגיש?' : 'How do I feel?'}</div>
          <div className="model-step">🛡️ {isHe ? 'בטוח / לא בטוח?' : 'Safe / not safe?'}</div>
          <div className="model-step">💡 {isHe ? 'מה אני עושה?' : 'What do I do?'}</div>
        </div>
        <button className="start-btn" onClick={startGame}>
          {isHe ? 'בואו נתחיל! 🚀' : 'Let\'s start! 🚀'}
        </button>
        {/* Language toggle — bottom of start screen so it doesn't clutter */}
        <button className="lang-btn" onClick={() => setLang(l => l === 'he' ? 'en' : 'he')}>
          {isHe ? 'EN' : 'עב'}
        </button>
      </div>
    );
  }

  // ── END SCREEN ────────────────────────────────────────────────────────────
  if (screen === 'end') {
    return (
      <div className="game end-screen" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="end-trophy">🌟</div>
        <h1 className="end-title">{isHe ? 'כל הכבוד!' : 'Well done!'}</h1>
        <p className="end-subtitle">{isHe ? 'סיימת את כל הסיפורים!' : 'You finished all the stories!'}</p>
        <div className="end-stars">{'⭐'.repeat(stars)}</div>
        {balloons > 0 && (
          <div className="end-balloons">{'🎈'.repeat(balloons)}</div>
        )}
        <button className="play-again-btn" onClick={exitGame}>
          {isHe ? 'שחק שוב 🎮' : 'Play again 🎮'}
        </button>
      </div>
    );
  }

  // ── GAME SCREEN ───────────────────────────────────────────────────────────
  return (
    <div className="game" dir={isHe ? 'rtl' : 'ltr'}>

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
            {/* Language toggle */}
            <button
              className="lang-btn"
              onClick={() => setLang(l => l === 'he' ? 'en' : 'he')}
              aria-label={isHe ? 'Switch to English' : 'עבור לעברית'}
            >
              {isHe ? 'EN' : 'עב'}
            </button>
            {/* Facilitator mode — 💡 lamp icon; disables all auto-timers for therapist-led sessions */}
            <button
              className={`facilitator-btn ${facilitator ? 'on' : ''}`}
              onClick={() => setFacilitator(f => !f)}
              aria-label={
                facilitator
                  ? (isHe ? 'כבה מצב מטפל' : 'Turn off facilitator mode')
                  : (isHe ? 'הפעל מצב מטפל' : 'Turn on facilitator mode')
              }
              title={isHe ? 'מצב מטפל' : 'Facilitator mode'}
            >
              💡
            </button>
            <button
              className={`sound-btn ${soundOn ? 'on' : 'off'}`}
              onClick={() => setSoundOn(s => !s)}
              aria-label={soundOn ? (isHe ? 'כבה סאונד' : 'Mute') : (isHe ? 'הפעל סאונד' : 'Unmute')}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="exit-btn" onClick={exitGame} aria-label={isHe ? 'יציאה' : 'Exit'}>
              ✕
            </button>
          </div>
        </div>

        {/* Facilitator mode banner — visible explanation for the therapist */}
        {facilitator && (
          <div className="facilitator-banner">
            💡{' '}
            {isHe
              ? 'מצב מטפל פעיל — אין טיימרים אוטומטיים'
              : 'Facilitator mode — no auto-timers'}
          </div>
        )}

        {balloons > 0 && (
          <div className="balloon-row">{'🎈'.repeat(balloons)}</div>
        )}
      </header>

      {/* Animated emoji scene (video preferred; animated emojis as fallback) */}
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
          <div className="animated-scene" key={scenario.id}>
            {scenario.sceneEmojis
              ? scenario.sceneEmojis.map((emoji, i) => (
                  <span
                    key={i}
                    className={`scene-emoji anim-${scenario.sceneAnims[i]}`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {emoji}
                  </span>
                ))
              : <span className="scene-emoji anim-float">{scenario.scene}</span>
            }
          </div>
        )}
      </div>

      {/* Situation text + read-aloud button */}
      <div className="situation-row">
        <p className="situation-text">
          {isHe ? scenario.situation : scenario.situationEn}
        </p>
        <button
          className="situation-speak-btn"
          onClick={() => speak(
            isHe ? scenario.tts : scenario.ttsFallback,
            isHe ? scenario.ttsFallback : null,
            true
          )}
          aria-label={isHe ? 'שמע את השאלה' : 'Read the question'}
        >
          🔊
        </button>
      </div>

      {/* Prompt — changes to a nudge when idle; does NOT reveal which option is correct */}
      <p className={`prompt${showIdlePrompt ? ' prompt-nudge' : ''}`}>
        {showIdlePrompt
          ? (isHe ? '👆 בחר אחת!' : '👆 Pick one!')
          : (isHe ? 'מה אתה עושה?' : 'What do you do?')}
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
                aria-label={isHe ? 'שמע את התשובה' : 'Read the option'}
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
            <span className="lesson-text">
              {isHe ? scenario.lesson : scenario.lessonFallback}
            </span>
            {/* Speak button on lesson — for non-readers when sound is off */}
            <button
              className="lesson-speak-btn"
              onClick={() => speak(
                isHe ? scenario.lesson : scenario.lessonFallback,
                isHe ? scenario.lessonFallback : null,
                true
              )}
              aria-label={isHe ? 'שמע את השיעור' : 'Read the lesson'}
            >
              🔊
            </button>
          </div>

          {/* "הבנתי ✓" — child taps when done reading; auto-advances after 15s */}
          {tapped === 'best' && showContinueBtn && (
            <button className="continue-btn" onClick={handleContinue}>
              {isHe ? 'הבנתי ✓' : 'Got it ✓'}
            </button>
          )}

          {/* "נסה שוב" — visible signal that retry is coming; tappable for early reset */}
          {tapped === 'notGood' && (
            <button className="retry-btn" onClick={handleRetry}>
              {isHe ? 'נסה שוב 🔄' : 'Try again 🔄'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
