import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BigVsSmall.css';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

// Each round: big = correct/biggest item, others = smaller items (shuffled for display)
const LEVELS = [
  // Level 1 — 2 items, very obvious size difference
  { rounds: [
    { big: { emoji:'🐘', name:'Elephant', heName:'פיל'    }, others:[{ emoji:'🐭', name:'Mouse',   heName:'עכבר'   }] },
    { big: { emoji:'🦒', name:'Giraffe',  heName:"ג'ירף"  }, others:[{ emoji:'🐹', name:'Hamster', heName:'אוגר'   }] },
    { big: { emoji:'🐻', name:'Bear',     heName:'דוב'    }, others:[{ emoji:'🐝', name:'Bee',     heName:'דבורה'  }] },
    { big: { emoji:'🐄', name:'Cow',      heName:'פרה'    }, others:[{ emoji:'🐸', name:'Frog',    heName:'צפרדע'  }] },
    { big: { emoji:'🦁', name:'Lion',     heName:'אריה'   }, others:[{ emoji:'🐜', name:'Ant',     heName:'נמלה'   }] },
  ]},
  // Level 2 — 3 items
  { rounds: [
    { big: { emoji:'🐘', name:'Elephant',  heName:'פיל'        }, others:[{ emoji:'🐕',  name:'Dog',      heName:'כלב'           }, { emoji:'🐝', name:'Bee',     heName:'דבורה'         }] },
    { big: { emoji:'🦏', name:'Rhino',     heName:'קרנף'       }, others:[{ emoji:'🐰',  name:'Rabbit',   heName:'ארנב'          }, { emoji:'🐞', name:'Ladybug', heName:'פרת משה רבנו' }] },
    { big: { emoji:'🦛', name:'Hippo',     heName:'היפופוטם'   }, others:[{ emoji:'🦊',  name:'Fox',      heName:'שועל'          }, { emoji:'🐌', name:'Snail',   heName:'חילזון'        }] },
    { big: { emoji:'🐊', name:'Crocodile', heName:'תנין'       }, others:[{ emoji:'🐿️', name:'Squirrel', heName:'סנאי'          }, { emoji:'🪱', name:'Worm',    heName:'תולעת'         }] },
    { big: { emoji:'🦓', name:'Zebra',     heName:'זברה'       }, others:[{ emoji:'🐱',  name:'Cat',      heName:'חתול'          }, { emoji:'🐭', name:'Mouse',   heName:'עכבר'          }] },
  ]},
  // Level 3 — 4 animals
  { rounds: [
    { big: { emoji:'🐘', name:'Elephant', heName:'פיל'      }, others:[{ emoji:'🦁', name:'Lion',    heName:'אריה'  }, { emoji:'🐱', name:'Cat',      heName:'חתול'          }, { emoji:'🐭', name:'Mouse',   heName:'עכבר'          }] },
    { big: { emoji:'🦒', name:'Giraffe',  heName:"ג'ירף"    }, others:[{ emoji:'🐕', name:'Dog',     heName:'כלב'   }, { emoji:'🐇', name:'Rabbit',   heName:'ארנב'          }, { emoji:'🐝', name:'Bee',     heName:'דבורה'         }] },
    { big: { emoji:'🦛', name:'Hippo',    heName:'היפופוטם' }, others:[{ emoji:'🐺', name:'Wolf',    heName:'זאב'   }, { emoji:'🐹', name:'Hamster',  heName:'אוגר'          }, { emoji:'🐜', name:'Ant',     heName:'נמלה'          }] },
    { big: { emoji:'🐻', name:'Bear',     heName:'דוב'      }, others:[{ emoji:'🦊', name:'Fox',     heName:'שועל'  }, { emoji:'🐸', name:'Frog',     heName:'צפרדע'         }, { emoji:'🐌', name:'Snail',   heName:'חילזון'        }] },
    { big: { emoji:'🦏', name:'Rhino',    heName:'קרנף'     }, others:[{ emoji:'🦌', name:'Deer',    heName:'אייל'  }, { emoji:'🐿️',name:'Squirrel', heName:'סנאי'          }, { emoji:'🐞', name:'Ladybug', heName:'פרת משה רבנו' }] },
  ]},
  // Level 4 — 4 items, mixed (vehicles, nature, objects)
  { rounds: [
    { big: { emoji:'🚌', name:'Bus',      heName:'אוטובוס' }, others:[{ emoji:'🚗', name:'Car',      heName:'מכונית'  }, { emoji:'🚲', name:'Bike',     heName:'אופניים' }, { emoji:'🐜', name:'Ant',      heName:'נמלה'   }] },
    { big: { emoji:'🌳', name:'Tree',     heName:'עץ'      }, others:[{ emoji:'🍄', name:'Mushroom', heName:'פטריה'   }, { emoji:'🌸', name:'Flower',   heName:'פרח'     }, { emoji:'🌱', name:'Seedling', heName:'שתיל'   }] },
    { big: { emoji:'🏠', name:'House',    heName:'בית'     }, others:[{ emoji:'🪑', name:'Chair',    heName:'כיסא'    }, { emoji:'📚', name:'Book',     heName:'ספר'     }, { emoji:'🍎', name:'Apple',    heName:'תפוח'   }] },
    { big: { emoji:'🐋', name:'Whale',    heName:'לווייתן' }, others:[{ emoji:'🐕', name:'Dog',      heName:'כלב'     }, { emoji:'🐭', name:'Mouse',    heName:'עכבר'    }, { emoji:'🐝', name:'Bee',      heName:'דבורה'  }] },
    { big: { emoji:'🏔️', name:'Mountain', heName:'הר'     }, others:[{ emoji:'🏠', name:'House',    heName:'בית'     }, { emoji:'🚲', name:'Bike',     heName:'אופניים' }, { emoji:'🐜', name:'Ant',      heName:'נמלה'   }] },
  ]},
];

