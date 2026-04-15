import React, { useState, useEffect, useRef, useCallback } from 'react';
import { speak } from '../../speak';
import './WordRace.css';

const WORDS = [
  { word: 'elephant', emoji: '🐘' },
  { word: 'dog',      emoji: '🐶' },
  { word: 'cat',      emoji: '🐱' },
  { word: 'fish',     emoji: '🐟' },
  { word: 'duck',     emoji: '🦆' },
  { word: 'bear',     emoji: '🐻' },
  { word: 'frog',     emoji: '🐸' },
  { word: 'tiger',    emoji: '🐯' },
  { word: 'rabbit',   emoji: '🐰' },
  { word: 'monkey',   emoji: '🐵' },
  { word: 'turtle',   emoji: '🐢' },
  { word: 'apple',    emoji: '🍎' },
  { word: 'cake',     emoji: '🎂' },
  { word: 'rocket',   emoji: '🚀' },
  { word: 'train',    emoji: '🚂' },
  { word: 'ball',     emoji: '⚽' },
  { word: 'drum',     emoji: '🥁' },
  { word: 'hat',      emoji: '🎩' },
  { word: 'bird',     emoji: '🐦' },
  { word: 'cow',      emoji: '🐮' },
];

const TURBO_BOOST    = 18;   // % per correct word
const AI_TICK_MS     = 800;  // ms between AI steps
const AI_STEP        = 2.5;  // % per tick
const AI_STEP_SLOW   = 0.8;  // % per tick during a challenge
const CHALLENGE_DELAY = 2500; // ms before first/next challenge
const FEEDBACK_DELAY  = 1500; // ms to show feedback before next round
const WINS_REQUIRED   = 12;   // correct words = auto-win

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const HAS_SPEECH = !!SpeechRecognition;

