import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import './WordRace.css';

const WORDS = [
  { en: 'elephant', he: 'פיל', emoji: '🐘' },
  { en: 'dog', he: 'כלב', emoji: '🐶' },
  { en: 'cat', he: 'חתול', emoji: '🐱' },
  { en: 'fish', he: 'דג', emoji: '🐟' },
  { en: 'duck', he: 'ברווז', emoji: '🦆' },
  { en: 'bear', he: 'דוב', emoji: '🐻' },
  { en: 'frog', he: 'צפרדע', emoji: '🐸' },
  { en: 'tiger', he: 'נמר', emoji: '🐯' },
  { en: 'rabbit', he: 'ארנב', emoji: '🐰' },
  { en: 'monkey', he: 'קוף', emoji: '🐵' },
  { en: 'turtle', he: 'צב', emoji: '🐢' },
  { en: 'apple', he: 'תפוח', emoji: '🍎' },
  { en: 'cake', he: 'עוגה', emoji: '🎂' },
  { en: 'rocket', he: 'רקטה', emoji: '🚀' },
  { en: 'train', he: 'רכבת', emoji: '🚂' },
  { en: 'ball', he: 'כדור', emoji: '⚽' },
  { en: 'drum', he: 'תוף', emoji: '🥁' },
  { en: 'hat', he: 'כובע', emoji: '🎩' },
  { en: 'bird', he: 'ציפור', emoji: '🐦' },
  { en: 'cow', he: 'פרה', emoji: '🐮' },
];

const COPY = {
  he: {
    title: 'מירוץ מילים',
    subtitle: 'שומעים, אומרים, ומאיצים',
    start: 'מתחילים',
    how1: 'שומעים מילה',
    how2: 'אומרים בקול',
    how3: 'מקבלים טורבו',
    micFallback: 'אין מיקרופון זמין. אפשר לבחור את הכרטיס הנכון.',
    you: 'את/ה',
    ai: 'מחשב',
    listening: 'מקשיב...',
    micLabel: 'אמרו את המילה',
    coachIdleTitle: 'המשימה הבאה',
    coachIdleText: 'לחצו על הרמקול כדי לשמוע שוב, ואז אמרו את המילה.',
    coachListeningTitle: 'אני מקשיב',
    coachListeningText: 'אמרו את המילה בקול ברור וקצר.',
    coachWrongTitle: 'לא נקלט טוב',
    coachWrongText: 'אפשר לנסות שוב, או לבחור את הכרטיס הנכון.',
    coachCorrectTitle: 'מעולה!',
    coachCorrectText: 'קיבלתם טורבו.',
    heard: 'מה שמעתי',
    noClearWord: 'לא שמעתי מילה ברורה',
    turbo: 'טורבו!',
    tryAgain: 'נסו שוב',
    skip: 'דלג',
    challengeSoon: 'האתגר הבא מגיע...',
    win: 'ניצחתם!',
    lose: 'כמעט הצלחתם',
    winSub: 'עניתם נכון והקדמתם את המחשב.',
    loseSub: 'המחשב ניצח הפעם. רוצים עוד סיבוב?',
    collect: 'קבלו מדבקה',
    playAgain: 'שחקו שוב',
    back: 'חזרה',
    score: 'מילים',
  },
  en: {
    title: 'Word Race',
    subtitle: 'Hear it, say it, boost ahead',
    start: 'Start Race',
    how1: 'Hear a word',
    how2: 'Say it out loud',
    how3: 'Get turbo',
    micFallback: 'No microphone available. You can pick the right card instead.',
    you: 'You',
    ai: 'AI',
    listening: 'Listening...',
    micLabel: 'Say the word',
    coachIdleTitle: 'Your next word',
    coachIdleText: 'Tap the speaker to hear it again, then say the word.',
    coachListeningTitle: 'I am listening',
    coachListeningText: 'Say the word clearly and briefly.',
    coachWrongTitle: 'Not clear enough',
    coachWrongText: 'Try the mic again, or pick the right card.',
    coachCorrectTitle: 'Perfect!',
    coachCorrectText: 'Turbo boost unlocked.',
    heard: 'I heard',
    noClearWord: 'No clear word',
    turbo: 'Turbo!',
    tryAgain: 'Try again',
    skip: 'Skip',
    challengeSoon: 'Next challenge coming...',
    win: 'You Win!',
    lose: 'So Close!',
    winSub: 'You answered correctly and passed the AI.',
    loseSub: 'The AI won this round. Want another race?',
    collect: 'Collect Sticker',
    playAgain: 'Play Again',
    back: 'Back',
    score: 'Words',
  },
};