const TOTAL_ROUNDS = LEVELS.reduce((s, l) => s + l.rounds.length, 0);

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDisplayItems(round) {
  return shuffle([{ ...round.big, isBig: true }, ...round.others.map(o => ({ ...o, isBig: false }))]);
}

export default function BigVsSmall({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const [levelIdx, setLevelIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [winner, setWinner] = useState(null);    // index in displayItems
  const [highlight, setHighlight] = useState(null); // index in displayItems
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [displayItems, setDisplayItems] = useState(() => buildDisplayItems(LEVELS[0].rounds[0]));
  const soundOnRef = useRef(true);
  const idleTimer = useRef(null);

  const done = levelIdx >= LEVELS.length;
  const bigIdx = displayItems.findIndex(item => item.isBig);

  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked || done) return;
    idleTimer.current = setTimeout(() => setHighlight(bigIdx), 3000);
  }, [locked, done, bigIdx]);

  // Rebuild display when round/level changes
  useEffect(() => {
    if (done) {
      if (soundOnRef.current) speak(t(lang, 'amazing'), lang);
      return;
    }
    const round = LEVELS[levelIdx].rounds[roundIdx];
    setDisplayItems(buildDisplayItems(round));
    setWinner(null);
    setHighlight(null);
    setLocked(false);
    if (soundOnRef.current) speak(t(lang, 'whoIsBigger'), lang);
  }, [levelIdx, roundIdx, done, lang]);

  useEffect(() => {
    resetIdle();
    return () => clearTimeout(idleTimer.current);
  }, [resetIdle, levelIdx, roundIdx]);

  function handleTap(idx) {
    if (locked) return;
    clearTimeout(idleTimer.current);
    setLocked(true);

    const capLevelIdx = levelIdx;
    const capRoundIdx = roundIdx;

    if (displayItems[idx].isBig) {
      setWinner(idx);
      const newStars = stars + 1;
      setStars(newStars);
      if (newStars % 5 === 0) setBalloons(b => b + 1);
      if (soundOnRef.current) speak(t(lang, 'correct'), lang);

      setTimeout(() => {
        const level = LEVELS[capLevelIdx];
        if (capRoundIdx + 1 < level.rounds.length) {
          setRoundIdx(capRoundIdx + 1);
        } else if (capLevelIdx + 1 < LEVELS.length) {
          setShowLevelUp(true);
          setTimeout(() => {
            setShowLevelUp(false);
            setLevelIdx(capLevelIdx + 1);
            setRoundIdx(0);
          }, 1500);
        } else {
          setLevelIdx(LEVELS.length); // triggers done
        }
      }, 700);
    } else {
      setHighlight(bigIdx);
      const bigItem = displayItems[bigIdx];
      const msg = lang === 'he'
        ? `${bigItem.heName} יותר גדול`
        : `${bigItem.name} is bigger`;
      if (soundOnRef.current) speak(msg, lang);
      setTimeout(() => {
        setHighlight(null);
        setLocked(false);
      }, 2000);
    }
  }

  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;
  const itemCount = done ? 2 : displayItems.length;
  const levelNum = levelIdx + 1;

  if (done) {
    return (
      <div className="bvs-game bvs-win" dir={dir}>
        <div className="bvs-win-emoji">🏆</div>
        <h1 className="bvs-win-title">{t(lang, 'amazing')}</h1>
        <p className="bvs-win-sub">{t(lang, 'youFinishedAll')}</p>
        <div className="bvs-win-stats">
          <div className="bvs-win-stat-row">
            <span className="bvs-win-stat-stars">
              {Array.from({ length: TOTAL_ROUNDS }).map((_, i) => (
                <span key={i} className={i < stars ? 'bvs-star filled' : 'bvs-star empty'}>⭐</span>
              ))}
            </span>
            <span className="bvs-win-stat-count">{stars} / {TOTAL_ROUNDS}</span>
          </div>
          {balloons > 0 && <div className="bvs-win-balloons">{'🎈'.repeat(balloons)}</div>}
        </div>
        <button className="bvs-collect-btn" onClick={onSuccess}>{t(lang, 'collectSticker')}</button>
        <button className="bvs-play-again" onClick={() => { setLevelIdx(0); setRoundIdx(0); setStars(0); setBalloons(0); }}>
          {t(lang, 'playAgain')}
        </button>
        <button className="bvs-exit-link" onClick={onExit}>←</button>
      </div>
    );
  }

  return (
    <div className="bvs-game" dir={dir}>
      {showLevelUp && (
        <div className="bvs-levelup-overlay">
          <div className="bvs-levelup-box">
            <span className="bvs-levelup-star">🌟</span>
            <span className="bvs-levelup-text">
              {lang === 'he' ? `שלב ${levelNum + 1}` : `Level ${levelNum + 1}`}
            </span>
          </div>
        </div>
      )}

      <header className="bvs-hud">
        <div className="bvs-hud-top">
          <StarBar starsInCycle={starsInCycle} balloons={balloons} />
          <div className="bvs-hud-controls">
            <span className="bvs-level-badge">
              {lang === 'he' ? `שלב ${levelNum}` : `L${levelNum}`}
            </span>
            <button
              className={`bvs-sound-btn${soundOn ? ' on' : ''}`}
              onClick={() => setSoundOn(s => !s)}
              aria-label={soundOn ? 'Sound on' : 'Sound off'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="bvs-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
          </div>
        </div>
      </header>

      <h1 className="bvs-prompt">{t(lang, 'whoIsBigger')}</h1>

      <div className={`bvs-arena bvs-arena--${itemCount}`}>
        {displayItems.map((item, idx) => {
          const name = lang === 'he' ? item.heName : item.name;
          return (
            <button
              key={idx}
              className={`bvs-animal-btn${winner === idx ? ' grow' : ''}${highlight === idx ? ' pulse' : ''}`}
              onClick={() => handleTap(idx)}
              aria-label={name}
            >
              <span className="bvs-animal-emoji">{item.emoji}</span>
              <span className="bvs-animal-name">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
