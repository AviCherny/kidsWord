import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FeedTheMonster.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';

const WORD_POOL = [
  { word: 'Apple',   heWord: 'תפוח',      emoji: '🍎' },
  { word: 'Dog',     heWord: 'כלב',        emoji: '🐶' },
  { word: 'Car',     heWord: 'מכונית',     emoji: '🚗' },
  { word: 'Ball',    heWord: 'כדור',       emoji: '⚽' },
  { word: 'Hat',     heWord: 'כובע',       emoji: '🎩' },
  { word: 'Cup',     heWord: 'כוס',        emoji: '☕' },
  { word: 'Pig',     heWord: 'חזיר',       emoji: '🐷' },
  { word: 'Sun',     heWord: 'שמש',        heSpeech: 'שֶׁמֶשׁ',   emoji: '☀️' },
  { word: 'Fish',    heWord: 'דג',         emoji: '🐟' },
  { word: 'Bird',    heWord: 'ציפור',      heSpeech: 'צִיפּוֹר',  emoji: '🐦' },
  { word: 'Tree',    heWord: 'עץ',         emoji: '🌳' },
  { word: 'Book',    heWord: 'ספר',        emoji: '📚' },
  { word: 'Cake',    heWord: 'עוגה',       emoji: '🎂' },
  { word: 'Duck',    heWord: 'ברווז',      heSpeech: 'בַּרְוָז',  emoji: '🦆' },
  { word: 'Bear',    heWord: 'דוב',        emoji: '🐻' },
  { word: 'Cat',     heWord: 'חתול',       emoji: '🐱' },
  { word: 'Bee',     heWord: 'דבורה',      heSpeech: 'דְּבוֹרָה', emoji: '🐝' },
  { word: 'Cow',     heWord: 'פרה',        heSpeech: 'פָּרָה',    emoji: '🐮' },
  { word: 'Star',    heWord: 'כוכב',       heSpeech: 'כּוֹכָב',   emoji: '⭐' },
  { word: 'Moon',    heWord: 'ירח',        heSpeech: 'יָרֵחַ',    emoji: '🌙' },
  { word: 'Egg',     heWord: 'ביצה',       heSpeech: 'בֵּיצָה',   emoji: '🥚' },
  { word: 'Milk',    heWord: 'חלב',        heSpeech: 'חָלָב',     emoji: '🥛' },
  { word: 'Key',     heWord: 'מפתח',       heSpeech: 'מַפְתֵּחַ', emoji: '🔑' },
  { word: 'Bus',     heWord: 'אוטובוס',    emoji: '🚌' },
  { word: 'Ship',    heWord: 'ספינה',      emoji: '🚢' },
  { word: 'Frog',    heWord: 'צפרדע',      emoji: '🐸' },
  { word: 'Rabbit',  heWord: 'ארנב',       emoji: '🐰' },
  { word: 'Hen',     heWord: 'תרנגולת',    emoji: '🐔' },
  { word: 'Corn',    heWord: 'תירס',       emoji: '🌽' },
  { word: 'Bed',     heWord: 'מיטה',       emoji: '🛏️' },
];

const WINS_TO_WIN = 5;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function playNomSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.2].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(550, ctx.currentTime + offset);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + offset + 0.14);
      gain.gain.setValueAtTime(0.55, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.14);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  } catch (e) {}
}

function playBlehSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.51);
  } catch (e) {}
}

function playFeedMeVoice() {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance('Feed me!');
      utter.pitch = 0.1;
      utter.rate = 0.55;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    }
  } catch (e) {}
}

