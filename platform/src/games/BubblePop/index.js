import React, { useState, useEffect, useCallback, useRef } from 'react';
import { speak } from '../../speak';
import './BubblePop.css';

// ── Synthesized sounds ────────────────────────────────────────────────────────
function playPopSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
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
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
    gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + i * 0.1 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.2);
  });
  setTimeout(() => ctx.close(), 800);
}

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
    a = 2 + Math.floor(Math.random() * (levelCfg.max - 1));
    b = 1 + Math.floor(Math.random() * (a - 1));
    answer = a - b;
  }
  return { a, b, op, answer };
}

function makeDistractors(answer, count) {
  const set = new Set([answer]);
  const candidates = [];
  for (let d = 1; d <= 5; d++) {
    if (answer - d > 0) candidates.push(answer - d);
    candidates.push(answer + d);
  }
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const result = [answer];
  for (const c of candidates) {
    if (!set.has(c) && result.length < count) { set.add(c); result.push(c); }
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const BALLOON_COLORS = [
  '#f44336', '#9c27b0', '#2196f3', '#00897b',
  '#ff5722', '#43a047', '#3f51b5', '#ff9800',
];

function makeParticles(color) {
  return Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 360 + (Math.random() - 0.5) * 30;
    const dist  = 55 + Math.random() * 45;
    const rad   = (angle * Math.PI) / 180;
    return {
      dx:   Math.round(Math.cos(rad) * dist),
      dy:   Math.round(Math.sin(rad) * dist),
      size: 7 + Math.floor(Math.random() * 11),
      // alternate between balloon color and white/yellow shards
      color: i % 3 === 0 ? '#fff' : i % 3 === 1 ? color : '#ffd54f',
    };
  });
}

function makeBubbles(answer, count = 5) {
  const values = makeDistractors(answer, count);
  return values.map((val, i) => ({
    id: Date.now() + i,
    value: val,
    isAnswer: val === answer,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    x: 10 + i * (80 / (count - 1)),
    duration: 9 + Math.random() * 5,   // 9–14 s — slow drift
    delay: -(Math.random() * 8),       // negative delay = already mid-flight on load
    wrong: false,
    popped: false,
  }));
}

// ── Pop burst overlay ─────────────────────────────────────────────────────────
function PopBurst({ pop }) {
  return (
    <div className="bp-pop-root" style={{ left: pop.x, top: pop.y }}>
      <div className="bp-pop-flash" style={{ background: pop.color }} />
      {pop.particles.map((p, i) => (
        <div
          key={i}
          className="bp-particle"
          style={{
            '--dx':   `${p.dx}px`,
            '--dy':   `${p.dy}px`,
            width:    p.size,
            height:   p.size,
            background: p.color,
            animationDelay: `${i * 0.018}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BubblePop({ onSuccess, onExit }) {
  const [levelIdx, setLevelIdx] = useState(0);
  const [qCount,   setQCount]   = useState(0);
  const [question, setQuestion] = useState(() => makeQuestion(LEVELS[0]));
  const [bubbles,  setBubbles]  = useState(() => makeBubbles(makeQuestion(LEVELS[0]).answer));
  const [stars,    setStars]    = useState(0);
  const [done,     setDone]     = useState(false);
  const [combo,    setCombo]    = useState(0);
  const [pops,     setPops]     = useState([]);   // active pop bursts
  const transitioning = useRef(false);

  useEffect(() => {
    const { a, b, op } = question;
    speak(`What is ${a} ${op === '+' ? 'plus' : 'minus'} ${b}?`, 'en');
  }, [question]);

  const nextQuestion = useCallback((lvl, qc) => {
    transitioning.current = false;
    const nextQ = qc + 1;
    if (nextQ >= QUESTIONS_PER_LEVEL) {
      setStars(s => s + 1);
      const nextLvl = lvl + 1;
      if (nextLvl >= LEVELS.length) {
        setDone(true);
        speak('Amazing! You finished all levels!', 'en');
        return;
      }
      speak(`Level ${nextLvl + 1}! Keep going!`, 'en');
      setLevelIdx(nextLvl);
      setQCount(0);
      const q = makeQuestion(LEVELS[nextLvl]);
      setQuestion(q);
      setBubbles(makeBubbles(q.answer));
    } else {
      setQCount(nextQ);
      const q = makeQuestion(LEVELS[lvl]);
      setQuestion(q);
      setBubbles(makeBubbles(q.answer));
    }
  }, []);

  const handleTap = useCallback((id, e) => {
    if (transitioning.current) return;

    // Capture position before any state updates
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    setBubbles(prev => {
      const bubble = prev.find(b => b.id === id);
      if (!bubble || bubble.popped || bubble.wrong) return prev;

      if (bubble.isAnswer) {
        transitioning.current = true;
        setCombo(c => c + 1);
        playPopSound();
        playSuccessSound();

        // Spawn particle burst
        const popEntry = {
          id: Date.now(),
          x: cx,
          y: cy,
          color: bubble.color,
          particles: makeParticles(bubble.color),
        };
        setPops(p => [...p, popEntry]);
        setTimeout(() => setPops(p => p.filter(pop => pop.id !== popEntry.id)), 900);

        setTimeout(() => nextQuestion(levelIdx, qCount), 650);
        return prev.map(b => b.id === id ? { ...b, popped: true } : b);

      } else {
        setCombo(0);
        speak('Try again!', 'en');
        setTimeout(() => {
          setBubbles(p => p.map(b => b.id === id ? { ...b, wrong: false } : b));
        }, 700);
        return prev.map(b => b.id === id ? { ...b, wrong: true } : b);
      }
    });
  }, [levelIdx, qCount, nextQuestion]);

  // ── Done screen ──────────────────────────────────────────────────────────────
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
      {/* Pop bursts — fixed overlay, outside all containers */}
      {pops.map(pop => <PopBurst key={pop.id} pop={pop} />)}

      {/* Header */}
      <div className="bp-header">
        <button className="bp-back" onClick={onExit}>←</button>
        <h1 className="bp-title">🎈 Balloon Pop</h1>
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

      {/* Balloon field */}
      <div className="bp-field">
        {bubbles.map(bubble => {
          if (bubble.popped) return null;
          return (
            <button
              key={bubble.id}
              className={['bp-balloon', bubble.wrong ? 'bp-balloon--wrong' : ''].join(' ')}
              style={{
                '--balloon-color': bubble.color,
                left: `${bubble.x}%`,
                '--rise-dur':   `${bubble.duration}s`,
                '--rise-delay': `${bubble.delay}s`,
              }}
              onClick={e => handleTap(bubble.id, e)}
            >
              <span className="bp-balloon-text">{bubble.value}</span>
            </button>
          );
        })}
      </div>

      {/* Replay */}
      <button className="bp-hear" onClick={() => {
        speak(`What is ${a} ${op === '+' ? 'plus' : 'minus'} ${b}?`, 'en');
      }}>
        🔊 Hear again
      </button>
    </div>
  );
}
