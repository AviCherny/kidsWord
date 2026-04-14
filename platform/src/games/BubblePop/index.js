import React, { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '../../speak';
import './BubblePop.css';

// ── Math question generator ───────────────────────────────────────────────────
const LEVELS = [
  { label: 'Level 1', ops: ['+'], max: 5  },
  { label: 'Level 2', ops: ['+'], max: 10 },
  { label: 'Level 3', ops: ['+', '-'], max: 10 },
];
const QUESTIONS_PER_LEVEL = 5;

function makeQuestion(levelCfg) {
  const op = levelCfg.ops[Math.floor(Math.random() * levelCfg.ops.length)];
  let a, b, answer;
  if (op === '+') {
    a = 1 + Math.floor(Math.random() * (levelCfg.max - 1));
    b = 1 + Math.floor(Math.random() * (levelCfg.max - a));
    answer = a + b;
  } else {
    // subtraction: ensure b ≤ a, result ≥ 1
    a = 2 + Math.floor(Math.random() * (levelCfg.max - 1));
    b = 1 + Math.floor(Math.random() * (a - 1));
    answer = a - b;
  }
  return { a, b, op, answer };
}

function makeDistractors(answer, count) {
  const set = new Set([answer]);
  const candidates = [];
  for (let d = 1; d <= 4; d++) {
    if (answer - d > 0) candidates.push(answer - d);
    candidates.push(answer + d);
  }
  // shuffle candidates
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const result = [answer];
  for (const c of candidates) {
    if (!set.has(c) && result.length < count) {
      set.add(c);
      result.push(c);
    }
  }
  // shuffle result so answer isn't always first
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const BUBBLE_COLORS = [
  '#e53935', '#8e24aa', '#1e88e5', '#00897b',
  '#f4511e', '#43a047', '#6d4c41', '#3949ab',
];

function makeBubbles(answer, count = 5) {
  const values = makeDistractors(answer, count);
  return values.map((val, i) => ({
    id: Date.now() + i,
    value: val,
    isAnswer: val === answer,
    color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
    x: 8 + i * (84 / (count - 1)), // spread evenly 8%–92%
    duration: 4 + Math.random() * 3,   // 4–7s rise
    delay: Math.random() * 2,          // stagger start
    wrong: false,
    popped: false,
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BubblePop({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx]       = useState(0);
  const [qCount, setQCount]           = useState(0);      // questions answered in level
  const [question, setQuestion]       = useState(() => makeQuestion(LEVELS[0]));
  const [bubbles, setBubbles]         = useState(() => makeBubbles(makeQuestion(LEVELS[0]).answer));
  const [stars, setStars]             = useState(0);
  const [done, setDone]               = useState(false);
  const [popId, setPopId]             = useState(null);   // bubble id being popped
  const [combo, setCombo]             = useState(0);
  const transitioning = useRef(false);

  // Speak question on mount + new question
  useEffect(() => {
    const { a, b, op } = question;
    const opWord = op === '+' ? 'plus' : 'minus';
    speak(`What is ${a} ${opWord} ${b}?`, 'en');
  }, [question]);

  const nextQuestion = useCallback((currentLevelIdx, currentQCount) => {
    transitioning.current = false;
    const nextQ = currentQCount + 1;
    if (nextQ >= QUESTIONS_PER_LEVEL) {
      // level complete
      setStars(s => s + 1);
      const nextLevel = currentLevelIdx + 1;
      if (nextLevel >= LEVELS.length) {
        setDone(true);
        speak('Amazing! You finished all levels!', 'en');
        return;
      }
      speak(`Level ${nextLevel + 1}! Keep going!`, 'en');
      setLevelIdx(nextLevel);
      setQCount(0);
      const q = makeQuestion(LEVELS[nextLevel]);
      setQuestion(q);
      setBubbles(makeBubbles(q.answer));
    } else {
      setQCount(nextQ);
      const q = makeQuestion(LEVELS[currentLevelIdx]);
      setQuestion(q);
      setBubbles(makeBubbles(q.answer));
    }
  }, []);

  const handleTap = useCallback((id) => {
    if (transitioning.current) return;
    setBubbles(prev => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble || bubble.popped || bubble.wrong) return prev;

      if (bubble.isAnswer) {
        transitioning.current = true;
        setPopId(id);
        setCombo(c => c + 1);
        speak('Pop!', 'en');
        setTimeout(() => {
          setPopId(null);
          nextQuestion(levelIdx, qCount);
        }, 600);
        return prev.map(b => b.id === id ? { ...b, popped: true } : b);
      } else {
        // wrong — flash red, recover
        setCombo(0);
        speak('Try again!', 'en');
        setTimeout(() => {
          setBubbles(p => p.map(b => b.id === id ? { ...b, wrong: false } : b));
        }, 700);
        return prev.map(b => b.id === id ? { ...b, wrong: true } : b);
      }
    });
  }, [levelIdx, qCount, nextQuestion]);

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="bp-root">
        <div className="bp-done">
          <div className="bp-done-emoji">🎈🏆🎈</div>
          <h2>Math Champion!</h2>
          <p>You solved all {LEVELS.length * QUESTIONS_PER_LEVEL} questions!</p>
          <div className="bp-done-stars">{'⭐'.repeat(stars)}</div>
          <button className="bp-btn bp-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
          <button className="bp-btn bp-btn--ghost"  onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  const { a, b, op } = question;
  const progress = ((levelIdx * QUESTIONS_PER_LEVEL + qCount) / (LEVELS.length * QUESTIONS_PER_LEVEL)) * 100;

  return (
    <div className="bp-root">
      {/* Header */}
      <div className="bp-header">
        <button className="bp-back" onClick={onExit}>←</button>
        <h1 className="bp-title">🫧 Bubble Pop</h1>
        <div className="bp-stars">{'⭐'.repeat(stars)}</div>
      </div>

      {/* Progress */}
      <div className="bp-progress">
        <div className="bp-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Math equation */}
      <div className="bp-equation">
        <span className="bp-eq-num">{a}</span>
        <span className="bp-eq-op">{op}</span>
        <span className="bp-eq-num">{b}</span>
        <span className="bp-eq-eq">=</span>
        <span className="bp-eq-q">?</span>
      </div>

      {/* Level + question counter */}
      <div className="bp-level-info">
        {LEVELS[levelIdx].label} &nbsp;·&nbsp; {qCount + 1} / {QUESTIONS_PER_LEVEL}
        {combo >= 3 && <span className="bp-combo"> 🔥 ×{combo}</span>}
      </div>

      {/* Bubble field */}
      <div className="bp-field">
        {bubbles.map(bubble => {
          if (bubble.popped) return null;
          return (
            <button
              key={bubble.id}
              className={[
                'bp-bubble',
                bubble.wrong  ? 'bp-bubble--wrong' : '',
                popId === bubble.id ? 'bp-bubble--pop' : '',
              ].join(' ')}
              style={{
                background: bubble.color,
                left: `${bubble.x}%`,
                '--rise-dur': `${bubble.duration}s`,
                '--rise-delay': `${bubble.delay}s`,
              }}
              onClick={() => handleTap(bubble.id)}
            >
              <span className="bp-bubble-text">{bubble.value}</span>
            </button>
          );
        })}
      </div>

      {/* Replay */}
      <button className="bp-hear" onClick={() => {
        const opWord = op === '+' ? 'plus' : 'minus';
        speak(`What is ${a} ${opWord} ${b}?`, 'en');
      }}>
        🔊 Hear again
      </button>
    </div>
  );
}
