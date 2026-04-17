import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { speak } from '../../speak';
import './RescueDog.css';

const DIFFICULTIES = [
  {
    id: 'easy',
    label: { en: 'Easy', he: 'קל' },
    summary: {
      en: '5 hidden items, larger targets, 4 hints',
      he: '5 חפצים, מטרות גדולות יותר, 4 רמזים',
    },
    itemCount: 5,
    hints: 4,
    timeLimit: 120,
    defaultTimer: false,
    scaleBoost: 1.06,
  },
  {
    id: 'medium',
    label: { en: 'Medium', he: 'בינוני' },
    summary: {
      en: '7 hidden items, balanced size, 3 hints',
      he: '7 חפצים, גודל מאוזן, 3 רמזים',
    },
    itemCount: 7,
    hints: 3,
    timeLimit: 95,
    defaultTimer: false,
    scaleBoost: 0.94,
  },
  {
    id: 'hard',
    label: { en: 'Hard', he: 'קשה' },
    summary: {
      en: '9 hidden items, smaller targets, timer on',
      he: '9 חפצים, מטרות קטנות יותר, טיימר פעיל',
    },
    itemCount: 9,
    hints: 2,
    timeLimit: 70,
    defaultTimer: true,
    scaleBoost: 0.82,
  },
];

const CHARACTERS = [
  {
    id: 'chase',
    name: { en: 'Chase', he: 'צ׳ייס' },
    badge: { en: 'Patrol Lead', he: 'ראש הסיור' },
    role: { en: 'Leads the patrol and spots clues fast.', he: 'מוביל את הסיור ומזהה רמזים במהירות.' },
    palette: {
      fur: '#b47d4f',
      muzzle: '#f4d2a6',
      patch: '#5f3e26',
      suit: '#2458a5',
      suitSoft: '#3f78c6',
      accent: '#f4ca51',
      hat: '#1d427d',
    },
  },
  {
    id: 'marshall',
    name: { en: 'Marshall', he: 'מרשל' },
    badge: { en: 'Fire Rescue', he: 'חילוץ אש' },
    role: { en: 'Rushes in first and keeps the team brave.', he: 'נכנס ראשון לפעולה ומשאיר את הצוות אמיץ.' },
    palette: {
      fur: '#fff0ea',
      muzzle: '#ffe2cf',
      patch: '#cf6c4e',
      suit: '#cb3732',
      suitSoft: '#f05d49',
      accent: '#ffd36f',
      hat: '#b52d28',
    },
  },
  {
    id: 'rocky',
    name: { en: 'Rocky', he: 'רוקי' },
    badge: { en: 'Tool Expert', he: 'אלוף הכלים' },
    role: { en: 'Finds hidden gear and fixes tricky spots.', he: 'מוצא ציוד נסתר ומסתדר גם בפינות קשות.' },
    palette: {
      fur: '#878e97',
      muzzle: '#c9d0d6',
      patch: '#596068',
      suit: '#39814a',
      suitSoft: '#53a764',
      accent: '#d5f07a',
      hat: '#2d6b3d',
    },
  },
  {
    id: 'skye',
    name: { en: 'Skye', he: 'סקיי' },
    badge: { en: 'Air Scout', he: 'סיירת אוויר' },
    role: { en: 'Sees the whole zone and guides the search.', he: 'רואה את כל הזירה ומכוונת את החיפוש.' },
    palette: {
      fur: '#ccb492',
      muzzle: '#f6e2c7',
      patch: '#8d6a41',
      suit: '#db6e95',
      suitSoft: '#f28db1',
      accent: '#7ce9f3',
      hat: '#c75780',
    },
  },
];

const LOCATIONS = [
  {
    id: 'harbor',
    name: { en: 'Harbor Bay', he: 'מפרץ הנמל' },
    description: { en: 'Search around the dock and bright water.', he: 'מחפשים ליד המזח והמים הבוהקים.' },
    items: ['badge', 'bone', 'binoculars', 'whistle', 'float', 'map', 'lantern', 'rope', 'compass'],
    slots: [
      { x: 16, y: 73, scale: 1.04, rotate: -12 },
      { x: 28, y: 55, scale: 1.02, rotate: 6 },
      { x: 38, y: 69, scale: 0.96, rotate: -8 },
      { x: 48, y: 46, scale: 1.02, rotate: 8 },
      { x: 59, y: 66, scale: 1.08, rotate: -5 },
      { x: 68, y: 53, scale: 0.96, rotate: 4 },
      { x: 79, y: 71, scale: 1, rotate: -6 },
      { x: 84, y: 44, scale: 0.94, rotate: 10 },
      { x: 61, y: 36, scale: 0.88, rotate: -6 },
      { x: 22, y: 38, scale: 0.88, rotate: 5 },
    ],
  },
  {
    id: 'jungle',
    name: { en: 'Jungle Trail', he: 'שביל הג׳ונגל' },
    description: { en: 'Look through leaves, rocks, and vines.', he: 'מחפשים בין העלים, הסלעים והגפנים.' },
    items: ['badge', 'bone', 'binoculars', 'map', 'rope', 'compass', 'pawprint', 'lantern', 'radio'],
    slots: [
      { x: 14, y: 67, scale: 1.02, rotate: -8 },
      { x: 24, y: 49, scale: 0.94, rotate: 7 },
      { x: 35, y: 62, scale: 0.92, rotate: -7 },
      { x: 47, y: 53, scale: 1.05, rotate: 5 },
      { x: 56, y: 71, scale: 0.98, rotate: -5 },
      { x: 65, y: 44, scale: 0.92, rotate: 9 },
      { x: 75, y: 62, scale: 1.02, rotate: -6 },
      { x: 84, y: 50, scale: 0.96, rotate: 6 },
      { x: 60, y: 32, scale: 0.84, rotate: -4 },
      { x: 31, y: 34, scale: 0.84, rotate: 4 },
    ],
  },
  {
    id: 'snow',
    name: { en: 'Snow Ridge', he: 'רכס השלג' },
    description: { en: 'Scan the icy field and soft snowdrifts.', he: 'סורקים את הקרח והשלג הרך.' },
    items: ['badge', 'bone', 'binoculars', 'scarf', 'thermos', 'lantern', 'whistle', 'pawprint', 'compass'],
    slots: [
      { x: 18, y: 70, scale: 1.06, rotate: -9 },
      { x: 28, y: 51, scale: 0.98, rotate: 6 },
      { x: 39, y: 66, scale: 0.92, rotate: -5 },
      { x: 48, y: 47, scale: 1.02, rotate: 8 },
      { x: 58, y: 69, scale: 0.98, rotate: -4 },
      { x: 68, y: 50, scale: 0.94, rotate: 5 },
      { x: 78, y: 65, scale: 1.02, rotate: -7 },
      { x: 84, y: 46, scale: 0.9, rotate: 5 },
      { x: 60, y: 34, scale: 0.84, rotate: -2 },
      { x: 24, y: 36, scale: 0.84, rotate: 3 },
    ],
  },
];

