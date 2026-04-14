import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SocialSkills.css';
import { SCENARIOS } from './scenarios';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

export default function SocialSkills({ onSuccess, onExit, facilitatorMode }) {
  const { lang, dir } = useLanguage();
  const [screen, setScreen] = useState('start');
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [tapped, setTapped] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const [showContinueBtn, setShowContinueBtn] = useState(false);
  const [locked, setLocked] = useState(false);
  const [displayOrder, setDisplayOrder] = useState([0, 1]);
  const [soundOn, setSoundOn] = useState(true);
  const soundOnRef = useRef(true);
  const [facilitator, setFacilitator] = useState(!!facilitatorMode);
  const [videoError, setVideoError] = useState(false);

  const idleTimer = useRef(null);
  const autoAdvanceTimer = useRef(null);
  const resetTimer = useRef(null);

  const scenario = SCENARIOS[scenarioIndex];

  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const situationText = lang === 'he' ? scenario.situation : scenario.situationEn;
  const ttsFull = lang === 'he' ? scenario.tts : scenario.ttsFallback;
  const lessonText = lang === 'he' ? scenario.lesson : scenario.lessonFallback;
  const optionText = (opt) => lang === 'he' ? opt.text : opt.textEn;

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked || facilitator) return;
    idleTimer.current = setTimeout(() => {
      setShowIdlePrompt(true);
    }, 8000);
  }, [locked, facilitator]);

  function advanceScenario() {
    clearTimeout(autoAdvanceTimer.current);
    if (scenarioIndex + 1 >= SCENARIOS.length) {
      setScreen('end');
      onSuccess();
    } else {
      setScenarioIndex(i => i + 1);
    }
  }

  useEffect(() => {
    if (screen !== 'game') return;
    setTapped(null);
    setShowHint(false);
    setShowIdlePrompt(false);
    setShowContinueBtn(false);
    setLocked(false);
    setVideoError(false);
    setDisplayOrder(Math.random() < 0.5 ? [0, 1] : [1, 0]);

    const opts = scenario.options;
    const opt0 = lang === 'he' ? opts[0].text : opts[0].textEn;
    const opt1 = lang === 'he' ? opts[1].text : opts[1].textEn;
    const sep = lang === 'he' ? 'אפשרות אחת: ' : 'Option one: ';
    const sep2 = lang === 'he' ? 'אפשרות שתיים: ' : 'Option two: ';
    const fullTts = `${ttsFull} ${sep}${opt0}. ${sep2}${opt1}.`;

    if (soundOnRef.current) speak(fullTts, lang);
    resetIdle();

    return () => {
      clearTimeout(idleTimer.current);
      clearTimeout(autoAdvanceTimer.current);
      clearTimeout(resetTimer.current);
    };
  // eslint-disable-next-line
  }, [scenarioIndex, screen]);

  function handleTap(opt) {
    if (locked) return;
    clearTimeout(idleTimer.current);
    setShowIdlePrompt(false);
    setLocked(true);
    setTapped(opt.quality);

    const text = optionText(opt);
    const lesson = lessonText;

    if (opt.quality === 'best') {
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) {
        setBalloons(b => b + 1);
        if (soundOnRef.current) speak(`${text}. ${lang === 'he' ? 'יפה מאוד!' : 'Excellent!'}`, lang);
      } else {
        if (soundOnRef.current) speak(`${text}. ${lesson}`, lang);
      }
      setShowContinueBtn(true);
      if (!facilitator) {
        autoAdvanceTimer.current = setTimeout(advanceScenario, 15000);
      }
    } else {
      if (soundOnRef.current) speak(`${text}. ${lesson}`, lang);
      setShowHint(true);
      if (!facilitator) {
        resetTimer.current = setTimeout(handleRetry, 3500);
      }
    }
  }

  function handleContinue() {
    clearTimeout(autoAdvanceTimer.current);
    advanceScenario();
  }

  function handleRetry() {
    clearTimeout(resetTimer.current);
    setTapped(null);
    setShowHint(false);
    setShowContinueBtn(false);
    setLocked(false);
    resetIdle();
  }

  function startGame() {
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
    onExit();
  }

  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;

  if (screen === 'start') return (
    <div className="ss-game ss-start" dir={dir}>
      <div className="ss-start-emoji">🧠💬</div>
      <h1 className="ss-start-title">{t(lang, 'socialTitle')}</h1>
      <p className="ss-start-subtitle">{t(lang, 'socialSubtitle')}</p>
      <div className="ss-scenario-count">{t(lang, 'socialCount')}</div>
      <div className="ss-model-steps">
        <div className="ss-model-step">{lang === 'he' ? '👀 מה קורה?' : '👀 What is happening?'}</div>
        <div className="ss-model-step">{lang === 'he' ? '❤️ איך אני מרגיש?' : '❤️ How do I feel?'}</div>
        <div className="ss-model-step">{lang === 'he' ? '🛡️ בטוח / לא בטוח?' : '🛡️ Safe / not safe?'}</div>
        <div className="ss-model-step">{lang === 'he' ? '💡 מה אני עושה?' : '💡 What do I do?'}</div>
      </div>
      <button className="ss-start-btn" onClick={startGame}>{t(lang, 'letsStart')}</button>
      <button className="ss-exit-link" onClick={onExit}>←</button>
    </div>
  );

  if (screen === 'end') return (
    <div className="ss-game ss-end" dir={dir}>
      <div className="ss-end-trophy">🌟</div>
      <h1 className="ss-end-title">{t(lang, 'wellDone')}</h1>
      <p className="ss-end-sub">{t(lang, 'finishedAll')}</p>
      <div className="ss-end-stars">{'⭐'.repeat(stars)}</div>
      {balloons > 0 && <div className="ss-end-balloons">{'🎈'.repeat(balloons)}</div>}
      <button className="ss-play-again" onClick={startGame}>{t(lang, 'playAgainGame')}</button>
      <button className="ss-exit-link" onClick={onExit}>←</button>
    </div>
  );

  return (
    <div className="ss-game" dir={dir}>
      <header className="ss-hud">
        <div className="ss-hud-top">
          <div className="ss-progress">{scenarioIndex + 1} / {SCENARIOS.length}</div>
          <StarBar starsInCycle={starsInCycle} balloons={0} />
          <div className="ss-hud-controls">
            <button
              className={`ss-facilitator-btn${facilitator ? ' on' : ''}`}
              onClick={() => setFacilitator(f => !f)}
              title={lang === 'he' ? 'מצב מטפל' : 'Facilitator mode'}
              aria-label={facilitator
                ? (lang === 'he' ? 'כבה מצב מטפל' : 'Turn off facilitator mode')
                : (lang === 'he' ? 'הפעל מצב מטפל' : 'Turn on facilitator mode')}
            >
              💡
            </button>
            <button
              className={`ss-sound-btn${soundOn ? ' on' : ''}`}
              onClick={() => setSoundOn(s => !s)}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="ss-exit-btn" onClick={exitGame}>✕</button>
          </div>
        </div>
        {facilitator && (
          <div className="ss-facilitator-banner">
            💡{' '}
            {lang === 'he'
              ? 'מצב מטפל פעיל — אין טיימרים אוטומטיים'
              : 'Facilitator mode — no auto-timers'}
          </div>
        )}
        {balloons > 0 && <div className="ss-balloon-row">{'🎈'.repeat(balloons)}</div>}
      </header>

      <div className="ss-scene-area">
        {!videoError ? (
          <video
            key={scenario.video}
            src={scenario.video}
            className="ss-scene-video"
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
          />
        ) : (
          <div className="ss-animated-scene" key={scenario.id}>
            {scenario.sceneEmojis
              ? scenario.sceneEmojis.map((emoji, i) => (
                  <span
                    key={i}
                    className={`ss-scene-emoji ss-anim-${scenario.sceneAnims[i]}`}
                    style={{ animationDelay: `${i * 0.15}s` }}
                  >
                    {emoji}
                  </span>
                ))
              : <span className="ss-scene-emoji ss-anim-float">{scenario.scene}</span>
            }
          </div>
        )}
      </div>

      <div className="ss-situation-row">
        <p className="ss-situation-text">{situationText}</p>
        <button
          className="ss-speak-btn"
          onClick={() => speak(ttsFull, lang)}
        >
          🔊
        </button>
      </div>

      <p className={`ss-prompt${showIdlePrompt ? ' ss-prompt-nudge' : ''}`}>
        {showIdlePrompt ? t(lang, 'tapOne') : t(lang, 'whatDoIDo')}
      </p>

      <div className="ss-options">
        {displayOrder.map(i => {
          const opt = scenario.options[i];
          const isBest = opt.quality === 'best';
          const isChosen = tapped === opt.quality;
          const isHinted = showHint && isBest;
          const isIdlePrompted = showIdlePrompt && !tapped;

          let rowClass = 'ss-option-row';
          if (isChosen && tapped === 'best') rowClass += ' chosen-best';
          if (isChosen && tapped === 'notGood') rowClass += ' chosen-not-good';
          if (isHinted) rowClass += ' hint-glow';
          if (isIdlePrompted) rowClass += ' idle-prompt';

          return (
            <div key={opt.quality} className={rowClass}>
              <button className="ss-option-main" onClick={() => handleTap(opt)}>
                <span className="ss-option-emoji">{opt.emoji}</span>
                <span className="ss-option-text">{optionText(opt)}</span>
              </button>
              <button
                className="ss-option-speak-btn"
                onClick={() => speak(optionText(opt), lang)}
              >
                🔊
              </button>
            </div>
          );
        })}
      </div>

      {tapped && (
        <div className={`ss-lesson-bar${tapped === 'best' ? ' lesson-success' : ' lesson-hint'}`}>
          <div className="ss-lesson-content">
            <span className="ss-lesson-icon">{tapped === 'best' ? '✅' : '💡'}</span>
            <span className="ss-lesson-text">{lessonText}</span>
            <button
              className="ss-lesson-speak-btn"
              onClick={() => speak(lessonText, lang)}
            >
              🔊
            </button>
          </div>
          {tapped === 'best' && showContinueBtn && (
            <button className="ss-continue-btn" onClick={handleContinue}>
              {t(lang, 'iUnderstood')}
            </button>
          )}
          {tapped === 'notGood' && (
            <button className="ss-retry-btn" onClick={handleRetry}>
              {t(lang, 'tryAgain')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
