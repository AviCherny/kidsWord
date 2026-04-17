import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Sonic.css';
import { useLanguage } from '../../context/LanguageContext';
import { SonicPlatformerEngine, SONIC_MAX_LIVES } from './engine';

const FIXED_STEP = 1 / 60;
const HEART_LIVE = '\u2665';
const HEART_EMPTY = '\u2661';

const COPY = {
  en: {
    title: 'Sonic Green Hill',
    hint: 'Left and Right run. Space jumps. Down rolls.',
    touchHint: 'Hold Left or Right to run. Tap Jump. Hold Roll.',
    mission: 'Eat good food, avoid bad food, and reach the goal sign.',
    springTip: 'Red springs launch Sonic high into the air.',
    hazardTip: 'Bad food shrinks Sonic. Bad food at the smallest size costs a heart.',
    goodFood: 'Good Food',
    size: 'Size',
    lives: 'Lives',
    level: 'Level',
    speed: 'Dash',
    progress: 'Progress',
    ground: 'Running',
    rolling: 'Rolling',
    airborne: 'Air time',
    levelClear: 'Level clear',
    campaignClear: 'Adventure complete',
    gameOver: 'Out of hearts',
    result: 'Good food: {goodFood}. Bad food: {badFood}.',
    retryHint: 'Eat good food to grow and avoid junk food.',
    nextStageHint: 'Keep going. The sticker unlocks after the last level.',
    stickerReady: 'Sticker unlocked. Great run.',
    restart: 'Restart',
    nextLevel: 'Next Level',
    exit: 'Back',
    collect: 'Collect Sticker',
    left: 'Left',
    right: 'Right',
    jump: 'Jump',
    roll: 'Roll',
    sizeLevels: ['Small', 'Normal', 'Big'],
  },
  he: {
    title: 'סוניק גרין היל',
    hint: 'ימינה ושמאלה לרוץ. רווח לקפוץ. למטה לגלגול.',
    touchHint: 'החזיקו ימין או שמאל כדי לרוץ. לחצו קפיצה. החזיקו גלגול.',
    mission: 'אספו לפחות {ringGoal} טבעות והגיעו לשלט הסיום.',
    springTip: 'הקפיצים האדומים מעיפים את סוניק גבוה.',
    hazardTip: 'הקוצים הכסופים מורידים לב. עמודי הכוכב שומרים מקום.',
    rings: 'טבעות',
    lives: 'חיים',
    speed: 'מהירות',
    progress: 'התקדמות',
    target: 'מטרה',
    ground: 'רץ',
    rolling: 'מתגלגל',
    airborne: 'באוויר',
    levelClear: 'סיימתם את המסלול',
    gameOver: 'נגמרו הלבבות',
    result: 'אספתם {rings} מתוך {totalRings} טבעות.',
    stickerReady: 'המדבקה נפתחה. ריצה מעולה.',
    stickerMissed: 'צריך להגיע ל-{ringGoal} טבעות כדי לפתוח מדבקה.',
    restart: 'נסו שוב',
    exit: 'חזרה',
    collect: 'קבלו מדבקה',
    left: 'שמאל',
    right: 'ימין',
    jump: 'קפיצה',
    roll: 'גלגול',
  },
};

COPY.he.goodFood = 'אוכל טוב';
COPY.he.size = 'גודל';
COPY.he.level = 'שלב';
COPY.he.mission = 'אכלו אוכל טוב, הימנעו מאוכל לא טוב, והגיעו לשלט הסיום.';
COPY.he.hazardTip = 'אוכל לא טוב מקטין את סוניק. אוכל לא טוב בגודל הכי קטן מוריד לב.';
COPY.he.campaignClear = 'סיימתם את ההרפתקה';
COPY.he.result = 'אוכל טוב: {goodFood}. אוכל לא טוב: {badFood}.';
COPY.he.nextStageHint = 'ממשיכים. המדבקה נפתחת אחרי השלב האחרון.';
COPY.he.retryHint = 'אכלו אוכל טוב כדי לגדול והימנעו מג׳אנק פוד.';
COPY.he.nextLevel = 'לשלב הבא';
COPY.he.sizeLevels = ['קטן', 'רגיל', 'גדול'];

function format(text, values) {
  return text.replace(/\{(\w+)\}/g, (_, key) => `${values[key] ?? ''}`);
}

function createInitialUi() {
  return {
    phase: 'playing',
    levelIndex: 1,
    totalLevels: 1,
    goodFood: 0,
    badFood: 0,
    sizeTier: 1,
    lives: SONIC_MAX_LIVES,
    maxLives: SONIC_MAX_LIVES,
    canAdvanceLevel: false,
    canClaimSticker: false,
    progress: 0,
    speed: 0,
    playerRolling: false,
    playerAirborne: false,
  };
}