const WORD_ALIASES = {
  elephant: ['elefant', 'elifant'],
  rabbit: ['rabit'],
  tiger: ['tigar'],
  monkey: ['monkee'],
  turtle: ['turtel'],
  rocket: ['rockit'],
};

const TURBO_BOOST = 18;
const AI_TICK_MS = 800;
const AI_STEP = 2.5;
const AI_STEP_SLOW = 0.8;
const CHALLENGE_DELAY = 2500;
const FEEDBACK_DELAY = 1500;
const WINS_REQUIRED = 12;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const HAS_SPEECH = !!SpeechRecognition;
const CONFETTI_COLORS = ['#ffcf53', '#ff8b5e', '#ff5f7a', '#6dd3ff', '#53e0a1', '#c38bff'];

function normalizeSpokenText(text, lang) {
  const pattern = lang === 'he' ? /[^א-ת\s]/g : /[^a-z\s]/g;
  return (text || '')
    .toLowerCase()
    .replace(pattern, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function getWordText(wordObj, lang) {
  return lang === 'he' ? wordObj.he : wordObj.en;
}

function getSpeechLang(lang) {
  return lang === 'he' ? 'he-IL' : 'en-US';
}

function wordMatches(heard, target, lang) {
  const normalizedHeard = normalizeSpokenText(heard, lang);
  const normalizedTarget = normalizeSpokenText(target, lang);
  if (!normalizedHeard || !normalizedTarget) return false;
  if (normalizedHeard.includes(normalizedTarget) || normalizedTarget.includes(normalizedHeard)) return true;

  const acceptable = lang === 'he'
    ? [normalizedTarget]
    : [normalizedTarget, ...(WORD_ALIASES[normalizedTarget] || [])];

  return normalizedHeard.split(/\s+/).some((word) =>
    acceptable.some((candidate) =>
      word === candidate ||
      word.startsWith(candidate) ||
      candidate.startsWith(word) ||
      levenshtein(word, candidate) <= Math.min(2, Math.floor(candidate.length / 3))
    )
  );
}

function shuffle(arr) {
  const clone = [...arr];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function getFallbackChoices(target, all) {
  const others = all.filter((item) => item.en !== target.en);
  return shuffle([target, ...shuffle(others).slice(0, 2)]);
}

function Confetti({ id }) {
  const pieces = Array.from({ length: 20 }, (_, i) => {
    const angle = (i / 20) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const dist = 50 + Math.random() * 90;
    return {
      tx: Math.round(Math.cos(angle) * dist),
      ty: Math.round(Math.sin(angle) * dist),
      r: Math.round(Math.random() * 480 - 240),
      size: Math.round(6 + Math.random() * 5),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: (i * 0.02).toFixed(3),
    };
  });

  return (
    <div className="wr-confetti-wrap" key={id}>
      {pieces.map((piece, index) => (
        <div
          key={index}
          className="wr-confetti-piece"
          style={{
            '--tx': `${piece.tx}px`,
            '--ty': `${piece.ty}px`,
            '--r': `${piece.r}deg`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            background: piece.color,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function CountdownScreen({ onDone }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count > 1) {
      const timer = setTimeout(() => setCount((current) => current - 1), 900);
      return () => clearTimeout(timer);
    }
    if (count === 1) {
      const timer = setTimeout(() => setCount(0), 900);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => onDone(), 600);
    return () => clearTimeout(timer);
  }, [count, onDone]);

  return (
    <div className="wr-countdown">
      <div key={count} className="wr-countdown-number">
        {count === 0 ? 'GO!' : count}
      </div>
    </div>
  );
}

function IntroScreen({ copy, onStart }) {
  return (
    <div className="wr-intro">
      <div className="wr-intro-badge">{copy.title}</div>
      <h1 className="wr-intro-title">{copy.title}</h1>
      <p className="wr-intro-subtitle">{copy.subtitle}</p>

      <div className="wr-intro-preview">
        <div className="wr-intro-preview-car">🏎️</div>
        <div className="wr-intro-preview-track" />
      </div>

      <div className="wr-intro-grid">
        <div className="wr-intro-card">
          <span className="wr-intro-card-icon">🔊</span>
          <span>{copy.how1}</span>
        </div>
        <div className="wr-intro-card">
          <span className="wr-intro-card-icon">🎙️</span>
          <span>{copy.how2}</span>
        </div>
        <div className="wr-intro-card">
          <span className="wr-intro-card-icon">⚡</span>
          <span>{copy.how3}</span>
        </div>
      </div>

      {!HAS_SPEECH && <div className="wr-intro-warning">{copy.micFallback}</div>}

      <button className="wr-btn wr-btn--start" onClick={onStart}>
        {copy.start}
      </button>
    </div>
  );
}

function ChallengeCard({
  copy,
  lang,
  wordObj,
  subPhase,
  onMic,
  onFallback,
  fallbackChoices,
  onReplay,
  onSkip,
  heardText,
  failedAttempts,
}) {
  const isListening = subPhase === 'listening';
  const isCorrect = subPhase === 'correct';
  const isWrong = subPhase === 'wrong';
  const showFallback = !isCorrect && (!HAS_SPEECH || failedAttempts > 0 || isWrong);

  let coachTitle = copy.coachIdleTitle;
  let coachText = copy.coachIdleText;
  if (isListening) {
    coachTitle = copy.coachListeningTitle;
    coachText = copy.coachListeningText;
  } else if (isWrong) {
    coachTitle = copy.coachWrongTitle;
    coachText = copy.coachWrongText;
  } else if (isCorrect) {
    coachTitle = copy.coachCorrectTitle;
    coachText = copy.coachCorrectText;
  }

  let cardClass = 'wr-challenge';
  if (isCorrect) cardClass += ' wr-challenge--correct';
  if (isWrong) cardClass += ' wr-challenge--wrong';
  if (isListening) cardClass += ' wr-challenge--listening';
  if (!isCorrect && !isWrong && !isListening) cardClass += ' wr-challenge--idle';

  return (
    <div className={cardClass}>
      <div className="wr-coach">
        <div className="wr-coach-label">{coachTitle}</div>
        <div className="wr-coach-text">{coachText}</div>
      </div>

      <div className="wr-challenge-stage">
        <div className="wr-challenge-emoji">{wordObj.emoji}</div>
        <div className="wr-challenge-word">{getWordText(wordObj, lang)}</div>
        <button className="wr-challenge-replay" onClick={onReplay} aria-label="Replay word">
          🔊
        </button>
      </div>

      {isCorrect && <div className="wr-feedback-turbo">{copy.turbo}</div>}
      {isWrong && <div className="wr-feedback-wrong">{copy.tryAgain}</div>}

      {!isCorrect && HAS_SPEECH && (
        <button
          className={`wr-mic-btn ${isListening ? 'wr-mic-btn--listening' : ''}`}
          onClick={onMic}
          disabled={isListening}
        >
          {isListening ? (
            <>
              <span className="wr-mic-waves">
                <span className="wr-bar wr-bar--1" />
                <span className="wr-bar wr-bar--2" />
                <span className="wr-bar wr-bar--3" />
              </span>
              <span>{copy.listening}</span>
            </>
          ) : (
            <>
              <span className="wr-mic-icon">🎙️</span>
              <span>{copy.micLabel}</span>
            </>
          )}
        </button>
      )}

      {heardText && !isCorrect && (
        <div className="wr-heard">
          <span className="wr-heard-label">{copy.heard}</span>
          <strong>{heardText}</strong>
        </div>
      )}

      {showFallback && (
        <div className="wr-fallback-btns">
          {fallbackChoices.map((choice) => (
            <button
              key={choice.en}
              className="wr-fallback-btn"
              onClick={() => onFallback(choice)}
            >
              <span>{choice.emoji}</span>
              <span>{getWordText(choice, lang)}</span>
            </button>
          ))}
        </div>
      )}

      {!isCorrect && (
        <button
          className="wr-skip-btn"
          onClick={onSkip}
          disabled={isListening || isCorrect || isWrong}
        >
          {copy.skip}
        </button>
      )}
    </div>
  );
}

export default function WordRace({ onSuccess, onExit }) {
  const { lang, dir, setLang } = useLanguage();
  const copy = COPY[lang] || COPY.en;

  const [screen, setScreen] = useState('intro');
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos] = useState(0);
  const [subPhase, setSubPhase] = useState('driving');
  const [currentWord, setCurrentWord] = useState(null);
  const [fallbackChoices, setFallbackChoices] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [winner, setWinner] = useState(null);
  const [heardText, setHeardText] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [turboActive, setTurboActive] = useState(false);
  const [confettiId, setConfettiId] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  const recogRef = useRef(null);
  const currentWordRef = useRef(null);
  const subPhaseRef = useRef('driving');
  const playerPosRef = useRef(0);
  const aiPosRef = useRef(0);
  const correctCountRef = useRef(0);
  const doneRef = useRef(false);
  const wordDeckRef = useRef([]);

  useEffect(() => { subPhaseRef.current = subPhase; }, [subPhase]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { aiPosRef.current = aiPos; }, [aiPos]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);

  const nextWordFromDeck = useCallback(() => {
    if (wordDeckRef.current.length === 0) {
      wordDeckRef.current = shuffle([...WORDS]);
    }
    return wordDeckRef.current.pop();
  }, []);

  const replayCurrentWord = useCallback(() => {
    const word = currentWordRef.current;
    if (!word) return;
    speak(getWordText(word, lang), lang);
  }, [lang]);

  function checkWin(nextPlayerPos, nextAiPos, nextCorrectCount) {
    if (doneRef.current) return false;
    if (nextPlayerPos >= 100 || nextCorrectCount >= WINS_REQUIRED) {
      doneRef.current = true;
      setWinner('player');
      setScreen('done');
      return true;
    }
    if (nextAiPos >= 100) {
      doneRef.current = true;
      setWinner('ai');
      setScreen('done');
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (screen !== 'race') return undefined;
    const interval = setInterval(() => {
      if (doneRef.current) return;
      const step = ['challenge', 'listening', 'correct', 'wrong'].includes(subPhaseRef.current)
        ? AI_STEP_SLOW
        : AI_STEP;
      const nextAiPos = Math.min(aiPosRef.current + step, 100);
      aiPosRef.current = nextAiPos;
      setAiPos(nextAiPos);
      checkWin(playerPosRef.current, nextAiPos, correctCountRef.current);
    }, AI_TICK_MS);
    return () => clearInterval(interval);
  }, [screen]);

  const presentChallenge = useCallback(() => {
    if (doneRef.current) return;
    const word = nextWordFromDeck();
    currentWordRef.current = word;
    setCurrentWord(word);
    setFallbackChoices(getFallbackChoices(word, WORDS));
    setHeardText('');
    setFailedAttempts(0);
    setSubPhase('challenge');
    speak(getWordText(word, lang), lang);
  }, [lang, nextWordFromDeck]);

  useEffect(() => {
    if (screen !== 'race' || subPhase !== 'driving') return undefined;
    const timer = setTimeout(presentChallenge, CHALLENGE_DELAY);
    return () => clearTimeout(timer);
  }, [screen, subPhase, presentChallenge]);

  function handleResult(correct) {
    if (doneRef.current) return;

    if (correct) {
      setHeardText('');
      setFailedAttempts(0);
      setSubPhase('correct');
      setTurboActive(true);
      setConfettiId((value) => value + 1);
      setShowFlash(true);
      speak(lang === 'he' ? 'כל הכבוד!' : 'Amazing!', lang);

      const nextCorrectCount = correctCountRef.current + 1;
      const nextPlayerPos = Math.min(playerPosRef.current + TURBO_BOOST, 100);
      setCorrectCount(nextCorrectCount);
      setPlayerPos(nextPlayerPos);
      playerPosRef.current = nextPlayerPos;
      correctCountRef.current = nextCorrectCount;

      setTimeout(() => setShowFlash(false), 500);

      if (!checkWin(nextPlayerPos, aiPosRef.current, nextCorrectCount)) {
        setTimeout(() => {
          setTurboActive(false);
          setSubPhase('driving');
        }, FEEDBACK_DELAY);
      }
      return;
    }

    setFailedAttempts((value) => value + 1);
    setSubPhase('wrong');
    replayCurrentWord();
    setTimeout(() => setSubPhase('challenge'), FEEDBACK_DELAY);
  }

  function startListening() {
    if (!HAS_SPEECH) return;
    if (recogRef.current) {
      try { recogRef.current.abort(); } catch (error) {}
    }

    setHeardText('');
    const recog = new SpeechRecognition();
    recog.lang = getSpeechLang(lang);
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;

    recog.onresult = (event) => {
      const transcripts = Array.from(event.results[0]).map((result) => result.transcript);
      const targetText = getWordText(currentWordRef.current || { en: '', he: '' }, lang);
      const normalized = normalizeSpokenText(transcripts[0] || '', lang);
      setHeardText(normalized || copy.noClearWord);
      handleResult(transcripts.some((text) => wordMatches(text, targetText, lang)));
    };
    recog.onerror = () => {
      setHeardText(copy.noClearWord);
      handleResult(false);
    };
    recog.onend = () => {
      if (subPhaseRef.current === 'listening') {
        setHeardText((current) => current || copy.noClearWord);
        handleResult(false);
      }
    };

    setSubPhase('listening');
    recog.start();
  }

  function handleSkip() {
    setAiPos((value) => Math.min(value + 5, 100));
    setSubPhase('driving');
  }

  function handleFallback(choice) {
    if (!['challenge', 'wrong'].includes(subPhaseRef.current)) return;
    handleResult(choice.en === currentWordRef.current?.en);
  }

  function startRace() {
    doneRef.current = false;
    wordDeckRef.current = shuffle([...WORDS]);
    setScreen('countdown');
    setPlayerPos(0);
    setAiPos(0);
    setCorrectCount(0);
    setWinner(null);
    setSubPhase('driving');
    setCurrentWord(null);
    setHeardText('');
    setFailedAttempts(0);
    setTurboActive(false);
    setConfettiId(0);
    setShowFlash(false);
    playerPosRef.current = 0;
    aiPosRef.current = 0;
    correctCountRef.current = 0;
    subPhaseRef.current = 'driving';
  }

  useEffect(() => {
    return () => {
      if (recogRef.current) {
        try { recogRef.current.abort(); } catch (error) {}
      }
    };
  }, []);

  if (screen === 'intro') {
    return (
      <div className="wr-root" dir={dir}>
        <div className="wr-bg-stars" />
        <button className="wr-back" onClick={onExit}>{dir === 'rtl' ? '→' : '←'}</button>
        <IntroScreen copy={copy} onStart={startRace} />
      </div>
    );
  }

  if (screen === 'countdown') {
    return (
      <div className="wr-root" dir={dir}>
        <div className="wr-bg-stars" />
        <div className="wr-track-wrap wr-track-wrap--faint">
          <div className="wr-lane">
            <span className="wr-lane-label">{copy.you}</span>
            <div className="wr-road wr-road--paused">
              <div className="wr-car" style={{ left: '0%' }}>🏎️</div>
            </div>
            <span className="wr-flag">🏁</span>
          </div>
          <div className="wr-lane">
            <span className="wr-lane-label">{copy.ai}</span>
            <div className="wr-road wr-road--paused">
              <div className="wr-car" style={{ left: '0%' }}>🤖</div>
            </div>
            <span className="wr-flag">🏁</span>
          </div>
        </div>
        <CountdownScreen onDone={() => setScreen('race')} />
      </div>
    );
  }

  if (screen === 'done') {
    const won = winner === 'player';
    return (
      <div className="wr-root" dir={dir}>
        <div className="wr-bg-stars" />
        <div className="wr-done">
          <div className="wr-done-emoji">{won ? '🏆' : '🙂'}</div>
          <h2 className="wr-done-title">{won ? copy.win : copy.lose}</h2>
          <p className="wr-done-sub">{won ? copy.winSub : copy.loseSub}</p>
          {won ? (
            <button className="wr-btn wr-btn--primary" onClick={onSuccess}>{copy.collect}</button>
          ) : (
            <button className="wr-btn wr-btn--primary" onClick={startRace}>{copy.playAgain}</button>
          )}
          <button className="wr-btn wr-btn--ghost" onClick={onExit}>{copy.back}</button>
        </div>
      </div>
    );
  }

  const showChallenge = ['challenge', 'listening', 'correct', 'wrong'].includes(subPhase);
  const roadMoving = subPhase === 'driving';

  return (
    <div className="wr-root" dir={dir}>
      <div className="wr-bg-stars" />
      {showFlash && <div className="wr-flash" />}

      <div className="wr-header">
        <button className="wr-back" onClick={onExit}>{dir === 'rtl' ? '→' : '←'}</button>
        <div className="wr-header-main">
          <div className="wr-header-title">{copy.title}</div>
          <div className="wr-header-subtitle">{copy.score}</div>
        </div>
        <div className="wr-header-actions">
          <button
            className="wr-lang-btn"
            onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
            aria-label={lang === 'he' ? 'Switch to English' : 'לעבור לעברית'}
          >
            {lang === 'he' ? 'EN' : 'עב'}
          </button>
          <div className="wr-score">{correctCount} / {WINS_REQUIRED}</div>
        </div>
      </div>

      <div className="wr-track-wrap">
        {confettiId > 0 && <Confetti id={confettiId} />}

        <div className="wr-track-topline">
          <div className="wr-track-topline-item">
            <span className="wr-track-topline-dot wr-track-topline-dot--you" />
            <span>{copy.you}</span>
          </div>
          <div className="wr-track-topline-item">
            <span className="wr-track-topline-dot wr-track-topline-dot--ai" />
            <span>{copy.ai}</span>
          </div>
        </div>

        <div className="wr-lane">
          <span className="wr-lane-label">{copy.you}</span>
          <div className={`wr-road ${roadMoving ? '' : 'wr-road--paused'}`}>
            <div
              className={`wr-car ${turboActive ? 'wr-car--turbo' : ''}`}
              style={{ left: `calc(${playerPos}% * 0.88)` }}
            >
              🏎️
              {subPhase === 'driving' && <span className="wr-exhaust">💨</span>}
              {turboActive && <span className="wr-turbo-trail">✨</span>}
            </div>
          </div>
          <span className="wr-flag">🏁</span>
        </div>

        <div className="wr-lane">
          <span className="wr-lane-label">{copy.ai}</span>
          <div className={`wr-road ${roadMoving ? '' : 'wr-road--paused'}`}>
            <div className="wr-car" style={{ left: `calc(${aiPos}% * 0.88)` }}>🤖</div>
          </div>
          <span className="wr-flag">🏁</span>
        </div>
      </div>

      {showChallenge && currentWord && (
        <ChallengeCard
          copy={copy}
          lang={lang}
          wordObj={currentWord}
          subPhase={subPhase}
          onMic={startListening}
          onFallback={handleFallback}
          fallbackChoices={fallbackChoices}
          onReplay={replayCurrentWord}
          onSkip={handleSkip}
          heardText={heardText}
          failedAttempts={failedAttempts}
        />
      )}

      {!showChallenge && (
        <div className="wr-driving-hint">
          <span className="wr-driving-dot" />
          <span className="wr-driving-dot" />
          <span className="wr-driving-dot" />
          <span className="wr-driving-text">{copy.challengeSoon}</span>
        </div>
      )}
    </div>
  );
}
