import React, { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getSettings, saveSettings, verifyPin } from '../lib/settings';

const GAME_LABELS = {
  bigvssmall:  { emoji: '🐘🐭',   he: 'גדול מול קטן',       en: 'Big vs Small'    },
  memory:      { emoji: '🧠',     he: 'משחק זיכרון',         en: 'Memory Game'     },
  social:      { emoji: '💬',     he: 'מיומנויות חברתיות',   en: 'Social Skills'   },
  shooter:     { emoji: '🦸',     he: 'יורה מילים',           en: 'Word Shooter'    },
  pattern:     { emoji: '⭐🔴⭐', he: 'מציאת דפוסים',        en: 'Pattern Finder'  },
  numbertrain: { emoji: '🚂',     he: 'רכבת המספרים',        en: 'Number Train'    },
  shapesorter: { emoji: '🔺⬜🔴', he: 'ממיין הצורות',        en: 'Shape Sorter'    },
  lego:        { emoji: '🧱',     he: 'בונה לגו',             en: 'Lego Builder'    },
};

const TEMP_HIDDEN_GAME_IDS = new Set(['shapesorter', 'rescuedog', 'pjmasks']);

function PinPad({ title, hint, onDigit, onBack, pinLength, hasError, onCancel }) {
  return (
    <div className={`ps-pin-modal ${hasError ? 'ps-pin-shake' : ''}`}>
      <div className="ps-pin-lock">🔐</div>
      <h2 className="ps-pin-title">{title}</h2>
      {hint && <p className="ps-pin-hint">{hint}</p>}
      <div className="ps-pin-dots">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`ps-pin-dot ${pinLength > i ? 'ps-pin-dot--filled' : ''}`} />
        ))}
      </div>
      <div className="ps-numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} className="ps-numpad-btn" onClick={() => onDigit(String(n))}>{n}</button>
        ))}
        <div />
        <button className="ps-numpad-btn" onClick={() => onDigit('0')}>0</button>
        <button className="ps-numpad-btn ps-numpad-back" onClick={onBack}>⌫</button>
      </div>
      {onCancel && (
        <button className="ps-cancel-link" onClick={onCancel}>
          {/* label set by parent */}
          Cancel
        </button>
      )}
    </div>
  );
}