function shouldPublish(prev, next) {
  if (!prev) return true;

  return (
    prev.phase !== next.phase ||
    prev.levelIndex !== next.levelIndex ||
    prev.totalLevels !== next.totalLevels ||
    prev.goodFood !== next.goodFood ||
    prev.badFood !== next.badFood ||
    prev.sizeTier !== next.sizeTier ||
    prev.lives !== next.lives ||
    prev.canAdvanceLevel !== next.canAdvanceLevel ||
    prev.canClaimSticker !== next.canClaimSticker ||
    prev.progress !== next.progress ||
    prev.speed !== next.speed ||
    prev.playerRolling !== next.playerRolling ||
    prev.playerAirborne !== next.playerAirborne
  );
}

export default function Sonic({ onSuccess, onExit, facilitatorMode = false }) {
  const { lang, dir } = useLanguage();
  const copy = { ...COPY.en, ...(COPY[lang] || {}) };

  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const rafRef = useRef(0);
  const accumulatorRef = useRef(0);
  const lastFrameRef = useRef(0);
  const lastUiSyncRef = useRef(0);
  const lastSnapshotRef = useRef(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  const [ui, setUi] = useState(createInitialUi);

  const publishSnapshot = useCallback((force = false) => {
    const engine = engineRef.current;
    if (!engine) return;

    const next = engine.getSnapshot();
    if (!force && !shouldPublish(lastSnapshotRef.current, next)) return;

    lastSnapshotRef.current = next;
    setUi(next);
  }, []);

  const clearControls = useCallback(() => {
    engineRef.current?.clearControls();
  }, []);

  const handleJump = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.jump();
    publishSnapshot();
  }, [publishSnapshot]);

  const handleRestart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.reset();
    accumulatorRef.current = 0;
    lastFrameRef.current = 0;
    lastUiSyncRef.current = 0;
    publishSnapshot(true);
  }, [publishSnapshot]);

  const handleNextLevel = useCallback(() => {
    const engine = engineRef.current;
    if (!engine?.nextLevel()) return;
    accumulatorRef.current = 0;
    lastFrameRef.current = 0;
    lastUiSyncRef.current = 0;
    publishSnapshot(true);
  }, [publishSnapshot]);

  const setAction = useCallback((action, active) => {
    engineRef.current?.setControl(action, active);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return undefined;

    const engine = new SonicPlatformerEngine({ facilitatorMode });
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    engineRef.current = engine;
    let resizeFrame = 0;

    const renderFrame = () => {
      const { width, height, dpr } = sizeRef.current;
      if (!width || !height) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.render(ctx);
    };

    const resizeCanvas = () => {
      const rect = wrapper.getBoundingClientRect();
      const width = Math.max(320, Math.round(rect.width));
      const height = Math.max(360, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (sizeRef.current.width === width && sizeRef.current.height === height && sizeRef.current.dpr === dpr) {
        return;
      }

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      engine.resize(width, height);
      renderFrame();
      publishSnapshot(true);
    };

    const queueResize = () => {
      if (resizeFrame) return;
      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeCanvas();
      });
    };

    const step = (timestamp) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp;
      const frameDelta = Math.min(0.05, (timestamp - lastFrameRef.current) / 1000);
      lastFrameRef.current = timestamp;

      if (!document.hidden) {
        accumulatorRef.current += frameDelta;
        while (accumulatorRef.current >= FIXED_STEP) {
          engine.update(FIXED_STEP);
          accumulatorRef.current -= FIXED_STEP;
        }
        renderFrame();
        if (timestamp - lastUiSyncRef.current >= 80) {
          lastUiSyncRef.current = timestamp;
          publishSnapshot();
        }
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    resizeCanvas();
    publishSnapshot(true);
    renderFrame();
    rafRef.current = window.requestAnimationFrame(step);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(queueResize);
      resizeObserver.observe(wrapper);
    } else {
      window.addEventListener('resize', queueResize);
    }

    return () => {
      window.cancelAnimationFrame(rafRef.current);
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', queueResize);
      engineRef.current = null;
    };
  }, [facilitatorMode, publishSnapshot]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        event.preventDefault();
        setAction('left', true);
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        event.preventDefault();
        setAction('right', true);
      }
      if (event.code === 'ArrowDown' || event.code === 'KeyS') {
        event.preventDefault();
        setAction('down', true);
      }
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        event.preventDefault();
        if (!event.repeat) handleJump();
      }
    };

    const onKeyUp = (event) => {
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') setAction('left', false);
      if (event.code === 'ArrowRight' || event.code === 'KeyD') setAction('right', false);
      if (event.code === 'ArrowDown' || event.code === 'KeyS') setAction('down', false);
    };

    const onVisibilityChange = () => {
      accumulatorRef.current = 0;
      lastFrameRef.current = 0;
      clearControls();
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearControls);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearControls);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [clearControls, handleJump, setAction]);

  const hearts = Array.from({ length: ui.maxLives }, (_, index) => index < ui.lives);
  const sizeLabel = copy.sizeLevels?.[ui.sizeTier] || COPY.en.sizeLevels[ui.sizeTier];
  const resultText = format(copy.result, { goodFood: ui.goodFood, badFood: ui.badFood });
  const stickerText = ui.phase === 'won'
    ? (ui.canAdvanceLevel ? copy.nextStageHint : copy.stickerReady)
    : copy.retryHint;

  const holdHandlers = (action) => ({
    onPointerDown: (event) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setAction(action, true);
    },
    onPointerUp: () => setAction(action, false),
    onPointerLeave: () => setAction(action, false),
    onPointerCancel: () => setAction(action, false),
    onLostPointerCapture: () => setAction(action, false),
  });

  return (
    <div className="sonic-runner" dir={dir}>
      <div className="sonic-shell" ref={wrapperRef}>
        <canvas ref={canvasRef} className="sonic-canvas" />

        <div className="sonic-overlay sonic-overlay--top">
          <button className="sonic-icon-btn" onClick={onExit} type="button" aria-label={copy.exit}>
            X
          </button>
        </div>

        <div className="sonic-overlay sonic-overlay--stats">
          <div className="sonic-card">
            <span>{copy.goodFood}</span>
            <strong>{ui.goodFood}</strong>
          </div>
          <div className="sonic-card sonic-card--status">
            <span>{copy.size}</span>
            <strong>{sizeLabel}</strong>
          </div>
          <div className="sonic-card sonic-card--status">
            <span>{copy.level}</span>
            <strong>
              {ui.levelIndex} / {ui.totalLevels}
            </strong>
          </div>
          <div className="sonic-card sonic-card--status">
            <span>{copy.lives}</span>
            <div className="sonic-hearts" aria-label={`${copy.lives}: ${ui.lives}`}>
              {hearts.map((filled, index) => (
                <span key={index} className={filled ? 'is-live' : 'is-empty'}>
                  {filled ? HEART_LIVE : HEART_EMPTY}
                </span>
              ))}
            </div>
          </div>
          <div className="sonic-card sonic-card--meter">
            <span>{copy.progress}</span>
            <strong>{ui.progress}%</strong>
            <div className="sonic-meter" aria-label={`${copy.progress}: ${ui.progress}%`}>
              <div className="sonic-meter__fill sonic-meter__fill--progress" style={{ width: `${ui.progress}%` }} />
            </div>
          </div>
        </div>

        <div className="sonic-controls" onContextMenu={(event) => event.preventDefault()}>
          <button type="button" className="sonic-control-btn sonic-control-btn--dir" {...holdHandlers('left')}>
            {copy.left}
          </button>
          <button type="button" className="sonic-control-btn sonic-control-btn--dir" {...holdHandlers('right')}>
            {copy.right}
          </button>
          <button type="button" className="sonic-control-btn sonic-control-btn--jump" onPointerDown={handleJump}>
            {copy.jump}
          </button>
          <button type="button" className="sonic-control-btn sonic-control-btn--roll" {...holdHandlers('down')}>
            {copy.roll}
          </button>
        </div>

        {ui.phase !== 'playing' && (
          <div className="sonic-gameover">
            <div className="sonic-gameover-card">
              <p className="sonic-gameover-kicker">
                {ui.phase === 'won' ? (ui.canAdvanceLevel ? copy.levelClear : copy.campaignClear) : copy.gameOver}
              </p>
              <h2>
                {ui.levelIndex} / {ui.totalLevels}
              </h2>
              <p>{resultText}</p>
              <p className={`sonic-sticker-note ${ui.canClaimSticker ? 'is-ready' : ''}`}>
                {stickerText}
              </p>
              <div className="sonic-gameover-actions">
                {ui.canAdvanceLevel ? (
                  <button type="button" className="sonic-action-btn sonic-action-btn--primary" onClick={handleNextLevel}>
                    {copy.nextLevel}
                  </button>
                ) : (
                  <button type="button" className="sonic-action-btn sonic-action-btn--primary" onClick={handleRestart}>
                    {copy.restart}
                  </button>
                )}
                {ui.canAdvanceLevel && (
                  <button type="button" className="sonic-action-btn sonic-action-btn--ghost" onClick={handleRestart}>
                    {copy.restart}
                  </button>
                )}
                {ui.canClaimSticker && (
                  <button type="button" className="sonic-action-btn sonic-action-btn--accent" onClick={onSuccess}>
                    {copy.collect}
                  </button>
                )}
                <button type="button" className="sonic-action-btn sonic-action-btn--ghost" onClick={onExit}>
                  {copy.exit}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
