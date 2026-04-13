import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { T } from '../i18n/translations';

const CREATURES = ['🐻', '🐿️', '🐘', '🦊', '🤖'];
const AUDIO_FILES = ['kol-hakavod.m4a', 'yesss.m4a'];

function playAudio(filename) {
  try {
    const audio = new Audio(`/audio/${filename}`);
    audio.volume = 0.8;
    audio.play().catch(() => {});
  } catch (e) {}
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function CreatureCelebration({ onDone }) {
  const { lang } = useLanguage();
  const [slidingOut, setSlidingOut] = useState(false);
  const [creature] = useState(() => pickRandom(CREATURES));
  const [phrase] = useState(() => pickRandom(T[lang]?.creaturePhrases || T.en.creaturePhrases));
  const [fromRight] = useState(() => Math.random() < 0.5);

  useEffect(() => {
    playAudio(pickRandom(AUDIO_FILES));

    const slideOutTimer = setTimeout(() => {
      setSlidingOut(true);
    }, 2800);

    const doneTimer = setTimeout(() => {
      if (onDone) onDone();
    }, 3500);

    return () => {
      clearTimeout(slideOutTimer);
      clearTimeout(doneTimer);
    };
  }, []); // eslint-disable-line

  const slideInAnim = fromRight ? 'slideInRight' : 'slideInLeft';
  const slideOutAnim = fromRight ? 'slideOutRight' : 'slideOutLeft';

  return (
    <div className="creature-overlay" aria-live="polite">
      <div
        className="creature-container"
        style={{
          [fromRight ? 'right' : 'left']: '5vw',
          animation: slidingOut
            ? `${slideOutAnim} 0.6s ease forwards`
            : `${slideInAnim} 0.5s ease forwards`,
        }}
      >
        <div className="creature-bubble">{phrase}</div>
        <div className="creature-emoji" style={{ animation: 'dance 0.6s ease-in-out infinite' }}>
          {creature}
        </div>
      </div>
    </div>
  );
}
