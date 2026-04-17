import React, { useCallback, useEffect, useRef, useState } from 'react';
import { speak } from '../../speak';
import { useLanguage } from '../../context/LanguageContext';
import './BubblePop.css';

function playPopSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.8;
  src.connect(filter);
  filter.connect(ctx.destination);
  src.start();
  src.onended = () => ctx.close();
}

function playSuccessSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.1);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + index * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.1 + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + index * 0.1);
    osc.stop(ctx.currentTime + index * 0.1 + 0.2);
  });
  setTimeout(() => ctx.close(), 800);
}

const BUBBLE_DIFFICULTIES = {
  1: {
    questionsPerLevel: 4,
    bubbleCount: 4,
    levels: [
      { ops: ['+'], max: 5 },
      { ops: ['+'], max: 8 },
    ],
  },
  2: {
    questionsPerLevel: 5,
    bubbleCount: 5,
    levels: [
      { ops: ['+'], max: 5 },
      { ops: ['+'], max: 10 },
      { ops: ['+', '-'], max: 10 },
    ],
  },
  3: {
    questionsPerLevel: 5,
    bubbleCount: 5,
    levels: [
      { ops: ['+'], max: 10 },
      { ops: ['+', '-'], max: 14 },
      { ops: ['+', '-'], max: 18 },
      { ops: ['+', '-', '×'], max: 20, factorMax: 5 },
    ],
  },
  4: {
    questionsPerLevel: 6,
    bubbleCount: 6,
    levels: [
      { ops: ['+', '-'], max: 15 },
      { ops: ['+', '-'], max: 20 },
      { ops: ['+', '-', '×'], max: 24, factorMax: 6 },
      { ops: ['+', '-', '×'], max: 30, factorMax: 8 },
    ],
  },
};

const COPY = {
  en: {
    title: 'Balloon Pop',
    hearAgain: 'Hear again',
    back: 'Back',
    champion: 'Math Champion!',
    solvedAll: (count) => `You solved all ${count} questions!`,
    collectSticker: 'Collect Sticker 🌟',
    finishedAllLevels: (count) => `Amazing! You finished all ${count} levels!`,
    tryAgain: 'Try again!',
    keepGoing: (levelNumber) => `Level ${levelNumber}! Keep going!`,
    questionPrompt: (a, op, b) => {
      if (op === '+') return `What is ${a} plus ${b}?`;
      if (op === '-') return `What is ${a} minus ${b}?`;
      return `What is ${a} times ${b}?`;
    },
  },
  he: {
    title: 'פיצוץ בלונים',
    hearAgain: 'שומעים שוב',
    back: 'חזרה',
    champion: 'אלוף החשבון!',
    solvedAll: (count) => `פתרת את כל ${count} התרגילים!`,
    collectSticker: 'קבל מדבקה 🌟',
    finishedAllLevels: (count) => `מדהים! סיימת את כל ${count} השלבים!`,
    tryAgain: 'נסה שוב!',
    keepGoing: (levelNumber) => `שלב ${levelNumber}! ממשיכים!`,
    questionPrompt: (a, op, b) => {
      if (op === '+') return `כמה זה ${a} ועוד ${b}?`;
      if (op === '-') return `כמה זה ${a} פחות ${b}?`;
      return `כמה זה ${a} כפול ${b}?`;
    },
  },
};

const BALLOON_COLORS = [
  '#f44336', '#9c27b0', '#2196f3', '#00897b',
  '#ff5722', '#43a047', '#3f51b5', '#ff9800',
];

function makeQuestion(levelCfg) {
  const op = levelCfg.ops[Math.floor(Math.random() * levelCfg.ops.length)];

  if (op === '+') {
    const a = 1 + Math.floor(Math.random() * (levelCfg.max - 1));
    const b = 1 + Math.floor(Math.random() * Math.max(1, levelCfg.max - a));
    return { a, b, op, answer: a + b };
  }

  if (op === '-') {
    const a = 2 + Math.floor(Math.random() * (levelCfg.max - 1));
    const b = 1 + Math.floor(Math.random() * Math.max(1, a - 1));
    return { a, b, op, answer: a - b };
  }

  const factorMax = levelCfg.factorMax || 5;
  const a = 2 + Math.floor(Math.random() * Math.max(1, factorMax - 1));
  const b = 2 + Math.floor(Math.random() * Math.max(1, factorMax - 1));
  return { a, b, op, answer: a * b };
}