export default function ParentSettings({ onClose, onSettingsChange }) {
  const { lang, setLang } = useLanguage();
  const isRTL = lang === 'he';

  const [phase, setPhase] = useState('pin'); // 'pin' | 'settings' | 'changePin'
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [settings, setSettings] = useState(getSettings);

  // Change-PIN flow
  const [newPin, setNewPin] = useState('');
  const [newPinStep, setNewPinStep] = useState(1); // 1=enter new, 2=confirm
  const [newPinFirst, setNewPinFirst] = useState('');
  const [newPinError, setNewPinError] = useState(false);

  const [resetConfirm, setResetConfirm] = useState(false);

  // ── PIN entry ────────────────────────────────────────────────────────────
  const handlePinDigit = useCallback((digit) => {
    const next = pinInput + digit;
    if (next.length > 4) return;
    setPinInput(next);
    if (next.length === 4) {
      if (verifyPin(next)) {
        setPhase('settings');
        setPinInput('');
      } else {
        setPinError(true);
        setTimeout(() => { setPinError(false); setPinInput(''); }, 600);
      }
    }
  }, [pinInput]);

  // ── Change-PIN entry ─────────────────────────────────────────────────────
  function handleNewPinDigit(digit) {
    const next = newPin + digit;
    if (next.length > 4) return;
    setNewPin(next);
    if (next.length === 4) {
      if (newPinStep === 1) {
        setNewPinFirst(next);
        setNewPin('');
        setNewPinStep(2);
      } else {
        if (next === newPinFirst) {
          updateSetting('pin', next);
          setPhase('settings');
          setNewPin('');
          setNewPinStep(1);
        } else {
          setNewPinError(true);
          setTimeout(() => { setNewPinError(false); setNewPin(''); setNewPinStep(1); }, 600);
        }
      }
    }
  }

  // ── Settings helpers ─────────────────────────────────────────────────────
  function updateSetting(key, value) {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
    if (onSettingsChange) onSettingsChange(updated);
  }

  function toggleGame(id) {
    const hidden = settings.hiddenGames.includes(id)
      ? settings.hiddenGames.filter(g => g !== id)
      : [...settings.hiddenGames, id];
    updateSetting('hiddenGames', hidden);
  }

  function handleReset() {
    localStorage.removeItem('kids-stickers-earned');
    setResetConfirm(false);
    if (onSettingsChange) onSettingsChange(settings);
    onClose();
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const dir = isRTL ? 'rtl' : 'ltr';

  // Backdrop click closes
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  if (phase === 'pin') {
    return (
      <div className="ps-backdrop" onClick={handleBackdropClick} dir={dir}>
        <div className={`ps-pin-modal ${pinError ? 'ps-pin-shake' : ''}`}>
          <button className="ps-close" onClick={onClose}>✕</button>
          <div className="ps-pin-lock">🔐</div>
          <h2 className="ps-pin-title">
            {isRTL ? 'הכנס קוד הורים' : 'Enter Parent PIN'}
          </h2>
          <p className="ps-pin-hint">
            {isRTL ? 'קוד ברירת מחדל: 1234' : 'Default PIN: 1234'}
          </p>
          <div className="ps-pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`ps-pin-dot ${pinInput.length > i ? 'ps-pin-dot--filled' : ''}`} />
            ))}
          </div>
          <div className="ps-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} className="ps-numpad-btn" onClick={() => handlePinDigit(String(n))}>{n}</button>
            ))}
            <div />
            <button className="ps-numpad-btn" onClick={() => handlePinDigit('0')}>0</button>
            <button className="ps-numpad-btn ps-numpad-back" onClick={() => setPinInput(p => p.slice(0, -1))}>⌫</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'changePin') {
    const titleMap = {
      he: [null, 'הכנס קוד חדש', 'אשר קוד חדש'],
      en: [null, 'Enter new PIN', 'Confirm new PIN'],
    };
    return (
      <div className="ps-backdrop" onClick={handleBackdropClick} dir={dir}>
        <div className={`ps-pin-modal ${newPinError ? 'ps-pin-shake' : ''}`}>
          <button className="ps-close" onClick={() => { setPhase('settings'); setNewPin(''); setNewPinStep(1); }}>✕</button>
          <div className="ps-pin-lock">🔑</div>
          <h2 className="ps-pin-title">{isRTL ? titleMap.he[newPinStep] : titleMap.en[newPinStep]}</h2>
          <p className="ps-pin-hint"> </p>
          <div className="ps-pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`ps-pin-dot ${newPin.length > i ? 'ps-pin-dot--filled' : ''}`} />
            ))}
          </div>
          <div className="ps-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button key={n} className="ps-numpad-btn" onClick={() => handleNewPinDigit(String(n))}>{n}</button>
            ))}
            <div />
            <button className="ps-numpad-btn" onClick={() => handleNewPinDigit('0')}>0</button>
            <button className="ps-numpad-btn ps-numpad-back" onClick={() => setNewPin(p => p.slice(0, -1))}>⌫</button>
          </div>
          <button className="ps-cancel-link" onClick={() => { setPhase('settings'); setNewPin(''); setNewPinStep(1); }}>
            {isRTL ? 'ביטול' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // ── Settings panel ───────────────────────────────────────────────────────
  return (
    <div className="ps-backdrop" onClick={handleBackdropClick} dir={dir}>
      <div className="ps-panel">
        <div className="ps-panel-header">
          <h2 className="ps-panel-title">
            {isRTL ? '⚙️ הגדרות הורים' : '⚙️ Parent Settings'}
          </h2>
          <button className="ps-close ps-close--light" onClick={onClose}>✕</button>
        </div>

        <div className="ps-panel-body">

          {/* Sound */}
          <div className="ps-row">
            <div className="ps-row-label">
              <span className="ps-row-icon">🔊</span>
              <div>
                <div className="ps-row-name">{isRTL ? 'סאונד' : 'Sound'}</div>
                <div className="ps-row-desc">{isRTL ? 'קול בכל המשחקים' : 'Audio in all games'}</div>
              </div>
            </div>
            <button
              className={`ps-toggle ${settings.sound ? 'ps-toggle--on' : ''}`}
              onClick={() => updateSetting('sound', !settings.sound)}
              aria-label="Toggle sound"
            >
              <div className="ps-toggle-thumb" />
            </button>
          </div>

          {/* Language */}
          <div className="ps-row">
            <div className="ps-row-label">
              <span className="ps-row-icon">🌐</span>
              <div>
                <div className="ps-row-name">{isRTL ? 'שפה' : 'Language'}</div>
                <div className="ps-row-desc">{lang === 'he' ? 'עברית' : 'English'}</div>
              </div>
            </div>
            <button className="ps-lang-btn" onClick={() => setLang(lang === 'he' ? 'en' : 'he')}>
              {lang === 'he' ? 'English 🇬🇧' : 'עברית 🇮🇱'}
            </button>
          </div>

          {/* Facilitator mode */}
          <div className="ps-row">
            <div className="ps-row-label">
              <span className="ps-row-icon">🧑‍🏫</span>
              <div>
                <div className="ps-row-name">{isRTL ? 'מצב מנחה' : 'Facilitator Mode'}</div>
                <div className="ps-row-desc">
                  {isRTL ? 'העברה ידנית בין שלבים' : 'Manual advance between steps'}
                </div>
              </div>
            </div>
            <button
              className={`ps-toggle ${settings.facilitator ? 'ps-toggle--on' : ''}`}
              onClick={() => updateSetting('facilitator', !settings.facilitator)}
              aria-label="Toggle facilitator mode"
            >
              <div className="ps-toggle-thumb" />
            </button>
          </div>

          {/* Game visibility */}
          <div className="ps-section-label">
            {isRTL ? 'משחקים מוצגים' : 'Visible Games'}
          </div>
          <div className="ps-games-grid">
            {Object.entries(GAME_LABELS).filter(([id]) => !TEMP_HIDDEN_GAME_IDS.has(id)).map(([id, info]) => {
              const active = !settings.hiddenGames.includes(id);
              return (
                <button
                  key={id}
                  className={`ps-game-chip ${active ? 'ps-game-chip--active' : ''}`}
                  onClick={() => toggleGame(id)}
                >
                  <span>{info.emoji}</span>
                  <span>{isRTL ? info.he : info.en}</span>
                  {active && <span className="ps-game-chip-check">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Change PIN */}
          <button
            className="ps-action-btn"
            onClick={() => { setPhase('changePin'); setNewPin(''); setNewPinStep(1); }}
          >
            🔑 {isRTL ? 'שינוי קוד הורים' : 'Change Parent PIN'}
          </button>

          {/* Reset progress */}
          {resetConfirm ? (
            <div className="ps-reset-confirm">
              <p>{isRTL ? 'למחוק את כל המדבקות?' : 'Delete all sticker progress?'}</p>
              <div className="ps-reset-btns">
                <button className="ps-reset-cancel" onClick={() => setResetConfirm(false)}>
                  {isRTL ? 'ביטול' : 'Cancel'}
                </button>
                <button className="ps-reset-ok" onClick={handleReset}>
                  {isRTL ? 'מחק' : 'Reset'}
                </button>
              </div>
            </div>
          ) : (
            <button className="ps-danger-btn" onClick={() => setResetConfirm(true)}>
              🗑️ {isRTL ? 'איפוס התקדמות' : 'Reset Progress'}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