export default function FeedTheMonster({ onSuccess }) {
  const { lang } = useLanguage();
  const [phase, setPhase] = useState('idle');
  const [monsterState, setMonsterState] = useState('idle');
  const [target, setTarget] = useState(null);
  const [cards, setCards] = useState([]);
  const [flyingCardId, setFlyingCardId] = useState(null);
  const [wrongCardId, setWrongCardId] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // drag state: { card, x, y } or null
  const [dragState, setDragState] = useState(null);
  const [isOverMonster, setIsOverMonster] = useState(false);

  const deckRef = useRef(shuffle([...WORD_POOL]));
  const deckIndexRef = useRef(0);
  const lastTargetRef = useRef(null);
  const dragStateRef = useRef(null);      // mirrors dragState for use inside effects
  const monsterAreaRef = useRef(null);
  const handleCardDropRef = useRef(null); // always-fresh ref to handleCardDrop
  const feedMeTimerRef = useRef(null);
  const phaseRef = useRef('idle');

  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const getNextWord = useCallback(() => {
    let word, tries = 0;
    do {
      if (deckIndexRef.current >= deckRef.current.length) {
        deckRef.current = shuffle([...WORD_POOL]);
        deckIndexRef.current = 0;
      }
      word = deckRef.current[deckIndexRef.current++];
      tries++;
    } while (word.word === lastTargetRef.current?.word && tries < 4);
    lastTargetRef.current = word;
    return word;
  }, []);

  const scheduleFeedMe = useCallback(() => {
    clearTimeout(feedMeTimerRef.current);
    feedMeTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== 'asking') return;
      setMonsterState('feedme');
      playFeedMeVoice();
      feedMeTimerRef.current = setTimeout(() => {
        if (phaseRef.current === 'asking') {
          setMonsterState('asking');
          // repeat after a pause
          feedMeTimerRef.current = setTimeout(() => {
            if (phaseRef.current === 'asking') {
              setMonsterState('feedme');
              playFeedMeVoice();
              feedMeTimerRef.current = setTimeout(() => {
                if (phaseRef.current === 'asking') setMonsterState('asking');
              }, 2500);
            }
          }, 3000);
        }
      }, 2500);
    }, 3500);
  }, []);

  const startRound = useCallback(() => {
    clearTimeout(feedMeTimerRef.current);
    const newTarget = getNextWord();
    const foils = shuffle(WORD_POOL.filter(w => w.word !== newTarget.word)).slice(0, 3);
    const roundCards = shuffle([newTarget, ...foils]).map((w, i) => ({ ...w, id: i }));

    setTarget(newTarget);
    setCards(roundCards);
    setFlyingCardId(null);
    setWrongCardId(null);
    setMonsterState('asking');
    setPhase('asking');
    setIsSpeaking(true);

    setTimeout(() => {
      const text = lang === 'he' ? (newTarget.heSpeech || newTarget.heWord) : newTarget.word;
      speak(text, lang, () => {
        setIsSpeaking(false);
        scheduleFeedMe();
      });
    }, 350);
  }, [lang, getNextWord, scheduleFeedMe]);

  useEffect(() => {
    const t = setTimeout(startRound, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardDrop = useCallback((card) => {
    if (phase !== 'asking') return;
    clearTimeout(feedMeTimerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    if (card.word === target.word) {
      setFlyingCardId(card.id);
      setMonsterState('eating');
      setPhase('correct');
      setIsSpeaking(false);
      playNomSound();

      setTimeout(() => {
        const text = lang === 'he' ? (target.heSpeech || target.heWord) : target.word;
        setIsSpeaking(true);
        speak(text, lang, () => {
          setIsSpeaking(false);
          const newCount = correctCount + 1;
          setCorrectCount(newCount);
          if (newCount >= WINS_TO_WIN) {
            onSuccess();
          } else {
            setTimeout(startRound, 350);
          }
        });
      }, 480);
    } else {
      setWrongCardId(card.id);
      setMonsterState('rejecting');
      setPhase('wrong');
      playBlehSound();

      setTimeout(() => {
        setWrongCardId(null);
        setMonsterState('asking');
        setPhase('asking');
        const text = lang === 'he' ? (target.heSpeech || target.heWord) : target.word;
        setIsSpeaking(true);
        speak(text, lang, () => {
          setIsSpeaking(false);
          scheduleFeedMe();
        });
      }, 950);
    }
  }, [phase, target, lang, correctCount, onSuccess, startRound, scheduleFeedMe]);

  // Keep handleCardDrop ref fresh every render
  handleCardDropRef.current = handleCardDrop;

  // Drag start — pointerdown on a card
  const handlePointerDown = useCallback((e, card) => {
    if (phaseRef.current !== 'asking') return;
    e.preventDefault();
    clearTimeout(feedMeTimerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const point = e.touches ? e.touches[0] : e;
    const state = { card, x: point.clientX, y: point.clientY };
    dragStateRef.current = state;
    setDragState(state);
    setMonsterState('asking'); // snap out of feedme if active
  }, []);

  // Global drag listeners — attach only while dragging
  const isDragging = dragState !== null;
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      if (e.cancelable) e.preventDefault();
      const point = e.touches ? e.touches[0] : e;
      const { clientX, clientY } = point;

      dragStateRef.current = dragStateRef.current
        ? { ...dragStateRef.current, x: clientX, y: clientY }
        : null;
      setDragState(s => s ? { ...s, x: clientX, y: clientY } : null);

      if (monsterAreaRef.current) {
        const rect = monsterAreaRef.current.getBoundingClientRect();
        setIsOverMonster(
          clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top  && clientY <= rect.bottom
        );
      }
    };

    const onUp = (e) => {
      const point = e.changedTouches ? e.changedTouches[0] : e;
      const { clientX, clientY } = point;
      const card = dragStateRef.current?.card;

      dragStateRef.current = null;
      setDragState(null);
      setIsOverMonster(false);

      if (card && monsterAreaRef.current) {
        const rect = monsterAreaRef.current.getBoundingClientRect();
        const hit =
          clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top  && clientY <= rect.bottom;
        if (hit) {
          handleCardDropRef.current?.(card);
        }
      }
    };

    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDragging]);

  const handleRepeat = useCallback(() => {
    if (!target || phase !== 'asking') return;
    const text = lang === 'he' ? (target.heSpeech || target.heWord) : target.word;
    setIsSpeaking(true);
    speak(text, lang, () => {
      setIsSpeaking(false);
      scheduleFeedMe();
    });
  }, [target, lang, phase, scheduleFeedMe]);

  const labelFor = (w) => lang === 'he' ? w.heWord : w.word;

  const mouthState =
    isSpeaking                       ? 'talking'  :
    monsterState === 'asking'        ? 'open'     :
    monsterState === 'feedme'        ? 'open'     :
    monsterState === 'eating'        ? 'chomp'    :
    monsterState === 'rejecting'     ? 'bleh'     : 'closed';

  const grabbing = dragState !== null;
  const grabbedCardId = dragState?.card?.id;

  return (
    <div className="ftm-root">
      {/* Score dots */}
      <div className="ftm-score">
        {Array.from({ length: WINS_TO_WIN }).map((_, i) => (
          <div key={i} className={`ftm-dot${i < correctCount ? ' ftm-dot--filled' : ''}`} />
        ))}
      </div>

      {/* Monster */}
      <div
        className={`ftm-monster-area${isOverMonster ? ' ftm-monster-area--target' : ''}`}
        ref={monsterAreaRef}
      >
        <div className={`ftm-monster ftm-monster--${monsterState}`}>
          <div className="ftm-horns">
            <div className="ftm-horn ftm-horn--left" />
            <div className="ftm-horn ftm-horn--right" />
          </div>
          <div className="ftm-body">
            <div className="ftm-eyes">
              <div className="ftm-eye"><div className="ftm-pupil" /></div>
              <div className="ftm-eye"><div className="ftm-pupil" /></div>
            </div>
            <div className={`ftm-mouth ftm-mouth--${mouthState}`}>
              {(mouthState === 'open' || mouthState === 'chomp' || mouthState === 'talking') && (
                <div className="ftm-teeth">
                  <span className="ftm-tooth" />
                  <span className="ftm-tooth" />
                  <span className="ftm-tooth" />
                </div>
              )}
              {mouthState === 'bleh' && <div className="ftm-tongue" />}
            </div>
          </div>
          <div className="ftm-arms">
            <div className="ftm-arm ftm-arm--left" />
            <div className="ftm-arm ftm-arm--right" />
          </div>
          {monsterState === 'feedme' && (
            <div className="ftm-speech-bubble">Feed me!</div>
          )}
        </div>

        <button className="ftm-repeat-btn" onClick={handleRepeat} type="button" aria-label="Repeat word">
          🔊
        </button>
      </div>

      {/* Cards */}
      <div className="ftm-cards">
        {cards.map(card => (
          <div
            key={card.id}
            className={[
              'ftm-card',
              flyingCardId === card.id  ? 'ftm-card--flying'   : '',
              wrongCardId  === card.id  ? 'ftm-card--wrong'    : '',
              grabbedCardId === card.id ? 'ftm-card--grabbed'  : '',
            ].filter(Boolean).join(' ')}
            onMouseDown={(e) => handlePointerDown(e, card)}
            onTouchStart={(e) => handlePointerDown(e, card)}
            style={{ cursor: grabbing && grabbedCardId === card.id ? 'grabbing' : 'grab' }}
          >
            <span className="ftm-card-emoji">{card.emoji}</span>
            <span className="ftm-card-label">{labelFor(card)}</span>
          </div>
        ))}
      </div>

      {/* Ghost card — follows finger/cursor while dragging */}
      {dragState && (
        <div
          className="ftm-ghost-card"
          style={{ left: dragState.x, top: dragState.y }}
        >
          <span className="ftm-card-emoji">{dragState.card.emoji}</span>
          <span className="ftm-card-label">{labelFor(dragState.card)}</span>
        </div>
      )}
    </div>
  );
}