function buildDeck(levelCfg, questionsPerLevel) {
  const pool = [];
  const seen = new Set();
  let attempts = 0;

  while (pool.length < questionsPerLevel * 3 && attempts < 240) {
    attempts += 1;
    const question = makeQuestion(levelCfg);
    const key = `${question.a}${question.op}${question.b}`;
    if (!seen.has(key)) {
      seen.add(key);
      pool.push(question);
    }
  }

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}

function makeDistractors(answer, count) {
  const seen = new Set([answer]);
  const candidates = [];
  const span = answer > 20 ? 8 : 5;

  for (let delta = 1; delta <= span; delta += 1) {
    if (answer - delta > 0) candidates.push(answer - delta);
    candidates.push(answer + delta);
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const values = [answer];
  for (const candidate of candidates) {
    if (!seen.has(candidate) && values.length < count) {
      seen.add(candidate);
      values.push(candidate);
    }
  }

  for (let i = values.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  return values;
}

function makeParticles(color) {
  return Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * 360 + (Math.random() - 0.5) * 30;
    const distance = 55 + Math.random() * 45;
    const radians = (angle * Math.PI) / 180;
    return {
      dx: Math.round(Math.cos(radians) * distance),
      dy: Math.round(Math.sin(radians) * distance),
      size: 7 + Math.floor(Math.random() * 11),
      color: index % 3 === 0 ? '#fff' : index % 3 === 1 ? color : '#ffd54f',
    };
  });
}

function makeBubbles(answer, count) {
  const values = makeDistractors(answer, count);
  return values.map((value, index) => ({
    id: Date.now() + index,
    value,
    isAnswer: value === answer,
    color: BALLOON_COLORS[index % BALLOON_COLORS.length],
    x: 10 + index * (80 / Math.max(1, count - 1)),
    duration: 9 + Math.random() * 5,
    delay: -(Math.random() * 8),
    wrong: false,
    popped: false,
  }));
}