// Levenshtein distance — used for fuzzy matching
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function wordMatches(heard, target) {
  const h = heard.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  // exact substring match or close enough
  if (h.includes(t) || t.includes(h)) return true;
  const words = h.split(/\s+/);
  return words.some(w => levenshtein(w, t) <= 2);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getFallbackChoices(target, all) {
  const others = all.filter(w => w.word !== target.word);
  const distractors = shuffle(others).slice(0, 2);
  return shuffle([target, ...distractors]);
}

// ─── Intro Screen ──────────────────────────────────────────────────────────────
function IntroScreen({ onStart }) {
  return (
    <div className="wr-intro">
      <div className="wr-intro-title">
        <span className="wr-intro-he">מרוץ מילים</span>
        <span className="wr-intro-en">Word Race</span>
      </div>

      <div className="wr-intro-car">🏎️</div>

      <div className="wr-intro-steps">
        <div className="wr-intro-step wr-intro-step--1">
          <div className="wr-intro-step-icon">🔊</div>
          <div className="wr-intro-step-text">I say a word</div>
        </div>
        <div className="wr-intro-arrow">→</div>
        <div className="wr-intro-step wr-intro-step--2">
          <div className="wr-intro-step-icon">🎤</div>
          <div className="wr-intro-step-text">You say it!</div>
        </div>
        <div className="wr-intro-arrow">→</div>
        <div className="wr-intro-step wr-intro-step--3">
          <div className="wr-intro-step-icon">🚀</div>
          <div className="wr-intro-step-text">TURBO!</div>
        </div>
      </div>

      {!HAS_SPEECH && (
        <div className="wr-intro-warning">⚠️ No microphone — tap the right word instead</div>
      )}

      <button className="wr-btn wr-btn--start" onClick={onStart}>
        Start Race! 🏁
      </button>
    </div>
  );
}

// ─── Challenge Card ─────────────────────────────────────────────────────────────
function ChallengeCard({ wordObj, subPhase, onMic, onFallback, fallbackChoices, onReplay }) {
  const isListening = subPhase === 'listening';
  const isCorrect   = subPhase === 'correct';
  const isWrong     = subPhase === 'wrong';

  return (
    <div className={`wr-challenge ${isCorrect ? 'wr-challenge--correct' : ''} ${isWrong ? 'wr-challenge--wrong' : ''}`}>
      <div className="wr-challenge-emoji">{wordObj.emoji}</div>
      <div className="wr-challenge-word">{wordObj.word}</div>
      <button className="wr-challenge-replay" onClick={onReplay} aria-label="Replay word">
        🔊
      </button>

      {isCorrect && <div className="wr-feedback-turbo">🚀 TURBO BOOST!</div>}
      {isWrong   && <div className="wr-feedback-wrong">Try again! 💪</div>}

      {!isCorrect && !isWrong && (
        HAS_SPEECH ? (
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
                <span>Listening...</span>
              </>
            ) : (
              '🎤 Say it!'
            )}
          </button>
        ) : (
          <div className="wr-fallback-btns">
            {fallbackChoices.map((choice, i) => (
              <button
                key={i}
                className="wr-fallback-btn"
                onClick={() => onFallback(choice)}
              >
                {choice.emoji} {choice.word}
              </button>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// ─── Main Game ──────────────────────────────────────────────────────────────────
export default function WordRace({ onSuccess, onExit }) {
  const [screen, setScreen]       = useState('intro');   // intro | race | done
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos]         = useState(0);
  const [subPhase, setSubPhase]   = useState('driving'); // driving | challenge | listening | correct | wrong
  const [currentWord, setCurrentWord] = useState(null);
  const [fallbackChoices, setFallbackChoices] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [winner, setWinner]       = useState(null);     // 'player' | 'ai'
  const [steerClass, setSteerClass] = useState('');
  const [turboActive, setTurboActive] = useState(false);

  const recogRef       = useRef(null);
  const currentWordRef = useRef(null);
  const subPhaseRef    = useRef('driving');
  const playerPosRef   = useRef(0);
  const aiPosRef       = useRef(0);
  const correctCountRef = useRef(0);
  const doneRef        = useRef(false);
  const wordDeckRef    = useRef([]);

  // Keep refs in sync with state
  useEffect(() => { subPhaseRef.current = subPhase; }, [subPhase]);
  useEffect(() => { playerPosRef.current = playerPos; }, [playerPos]);
  useEffect(() => { aiPosRef.current = aiPos; }, [aiPos]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);

  function nextWordFromDeck() {
    if (wordDeckRef.current.length === 0) {
      wordDeckRef.current = shuffle([...WORDS]);
    }
    return wordDeckRef.current.pop();
  }

  function checkWin(pp, ap, cc) {
    if (doneRef.current) return false;
    if (pp >= 100 || cc >= WINS_REQUIRED) {
      doneRef.current = true;
      setWinner('player');
      setScreen('done');
      return true;
    }
    if (ap >= 100) {
      doneRef.current = true;
      setWinner('ai');
      setScreen('done');
      return true;
    }
    return false;
  }

  // AI ticker
  useEffect(() => {
    if (screen !== 'race') return;
    const interval = setInterval(() => {
      if (doneRef.current) return;
      const step = ['challenge','listening','correct','wrong'].includes(subPhaseRef.current)
        ? AI_STEP_SLOW
        : AI_STEP;
      const next = Math.min(aiPosRef.current + step, 100);
      aiPosRef.current = next;
      setAiPos(next);
      checkWin(playerPosRef.current, next, correctCountRef.current);
    }, AI_TICK_MS);
    return () => clearInterval(interval);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentChallenge = useCallback(() => {
    if (doneRef.current) return;
    const word = nextWordFromDeck();
    currentWordRef.current = word;
    setCurrentWord(word);
    setSubPhase('challenge');
    setFallbackChoices(getFallbackChoices(word, WORDS));
    speak(word.word, 'en');
  }, []);

  // Driving timer — triggers challenge after delay
  useEffect(() => {
    if (screen !== 'race' || subPhase !== 'driving') return;
    const t = setTimeout(presentChallenge, CHALLENGE_DELAY);
    return () => clearTimeout(t);
  }, [screen, subPhase, presentChallenge]);

  function startListening() {
    if (!HAS_SPEECH) return;
    if (recogRef.current) {
      try { recogRef.current.abort(); } catch (e) {}
    }
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    recogRef.current = recog;

    recog.onresult = (e) => {
      const transcripts = Array.from(e.results[0]).map(r => r.transcript);
      const target = currentWordRef.current?.word || '';
      const matched = transcripts.some(t => wordMatches(t, target));
      handleResult(matched);
    };
    recog.onerror = () => handleResult(false);
    recog.onend = () => {
      if (subPhaseRef.current === 'listening') handleResult(false);
    };

    setSubPhase('listening');
    recog.start();
  }

  function handleResult(correct) {
    if (doneRef.current) return;
    if (correct) {
      speak('Amazing!', 'en');
      setSubPhase('correct');
      setTurboActive(true);
      const newCount = correctCountRef.current + 1;
      const newPos   = Math.min(playerPosRef.current + TURBO_BOOST, 100);
      setCorrectCount(newCount);
      setPlayerPos(newPos);
      playerPosRef.current = newPos;
      correctCountRef.current = newCount;

      if (!checkWin(newPos, aiPosRef.current, newCount)) {
        setTimeout(() => {
          setTurboActive(false);
          setSubPhase('driving');
        }, FEEDBACK_DELAY);
      }
    } else {
      speak(currentWordRef.current?.word || '', 'en');
      setSubPhase('wrong');
      setTimeout(() => {
        setSubPhase('challenge');
      }, FEEDBACK_DELAY);
    }
  }

  function handleFallback(choice) {
    if (subPhaseRef.current !== 'challenge') return;
    handleResult(choice.word === currentWordRef.current?.word);
  }

  function handleReplay() {
    if (currentWordRef.current) speak(currentWordRef.current.word, 'en');
  }

  // Arrow key / space / enter support
  useEffect(() => {
    if (screen !== 'race') return;
    function onKey(e) {
      if (e.key === 'ArrowLeft') {
        setSteerClass('wr-car--steer-left');
        setTimeout(() => setSteerClass(''), 300);
      } else if (e.key === 'ArrowRight') {
        setSteerClass('wr-car--steer-right');
        setTimeout(() => setSteerClass(''), 300);
      } else if ((e.key === ' ' || e.key === 'Enter') && subPhaseRef.current === 'challenge') {
        e.preventDefault();
        startListening();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  function startRace() {
    doneRef.current = false;
    wordDeckRef.current = shuffle([...WORDS]);
    setScreen('race');
    setPlayerPos(0);
    setAiPos(0);
    setCorrectCount(0);
    setWinner(null);
    setSubPhase('driving');
    setCurrentWord(null);
    setTurboActive(false);
    playerPosRef.current = 0;
    aiPosRef.current = 0;
    correctCountRef.current = 0;
    subPhaseRef.current = 'driving';
  }

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (screen === 'intro') {
    return (
      <div className="wr-root">
        <button className="wr-back" onClick={onExit}>←</button>
        <IntroScreen onStart={startRace} />
      </div>
    );
  }

  if (screen === 'done') {
    const won = winner === 'player';
    return (
      <div className="wr-root">
        <div className="wr-done">
          <div className="wr-done-emoji">{won ? '🏆' : '😅'}</div>
          <h2 className="wr-done-title">{won ? 'You Win!' : 'So Close!'}</h2>
          <p className="wr-done-sub">
            {won ? 'Amazing Voice! 🎤🚀' : 'The AI won this time — try again!'}
          </p>
          {won
            ? <button className="wr-btn wr-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
            : <button className="wr-btn wr-btn--primary" onClick={startRace}>Try Again 🔄</button>
          }
          <button className="wr-btn wr-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  // Race screen
  const showChallenge = ['challenge','listening','correct','wrong'].includes(subPhase);

  return (
    <div className="wr-root" tabIndex={-1}>
      {/* Header */}
      <div className="wr-header">
        <button className="wr-back" onClick={onExit}>←</button>
        <h1 className="wr-title">🏎️ Word Race</h1>
        <div className="wr-score">{correctCount} / {WINS_REQUIRED}</div>
      </div>

      {/* Race Track */}
      <div className="wr-track-wrap">
        {/* Player lane */}
        <div className="wr-lane">
          <span className="wr-lane-label">You</span>
          <div className="wr-road">
            <div
              className={`wr-car wr-car--player ${steerClass} ${turboActive ? 'wr-car--turbo' : ''}`}
              style={{ left: `calc(${playerPos}% * 0.88)` }}
            >
              🏎️
              {turboActive && <span className="wr-turbo-trail">💨</span>}
            </div>
          </div>
          <span className="wr-flag">🏁</span>
        </div>

        {/* AI lane */}
        <div className="wr-lane">
          <span className="wr-lane-label">AI</span>
          <div className="wr-road">
            <div
              className="wr-car wr-car--ai"
              style={{ left: `calc(${aiPos}% * 0.88)` }}
            >
              🤖
            </div>
          </div>
          <span className="wr-flag">🏁</span>
        </div>
      </div>

      {/* Challenge card */}
      {showChallenge && currentWord && (
        <ChallengeCard
          wordObj={currentWord}
          subPhase={subPhase}
          onMic={startListening}
          onFallback={handleFallback}
          fallbackChoices={fallbackChoices}
          onReplay={handleReplay}
        />
      )}

      {/* Driving hint */}
      {!showChallenge && (
        <div className="wr-driving-hint">
          <span className="wr-driving-dot" />
          <span className="wr-driving-dot" />
          <span className="wr-driving-dot" />
          <span className="wr-driving-text">Word challenge coming…</span>
        </div>
      )}
    </div>
  );
}