const ITEM_LIBRARY = {
  badge: { label: { en: 'Badge', he: 'תג' } },
  bone: { label: { en: 'Bone', he: 'עצם' } },
  binoculars: { label: { en: 'Binoculars', he: 'משקפת' } },
  shell: { label: { en: 'Shell', he: 'צדף' } },
  whistle: { label: { en: 'Whistle', he: 'משרוקית' } },
  float: { label: { en: 'Float Ring', he: 'גלגל הצלה' } },
  map: { label: { en: 'Map', he: 'מפה' } },
  lantern: { label: { en: 'Lantern', he: 'פנס' } },
  rope: { label: { en: 'Rope', he: 'חבל' } },
  compass: { label: { en: 'Compass', he: 'מצפן' } },
  pawprint: { label: { en: 'Paw Print', he: 'טביעת כף' } },
  radio: { label: { en: 'Radio', he: 'מכשיר קשר' } },
  leaf: { label: { en: 'Leaf', he: 'עלה' } },
  fish: { label: { en: 'Fish', he: 'דג' } },
  scarf: { label: { en: 'Scarf', he: 'צעיף' } },
  thermos: { label: { en: 'Thermos', he: 'תרמוס' } },
  snowflake: { label: { en: 'Snowflake', he: 'פתית שלג' } },
};

const COPY = {
  en: {
    heroEyebrow: 'Rescue Squad HQ',
    setupTitle: 'Rescue Squad Search',
    setupSubtitle: 'Choose a rescue dog, lock in the mission difficulty, and clear three cinematic search zones.',
    chooseCharacter: 'Choose your rescue dog',
    chooseDifficulty: 'Choose a difficulty',
    missionRoute: 'Mission map',
    missionBoard: 'Mission board',
    rescueDogLabel: 'Rescue dog',
    difficultyLabel: 'Difficulty',
    routeProgress: 'Route progress',
    targetsLabel: 'Targets',
    hintsLabel: 'Hints',
    timeLabel: 'Timer',
    startMission: 'Launch Mission',
    exit: 'Back',
    findLabel: 'Find',
    locationLabel: 'Location',
    progressLabel: 'Progress',
    hintButton: 'Hint',
    timerOn: 'Timer On',
    timerOff: 'Timer Off',
    hintsLeft: 'Hints left',
    stageClear: 'Location cleared!',
    finalClear: 'All rescue locations cleared!',
    timerToastOn: 'Timer is running now.',
    timerToastOff: 'Timer paused.',
    noHints: 'No hints left. Keep searching.',
    hintLead: 'Try looking',
    foundLead: 'Found',
    timeoutTitle: 'Time is up',
    timeoutSubtitle: 'Try this location again or choose a calmer difficulty.',
    retry: 'Try Again',
    nextLocation: 'Next Location',
    collectSticker: 'Collect Sticker',
    playAgain: 'Play Again',
    stageGoal: 'Mission targets',
    setupTip: 'Hints pulse the search area, and the timer can be toggled during play.',
    campaignSummary: 'Three rescue zones. One squad. Find every hidden target.',
    regionUpper: 'higher up',
    regionLower: 'near the ground',
    regionLeft: 'on the left',
    regionRight: 'on the right',
    regionMiddle: 'near the middle',
    foundEverything: 'You found every hidden target.',
  },
  he: {
    heroEyebrow: 'מפקדת כלבי החילוץ',
    setupTitle: 'חיפוש כלבי חילוץ',
    setupSubtitle: 'בחרו כלב חילוץ, קבעו דרגת קושי, וצאו לשלוש זירות חיפוש מושקעות עם מטרות נסתרות.',
    chooseCharacter: 'בחרו את כלב החילוץ',
    chooseDifficulty: 'בחרו דרגת קושי',
    missionRoute: 'מפת המשימה',
    missionBoard: 'לוח המשימה',
    rescueDogLabel: 'כלב חילוץ',
    difficultyLabel: 'דרגת קושי',
    routeProgress: 'התקדמות במסלול',
    targetsLabel: 'מטרות',
    hintsLabel: 'רמזים',
    timeLabel: 'טיימר',
    startMission: 'יוצאים למשימה',
    exit: 'חזרה',
    findLabel: 'מחפשים',
    locationLabel: 'מיקום',
    progressLabel: 'התקדמות',
    hintButton: 'רמז',
    timerOn: 'טיימר פעיל',
    timerOff: 'טיימר כבוי',
    hintsLeft: 'רמזים נשארו',
    stageClear: 'סיימתם את המיקום!',
    finalClear: 'סיימתם את כל אזורי החילוץ!',
    timerToastOn: 'הטיימר התחיל לפעול.',
    timerToastOff: 'הטיימר נעצר.',
    noHints: 'נגמרו הרמזים. ממשיכים לחפש.',
    hintLead: 'נסו לחפש',
    foundLead: 'מצאתם',
    timeoutTitle: 'הזמן נגמר',
    timeoutSubtitle: 'אפשר לנסות שוב את המיקום הזה או לבחור קושי רגוע יותר.',
    retry: 'מנסים שוב',
    nextLocation: 'למיקום הבא',
    collectSticker: 'אוספים מדבקה',
    playAgain: 'משחקים שוב',
    stageGoal: 'מטרות לאיתור',
    setupTip: 'הרמזים מסמנים את אזור החיפוש, ואפשר להדליק או לכבות את הטיימר תוך כדי משחק.',
    campaignSummary: 'שלוש זירות חילוץ. צוות אחד. מאתרים כל מטרה נסתרת.',
    regionUpper: 'למעלה יותר',
    regionLower: 'קרוב לקרקע',
    regionLeft: 'בצד שמאל',
    regionRight: 'בצד ימין',
    regionMiddle: 'באזור האמצעי',
    foundEverything: 'מצאתם את כל המטרות הנסתרות.',
  },
};
function queueTimer(timersRef, callback, delay) {
  const timer = window.setTimeout(callback, delay);
  timersRef.current.push(timer);
}

