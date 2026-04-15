import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './BigVsSmall.css';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';

const ROUNDS_PER_LEVEL = 5;

// Pool of rounds per level — sampled randomly each session
const LEVEL_POOLS = [
  // Level 1 — 2 items, very obvious size difference
  { label: { he: 'קל', en: 'Easy' }, rounds: [
    { big: { emoji:'🐘', name:'Elephant', heName:'פיל'    }, others:[{ emoji:'🐭', name:'Mouse',   heName:'עכבר'   }] },
    { big: { emoji:'🦒', name:'Giraffe',  heName:"ג'ירף"  }, others:[{ emoji:'🐹', name:'Hamster', heName:'אוגר'   }] },
    { big: { emoji:'🐻', name:'Bear',     heName:'דוב'    }, others:[{ emoji:'🐝', name:'Bee',     heName:'דבורה'  }] },
    { big: { emoji:'🐄', name:'Cow',      heName:'פרה'    }, others:[{ emoji:'🐸', name:'Frog',    heName:'צפרדע'  }] },
    { big: { emoji:'🦁', name:'Lion',     heName:'אריה'   }, others:[{ emoji:'🐜', name:'Ant',     heName:'נמלה'   }] },
    { big: { emoji:'🐊', name:'Crocodile',heName:'תנין'   }, others:[{ emoji:'🦋', name:'Butterfly',heName:'פרפר'  }] },
    { big: { emoji:'🦛', name:'Hippo',    heName:'היפופוטם'},others:[{ emoji:'🐞', name:'Ladybug', heName:'פרת משה רבנו'}] },
    { big: { emoji:'🏠', name:'House',    heName:'בית'    }, others:[{ emoji:'🍎', name:'Apple',   heName:'תפוח'   }] },
    { big: { emoji:'🚌', name:'Bus',      heName:'אוטובוס'}, others:[{ emoji:'🐝', name:'Bee',     heName:'דבורה'  }] },
    { big: { emoji:'🌳', name:'Tree',     heName:'עץ'     }, others:[{ emoji:'🍄', name:'Mushroom',heName:'פטריה' }] },
  ]},
  // Level 2 — 3 items
  { label: { he: 'בינוני', en: 'Medium' }, rounds: [
    { big: { emoji:'🐘', name:'Elephant',  heName:'פיל'        }, others:[{ emoji:'🐕',  name:'Dog',      heName:'כלב'           }, { emoji:'🐝', name:'Bee',     heName:'דבורה'         }] },
    { big: { emoji:'🦏', name:'Rhino',     heName:'קרנף'       }, others:[{ emoji:'🐰',  name:'Rabbit',   heName:'ארנב'          }, { emoji:'🐞', name:'Ladybug', heName:'פרת משה רבנו' }] },
    { big: { emoji:'🦛', name:'Hippo',     heName:'היפופוטם'   }, others:[{ emoji:'🦊',  name:'Fox',      heName:'שועל'          }, { emoji:'🐌', name:'Snail',   heName:'חילזון'        }] },
    { big: { emoji:'🐊', name:'Crocodile', heName:'תנין'       }, others:[{ emoji:'🐿️', name:'Squirrel', heName:'סנאי'          }, { emoji:'🪱', name:'Worm',    heName:'תולעת'         }] },
    { big: { emoji:'🦓', name:'Zebra',     heName:'זברה'       }, others:[{ emoji:'🐱',  name:'Cat',      heName:'חתול'          }, { emoji:'🐭', name:'Mouse',   heName:'עכבר'          }] },
    { big: { emoji:'🐻', name:'Bear',      heName:'דוב'        }, others:[{ emoji:'🐹',  name:'Hamster',  heName:'אוגר'          }, { emoji:'🐜', name:'Ant',     heName:'נמלה'          }] },
    { big: { emoji:'🦒', name:'Giraffe',   heName:"ג'ירף"      }, others:[{ emoji:'🐸',  name:'Frog',     heName:'צפרדע'         }, { emoji:'🦋', name:'Butterfly',heName:'פרפר'         }] },
    { big: { emoji:'🚌', name:'Bus',       heName:'אוטובוס'    }, others:[{ emoji:'🚲',  name:'Bike',     heName:'אופניים'       }, { emoji:'🐜', name:'Ant',     heName:'נמלה'          }] },
    { big: { emoji:'🌳', name:'Tree',      heName:'עץ'         }, others:[{ emoji:'🌸',  name:'Flower',   heName:'פרח'           }, { emoji:'🌱', name:'Seedling',heName:'שתיל'          }] },
    { big: { emoji:'🏠', name:'House',     heName:'בית'        }, others:[{ emoji:'📚',  name:'Book',     heName:'ספר'           }, { emoji:'🍎', name:'Apple',   heName:'תפוח'          }] },
  ]},
  // Level 3 — 4 animals
  { label: { he: 'קשה', en: 'Hard' }, rounds: [
    { big: { emoji:'🐘', name:'Elephant', heName:'פיל'      }, others:[{ emoji:'🦁', name:'Lion',    heName:'אריה'  }, { emoji:'🐱', name:'Cat',      heName:'חתול'          }, { emoji:'🐭', name:'Mouse',   heName:'עכבר'          }] },
    { big: { emoji:'🦒', name:'Giraffe',  heName:"ג'ירף"    }, others:[{ emoji:'🐕', name:'Dog',     heName:'כלב'   }, { emoji:'🐇', name:'Rabbit',   heName:'ארנב'          }, { emoji:'🐝', name:'Bee',     heName:'דבורה'         }] },
    { big: { emoji:'🦛', name:'Hippo',    heName:'היפופוטם' }, others:[{ emoji:'🐺', name:'Wolf',    heName:'זאב'   }, { emoji:'🐹', name:'Hamster',  heName:'אוגר'          }, { emoji:'🐜', name:'Ant',     heName:'נמלה'          }] },
    { big: { emoji:'🐻', name:'Bear',     heName:'דוב'      }, others:[{ emoji:'🦊', name:'Fox',     heName:'שועל'  }, { emoji:'🐸', name:'Frog',     heName:'צפרדע'         }, { emoji:'🐌', name:'Snail',   heName:'חילזון'        }] },
    { big: { emoji:'🦏', name:'Rhino',    heName:'קרנף'     }, others:[{ emoji:'🦌', name:'Deer',    heName:'אייל'  }, { emoji:'🐿️',name:'Squirrel', heName:'סנאי'          }, { emoji:'🐞', name:'Ladybug', heName:'פרת משה רבנו' }] },
    { big: { emoji:'🐊', name:'Crocodile',heName:'תנין'     }, others:[{ emoji:'🦔', name:'Hedgehog',heName:'קיפוד' }, { emoji:'🐰', name:'Rabbit',   heName:'ארנב'          }, { emoji:'🦋', name:'Butterfly',heName:'פרפר'         }] },
    { big: { emoji:'🦓', name:'Zebra',    heName:'זברה'     }, others:[{ emoji:'🐱', name:'Cat',     heName:'חתול'  }, { emoji:'🐹', name:'Hamster',  heName:'אוגר'          }, { emoji:'🐜', name:'Ant',     heName:'נמלה'          }] },
    { big: { emoji:'🚌', name:'Bus',      heName:'אוטובוס'  }, others:[{ emoji:'🚗', name:'Car',     heName:'מכונית'}, { emoji:'🛴', name:'Scooter',  heName:'קורקינט'       }, { emoji:'🐜', name:'Ant',     heName:'נמלה'          }] },
    { big: { emoji:'🌳', name:'Tree',     heName:'עץ'       }, others:[{ emoji:'🌵', name:'Cactus',  heName:'קקטוס' }, { emoji:'🌸', name:'Flower',   heName:'פרח'           }, { emoji:'🌱', name:'Seedling',heName:'שתיל'          }] },
    { big: { emoji:'🏠', name:'House',    heName:'בית'      }, others:[{ emoji:'🪑', name:'Chair',   heName:'כיסא'  }, { emoji:'📚', name:'Book',     heName:'ספר'           }, { emoji:'🍎', name:'Apple',   heName:'תפוח'          }] },
  ]},
  // Level 4 — 4 items, tricky mixed categories
  { label: { he: 'מאתגר', en: 'Expert' }, rounds: [
    { big: { emoji:'🚌', name:'Bus',      heName:'אוטובוס' }, others:[{ emoji:'🚗', name:'Car',      heName:'מכונית'  }, { emoji:'🚲', name:'Bike',     heName:'אופניים' }, { emoji:'🐜', name:'Ant',      heName:'נמלה'   }] },
    { big: { emoji:'🌳', name:'Tree',     heName:'עץ'      }, others:[{ emoji:'🍄', name:'Mushroom', heName:'פטריה'   }, { emoji:'🌸', name:'Flower',   heName:'פרח'     }, { emoji:'🌱', name:'Seedling', heName:'שתיל'   }] },
    { big: { emoji:'🏠', name:'House',    heName:'בית'     }, others:[{ emoji:'🪑', name:'Chair',    heName:'כיסא'    }, { emoji:'📚', name:'Book',     heName:'ספר'     }, { emoji:'🍎', name:'Apple',    heName:'תפוח'   }] },
    { big: { emoji:'🐋', name:'Whale',    heName:'לווייתן' }, others:[{ emoji:'🐕', name:'Dog',      heName:'כלב'     }, { emoji:'🐭', name:'Mouse',    heName:'עכבר'    }, { emoji:'🐝', name:'Bee',      heName:'דבורה'  }] },
    { big: { emoji:'🏔️', name:'Mountain', heName:'הר'     }, others:[{ emoji:'🏠', name:'House',    heName:'בית'     }, { emoji:'🚲', name:'Bike',     heName:'אופניים' }, { emoji:'🐜', name:'Ant',      heName:'נמלה'   }] },
    { big: { emoji:'✈️',  name:'Plane',   heName:'מטוס'   }, others:[{ emoji:'🚗', name:'Car',      heName:'מכונית'  }, { emoji:'🐦', name:'Bird',     heName:'ציפור'   }, { emoji:'🐜', name:'Ant',      heName:'נמלה'   }] },
    { big: { emoji:'🚢', name:'Ship',     heName:'אנייה'   }, others:[{ emoji:'🚤', name:'Boat',     heName:'סירה'    }, { emoji:'🏊', name:'Swimmer',  heName:'שחיין'   }, { emoji:'🐟', name:'Fish',     heName:'דג'     }] },
    { big: { emoji:'🦣', name:'Mammoth',  heName:'מאמות'   }, others:[{ emoji:'🐺', name:'Wolf',     heName:'זאב'     }, { emoji:'🐇', name:'Rabbit',   heName:'ארנב'    }, { emoji:'🐛', name:'Caterpillar',heName:'זחל' }] },
    { big: { emoji:'🏟️', name:'Stadium',  heName:'אצטדיון'}, others:[{ emoji:'🏠', name:'House',    heName:'בית'     }, { emoji:'🎪', name:'Tent',     heName:'אוהל'    }, { emoji:'📦', name:'Box',      heName:'קופסה'  }] },
    { big: { emoji:'🌋', name:'Volcano',  heName:'הר געש'  }, others:[{ emoji:'⛰️', name:'Hill',    heName:'גבעה'    }, { emoji:'🌵', name:'Cactus',   heName:'קקטוס'   }, { emoji:'🌱', name:'Seedling', heName:'שתיל'   }] },
  ]},
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sampleRounds(pool) {
  return shuffle(pool).slice(0, ROUNDS_PER_LEVEL);
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
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Sample a fresh random set of rounds per level per session
  const [levelRounds, setLevelRounds] = useState(() =>
    LEVEL_POOLS.map(lp => sampleRounds(lp.rounds))
  );

  const [displayItems, setDisplayItems] = useState(() =>
    buildDisplayItems(levelRounds[0][0])
  );

  const soundOnRef = useRef(true);
  const idleTimer = useRef(null);

  const done = levelIdx >= LEVEL_POOLS.length;
  const totalRounds = LEVEL_POOLS.length * ROUNDS_PER_LEVEL;
  const bigIdx = displayItems.findIndex(item => item.isBig);

  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked || done) return;
    idleTimer.current = setTimeout(() => setHighlight(bigIdx), 3000);
  }, [locked, done, bigIdx]);

  useEffect(() => {
    if (done) {
      if (soundOnRef.current) speak(t(lang, 'amazing'), lang);
      return;
    }
    const round = levelRounds[levelIdx][roundIdx];
    setDisplayItems(buildDisplayItems(round));
    setWinner(null);
    setHighlight(null);
    setLocked(false);
    if (soundOnRef.current) speak(t(lang, 'whoIsBigger'), lang);
  }, [levelIdx, roundIdx, done, lang, levelRounds]);

  useEffect(() => {
    resetIdle();
    return () => clearTimeout(idleTimer.current);
  }, [resetIdle, levelIdx, roundIdx]);

  function jumpToLevel(idx) {
    if (idx === levelIdx) return;
    // Resample rounds for variety when manually switching
    setLevelRounds(LEVEL_POOLS.map(lp => sampleRounds(lp.rounds)));
    setLevelIdx(idx);
    setRoundIdx(0);
    setWinner(null);
    setHighlight(null);
    setLocked(false);
  }

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
        const rounds = levelRounds[capLevelIdx];
        if (capRoundIdx + 1 < rounds.length) {
          setRoundIdx(capRoundIdx + 1);
        } else if (capLevelIdx + 1 < LEVEL_POOLS.length) {
          setShowLevelUp(true);
          setTimeout(() => {
            setShowLevelUp(false);
            setLevelIdx(capLevelIdx + 1);
            setRoundIdx(0);
          }, 1500);
        } else {
          setLevelIdx(LEVEL_POOLS.length);
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
              {Array.from({ length: totalRounds }).map((_, i) => (
                <span key={i} className={i < stars ? 'bvs-star filled' : 'bvs-star empty'}>⭐</span>
              ))}
            </span>
            <span className="bvs-win-stat-count">{stars} / {totalRounds}</span>
          </div>
          {balloons > 0 && <div className="bvs-win-balloons">{'🎈'.repeat(balloons)}</div>}
        </div>
        <button className="bvs-collect-btn" onClick={onSuccess}>{t(lang, 'collectSticker')}</button>
        <button className="bvs-play-again" onClick={() => {
          setLevelRounds(LEVEL_POOLS.map(lp => sampleRounds(lp.rounds)));
          setLevelIdx(0); setRoundIdx(0); setStars(0); setBalloons(0);
        }}>
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

      {/* Level selector */}
      <div className="bvs-level-picker">
        {LEVEL_POOLS.map((lp, i) => (
          <button
            key={i}
            className={`bvs-level-pill${i === levelIdx ? ' active' : ''}`}
            onClick={() => jumpToLevel(i)}
          >
            <span className="bvs-level-pill-stars">{'⭐'.repeat(i + 1)}</span>
            <span className="bvs-level-pill-label">{lp.label[lang] || lp.label.en}</span>
          </button>
        ))}
      </div>

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