function PopBurst({ pop }) {
  return (
    <div className="bp-pop-root" style={{ left: pop.x, top: pop.y }}>
      <div className="bp-pop-flash" style={{ background: pop.color }} />
      {pop.particles.map((particle, index) => (
        <div
          key={index}
          className="bp-particle"
          style={{
            '--dx': `${particle.dx}px`,
            '--dy': `${particle.dy}px`,
            width: particle.size,
            height: particle.size,
            background: particle.color,
            animationDelay: `${index * 0.018}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function BubblePop({ onSuccess, onExit, sharedDifficulty = 1 }) {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang] || COPY.en;
  const difficulty = BUBBLE_DIFFICULTIES[sharedDifficulty] || BUBBLE_DIFFICULTIES[1];
  const totalQuestions = difficulty.levels.length * difficulty.questionsPerLevel;

  const [levelIdx, setLevelIdx] = useState(0);
  const [qCount, setQCount] = useState(0);
  const deckRef = useRef(buildDeck(difficulty.levels[0], difficulty.questionsPerLevel));
  const [question, setQuestion] = useState(() => deckRef.current[0]);
  const [bubbles, setBubbles] = useState(() => makeBubbles(deckRef.current[0].answer, difficulty.bubbleCount));
  const [stars, setStars] = useState(0);
  const [done, setDone] = useState(false);
  const [combo, setCombo] = useState(0);
  const [pops, setPops] = useState([]);
  const transitioning = useRef(false);

  useEffect(() => {
    const { a, b, op } = question;
    speak(copy.questionPrompt(a, op, b), lang);
  }, [copy, lang, question]);

  const nextQuestion = useCallback((currentLevelIdx, currentQuestionIdx) => {
    transitioning.current = false;
    const nextQuestionIdx = currentQuestionIdx + 1;

    if (nextQuestionIdx >= difficulty.questionsPerLevel) {
      setStars((value) => value + 1);
      const nextLevelIdx = currentLevelIdx + 1;

      if (nextLevelIdx >= difficulty.levels.length) {
        setDone(true);
        speak(copy.finishedAllLevels(difficulty.levels.length), lang);
        return;
      }

      speak(copy.keepGoing(nextLevelIdx + 1), lang);
      deckRef.current = buildDeck(difficulty.levels[nextLevelIdx], difficulty.questionsPerLevel);
      setLevelIdx(nextLevelIdx);
      setQCount(0);
      const next = deckRef.current[0];
      setQuestion(next);
      setBubbles(makeBubbles(next.answer, difficulty.bubbleCount));
      return;
    }

    setQCount(nextQuestionIdx);
    const next = deckRef.current[nextQuestionIdx] || makeQuestion(difficulty.levels[currentLevelIdx]);
    setQuestion(next);
    setBubbles(makeBubbles(next.answer, difficulty.bubbleCount));
  }, [copy, difficulty.bubbleCount, difficulty.levels, difficulty.questionsPerLevel, lang]);

  const handleTap = useCallback((id, event) => {
    if (transitioning.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    setBubbles((currentBubbles) => {
      const bubble = currentBubbles.find((entry) => entry.id === id);
      if (!bubble || bubble.popped || bubble.wrong) return currentBubbles;

      if (bubble.isAnswer) {
        transitioning.current = true;
        setCombo((value) => value + 1);
        playPopSound();
        playSuccessSound();

        const pop = {
          id: Date.now(),
          x: cx,
          y: cy,
          color: bubble.color,
          particles: makeParticles(bubble.color),
        };

        setPops((currentPops) => [...currentPops, pop]);
        setTimeout(() => {
          setPops((currentPops) => currentPops.filter((entry) => entry.id !== pop.id));
        }, 900);

        setTimeout(() => nextQuestion(levelIdx, qCount), 650);
        return currentBubbles.map((entry) => (entry.id === id ? { ...entry, popped: true } : entry));
      }

      setCombo(0);
      speak(copy.tryAgain, lang);
      setTimeout(() => {
        setBubbles((latestBubbles) => latestBubbles.map((entry) => (
          entry.id === id ? { ...entry, wrong: false } : entry
        )));
      }, 700);

      return currentBubbles.map((entry) => (entry.id === id ? { ...entry, wrong: true } : entry));
    });
  }, [copy.tryAgain, lang, levelIdx, nextQuestion, qCount]);

  if (done) {
    return (
      <div className="bp-root" dir={dir}>
        <div className="bp-done">
          <div className="bp-done-emoji">🎈🏆🎈</div>
          <h2>{copy.champion}</h2>
          <p>{copy.solvedAll(totalQuestions)}</p>
          <div className="bp-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="bp-btn bp-btn--primary" onClick={onSuccess}>{copy.collectSticker}</button>
          <button className="bp-btn bp-btn--ghost" onClick={onExit}>{copy.back}</button>
        </div>
      </div>
    );
  }

  const { a, b, op } = question;
  const progress = ((levelIdx * difficulty.questionsPerLevel + qCount) / totalQuestions) * 100;
  const levelLabel = `${lang === 'he' ? 'שלב' : 'Level'} ${levelIdx + 1}`;

  return (
    <div className="bp-root" dir={dir}>
      {pops.map((pop) => <PopBurst key={pop.id} pop={pop} />)}

      <div className="bp-header">
        <button className="bp-back" onClick={onExit}>{dir === 'rtl' ? '→' : '←'}</button>
        <h1 className="bp-title">🎈 {copy.title}</h1>
        <div className="bp-stars">{'⭐'.repeat(stars)}</div>
      </div>

      <div className="bp-progress">
        <div className="bp-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="bp-equation" dir="ltr">
        <span className="bp-eq-num">{a}</span>
        <span className="bp-eq-op">{op}</span>
        <span className="bp-eq-num">{b}</span>
        <span className="bp-eq-eq">=</span>
        <span className="bp-eq-q">?</span>
      </div>

      <div className="bp-level-info">
        {levelLabel} &nbsp;·&nbsp; {qCount + 1} / {difficulty.questionsPerLevel}
        {combo >= 3 && <span className="bp-combo"> 🔥 x{combo}</span>}
      </div>

      <div className="bp-field">
        {bubbles.map((bubble) => {
          if (bubble.popped) return null;
          return (
            <button
              key={bubble.id}
              className={['bp-balloon', bubble.wrong ? 'bp-balloon--wrong' : ''].join(' ')}
              style={{
                '--balloon-color': bubble.color,
                left: `${bubble.x}%`,
                '--rise-dur': `${bubble.duration}s`,
                '--rise-delay': `${bubble.delay}s`,
              }}
              onClick={(event) => handleTap(bubble.id, event)}
            >
              <span className="bp-balloon-text">{bubble.value}</span>
            </button>
          );
        })}
      </div>

      <button
        className="bp-hear"
        onClick={() => {
          speak(copy.questionPrompt(a, op, b), lang);
        }}
      >
        🔊 {copy.hearAgain}
      </button>
    </div>
  );
}
