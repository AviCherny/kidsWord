import React, { useState, useEffect, useCallback } from 'react';
import { speak } from '../../speak';
import './WordRace.css';

const QUESTIONS = [
  { q: 'Opposite of BIG?',        a: 'small',  wrong: ['huge',   'tall']   },
  { q: 'Opposite of HOT?',        a: 'cold',   wrong: ['warm',   'cool']   },
  { q: 'Rhymes with CAT?',        a: 'bat',    wrong: ['dog',    'pig']    },
  { q: 'Word for a baby cat?',    a: 'kitten', wrong: ['puppy',  'cub']    },
  { q: 'Opposite of FAST?',       a: 'slow',   wrong: ['quick',  'rush']   },
  { q: 'Opposite of NIGHT?',      a: 'day',    wrong: ['noon',   'dusk']   },
  { q: 'Animal that says MOO?',   a: 'cow',    wrong: ['pig',    'dog']    },
  { q: 'Opposite of CLEAN?',      a: 'dirty',  wrong: ['tidy',   'neat']   },
  { q: 'Plural of MOUSE?',        a: 'mice',   wrong: ['mouses', 'mouse']  },
  { q: 'Opposite of LAUGH?',      a: 'cry',    wrong: ['smile',  'shout']  },
  { q: 'Rhymes with TREE?',       a: 'bee',    wrong: ['car',    'bus']    },
  { q: 'Word for house of fish?', a: 'tank',   wrong: ['pond',   'lake']   },
];

function buildChoices(q) {
  return [q.a, ...q.wrong].sort(() => Math.random() - 0.5);
}

const FINISH = 100;
const PLAYER_STEP_CORRECT = 10;
const PLAYER_STEP_WRONG   = 0;
const AI_STEP_CORRECT     = 3;
const AI_STEP_WRONG       = 9;

export default function WordRace({ onSuccess, onExit }) {
  const [qIdx, setQIdx]           = useState(0);
  const [choices, setChoices]     = useState(() => buildChoices(QUESTIONS[0]));
  const [playerPos, setPlayerPos] = useState(0);
  const [aiPos, setAiPos]         = useState(0);
  const [feedback, setFeedback]   = useState(null); // 'correct' | 'wrong'
  const [gameOver, setGameOver]   = useState(null); // 'win' | 'lose'
  const [answering, setAnswering] = useState(false);

  const q = QUESTIONS[qIdx % QUESTIONS.length];

  const readQuestion = useCallback((idx) => {
    speak(QUESTIONS[idx % QUESTIONS.length].q, 'en');
  }, []);

  useEffect(() => { readQuestion(qIdx); }, [qIdx, readQuestion]);

  function handleAnswer(choice) {
    if (answering || gameOver) return;
    setAnswering(true);

    const correct = choice === q.a;

    if (correct) {
      speak('Great! Zoom!', 'en');
      setFeedback('correct');
      setPlayerPos(p => {
        const next = Math.min(p + PLAYER_STEP_CORRECT, FINISH);
        if (next >= FINISH) setTimeout(() => setGameOver('win'), 600);
        return next;
      });
      setAiPos(a => Math.min(a + AI_STEP_CORRECT, FINISH));
    } else {
      speak(`The answer is ${q.a}`, 'en');
      setFeedback('wrong');
      setAiPos(a => {
        const next = Math.min(a + AI_STEP_WRONG, FINISH);
        if (next >= FINISH) setTimeout(() => setGameOver('lose'), 600);
        return next;
      });
    }

    setTimeout(() => {
      setFeedback(null);
      setAnswering(false);
      if (!gameOver) {
        const next = qIdx + 1;
        setQIdx(next);
        setChoices(buildChoices(QUESTIONS[next % QUESTIONS.length]));
      }
    }, 1300);
  }

  function restart() {
    setQIdx(0);
    setPlayerPos(0);
    setAiPos(0);
    setGameOver(null);
    setFeedback(null);
    setAnswering(false);
    setChoices(buildChoices(QUESTIONS[0]));
  }

  if (gameOver) {
    const won = gameOver === 'win';
    return (
      <div className="wr-root">
        <div className="wr-done">
          <div className="wr-done-emoji">{won ? '🏎️🏆🎉' : '🚗💨😅'}</div>
          <h2>{won ? 'You Win!' : 'So Close!'}</h2>
          <p>{won ? 'Your car crossed the finish line!' : 'The AI car won this time — try again!'}</p>
          {won
            ? <button className="wr-btn wr-btn--primary" onClick={onSuccess}>Collect Sticker 🌟</button>
            : <button className="wr-btn wr-btn--primary" onClick={restart}>Try Again 🔄</button>
          }
          <button className="wr-btn wr-btn--ghost" onClick={onExit}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="wr-root">
      <div className="wr-header">
        <button className="wr-back" onClick={onExit}>←</button>
        <h1 className="wr-title">🏎️ Word Race</h1>
        <div className="wr-lap">{(qIdx % QUESTIONS.length) + 1} / {QUESTIONS.length}</div>
      </div>

      {/* Race track */}
      <div className="wr-track-wrap">
        {/* Player lane */}
        <div className="wr-lane">
          <span className="wr-lane-label">You</span>
          <div className="wr-road">
            <div className="wr-car" style={{ left: `calc(${playerPos}% - 28px)` }}>🏎️</div>
          </div>
          <span className="wr-flag">🏁</span>
        </div>
        {/* AI lane */}
        <div className="wr-lane">
          <span className="wr-lane-label">AI</span>
          <div className="wr-road">
            <div className="wr-car" style={{ left: `calc(${aiPos}% - 24px)` }}>🚗</div>
          </div>
          <span className="wr-flag">🏁</span>
        </div>
      </div>

      {/* Question */}
      <div className="wr-question-wrap">
        <div className="wr-question">{q.q}</div>
        <button className="wr-hear" onClick={() => speak(q.q, 'en')}>🔊</button>
      </div>

      {/* Answer buttons */}
      <div className="wr-choices">
        {choices.map((c, i) => (
          <button
            key={i}
            className={[
              'wr-choice',
              feedback === 'correct' && c === q.a ? 'wr-choice--correct' : '',
              feedback === 'wrong'   && c === q.a ? 'wr-choice--reveal'  : '',
              feedback === 'wrong'   && c !== q.a ? 'wr-choice--wrong'   : '',
            ].join(' ')}
            onClick={() => handleAnswer(c)}
            disabled={!!answering}
          >
            {c}
          </button>
        ))}
      </div>

      {feedback === 'correct' && <div className="wr-feedback wr-feedback--good">🏎️ Zoom! Correct!</div>}
      {feedback === 'wrong'   && <div className="wr-feedback wr-feedback--bad">❌ Not quite!</div>}
    </div>
  );
}
