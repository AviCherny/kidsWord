import React, { useEffect, useReducer, useRef } from 'react';
import './RescueDog.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const OBJECTS = [
  { id: 'bush', label: { en: 'Bush', he: 'שיח' }, shape: 'bush' },
  { id: 'rock', label: { en: 'Rock', he: 'סלע' }, shape: 'rock' },
  { id: 'box', label: { en: 'Box', he: 'קופסה' }, shape: 'box' },
];

const WORDS = ['person', 'help', 'water'];

const COPY = {
  en: {
    badge: 'Rescue Dog',
    title: 'Find the survivor',
    subtitle: 'Tap one big hiding spot. One person needs help.',
    start: 'Start',
    mission: 'Find the person!',
    tryAgain: 'Try again!',
    hint: 'Listen... help!',
    success: 'Good job!',
    thanks: 'Thank you!',
    heroTitle: 'You are a rescue hero!',
    heroText: 'You found 3 survivors.',
    playAgain: 'Play Again',
    collectSticker: 'Collect Sticker',
    back: 'Back',
    words: 'Words',
    wordPerson: 'person',
    wordHelp: 'help',
    wordWater: 'water',
    helpSpeech: 'Help!',
    thanksSpeech: 'Thank you!',
    foundSpeech: 'Find the person!',
  },
  he: {
    badge: 'כלב חילוץ',
    title: 'מצאו את הניצול',
    subtitle: 'לוחצים על מקום מסתור אחד גדול. אדם אחד צריך עזרה.',
    start: 'מתחילים',
    mission: 'מצאו את האדם!',
    tryAgain: 'נסו שוב!',
    hint: 'תקשיבו... עזרה!',
    success: 'כל הכבוד!',
    thanks: 'תודה!',
    heroTitle: 'אתם גיבורי חילוץ!',
    heroText: 'מצאתם 3 ניצולים.',
    playAgain: 'שחקו שוב',
    collectSticker: 'קבלו מדבקה',
    back: 'חזרה',
    words: 'מילים',
    wordPerson: 'person',
    wordHelp: 'help',
    wordWater: 'water',
    helpSpeech: 'הצילו!',
    thanksSpeech: 'תודה!',
    foundSpeech: 'מצאו את האדם!',
  },
};

function createInitialState() {
  return {
    stage: 'intro',
    round: 1,
    correctIndex: 0,
    successes: 0,
    selectedIndex: null,
    hintVisible: false,
    messageKey: 'mission',
    wordIndex: 0,
    feedbackTick: 0,
  };
}

function nextWordIndex(current) {
  return (current + 1) % WORDS.length;
}

function chooseIndex() {
  return Math.floor(Math.random() * OBJECTS.length);
}

function ensureAudio(audioRef) {
  if (!audioRef.current) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioRef.current = new AudioContext();
  }
  if (audioRef.current?.state === 'suspended') {
    audioRef.current.resume().catch(() => {});
  }
  return audioRef.current;
}

function beepSequence(audioRef, notes, wave) {
  const ctx = ensureAudio(audioRef);
  if (!ctx) return;

  let start = ctx.currentTime;
  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.value = note.freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + note.dur + 0.02);
    start += note.dur + 0.03;
  });
}

function playSuccessSound(audioRef) {
  beepSequence(
    audioRef,
    [
      { freq: 523.25, dur: 0.14, gain: 0.06 },
      { freq: 659.25, dur: 0.14, gain: 0.06 },
      { freq: 783.99, dur: 0.2, gain: 0.08 },
    ],
    'triangle'
  );
}

function playWrongSound(audioRef) {
  beepSequence(
    audioRef,
    [
      { freq: 330, dur: 0.16, gain: 0.04 },
      { freq: 280, dur: 0.2, gain: 0.04 },
    ],
    'sine'
  );
}

function playHintSound(audioRef) {
  beepSequence(
    audioRef,
    [
      { freq: 440, dur: 0.12, gain: 0.04 },
      { freq: 554.37, dur: 0.16, gain: 0.04 },
      { freq: 659.25, dur: 0.18, gain: 0.05 },
    ],
    'square'
  );
}

function reducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...createInitialState(),
        stage: 'play',
        correctIndex: chooseIndex(),
        feedbackTick: state.feedbackTick + 1,
      };

    case 'SELECT_CORRECT': {
      const nextSuccesses = state.successes + 1;
      return {
        ...state,
        stage: nextSuccesses >= 3 ? 'hero' : 'round-win',
        successes: nextSuccesses,
        selectedIndex: action.index,
        hintVisible: false,
        messageKey: 'success',
        wordIndex: nextWordIndex(state.wordIndex),
        feedbackTick: state.feedbackTick + 1,
      };
    }

    case 'SELECT_WRONG':
      return {
        ...state,
        stage: 'round-wrong',
        selectedIndex: action.index,
        hintVisible: false,
        messageKey: 'tryAgain',
        feedbackTick: state.feedbackTick + 1,
      };

    case 'SHOW_HINT':
      if (state.stage !== 'round-wrong') return state;
      return {
        ...state,
        stage: 'play',
        hintVisible: true,
        selectedIndex: null,
        messageKey: 'hint',
        wordIndex: 1,
        feedbackTick: state.feedbackTick + 1,
      };

    case 'NEXT_ROUND':
      if (state.stage !== 'round-win') return state;
      return {
        ...state,
        stage: 'play',
        round: state.round + 1,
        correctIndex: chooseIndex(),
        selectedIndex: null,
        hintVisible: false,
        messageKey: 'mission',
        wordIndex: nextWordIndex(state.wordIndex),
        feedbackTick: state.feedbackTick + 1,
      };

    case 'RESET':
      return createInitialState();

    default:
      return state;
  }
}