function clearTimers(timersRef) {
  timersRef.current.forEach((timer) => window.clearTimeout(timer));
  timersRef.current = [];
}

function playCollectSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const notes = [640, 820];

  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.06);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + index * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.06 + 0.17);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + index * 0.06);
    oscillator.stop(ctx.currentTime + index * 0.06 + 0.2);
  });

  window.setTimeout(() => ctx.close().catch(() => {}), 360);
}

function playWinSound() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const notes = [523, 659, 784, 988];

  notes.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + index * 0.11);
    gain.gain.linearRampToValueAtTime(0.16, ctx.currentTime + index * 0.11 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + index * 0.11 + 0.28);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + index * 0.11);
    oscillator.stop(ctx.currentTime + index * 0.11 + 0.32);
  });

  window.setTimeout(() => ctx.close().catch(() => {}), 900);
}

function getLabel(value, lang) {
  return typeof value === 'string' ? value : value?.[lang] || value?.en || '';
}

function getDifficulty(id) {
  return DIFFICULTIES.find((difficulty) => difficulty.id === id) || DIFFICULTIES[0];
}

function getCharacter(id) {
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}

function getLocation(id) {
  return LOCATIONS.find((location) => location.id === id) || LOCATIONS[0];
}

function shuffleArray(list) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createRound(locationId, difficultyId) {
  const location = getLocation(locationId);
  const difficulty = getDifficulty(difficultyId);
  const items = shuffleArray(location.items).slice(0, difficulty.itemCount);
  const slots = shuffleArray(location.slots).slice(0, difficulty.itemCount);

  return {
    locationId,
    difficultyId,
    items: items.map((itemId, index) => ({
      id: `${locationId}-${itemId}-${index}`,
      itemId,
      slot: slots[index],
    })),
  };
}

function formatTime(seconds) {
  const safeValue = Math.max(seconds, 0);
  const mins = Math.floor(safeValue / 60);
  const secs = safeValue % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getHintRegion(slot, copy) {
  const vertical = slot.y < 40 ? copy.regionUpper : slot.y > 63 ? copy.regionLower : copy.regionMiddle;
  const horizontal = slot.x < 34 ? copy.regionLeft : slot.x > 66 ? copy.regionRight : copy.regionMiddle;

  if (slot.y >= 40 && slot.y <= 63) return horizontal;
  if (slot.x >= 34 && slot.x <= 66) return vertical;

  return `${vertical} ${horizontal}`;
}

function Burst({ burst }) {
  return (
    <div className="rescuedog-burst" style={{ left: `${burst.x}%`, top: `${burst.y}%` }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <span
          key={`${burst.id}-${index}`}
          style={{
            '--angle': `${index * 45}deg`,
            '--distance': `${28 + (index % 2) * 12}px`,
          }}
        />
      ))}
      <div className="rescuedog-burst-core" />
    </div>
  );
}

function PawBadge() {
  return (
    <path d="M26 7c3 0 5 2 5 5 0 2-1 4-3 5 1 1 2 2 2 4 0 3-2 5-5 5-2 0-4-1-5-3-1 2-3 3-5 3-3 0-5-2-5-5 0-2 1-3 2-4-2-1-3-3-3-5 0-3 2-5 5-5 2 0 4 1 5 3 1-2 3-3 5-3z" />
  );
}

