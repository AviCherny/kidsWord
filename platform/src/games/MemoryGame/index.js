import React, { useState, useCallback, useRef } from 'react';
import './MemoryGame.css';
import { CARD_POOL, BOARD_SIZES } from './cards';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs) {
  const picked = shuffle([...CARD_POOL]).slice(0, pairs);
  const deck = [];
  picked.forEach(card => {
    deck.push({ ...card, uid: `${card.id}-A` });
    deck.push({ ...card, uid: `${card.id}-B` });
  });
  return shuffle(deck);
}

export default function MemoryGame({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [screen, setScreen] = useState('start');
  const [boardSize, setBoardSize] = useState(null);
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const firstRef = useRef(null);

  const cardLabel = (card) => lang === 'he' ? card.heLabel : card.label;

  const startGame = useCallback((size) => {
    setBoardSize(size);
    const newDeck = buildDeck(size.pairs);
    setDeck(newDeck);
    setFlipped(new Set());
    setMatched(new Set());
    setLocked(false);
    setMoves(0);
    firstRef.current = null;
    setScreen('game');
  }, []);

  const handleFlip = useCallback((card) => {
    if (locked) return;
    if (matched.has(card.uid)) return;
    if (flipped.has(card.uid)) return;

    speak(cardLabel(card), lang);

    const newFlipped = new Set(flipped);
    newFlipped.add(card.uid);
    setFlipped(newFlipped);

    if (!firstRef.current) {
      firstRef.current = card;
    } else {
      const first = firstRef.current;
      firstRef.current = null;
      setMoves(m => m + 1);
      setLocked(true);

      if (first.id === card.id) {
        setTimeout(() => {
          setMatched(prev => {
            const next = new Set(prev);
            next.add(first.uid);
            next.add(card.uid);
            return next;
          });
          setFlipped(new Set());
          setLocked(false);

          setTimeout(() => {
            setMatched(prev => {
              if (prev.size === boardSize.pairs * 2) {
                speak(lang === 'he' ? 'כל הכבוד!' : 'Amazing!', lang);
                setTimeout(() => {
                  onSuccess();
                  setScreen('win');
                }, 600);
              }
              return prev;
            });
          }, 50);
        }, 700);
      } else {
        setTimeout(() => {
          setFlipped(new Set());
          setLocked(false);
        }, 1100);
      }
    }
  }, [locked, matched, flipped, boardSize, lang, onSuccess]); // eslint-disable-line

  if (screen === 'start') return (
    <div className="mg-screen mg-start" dir={dir}>
      <div className="mg-title">{t(lang, 'memoryTitle').replace('\\n', '\n')}</div>
      <div className="mg-title-emoji">🧠</div>
      <div className="mg-size-label">{t(lang, 'chooseBoardSize')}</div>
      <div className="mg-size-buttons">
        {BOARD_SIZES.map(size => (
          <button
            key={size.pairs}
            className="mg-btn-size"
            onClick={() => startGame(size)}
          >
            <span className="mg-size-name">{t(lang, size.nameKey)}</span>
            <span className="mg-size-sub">{size.labelPairs} {t(lang, 'pairs')}</span>
          </button>
        ))}
      </div>
      <button className="mg-exit-link" onClick={onExit}>←</button>
    </div>
  );

  if (screen === 'win') return (
    <div className="mg-screen mg-win" dir={dir}>
      <div className="mg-big-emoji">🏆</div>
      <div className="mg-result-title">{t(lang, 'youDidIt')}</div>
      <div className="mg-result-sub">
        {moves} {t(lang, 'moves')} — {boardSize.pairs} {t(lang, 'pairs')}!
      </div>
      <button className="mg-btn-primary" onClick={() => startGame(boardSize)}>
        {t(lang, 'playAgain')}
      </button>
      <button className="mg-btn-secondary" onClick={() => setScreen('start')}>
        {t(lang, 'changeSize')}
      </button>
      <button className="mg-exit-link" onClick={onExit}>←</button>
    </div>
  );

  const cols = boardSize?.cols ?? 4;
  return (
    <div className="mg-screen mg-game" dir={dir}>
      <div className="mg-hud">
        <button className="mg-btn-back" onClick={() => setScreen('start')}>
          {dir === 'rtl' ? 'חזרה →' : '← Back'}
        </button>
        <span className="mg-hud-moves">{t(lang, 'moves')}: {moves}</span>
        <span className="mg-hud-pairs">{matched.size / 2}/{boardSize.pairs} {t(lang, 'pairs')}</span>
      </div>

      <div className="mg-board" style={{ '--cols': cols }}>
        {deck.map(card => {
          const isFaceUp = flipped.has(card.uid) || matched.has(card.uid);
          const isMatched = matched.has(card.uid);
          return (
            <div
              key={card.uid}
              className={`mg-card${isFaceUp ? ' mg-card-flipped' : ''}${isMatched ? ' mg-card-matched' : ''}`}
              onClick={() => !isFaceUp && handleFlip(card)}
            >
              <div className="mg-card-inner">
                <div className="mg-card-back">❓</div>
                <div className="mg-card-front">
                  <span className="mg-card-emoji">{card.emoji}</span>
                  <span className="mg-card-label">{cardLabel(card)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