export default function RescueDog({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang] || COPY.en;
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const timersRef = useRef([]);
  const audioRef = useRef(null);

  function clearTimers() {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  useEffect(() => {
    if (state.stage === 'round-win') {
      clearTimers();
      timersRef.current.push(window.setTimeout(() => {
        dispatch({ type: 'NEXT_ROUND' });
      }, 1400));
    }

    if (state.stage === 'round-wrong') {
      clearTimers();
      timersRef.current.push(window.setTimeout(() => {
        dispatch({ type: 'SHOW_HINT' });
      }, 2000));
    }
  }, [state.stage]);

  useEffect(() => {
    if (state.stage === 'intro') return;

    if (state.messageKey === 'mission') {
      speak(copy.foundSpeech, lang);
      return;
    }

    if (state.messageKey === 'tryAgain') {
      speak(copy.tryAgain, lang);
      playWrongSound(audioRef);
      return;
    }

    if (state.messageKey === 'hint') {
      speak(copy.helpSpeech, lang);
      playHintSound(audioRef);
      return;
    }

    if (state.messageKey === 'success') {
      speak(`${copy.success} ${copy.thanksSpeech}`, lang);
      playSuccessSound(audioRef);
    }
  }, [copy.foundSpeech, copy.helpSpeech, copy.success, copy.thanksSpeech, copy.tryAgain, lang, state.feedbackTick, state.messageKey, state.stage]);

  function handleSelect(index) {
    ensureAudio(audioRef);

    if (state.stage !== 'play') return;

    if (index === state.correctIndex) {
      dispatch({ type: 'SELECT_CORRECT', index });
      return;
    }

    dispatch({ type: 'SELECT_WRONG', index });
  }

  function currentWord() {
    const key = WORDS[state.wordIndex];
    if (key === 'help') return copy.wordHelp;
    if (key === 'water') return copy.wordWater;
    return copy.wordPerson;
  }

  const starsInCycle = state.successes % 5 === 0 && state.successes > 0 ? 5 : state.successes % 5;

  if (state.stage === 'intro') {
    return (
      <div className="rescuedog rescuedog-intro" dir={dir}>
        <header className="rescuedog-hud">
          <StarBar starsInCycle={0} balloons={0} />
          <button className="rescuedog-exit" type="button" onClick={onExit} aria-label="Exit">×</button>
        </header>

        <section className="rescuedog-card rescuedog-hero">
          <div className="rescuedog-badge">{copy.badge}</div>
          <h1 className="rescuedog-title">{copy.title}</h1>
          <p className="rescuedog-subtitle">{copy.subtitle}</p>

          <div className="rescuedog-scene-preview" aria-hidden="true">
            <div className="rescuedog-sun" />
            <div className="rescuedog-cloud rescuedog-cloud-left" />
            <div className="rescuedog-cloud rescuedog-cloud-right" />
            <div className="rescuedog-preview-ground" />
            <div className="rescuedog-preview-bush" />
            <div className="rescuedog-preview-rock" />
            <div className="rescuedog-preview-box" />
            <div className="rescuedog-preview-dog">🐶</div>
          </div>

          <div className="rescuedog-word-row">
            <span className="rescuedog-word-label">{copy.words}</span>
            {WORDS.map((word) => (
              <span key={word} className="rescuedog-word-chip">
                {word}
              </span>
            ))}
          </div>

          <button className="rescuedog-primary" type="button" onClick={() => dispatch({ type: 'START_GAME' })}>
            {copy.start}
          </button>
        </section>
      </div>
    );
  }

  if (state.stage === 'hero') {
    return (
      <div className="rescuedog rescuedog-win" dir={dir}>
        <header className="rescuedog-hud">
          <StarBar starsInCycle={starsInCycle} balloons={0} />
          <button className="rescuedog-exit" type="button" onClick={onExit} aria-label="Exit">×</button>
        </header>

        <section className="rescuedog-card rescuedog-hero-card">
          <div className="rescuedog-hero-stars">⭐ ⭐ ⭐</div>
          <h1 className="rescuedog-title rescuedog-title-small">{copy.heroTitle}</h1>
          <p className="rescuedog-subtitle rescuedog-subtitle-small">{copy.heroText}</p>

          <div className="rescuedog-win-actions">
            <button className="rescuedog-primary" type="button" onClick={onSuccess}>
              {copy.collectSticker}
            </button>
            <button className="rescuedog-secondary" type="button" onClick={() => dispatch({ type: 'RESET' })}>
              {copy.playAgain}
            </button>
          </div>

          <button className="rescuedog-back" type="button" onClick={onExit}>
            {copy.back}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="rescuedog" dir={dir}>
      <div className="rescuedog-blob rescuedog-blob-one" aria-hidden="true" />
      <div className="rescuedog-blob rescuedog-blob-two" aria-hidden="true" />

      <header className="rescuedog-hud">
        <StarBar starsInCycle={starsInCycle} balloons={0} />
        <button className="rescuedog-exit" type="button" onClick={onExit} aria-label="Exit">×</button>
      </header>

      <section className="rescuedog-card rescuedog-topbar">
        <div className="rescuedog-topbar-title">{copy.title}</div>
        <div className="rescuedog-topbar-message">
          {state.messageKey === 'success' ? `${copy.success} ${copy.thanks}` : copy[state.messageKey]}
        </div>
        <div className="rescuedog-topbar-stars">
          {'⭐'.repeat(state.successes)}
          {'☆'.repeat(Math.max(0, 3 - state.successes))}
        </div>
      </section>

      <section className="rescuedog-card rescuedog-wordbar">
        <span className="rescuedog-word-label">{copy.words}</span>
        <span className="rescuedog-word-current">{currentWord()}</span>
      </section>

      <section className="rescuedog-card rescuedog-scene">
        <div className="rescuedog-scene-sun" />
        <div className="rescuedog-hill rescuedog-hill-left" />
        <div className="rescuedog-hill rescuedog-hill-right" />
        <div className="rescuedog-tree rescuedog-tree-left" />
        <div className="rescuedog-tree rescuedog-tree-right" />
        <div className="rescuedog-ground" />

        <div className="rescuedog-object-row">
          {OBJECTS.map((object, index) => {
            const isCorrect = index === state.correctIndex;
            const showPerson = state.stage === 'round-win' && isCorrect;
            const showHint = state.hintVisible && isCorrect;
            const isWrongPick = state.selectedIndex === index && state.stage === 'round-wrong';

            return (
              <button
                key={object.id}
                type="button"
                className={[
                  'rescuedog-object',
                  `rescuedog-object-${object.shape}`,
                  showPerson ? 'rescuedog-object-open' : '',
                  showHint ? 'rescuedog-object-hint' : '',
                  isWrongPick ? 'rescuedog-object-wrong' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleSelect(index)}
                disabled={state.stage !== 'play'}
                aria-label={lang === 'he' ? object.label.he : object.label.en}
              >
                <span className="rescuedog-object-hit" />
                <span className="rescuedog-object-art">
                  {object.shape === 'bush' && <span className="rescuedog-bush-shape" />}
                  {object.shape === 'rock' && <span className="rescuedog-rock-shape" />}
                  {object.shape === 'box' && <span className="rescuedog-box-shape" />}
                </span>
                <span className={`rescuedog-person ${showPerson ? 'rescuedog-person-visible' : ''}`}>
                  <span className="rescuedog-person-head" />
                  <span className="rescuedog-person-arms" />
                  <span className="rescuedog-person-body" />
                </span>
                <span className="rescuedog-object-label">{lang === 'he' ? object.label.he : object.label.en}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rescuedog-dog-area" aria-hidden="true">
        <div className="rescuedog-dog">
          <div className="rescuedog-dog-head">
            <div className="rescuedog-dog-hat" />
            <div className="rescuedog-dog-eye rescuedog-dog-eye-left" />
            <div className="rescuedog-dog-eye rescuedog-dog-eye-right" />
            <div className="rescuedog-dog-nose" />
          </div>
          <div className="rescuedog-dog-body" />
          <div className="rescuedog-dog-legs" />
          <div className="rescuedog-dog-tail" />
        </div>
      </section>
    </div>
  );
}