function ItemIcon({ type }) {
  switch (type) {
    case 'badge':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M36 6 56 15v18c0 13-8 24-20 31C24 57 16 46 16 33V15z" fill="#f2ca57" />
          <path d="M36 12 50 18v14c0 10-6 18-14 24-8-6-14-14-14-24V18z" fill="#f7e39a" />
          <g fill="#46607b">
            <PawBadge />
          </g>
        </svg>
      );
    case 'bone':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M18 24c-5 0-9 4-9 9s4 9 9 9c2 0 3 0 5-1l17 8c1 0 2 0 3 0l10-6c1-1 2-2 2-4s-1-3-2-4L43 29c-1 0-2 0-3 0L23 21c-1-1-3-1-5-1z" fill="#fff1d3" />
          <path d="M54 30c5 0 9 4 9 9s-4 9-9 9c-2 0-3 0-5-1L32 39c-1 0-2 0-3 0L19 33" stroke="#e7d2ab" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
    case 'binoculars':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M21 19h10l4 12H19zM41 19h10l4 12H37z" fill="#3f5160" />
          <circle cx="24" cy="43" r="14" fill="#5f7d96" />
          <circle cx="48" cy="43" r="14" fill="#5f7d96" />
          <circle cx="24" cy="43" r="8" fill="#d8ecff" />
          <circle cx="48" cy="43" r="8" fill="#d8ecff" />
          <rect x="28" y="29" width="16" height="8" rx="4" fill="#263644" />
        </svg>
      );
    case 'shell':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M36 16c-12 0-22 10-22 22v10h44V38c0-12-10-22-22-22z" fill="#ffb585" />
          <path d="M22 48V31M30 48V24M42 48V24M50 48V31" stroke="#ff8f5b" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'whistle':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M18 34c0-8 7-15 16-15h15c7 0 13 6 13 13 0 9-7 16-16 16H34c-9 0-16-6-16-14z" fill="#f4d45f" />
          <circle cx="47" cy="34" r="7" fill="#fff6c2" />
          <circle cx="47" cy="34" r="3.5" fill="#b88e24" />
          <path d="M20 40h-8M18 32H8" stroke="#d5ac3c" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case 'float':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <circle cx="36" cy="36" r="22" fill="#ff835c" />
          <circle cx="36" cy="36" r="11" fill="#fff7f2" />
          <path d="M36 14a22 22 0 0 1 15 6l-9 9c-2-2-4-3-6-3zM21 51a22 22 0 0 1-7-15h13c0 2 1 4 3 6z" fill="#fff0d9" />
        </svg>
      );
    case 'map':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M15 18 31 14l10 6 16-4v38l-16 4-10-6-16 4z" fill="#f4e3ad" />
          <path d="M31 14v38M41 20v38" stroke="#d5bf82" strokeWidth="3" />
          <path d="M25 43c6-8 10-14 19-17" stroke="#6ab56a" strokeWidth="4" strokeLinecap="round" />
          <circle cx="45" cy="25" r="5" fill="#ef6a52" />
        </svg>
      );
    case 'lantern':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <rect x="24" y="22" width="24" height="32" rx="8" fill="#4a5f72" />
          <rect x="29" y="28" width="14" height="18" rx="7" fill="#ffe07d" />
          <path d="M27 22c0-6 4-10 9-10s9 4 9 10" fill="none" stroke="#4a5f72" strokeWidth="4" strokeLinecap="round" />
          <rect x="30" y="54" width="12" height="5" rx="2.5" fill="#31414f" />
        </svg>
      );
    case 'rope':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <circle cx="36" cy="36" r="18" fill="none" stroke="#d9b173" strokeWidth="8" />
          <circle cx="36" cy="36" r="8" fill="none" stroke="#f0cd93" strokeWidth="6" />
          <path d="M48 48 61 61" stroke="#d9b173" strokeWidth="7" strokeLinecap="round" />
        </svg>
      );
    case 'compass':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <circle cx="36" cy="36" r="21" fill="#e8f0f4" />
          <circle cx="36" cy="36" r="16" fill="#fcffff" />
          <path d="m36 21 8 16-8 14-8-14z" fill="#ef6252" />
          <path d="m36 51-8-14 8-16 8 16z" fill="#4c6b87" />
          <circle cx="36" cy="36" r="3" fill="#243340" />
        </svg>
      );
    case 'pawprint':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <ellipse cx="36" cy="47" rx="14" ry="11" fill="#7a523c" />
          <ellipse cx="23" cy="28" rx="6" ry="8" fill="#9a6b4b" />
          <ellipse cx="33" cy="22" rx="6" ry="8" fill="#9a6b4b" />
          <ellipse cx="44" cy="22" rx="6" ry="8" fill="#9a6b4b" />
          <ellipse cx="54" cy="29" rx="6" ry="8" fill="#9a6b4b" />
        </svg>
      );
    case 'radio':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <rect x="20" y="18" width="32" height="38" rx="8" fill="#37556f" />
          <rect x="28" y="24" width="16" height="14" rx="4" fill="#bfe7ff" />
          <circle cx="31" cy="46" r="4" fill="#ffca55" />
          <circle cx="41" cy="46" r="4" fill="#ff845c" />
          <path d="M44 18V8" stroke="#22384b" strokeWidth="4" strokeLinecap="round" />
          <path d="M49 13c7 1 12 6 13 13" fill="none" stroke="#7ce9f3" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M54 18c-19 0-32 11-32 28 0 9 7 16 16 16 18 0 24-18 24-44 0 0-3 0-8 0z" fill="#63b964" />
          <path d="M20 53c8-8 15-14 25-22" stroke="#3d7a3f" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'fish':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M18 36c8-13 25-17 37-10 4 2 7 6 10 10-3 4-6 8-10 10-12 7-29 3-37-10z" fill="#4ec4de" />
          <path d="M53 26 66 18v36L53 46" fill="#3f9cb4" />
          <circle cx="31" cy="33" r="3" fill="#26333c" />
        </svg>
      );
    case 'scarf':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M18 18h36v16H18z" fill="#ed6d8a" />
          <path d="M24 34h14v24H24zM40 34h10v18H40z" fill="#f59fb3" />
          <path d="M24 47h14M40 45h10" stroke="#fff0f3" strokeWidth="3" />
        </svg>
      );
    case 'thermos':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <rect x="25" y="17" width="22" height="40" rx="8" fill="#4a86c5" />
          <rect x="29" y="11" width="14" height="10" rx="4" fill="#2f557e" />
          <rect x="30" y="27" width="12" height="18" rx="6" fill="#d9f1ff" />
        </svg>
      );
    case 'snowflake':
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <path d="M36 14v44M18 24l36 24M18 48l36-24" stroke="#f7fdff" strokeWidth="6" strokeLinecap="round" />
          <path d="M36 14l-6 6M36 14l6 6M36 58l-6-6M36 58l6-6M18 24l8 1M18 24l2 8M54 48l-8-1M54 48l-2-8M18 48l8-1M18 48l2-8M54 24l-8 1M54 24l-2 8" stroke="#d7edf7" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 72 72" role="img" aria-hidden="true">
          <circle cx="36" cy="36" r="16" fill="#ffffff" />
        </svg>
      );
  }
}

