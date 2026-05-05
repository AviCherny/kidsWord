import React, { useState, useEffect, useRef, useCallback } from 'react';
import './FeedTheMonster.css';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';

const WORD_POOL = [
  { word: 'Apple',   heWord: 'תפוח',      emoji: '🍎', cat: 'food' },
  { word: 'Dog',     heWord: 'כלב',        emoji: '🐶', cat: 'animals' },
  { word: 'Car',     heWord: 'מכונית',     emoji: '🚗', cat: 'vehicles' },
  { word: 'Ball',    heWord: 'כדור',       emoji: '⚽', cat: 'objects' },
  { word: 'Hat',     heWord: 'כובע',       emoji: '🎩', cat: 'objects' },
  { word: 'Cup',     heWord: 'כוס',        emoji: '☕', cat: 'objects' },
  { word: 'Pig',     heWord: 'חזיר',       emoji: '🐷', cat: 'animals' },
  { word: 'Sun',     heWord: 'שמש',        heSpeech: 'שֶׁמֶשׁ',   emoji: '☀️', cat: 'nature' },
  { word: 'Fish',    heWord: 'דג',         emoji: '🐟', cat: 'animals' },
  { word: 'Bird',    heWord: 'ציפור',      heSpeech: 'צִיפּוֹר',  emoji: '🐦', cat: 'animals' },
  { word: 'Tree',    heWord: 'עץ',         emoji: '🌳', cat: 'nature' },
  { word: 'Book',    heWord: 'ספר',        emoji: '📚', cat: 'objects' },
  { word: 'Cake',    heWord: 'עוגה',       emoji: '🎂', cat: 'food' },
  { word: 'Duck',    heWord: 'ברווז',      heSpeech: 'בַּרְוָז',  emoji: '🦆', cat: 'animals' },
  { word: 'Bear',    heWord: 'דוב',        emoji: '🐻', cat: 'animals' },
  { word: 'Cat',     heWord: 'חתול',       emoji: '🐱', cat: 'animals' },
  { word: 'Bee',     heWord: 'דבורה',      heSpeech: 'דְּבוֹרָה', emoji: '🐝', cat: 'animals' },
  { word: 'Cow',     heWord: 'פרה',        heSpeech: 'פָּרָה',    emoji: '🐮', cat: 'animals' },
  { word: 'Star',    heWord: 'כוכב',       heSpeech: 'כּוֹכָב',   emoji: '⭐', cat: 'nature' },
  { word: 'Moon',    heWord: 'ירח',        heSpeech: 'יָרֵחַ',    emoji: '🌙', cat: 'nature' },
  { word: 'Egg',     heWord: 'ביצה',       heSpeech: 'בֵּיצָה',   emoji: '🥚', cat: 'food' },
  { word: 'Milk',    heWord: 'חלב',        heSpeech: 'חָלָב',     emoji: '🥛', cat: 'food' },
  { word: 'Key',     heWord: 'מפתח',       heSpeech: 'מַפְתֵּחַ', emoji: '🔑', cat: 'objects' },
  { word: 'Bus',     heWord: 'אוטובוס',    emoji: '🚌', cat: 'vehicles' },
  { word: 'Ship',    heWord: 'ספינה',      emoji: '🚢', cat: 'vehicles' },
  { word: 'Frog',    heWord: 'צפרדע',      emoji: '🐸', cat: 'animals' },
  { word: 'Rabbit',  heWord: 'ארנב',       emoji: '🐰', cat: 'animals' },
  { word: 'Hen',     heWord: 'תרנגולת',    emoji: '🐔', cat: 'animals' },
  { word: 'Corn',    heWord: 'תירס',       emoji: '🌽', cat: 'food' },
  { word: 'Bed',     heWord: 'מיטה',       emoji: '🛏️', cat: 'objects' },
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

// ── Sounds ───────────────────────────────────────────────────────────────────

// 3 ascending chomps instead of 2 flat beeps
function playNomSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18, 0.36].forEach((offset, i) => {
      const freq = [550, 650, 780][i];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + offset);
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

// Monster's personality voice — always English TTS, low funny pitch
// Used for sentences ("I want the Apple!"), not the learning word itself
function speakMonsterVoice(text, onEnd) {
  if (!text) { if (onEnd) onEnd(); return; }
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.pitch = 0.4;
      u.rate = 0.72;
      u.volume = 1;
      u.lang = 'en-US';
      if (onEnd) u.onend = onEnd;
      u.onerror = () => { if (onEnd) onEnd(); };
      window.speechSynthesis.speak(u);
    } else if (onEnd) onEnd();
  } catch (e) { if (onEnd) onEnd(); }
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
  const [dragState, setDragState] = useState(null);
  const [isOverMonster, setIsOverMonster] = useState(false);
  // 'yummy' | 'burp' | 'celebrate' | null — overlaid on top of the feedme bubble
  const [extraBubble, setExtraBubble] = useState(null);
  const [starEyes, setStarEyes] = useState(false);

  const deckRef = useRef(shuffle([...WORD_POOL]));
  const deckIndexRef = useRef(0);
  const lastTargetRef = useRef(null);
  const dragStateRef = useRef(null);
  const monsterAreaRef = useRef(null);
  const handleCardDropRef = useRef(null);
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

  // Same-category foils first; falls back to cross-category if category is too small
  const getFoils = useCallback((tgt) => {
    const sameCat = WORD_POOL.filter(w => w.cat === tgt.cat && w.word !== tgt.word);
    if (sameCat.length >= 3) return shuffle(sameCat).slice(0, 3);
    const crossCat = WORD_POOL.filter(w => w.cat !== tgt.cat && w.word !== tgt.word);
    return [...shuffle(sameCat), ...shuffle(crossCat)].slice(0, 3);
  }, []);

  const scheduleFeedMe = useCallback(() => {
    clearTimeout(feedMeTimerRef.current);
    feedMeTimerRef.current = setTimeout(() => {
      if (phaseRef.current !== 'asking') return;
      setMonsterState('feedme');
      speakMonsterVoice('Feed me!');
      feedMeTimerRef.current = setTimeout(() => {
        if (phaseRef.current === 'asking') {
          setMonsterState('asking');
          feedMeTimerRef.current = setTimeout(() => {
            if (phaseRef.current === 'asking') {
              setMonsterState('feedme');
              speakMonsterVoice('Feed me!');
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
    const foils = getFoils(newTarget);
    const roundCards = shuffle([newTarget, ...foils]).map((w, i) => ({ ...w, id: i }));

    setTarget(newTarget);
    setCards(roundCards);
    setFlyingCardId(null);
    setWrongCardId(null);
    setExtraBubble(null);
    setStarEyes(false);
    // thinking phase blocks dragging for 0.4s — creates anticipation
    setMonsterState('thinking');
    setPhase('thinking');
    setIsSpeaking(false);

    setTimeout(() => {
      setMonsterState('asking');
      setPhase('asking');
      setIsSpeaking(true);

      if (lang === 'he') {
        // Hebrew: just the word — uses custom audio for correct pronunciation
        const text = newTarget.heSpeech || newTarget.heWord;
        speak(text, lang, () => {
          setIsSpeaking(false);
          scheduleFeedMe();
        });
      } else {
        // English: monster speaks a full sentence; the word is embedded and emphasized
        speakMonsterVoice(`I want the ${newTarget.word}!`, () => {
          setIsSpeaking(false);
          scheduleFeedMe();
        });
      }
    }, 400);
  }, [lang, getNextWord, getFoils, scheduleFeedMe]);

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

      // Yummy bubble appears immediately on correct drop
      setExtraBubble('yummy');
      setTimeout(() => setExtraBubble(null), 1100);

      const newCount = correctCount + 1;

      setTimeout(() => {
        const text = lang === 'he' ? (target.heSpeech || target.heWord) : target.word;
        setIsSpeaking(true);
        // Speak the word cleanly (custom audio fires here for Hebrew)
        speak(text, lang, () => {
          setIsSpeaking(false);
          setCorrectCount(newCount);

          if (newCount >= WINS_TO_WIN) {
            // Full celebration before handing off
            setMonsterState('celebrating');
            setStarEyes(true);
            setExtraBubble('celebrate');
            speakMonsterVoice("Yay! I'm full! Thank you!", () => {
              setTimeout(onSuccess, 500);
            });
          } else if (Math.random() < 0.15) {
            // Burp micro-event (~1 in 7 correct answers)
            setExtraBubble('burp');
            speakMonsterVoice('Burp! Excuse me!', () => {
              setExtraBubble(null);
              setTimeout(startRound, 300);
            });
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

  const handlePointerDown = useCallback((e, card) => {
    if (phaseRef.current !== 'asking') return;
    e.preventDefault();
    clearTimeout(feedMeTimerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    const point = e.touches ? e.touches[0] : e;
    const state = { card, x: point.clientX, y: point.clientY };
    dragStateRef.current = state;
    setDragState(state);
    setMonsterState('asking');
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
        if (hit) handleCardDropRef.current?.(card);
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

  // When a card hovers over the monster during asking, monster reacts with surprise
  const effectiveMonsterState =
    (phase === 'asking' && isOverMonster) ? 'surprised' : monsterState;

  const mouthState =
    isSpeaking                                      ? 'talking'  :
    effectiveMonsterState === 'thinking'            ? 'closed'   :
    effectiveMonsterState === 'surprised'           ? 'open'     :
    effectiveMonsterState === 'asking'              ? 'open'     :
    effectiveMonsterState === 'feedme'              ? 'open'     :
    effectiveMonsterState === 'celebrating'         ? 'open'     :
    effectiveMonsterState === 'eating'              ? 'chomp'    :
    effectiveMonsterState === 'rejecting'           ? 'bleh'     : 'closed';

  const grabbing = dragState !== null;
  const grabbedCardId = dragState?.card?.id;

  const BUBBLE_TEXT = {
    yummy:     'Yummy! 😋',
    burp:      'Burp! 🤭',
    celebrate: 'Yay! 🎉',
  };

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
        <div className={`ftm-monster ftm-monster--${effectiveMonsterState}`}>
          <div className="ftm-horns">
            <div className="ftm-horn ftm-horn--left" />
            <div className="ftm-horn ftm-horn--right" />
          </div>
          <div className="ftm-body">
            <div className="ftm-eyes">
              <div className="ftm-eye">
                {starEyes
                  ? <span className="ftm-star-eye">⭐</span>
                  : <div className="ftm-pupil" />}
              </div>
              <div className="ftm-eye">
                {starEyes
                  ? <span className="ftm-star-eye">⭐</span>
                  : <div className="ftm-pupil" />}
              </div>
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

          {/* Extra bubbles (yummy, burp, celebrate) take priority over feedme */}
          {extraBubble ? (
            <div className={`ftm-speech-bubble ftm-speech-bubble--${extraBubble}`}>
              {BUBBLE_TEXT[extraBubble]}
            </div>
          ) : monsterState === 'feedme' && (
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