function RescuePup({ character, happy = false }) {
  const palette = character.palette;

  return (
    <svg className={`rescuedog-pup-svg ${happy ? 'rescuedog-pup-svg--happy' : ''}`} viewBox="0 0 220 200" role="img" aria-hidden="true">
      <ellipse cx="110" cy="184" rx="58" ry="12" fill="rgba(0,0,0,0.16)" />
      <path d="M58 112c-8 12-12 30-8 43 6 19 24 29 49 29h55c26 0 39-11 43-28 4-17-5-38-21-50z" fill={palette.patch} />
      <path d="M71 112c6 3 15 5 28 5h58c16 0 28-4 34-9 1 2 2 5 3 7 7 16 5 36-8 50-9 10-22 15-39 15H96c-20 0-35-7-44-20-10-14-11-32-4-48 6 1 14 1 23 0z" fill={palette.suitSoft} />
      <path d="M81 117c12 8 29 13 48 13 20 0 38-5 49-14" fill="none" stroke={palette.accent} strokeWidth="8" strokeLinecap="round" />
      <rect x="103" y="116" width="22" height="28" rx="9" fill={palette.accent} />
      <circle cx="114" cy="129" r="8" fill="#4e6077" />
      <path d="M92 60c-20 0-38 7-49 20-10 12-15 25-15 39 0 13 6 24 16 32 8 6 17 10 29 11 8 1 14-2 17-7l4-8c11 5 23 7 37 7 15 0 29-3 40-9l5 10c3 5 9 8 16 7 14-1 27-7 36-18 7-8 10-18 8-29-2-15-10-28-23-39-13-11-31-16-52-16z" fill={palette.patch} />
      <path d="M76 60c18-7 46-8 67-2 16 5 30 15 37 28 7 13 7 27-1 38-6 9-16 15-26 16l-8-14c-5 2-10 4-16 5-7 1-14 2-21 2-12 0-23-2-33-6l-7 14c-11-1-22-6-29-14-9-10-11-22-6-34 6-15 21-27 43-33z" fill={palette.fur} />
      <path d="M67 49c-8 2-16 8-20 16-3 5-4 12-1 17 2 3 5 5 9 4 5-1 8-5 10-9l9-21z" fill={palette.patch} />
      <path d="M152 45c10 1 18 6 23 13 4 6 6 13 3 19-1 3-4 5-8 5-5 1-9-3-12-7l-12-20z" fill={palette.patch} />
      <path d="M72 61c18-12 61-13 87-1l-3 15H76z" fill={palette.hat} />
      <path d="M66 63h96c3 0 5 2 5 5v7c0 3-2 5-5 5H66c-3 0-5-2-5-5v-7c0-3 2-5 5-5z" fill={palette.suit} />
      <circle cx="114" cy="68" r="14" fill="#ecf1f6" />
      <path d="M114 58l6 6-6 6-6-6z" fill="#68798f" />
      <circle cx="81" cy="94" r="12" fill="#fff7ef" />
      <circle cx="147" cy="94" r="12" fill="#fff7ef" />
      <circle cx="84" cy="96" r="5" fill="#2b2d39" />
      <circle cx="144" cy="96" r="5" fill="#2b2d39" />
      <circle cx="86" cy="94" r="2" fill="#fff" />
      <circle cx="146" cy="94" r="2" fill="#fff" />
      <ellipse cx="114" cy="110" rx="24" ry="19" fill={palette.muzzle} />
      <path d="M106 115c5 5 17 5 22 0" fill="none" stroke="#6d341f" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx="114" cy="105" rx="9" ry="7" fill="#34201b" />
      <path d="M61 147c-12 6-17 20-13 35h20c4-12 8-23 17-31z" fill={palette.patch} />
      <path d="M152 151c9 8 14 18 18 31h21c4-15-4-30-18-36z" fill={palette.patch} />
      <path d="M164 121c14 0 28 8 34 22 3 8 3 17 0 24" fill="none" stroke={palette.patch} strokeWidth="10" strokeLinecap="round" />
      <path d="M184 168c7 7 12 8 17 4" fill="none" stroke={palette.fur} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function SceneDecor({ locationId }) {
  if (locationId === 'harbor') {
    return (
      <>
        <div className="rescuedog-sun rescuedog-sun--harbor" aria-hidden="true" />
        <div className="rescuedog-cloud rescuedog-cloud--one" aria-hidden="true" />
        <div className="rescuedog-cloud rescuedog-cloud--two" aria-hidden="true" />
        <div className="rescuedog-water" aria-hidden="true" />
        <div className="rescuedog-dock" aria-hidden="true" />
        <div className="rescuedog-lighthouse" aria-hidden="true" />
        <div className="rescuedog-boat rescuedog-boat--one" aria-hidden="true" />
        <div className="rescuedog-boat rescuedog-boat--two" aria-hidden="true" />
      </>
    );
  }

  if (locationId === 'jungle') {
    return (
      <>
        <div className="rescuedog-sun rescuedog-sun--jungle" aria-hidden="true" />
        <div className="rescuedog-canopy rescuedog-canopy--left" aria-hidden="true" />
        <div className="rescuedog-canopy rescuedog-canopy--right" aria-hidden="true" />
        <div className="rescuedog-vines rescuedog-vines--left" aria-hidden="true" />
        <div className="rescuedog-vines rescuedog-vines--right" aria-hidden="true" />
        <div className="rescuedog-waterfall" aria-hidden="true" />
        <div className="rescuedog-jungle-rock rescuedog-jungle-rock--one" aria-hidden="true" />
        <div className="rescuedog-jungle-rock rescuedog-jungle-rock--two" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      <div className="rescuedog-sun rescuedog-sun--snow" aria-hidden="true" />
      <div className="rescuedog-aurora" aria-hidden="true" />
      <div className="rescuedog-mountains" aria-hidden="true" />
      <div className="rescuedog-cabin rescuedog-cabin--left" aria-hidden="true" />
      <div className="rescuedog-cabin rescuedog-cabin--right" aria-hidden="true" />
      <div className="rescuedog-ice-lake" aria-hidden="true" />
      <div className="rescuedog-snowdrift rescuedog-snowdrift--one" aria-hidden="true" />
      <div className="rescuedog-snowdrift rescuedog-snowdrift--two" aria-hidden="true" />
    </>
  );
}

function SetupCard({ character, active, lang, onClick }) {
  return (
    <button type="button" className={`rescuedog-choice-card ${active ? 'is-active' : ''}`} onClick={onClick}>
      <span className="rescuedog-choice-badge">{getLabel(character.badge, lang)}</span>
      <div className="rescuedog-choice-pup">
        <RescuePup character={character} />
      </div>
      <strong>{getLabel(character.name, lang)}</strong>
      <span>{getLabel(character.role, lang)}</span>
    </button>
  );
}

function DifficultyOption({ entry, active, lang, copy, onClick }) {
  return (
    <button
      type="button"
      className={`rescuedog-difficulty-card ${active ? 'is-active' : ''}`}
      onClick={onClick}
    >
      <strong>{getLabel(entry.label, lang)}</strong>
      <span>{getLabel(entry.summary, lang)}</span>
      <div className="rescuedog-difficulty-metrics">
        <span>{entry.itemCount} {copy.targetsLabel}</span>
        <span>{entry.hints} {copy.hintsLabel}</span>
        <span>{formatTime(entry.timeLimit)}</span>
      </div>
    </button>
  );
}

function RouteTracker({ stageIndex, lang, copy }) {
  return (
    <div className="rescuedog-route-tracker">
      <strong>{copy.routeProgress}</strong>
      <div className="rescuedog-route-steps">
        {LOCATIONS.map((location, index) => {
          const state = index < stageIndex ? 'is-complete' : index === stageIndex ? 'is-current' : '';
          return (
            <div key={location.id} className={`rescuedog-route-step ${state}`}>
              <span className="rescuedog-route-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="rescuedog-route-name">{getLabel(location.name, lang)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RescueDog({ onSuccess, onExit }) {
  const { lang, dir } = useLanguage();
  const copy = COPY[lang] || COPY.en;
  const timersRef = useRef([]);
  const intervalRef = useRef(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState(CHARACTERS[0].id);
  const [difficultyId, setDifficultyId] = useState(DIFFICULTIES[0].id);
  const [screen, setScreen] = useState('setup');
  const [stageIndex, setStageIndex] = useState(0);
  const [round, setRound] = useState(null);
  const [foundIds, setFoundIds] = useState([]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getDifficulty(DIFFICULTIES[0].id).timeLimit);
  const [hintsLeft, setHintsLeft] = useState(getDifficulty(DIFFICULTIES[0].id).hints);
  const [toast, setToast] = useState(copy.setupTip);
  const [highlightId, setHighlightId] = useState('');
  const [bursts, setBursts] = useState([]);

  const difficulty = getDifficulty(difficultyId);
  const character = getCharacter(selectedCharacterId);
  const progressTotal = round?.items.length || difficulty.itemCount;
  const progressCount = foundIds.length;

  useEffect(() => {
    if (screen === 'setup') {
      setToast(copy.setupTip);
    }
  }, [copy.setupTip, screen]);

  useEffect(() => () => {
    clearTimers(timersRef);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (screen !== 'playing' || !timerEnabled) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return undefined;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(intervalRef.current);
          intervalRef.current = null;
          setScreen('timeout');
          setToast(copy.timeoutTitle);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [copy.timeoutTitle, screen, timerEnabled]);

  useEffect(() => {
    if (!round || screen !== 'playing') return;
    const locationName = getLabel(getLocation(round.locationId).name, lang);
    speak(`${copy.findLabel} ${locationName}`, lang);
  }, [copy.findLabel, lang, round, screen]);

  useEffect(() => {
    if (screen === 'timeout') {
      speak(copy.timeoutTitle, lang);
    }
    if (screen === 'location-complete') {
      speak(copy.stageClear, lang);
    }
    if (screen === 'campaign-complete') {
      speak(copy.finalClear, lang);
      playWinSound();
    }
  }, [copy.finalClear, copy.stageClear, copy.timeoutTitle, lang, screen]);

  function beginStage(nextStageIndex) {
    clearTimers(timersRef);
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const nextDifficulty = getDifficulty(difficultyId);
    const nextLocation = LOCATIONS[nextStageIndex];
    setStageIndex(nextStageIndex);
    setRound(createRound(nextLocation.id, nextDifficulty.id));
    setFoundIds([]);
    setHintsLeft(nextDifficulty.hints);
    setTimeLeft(nextDifficulty.timeLimit);
    setTimerEnabled(nextDifficulty.defaultTimer);
    setHighlightId('');
    setBursts([]);
    setToast(`${getLabel(nextLocation.name, lang)}. ${getLabel(nextLocation.description, lang)}`);
    setScreen('playing');
  }

  function startMission() {
    beginStage(0);
  }

  function handleRetry() {
    beginStage(stageIndex);
  }

  function handleNextStage() {
    if (stageIndex >= LOCATIONS.length - 1) {
      setScreen('campaign-complete');
      setToast(copy.foundEverything);
      return;
    }

    beginStage(stageIndex + 1);
  }

  function handleTimerToggle() {
    if (screen !== 'playing') return;
    const nextValue = !timerEnabled;
    setTimerEnabled(nextValue);
    setToast(nextValue ? copy.timerToastOn : copy.timerToastOff);
  }

  function handleHint() {
    if (screen !== 'playing' || !round) return;
    if (hintsLeft <= 0) {
      setToast(copy.noHints);
      return;
    }

    const remaining = round.items.filter((item) => !foundIds.includes(item.id));
    const target = remaining[Math.floor(Math.random() * remaining.length)];
    if (!target) return;

    setHintsLeft((current) => Math.max(current - 1, 0));
    setHighlightId(target.id);
    setToast(`${copy.hintLead} ${getHintRegion(target.slot, copy)}.`);
    queueTimer(timersRef, () => setHighlightId(''), 1800);
  }

  function handleItemTap(item) {
    if (screen !== 'playing' || foundIds.includes(item.id) || !round) return;

    playCollectSound();
    const nextFoundIds = [...foundIds, item.id];
    const itemLabel = getLabel(ITEM_LIBRARY[item.itemId].label, lang);
    const nextBurst = {
      id: `${item.id}-${Date.now()}`,
      x: item.slot.x,
      y: item.slot.y,
    };

    setFoundIds(nextFoundIds);
    setHighlightId('');
    setBursts((current) => [...current, nextBurst]);
    setToast(`${copy.foundLead} ${itemLabel}`);

    queueTimer(timersRef, () => {
      setBursts((current) => current.filter((burst) => burst.id !== nextBurst.id));
    }, 700);

    if (nextFoundIds.length === round.items.length) {
      if (stageIndex === LOCATIONS.length - 1) {
        setScreen('campaign-complete');
        setToast(copy.finalClear);
      } else {
        setScreen('location-complete');
        setToast(copy.stageClear);
      }
    }
  }

  function renderSetup() {
    return (
      <div className="rescuedog-setup">
        <button type="button" className="rescuedog-exit" onClick={onExit}>
          {copy.exit}
        </button>

        <section className="rescuedog-briefing-shell">
          <div className="rescuedog-briefing-copy">
            <span className="rescuedog-eyebrow">{copy.heroEyebrow}</span>
            <h1>{copy.setupTitle}</h1>
            <p>{copy.setupSubtitle}</p>
            <div className="rescuedog-briefing-stats">
              <div className="rescuedog-briefing-stat">
                <label>{copy.rescueDogLabel}</label>
                <strong>{getLabel(character.name, lang)}</strong>
              </div>
              <div className="rescuedog-briefing-stat">
                <label>{copy.difficultyLabel}</label>
                <strong>{getLabel(difficulty.label, lang)}</strong>
              </div>
              <div className="rescuedog-briefing-stat">
                <label>{copy.routeProgress}</label>
                <strong>{LOCATIONS.length}</strong>
              </div>
            </div>
            <div className="rescuedog-briefing-note">
              <strong>{copy.campaignSummary}</strong>
              <span>{copy.setupTip}</span>
            </div>
            <div className="rescuedog-setup-actions">
              <button type="button" className="rescuedog-primary-btn" onClick={startMission}>
                {copy.startMission}
              </button>
              <span className="rescuedog-start-note">{getLabel(character.role, lang)}</span>
            </div>
          </div>
          <div className="rescuedog-briefing-preview">
            <div className="rescuedog-briefing-head">
              <span className="rescuedog-console-kicker">{copy.missionRoute}</span>
              <strong>{getLabel(character.name, lang)}</strong>
              <span>{getLabel(character.badge, lang)}</span>
            </div>
            <div className="rescuedog-briefing-pup">
              <RescuePup character={character} happy />
            </div>
            <div className="rescuedog-briefing-route">
              {LOCATIONS.map((location, index) => (
                <div
                  key={location.id}
                  className={`rescuedog-route-preview rescuedog-route-preview--${location.id}`}
                >
                  <span className="rescuedog-route-preview-index">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{getLabel(location.name, lang)}</strong>
                    <span>{getLabel(location.description, lang)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rescuedog-briefing-stats rescuedog-briefing-stats--preview">
              <div className="rescuedog-briefing-stat rescuedog-briefing-stat--preview">
                <label>{copy.targetsLabel}</label>
                <strong>{difficulty.itemCount}</strong>
              </div>
              <div className="rescuedog-briefing-stat rescuedog-briefing-stat--preview">
                <label>{copy.hintsLabel}</label>
                <strong>{difficulty.hints}</strong>
              </div>
              <div className="rescuedog-briefing-stat rescuedog-briefing-stat--preview">
                <label>{copy.timeLabel}</label>
                <strong>{formatTime(difficulty.timeLimit)}</strong>
              </div>
            </div>
            <div className="rescuedog-preview-stack">
              {LOCATIONS.map((location) => (
                <div
                  key={location.id}
                  className={`rescuedog-preview-card rescuedog-preview-card--${location.id}`}
                >
                  <span>{getLabel(location.name, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rescuedog-setup-grid">
          <section className="rescuedog-panel rescuedog-panel--wide">
            <header className="rescuedog-panel-header">
              <h2>{copy.chooseCharacter}</h2>
            </header>
            <div className="rescuedog-choice-grid">
              {CHARACTERS.map((entry) => (
                <SetupCard
                  key={entry.id}
                  character={entry}
                  active={entry.id === selectedCharacterId}
                  lang={lang}
                  onClick={() => setSelectedCharacterId(entry.id)}
                />
              ))}
            </div>
          </section>

          <section className="rescuedog-panel">
            <header className="rescuedog-panel-header">
              <h2>{copy.chooseDifficulty}</h2>
            </header>
            <div className="rescuedog-difficulty-grid">
              {DIFFICULTIES.map((entry) => (
                <DifficultyOption
                  key={entry.id}
                  entry={entry}
                  active={entry.id === difficultyId}
                  lang={lang}
                  copy={copy}
                  onClick={() => setDifficultyId(entry.id)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  function renderOverlay() {
    if (screen === 'playing' || screen === 'setup') return null;

    const campaignComplete = screen === 'campaign-complete';
    const locationComplete = screen === 'location-complete';
    const overlayTitle = campaignComplete ? copy.finalClear : locationComplete ? copy.stageClear : copy.timeoutTitle;
    const overlayBody = campaignComplete ? copy.foundEverything : locationComplete ? copy.foundEverything : copy.timeoutSubtitle;

    return (
      <div className="rescuedog-overlay">
        <div className="rescuedog-overlay-card">
          <div className="rescuedog-overlay-pup">
            <RescuePup character={character} happy />
          </div>
          <h2>{overlayTitle}</h2>
          <p>{overlayBody}</p>
          <div className="rescuedog-overlay-actions">
            {screen === 'timeout' && (
              <button type="button" className="rescuedog-primary-btn" onClick={handleRetry}>
                {copy.retry}
              </button>
            )}
            {screen === 'location-complete' && (
              <button type="button" className="rescuedog-primary-btn" onClick={handleNextStage}>
                {copy.nextLocation}
              </button>
            )}
            {campaignComplete && (
              <button type="button" className="rescuedog-primary-btn" onClick={onSuccess}>
                {copy.collectSticker}
              </button>
            )}
            <button
              type="button"
              className="rescuedog-secondary-btn"
              onClick={campaignComplete ? startMission : onExit}
            >
              {campaignComplete ? copy.playAgain : copy.exit}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderPlayfield() {
    if (!round) return null;

    const location = getLocation(round.locationId);
    const nextTarget = round.items.find((item) => !foundIds.includes(item.id)) || round.items[round.items.length - 1];
    const nextTargetLabel = nextTarget ? getLabel(ITEM_LIBRARY[nextTarget.itemId].label, lang) : '';

    return (
      <div className="rescuedog-play">
        <button type="button" className="rescuedog-exit" onClick={onExit}>
          {copy.exit}
        </button>

        <div className="rescuedog-play-layout">
          <div className="rescuedog-board-shell">
            <header className="rescuedog-board-top">
              <div className="rescuedog-title-wrap">
                <div className="rescuedog-title-meta">
                  <div className="rescuedog-stage-pill">
                    {copy.locationLabel}: {getLabel(location.name, lang)}
                  </div>
                  <div className="rescuedog-stage-pill rescuedog-stage-pill--accent">
                    {getLabel(character.name, lang)} / {getLabel(character.badge, lang)}
                  </div>
                </div>
                <h1>{copy.setupTitle}</h1>
                <p>{getLabel(location.description, lang)}</p>
              </div>

              <div className="rescuedog-find-panel">
                <span className="rescuedog-find-kicker">{copy.findLabel}</span>
                <div className="rescuedog-find-target">
                  <span className="rescuedog-find-icon">
                    {nextTarget && <ItemIcon type={nextTarget.itemId} />}
                  </span>
                  <div className="rescuedog-find-copy">
                    <strong>{nextTargetLabel}</strong>
                    <span>{copy.stageGoal}</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="rescuedog-goalbar">
              <div className="rescuedog-goalbar-head">
                <strong>{copy.stageGoal}</strong>
                <span>{progressCount} / {progressTotal}</span>
              </div>
              <div className="rescuedog-goal-list">
                {round.items.map((item) => {
                  const found = foundIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`rescuedog-goal-chip ${found ? 'is-found' : ''} ${nextTarget?.id === item.id ? 'is-current' : ''}`}
                    >
                      <span className="rescuedog-goal-icon">
                        <ItemIcon type={item.itemId} />
                      </span>
                      <span>{getLabel(ITEM_LIBRARY[item.itemId].label, lang)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rescuedog-toast">{toast}</div>

            <div className={`rescuedog-playfield rescuedog-playfield--${location.id}`}>
              <div className="rescuedog-playfield-scan" aria-hidden="true" />
              <div className="rescuedog-playfield-vignette" aria-hidden="true" />
              <div className="rescuedog-playfield-label" aria-hidden="true">{getLabel(location.name, lang)}</div>
              <SceneDecor locationId={location.id} />

              {round.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`rescuedog-hidden-item ${foundIds.includes(item.id) ? 'is-found' : ''} ${highlightId === item.id ? 'is-highlighted' : ''}`}
                  style={{
                    left: `${item.slot.x}%`,
                    top: `${item.slot.y}%`,
                    '--item-scale': item.slot.scale * difficulty.scaleBoost,
                    '--item-rotate': `${item.slot.rotate}deg`,
                  }}
                  onClick={() => handleItemTap(item)}
                  aria-label={getLabel(ITEM_LIBRARY[item.itemId].label, lang)}
                  disabled={foundIds.includes(item.id)}
                >
                  <ItemIcon type={item.itemId} />
                </button>
              ))}

              {bursts.map((burst) => (
                <Burst key={burst.id} burst={burst} />
              ))}
            </div>
          </div>

          <aside className="rescuedog-sidepanel">
            <RouteTracker stageIndex={stageIndex} lang={lang} copy={copy} />

            <div className="rescuedog-status-grid">
              <div className="rescuedog-score-pill">
                <strong>{copy.progressLabel}</strong>
                <span>{progressCount} / {progressTotal}</span>
              </div>
              <div className="rescuedog-score-pill">
                <strong>{copy.hintsLeft}</strong>
                <span>{hintsLeft}</span>
              </div>
              <button type="button" className="rescuedog-control-pill" onClick={handleTimerToggle}>
                <strong>{timerEnabled ? copy.timerOn : copy.timerOff}</strong>
                <span>{formatTime(timeLeft)}</span>
              </button>
              <button type="button" className="rescuedog-control-pill rescuedog-control-pill--hint" onClick={handleHint}>
                <strong>{copy.hintButton}</strong>
                <span>{hintsLeft}</span>
              </button>
            </div>

            <div className="rescuedog-partner-card">
              <div className="rescuedog-partner-pup">
                <RescuePup character={character} happy={screen !== 'playing'} />
              </div>
              <strong>{getLabel(character.name, lang)}</strong>
              <span className="rescuedog-partner-badge">{getLabel(character.badge, lang)}</span>
              <span>{getLabel(character.role, lang)}</span>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rescuedog-root"
      dir={dir}
      style={{
        '--rescuedog-accent': character.palette.suit,
        '--rescuedog-accent-soft': character.palette.suitSoft,
        '--rescuedog-highlight': character.palette.accent,
        '--rescuedog-deep': character.palette.hat,
        '--rescuedog-fur': character.palette.fur,
      }}
    >
      <div className="rescuedog-scene">
        {screen === 'setup' ? renderSetup() : renderPlayfield()}
        {renderOverlay()}
      </div>
    </div>
  );
}


