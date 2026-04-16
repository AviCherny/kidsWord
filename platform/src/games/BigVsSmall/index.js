import React, { useState, useEffect, useRef, useCallback } from 'react';
import './BigVsSmall.css';
import { useLanguage } from '../../context/LanguageContext';
import { t } from '../../i18n/translations';
import { speak } from '../../speak';
import StarBar from '../../components/StarBar';
import { getGameDifficulty, saveGameDifficulty } from '../../lib/settings';

const ROUNDS_PER_LEVEL = 5;
const GAME_ID = 'bigvssmall';

const makeItem = (emoji, name, heName) => ({ emoji, name, heName });
const makeRound = (big, ...others) => ({ big, others });

const EASY_PAIRS = [
  [makeItem('🐘', 'Elephant', 'פיל'), makeItem('🐭', 'Mouse', 'עכבר')],
  [makeItem('🦒', 'Giraffe', "ג'ירף"), makeItem('🐹', 'Hamster', 'אוגר')],
  [makeItem('🐻', 'Bear', 'דוב'), makeItem('🐝', 'Bee', 'דבורה')],
  [makeItem('🐄', 'Cow', 'פרה'), makeItem('🐸', 'Frog', 'צפרדע')],
  [makeItem('🦁', 'Lion', 'אריה'), makeItem('🐜', 'Ant', 'נמלה')],
  [makeItem('🐊', 'Crocodile', 'תנין'), makeItem('🦋', 'Butterfly', 'פרפר')],
  [makeItem('🦛', 'Hippo', 'היפופוטם'), makeItem('🐞', 'Ladybug', 'פרת משה רבנו')],
  [makeItem('🏠', 'House', 'בית'), makeItem('🍎', 'Apple', 'תפוח')],
  [makeItem('🚌', 'Bus', 'אוטובוס'), makeItem('🐝', 'Bee', 'דבורה')],
  [makeItem('🌳', 'Tree', 'עץ'), makeItem('🍄', 'Mushroom', 'פטריה')],
  [makeItem('🐋', 'Whale', 'לווייתן'), makeItem('🐟', 'Fish', 'דג')],
  [makeItem('✈️', 'Plane', 'מטוס'), makeItem('🐦', 'Bird', 'ציפור')],
  [makeItem('🚢', 'Ship', 'אנייה'), makeItem('🛶', 'Canoe', 'קאנו')],
  [makeItem('🏔️', 'Mountain', 'הר'), makeItem('🌼', 'Daisy', 'חרצית')],
  [makeItem('🏟️', 'Stadium', 'אצטדיון'), makeItem('📦', 'Box', 'קופסה')],
  [makeItem('🌋', 'Volcano', 'הר געש'), makeItem('🌱', 'Seedling', 'שתיל')],
  [makeItem('🚒', 'Fire Truck', 'כבאית'), makeItem('🛴', 'Scooter', 'קורקינט')],
  [makeItem('🚂', 'Train', 'רכבת'), makeItem('🪀', 'Yo-yo', 'יו-יו')],
  [makeItem('🏰', 'Castle', 'טירה'), makeItem('🧸', 'Teddy Bear', 'דובי')],
  [makeItem('🦣', 'Mammoth', 'מאמות'), makeItem('🐛', 'Caterpillar', 'זחל')],
];

const MEDIUM_ROUNDS = [
  makeRound(makeItem('🐘', 'Elephant', 'פיל'), makeItem('🐕', 'Dog', 'כלב'), makeItem('🐝', 'Bee', 'דבורה')),
  makeRound(makeItem('🦏', 'Rhino', 'קרנף'), makeItem('🐰', 'Rabbit', 'ארנב'), makeItem('🐞', 'Ladybug', 'פרת משה רבנו')),
  makeRound(makeItem('🦛', 'Hippo', 'היפופוטם'), makeItem('🦊', 'Fox', 'שועל'), makeItem('🐌', 'Snail', 'חילזון')),
  makeRound(makeItem('🐊', 'Crocodile', 'תנין'), makeItem('🐿️', 'Squirrel', 'סנאי'), makeItem('🪱', 'Worm', 'תולעת')),
  makeRound(makeItem('🦓', 'Zebra', 'זברה'), makeItem('🐱', 'Cat', 'חתול'), makeItem('🐭', 'Mouse', 'עכבר')),
  makeRound(makeItem('🐻', 'Bear', 'דוב'), makeItem('🐹', 'Hamster', 'אוגר'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🦒', 'Giraffe', "ג'ירף"), makeItem('🐸', 'Frog', 'צפרדע'), makeItem('🦋', 'Butterfly', 'פרפר')),
  makeRound(makeItem('🚌', 'Bus', 'אוטובוס'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🌳', 'Tree', 'עץ'), makeItem('🌸', 'Flower', 'פרח'), makeItem('🌱', 'Seedling', 'שתיל')),
  makeRound(makeItem('🏠', 'House', 'בית'), makeItem('📚', 'Book', 'ספר'), makeItem('🍎', 'Apple', 'תפוח')),
  makeRound(makeItem('🐋', 'Whale', 'לווייתן'), makeItem('🐠', 'Fish', 'דג קטן'), makeItem('🦐', 'Shrimp', 'שרימפס')),
  makeRound(makeItem('✈️', 'Plane', 'מטוס'), makeItem('🚗', 'Car', 'מכונית'), makeItem('🐦', 'Bird', 'ציפור')),
  makeRound(makeItem('🚢', 'Ship', 'אנייה'), makeItem('🚤', 'Boat', 'סירה'), makeItem('🐟', 'Fish', 'דג')),
  makeRound(makeItem('🏔️', 'Mountain', 'הר'), makeItem('🏡', 'Cottage', 'קוטג׳'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🏟️', 'Stadium', 'אצטדיון'), makeItem('🎪', 'Tent', 'אוהל'), makeItem('📦', 'Box', 'קופסה')),
  makeRound(makeItem('🌋', 'Volcano', 'הר געש'), makeItem('⛰️', 'Hill', 'גבעה'), makeItem('🌵', 'Cactus', 'קקטוס')),
  makeRound(makeItem('🚒', 'Fire Truck', 'כבאית'), makeItem('🛴', 'Scooter', 'קורקינט'), makeItem('⚽', 'Ball', 'כדור')),
  makeRound(makeItem('🚂', 'Train', 'רכבת'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🪀', 'Yo-yo', 'יו-יו')),
  makeRound(makeItem('🏰', 'Castle', 'טירה'), makeItem('🪑', 'Chair', 'כיסא'), makeItem('🧸', 'Teddy Bear', 'דובי')),
  makeRound(makeItem('🦣', 'Mammoth', 'מאמות'), makeItem('🐺', 'Wolf', 'זאב'), makeItem('🐛', 'Caterpillar', 'זחל')),
];

const HARD_ROUNDS = [
  makeRound(makeItem('🐘', 'Elephant', 'פיל'), makeItem('🦁', 'Lion', 'אריה'), makeItem('🐱', 'Cat', 'חתול'), makeItem('🐭', 'Mouse', 'עכבר')),
  makeRound(makeItem('🦒', 'Giraffe', "ג'ירף"), makeItem('🐕', 'Dog', 'כלב'), makeItem('🐇', 'Rabbit', 'ארנב'), makeItem('🐝', 'Bee', 'דבורה')),
  makeRound(makeItem('🦛', 'Hippo', 'היפופוטם'), makeItem('🐺', 'Wolf', 'זאב'), makeItem('🐹', 'Hamster', 'אוגר'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🐻', 'Bear', 'דוב'), makeItem('🦊', 'Fox', 'שועל'), makeItem('🐸', 'Frog', 'צפרדע'), makeItem('🐌', 'Snail', 'חילזון')),
  makeRound(makeItem('🦏', 'Rhino', 'קרנף'), makeItem('🦌', 'Deer', 'אייל'), makeItem('🐿️', 'Squirrel', 'סנאי'), makeItem('🐞', 'Ladybug', 'פרת משה רבנו')),
  makeRound(makeItem('🐊', 'Crocodile', 'תנין'), makeItem('🦔', 'Hedgehog', 'קיפוד'), makeItem('🐰', 'Rabbit', 'ארנב'), makeItem('🦋', 'Butterfly', 'פרפר')),
  makeRound(makeItem('🦓', 'Zebra', 'זברה'), makeItem('🐱', 'Cat', 'חתול'), makeItem('🐹', 'Hamster', 'אוגר'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🚌', 'Bus', 'אוטובוס'), makeItem('🚗', 'Car', 'מכונית'), makeItem('🛴', 'Scooter', 'קורקינט'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🌳', 'Tree', 'עץ'), makeItem('🌵', 'Cactus', 'קקטוס'), makeItem('🌸', 'Flower', 'פרח'), makeItem('🌱', 'Seedling', 'שתיל')),
  makeRound(makeItem('🏠', 'House', 'בית'), makeItem('🪑', 'Chair', 'כיסא'), makeItem('📚', 'Book', 'ספר'), makeItem('🍎', 'Apple', 'תפוח')),
  makeRound(makeItem('🐋', 'Whale', 'לווייתן'), makeItem('🐬', 'Dolphin', 'דולפין'), makeItem('🐟', 'Fish', 'דג'), makeItem('🦐', 'Shrimp', 'שרימפס')),
  makeRound(makeItem('✈️', 'Plane', 'מטוס'), makeItem('🚗', 'Car', 'מכונית'), makeItem('🐦', 'Bird', 'ציפור'), makeItem('🪰', 'Fly', 'זבוב')),
  makeRound(makeItem('🚢', 'Ship', 'אנייה'), makeItem('🚤', 'Boat', 'סירה'), makeItem('🏊', 'Swimmer', 'שחיין'), makeItem('🐟', 'Fish', 'דג')),
  makeRound(makeItem('🏔️', 'Mountain', 'הר'), makeItem('🏠', 'House', 'בית'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🏟️', 'Stadium', 'אצטדיון'), makeItem('🏠', 'House', 'בית'), makeItem('🎪', 'Tent', 'אוהל'), makeItem('📦', 'Box', 'קופסה')),
  makeRound(makeItem('🌋', 'Volcano', 'הר געש'), makeItem('⛰️', 'Hill', 'גבעה'), makeItem('🌵', 'Cactus', 'קקטוס'), makeItem('🌱', 'Seedling', 'שתיל')),
  makeRound(makeItem('🚒', 'Fire Truck', 'כבאית'), makeItem('🚙', 'Jeep', 'ג׳יפ'), makeItem('🛴', 'Scooter', 'קורקינט'), makeItem('⚽', 'Ball', 'כדור')),
  makeRound(makeItem('🚂', 'Train', 'רכבת'), makeItem('🚗', 'Car', 'מכונית'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🪀', 'Yo-yo', 'יו-יו')),
  makeRound(makeItem('🏰', 'Castle', 'טירה'), makeItem('🏡', 'Cottage', 'קוטג׳'), makeItem('🪑', 'Chair', 'כיסא'), makeItem('🧸', 'Teddy Bear', 'דובי')),
  makeRound(makeItem('🦣', 'Mammoth', 'מאמות'), makeItem('🐺', 'Wolf', 'זאב'), makeItem('🐇', 'Rabbit', 'ארנב'), makeItem('🐛', 'Caterpillar', 'זחל')),
];

const EXPERT_ROUNDS = [
  makeRound(makeItem('🚌', 'Bus', 'אוטובוס'), makeItem('🚗', 'Car', 'מכונית'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🌳', 'Tree', 'עץ'), makeItem('🍄', 'Mushroom', 'פטריה'), makeItem('🌸', 'Flower', 'פרח'), makeItem('🌱', 'Seedling', 'שתיל')),
  makeRound(makeItem('🏠', 'House', 'בית'), makeItem('🪑', 'Chair', 'כיסא'), makeItem('📚', 'Book', 'ספר'), makeItem('🍎', 'Apple', 'תפוח')),
  makeRound(makeItem('🐋', 'Whale', 'לווייתן'), makeItem('🐕', 'Dog', 'כלב'), makeItem('🐭', 'Mouse', 'עכבר'), makeItem('🐝', 'Bee', 'דבורה')),
  makeRound(makeItem('🏔️', 'Mountain', 'הר'), makeItem('🏠', 'House', 'בית'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('✈️', 'Plane', 'מטוס'), makeItem('🚗', 'Car', 'מכונית'), makeItem('🐦', 'Bird', 'ציפור'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🚢', 'Ship', 'אנייה'), makeItem('🚤', 'Boat', 'סירה'), makeItem('🏊', 'Swimmer', 'שחיין'), makeItem('🐟', 'Fish', 'דג')),
  makeRound(makeItem('🦣', 'Mammoth', 'מאמות'), makeItem('🐺', 'Wolf', 'זאב'), makeItem('🐇', 'Rabbit', 'ארנב'), makeItem('🐛', 'Caterpillar', 'זחל')),
  makeRound(makeItem('🏟️', 'Stadium', 'אצטדיון'), makeItem('🏠', 'House', 'בית'), makeItem('🎪', 'Tent', 'אוהל'), makeItem('📦', 'Box', 'קופסה')),
  makeRound(makeItem('🌋', 'Volcano', 'הר געש'), makeItem('⛰️', 'Hill', 'גבעה'), makeItem('🌵', 'Cactus', 'קקטוס'), makeItem('🌱', 'Seedling', 'שתיל')),
  makeRound(makeItem('🚒', 'Fire Truck', 'כבאית'), makeItem('🚕', 'Taxi', 'מונית'), makeItem('🛴', 'Scooter', 'קורקינט'), makeItem('⚽', 'Ball', 'כדור')),
  makeRound(makeItem('🚂', 'Train', 'רכבת'), makeItem('🚲', 'Bike', 'אופניים'), makeItem('🛼', 'Skates', 'גלגיליות'), makeItem('🪀', 'Yo-yo', 'יו-יו')),
  makeRound(makeItem('🏰', 'Castle', 'טירה'), makeItem('🏡', 'Cottage', 'קוטג׳'), makeItem('🧸', 'Teddy Bear', 'דובי'), makeItem('📦', 'Box', 'קופסה')),
  makeRound(makeItem('🐘', 'Elephant', 'פיל'), makeItem('🐎', 'Horse', 'סוס'), makeItem('🐈', 'Cat', 'חתול'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🦒', 'Giraffe', "ג'ירף"), makeItem('🦌', 'Deer', 'אייל'), makeItem('🐿️', 'Squirrel', 'סנאי'), makeItem('🐝', 'Bee', 'דבורה')),
  makeRound(makeItem('🦛', 'Hippo', 'היפופוטם'), makeItem('🐕', 'Dog', 'כלב'), makeItem('🐇', 'Rabbit', 'ארנב'), makeItem('🐞', 'Ladybug', 'פרת משה רבנו')),
  makeRound(makeItem('🐊', 'Crocodile', 'תנין'), makeItem('🦎', 'Lizard', 'לטאה'), makeItem('🐸', 'Frog', 'צפרדע'), makeItem('🪱', 'Worm', 'תולעת')),
  makeRound(makeItem('🦏', 'Rhino', 'קרנף'), makeItem('🐄', 'Cow', 'פרה'), makeItem('🐈', 'Cat', 'חתול'), makeItem('🐜', 'Ant', 'נמלה')),
  makeRound(makeItem('🌲', 'Pine Tree', 'עץ אורן'), makeItem('🌿', 'Herb', 'עשב'), makeItem('🍀', 'Clover', 'תלתן'), makeItem('🌱', 'Seedling', 'שתיל')),
  makeRound(makeItem('🏢', 'Building', 'בניין'), makeItem('🚪', 'Door', 'דלת'), makeItem('📘', 'Notebook', 'מחברת'), makeItem('🔑', 'Key', 'מפתח')),
];

const LEVEL_POOLS = [
  {
    label: { he: 'קל', en: 'Easy' },
    rounds: EASY_PAIRS.map(([big, small]) => makeRound(big, small)),
  },
  { label: { he: 'בינוני', en: 'Medium' }, rounds: MEDIUM_ROUNDS },
  { label: { he: 'קשה', en: 'Hard' }, rounds: HARD_ROUNDS },
  { label: { he: 'מאתגר', en: 'Expert' }, rounds: EXPERT_ROUNDS },
];

const DIFFICULTY_PATHS = {
  1: [0, 1, 2, 3],
  2: [0, 2, 2, 3],
  3: [1, 2, 2, 3],
  4: [1, 2, 3, 3],
};

const CARD_PALETTES = [
  { bg: 'linear-gradient(180deg, #ffffff 0%, #fff8ef 100%)', border: '#ffd39d', shadow: 'rgba(255, 152, 61, 0.18)' },
  { bg: 'linear-gradient(180deg, #ffffff 0%, #f6fbff 100%)', border: '#b7dbff', shadow: 'rgba(74, 144, 226, 0.18)' },
  { bg: 'linear-gradient(180deg, #ffffff 0%, #f5fff5 100%)', border: '#bde6b3', shadow: 'rgba(90, 178, 92, 0.18)' },
  { bg: 'linear-gradient(180deg, #ffffff 0%, #fff7fb 100%)', border: '#f3c1da', shadow: 'rgba(225, 110, 160, 0.18)' },
];

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function sampleRounds(pool) {
  return shuffle(pool).slice(0, ROUNDS_PER_LEVEL);
}

function buildDisplayItems(round) {
  const itemCount = round.others.length + 1;
  const bigScale = itemCount === 2 ? randomBetween(1.28, 1.44) : randomBetween(1.14, 1.28);
  const smallMin = itemCount === 2 ? 0.68 : 0.72;
  const smallMax = itemCount === 2 ? 0.86 : 0.92;

  return shuffle([
    { ...round.big, isBig: true },
    ...round.others.map((item) => ({ ...item, isBig: false })),
  ]).map((item, index) => {
    const palette = CARD_PALETTES[(index + Math.floor(Math.random() * CARD_PALETTES.length)) % CARD_PALETTES.length];
    const emojiScale = item.isBig ? bigScale : randomBetween(smallMin, smallMax);
    const nameScale = item.isBig ? randomBetween(1.02, 1.12) : randomBetween(0.9, 1.01);
    return {
      ...item,
      visualStyle: {
        '--bvs-card-bg': palette.bg,
        '--bvs-card-border': palette.border,
        '--bvs-card-shadow': palette.shadow,
        '--bvs-emoji-scale': emojiScale.toFixed(2),
        '--bvs-name-scale': nameScale.toFixed(2),
        '--bvs-tilt': '0deg',
        '--bvs-bob': '0px',
      },
    };
  });
}

function buildStageRounds(difficulty) {
  const path = DIFFICULTY_PATHS[difficulty] || DIFFICULTY_PATHS[1];
  return path.map((poolIdx) => sampleRounds(LEVEL_POOLS[poolIdx].rounds));
}

export default function BigVsSmall({ onSuccess, onExit }) {
  const { lang, setLang, dir } = useLanguage();
  const [difficulty, setDifficulty] = useState(() => getGameDifficulty(GAME_ID, 1));
  const [stageIdx, setStageIdx] = useState(0);
  const [roundIdx, setRoundIdx] = useState(0);
  const [stars, setStars] = useState(0);
  const [balloons, setBalloons] = useState(0);
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState(null);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [hintOn, setHintOn] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const difficultyPath = DIFFICULTY_PATHS[difficulty] || DIFFICULTY_PATHS[1];
  const [stageRounds, setStageRounds] = useState(() => buildStageRounds(getGameDifficulty(GAME_ID, 1)));
  const [displayItems, setDisplayItems] = useState(() => buildDisplayItems(stageRounds[0][0]));

  const soundOnRef = useRef(true);
  const idleTimer = useRef(null);

  const done = stageIdx >= difficultyPath.length;
  const totalRounds = difficultyPath.length * ROUNDS_PER_LEVEL;
  const bigIdx = displayItems.findIndex((item) => item.isBig);
  const currentPoolIdx = done ? difficultyPath[difficultyPath.length - 1] : difficultyPath[stageIdx];

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  useEffect(() => {
    setStageRounds(buildStageRounds(difficulty));
    setStageIdx(0);
    setRoundIdx(0);
    setStars(0);
    setBalloons(0);
    setWinner(null);
    setHighlight(null);
    setLocked(false);
    setShowLevelUp(false);
  }, [difficulty]);

  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (locked || done || !hintOn) return;
    idleTimer.current = setTimeout(() => setHighlight(bigIdx), 3000);
  }, [locked, done, bigIdx, hintOn]);

  useEffect(() => {
    if (done) {
      if (soundOnRef.current) speak(t(lang, 'amazing'), lang);
      return;
    }

    const round = stageRounds[stageIdx][roundIdx];
    setDisplayItems(buildDisplayItems(round));
    setWinner(null);
    setHighlight(null);
    setLocked(false);

    if (soundOnRef.current) speak(t(lang, 'whoIsBigger'), lang);
  }, [stageIdx, roundIdx, done, lang, stageRounds]);

  useEffect(() => {
    resetIdle();
    return () => clearTimeout(idleTimer.current);
  }, [resetIdle, stageIdx, roundIdx]);

  function handleDifficultyChange(nextDifficulty) {
    if (nextDifficulty === difficulty) return;
    setDifficulty(saveGameDifficulty(GAME_ID, nextDifficulty));
  }

  function handleTap(idx) {
    if (locked) return;

    clearTimeout(idleTimer.current);
    setLocked(true);

    const capStageIdx = stageIdx;
    const capRoundIdx = roundIdx;

    if (displayItems[idx].isBig) {
      setWinner(idx);
      const newStars = stars + 1;
      setStars(newStars);

      if (newStars % 5 === 0) setBalloons((count) => count + 1);
      if (soundOnRef.current) speak(t(lang, 'correct'), lang);

      setTimeout(() => {
        const rounds = stageRounds[capStageIdx];
        if (capRoundIdx + 1 < rounds.length) {
          setRoundIdx(capRoundIdx + 1);
        } else if (capStageIdx + 1 < difficultyPath.length) {
          setShowLevelUp(true);
          setTimeout(() => {
            setShowLevelUp(false);
            setStageIdx(capStageIdx + 1);
            setRoundIdx(0);
          }, 1500);
        } else {
          setStageIdx(difficultyPath.length);
        }
      }, 700);
      return;
    }

    if (hintOn) {
      setHighlight(bigIdx);
    }
    const bigItem = displayItems[bigIdx];
    const msg = lang === 'he' ? `${bigItem.heName} יותר גדול` : `${bigItem.name} is bigger`;

    if (soundOnRef.current) speak(msg, lang);
    setTimeout(() => {
      setHighlight(null);
      setLocked(false);
    }, 2000);
  }

  function handleReadAloud(item) {
    const text = lang === 'he' ? item.heName : item.name;
    speak(text, lang);
  }

  const starsInCycle = stars % 5 === 0 && stars > 0 ? 5 : stars % 5;
  const itemCount = done ? LEVEL_POOLS[currentPoolIdx].rounds[0].others.length + 1 : displayItems.length;
  const stageNum = stageIdx + 1;

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
        <button
          className="bvs-play-again"
          onClick={() => {
            setStageRounds(buildStageRounds(difficulty));
            setStageIdx(0);
            setRoundIdx(0);
            setStars(0);
            setBalloons(0);
          }}
        >
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
              {lang === 'he' ? `שלב ${stageNum + 1}` : `Stage ${stageNum + 1}`}
            </span>
          </div>
        </div>
      )}

      <header className="bvs-hud">
        <div className="bvs-hud-top">
          <StarBar starsInCycle={starsInCycle} balloons={balloons} />
          <div className="bvs-hud-controls">
            <button
              className="bvs-lang-btn"
              onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
              aria-label={lang === 'he' ? 'Switch to English' : 'עברית'}
            >
              {lang === 'he' ? 'EN' : 'עב'}
            </button>
            <button
              className={`bvs-hint-btn${hintOn ? ' on' : ' off'}`}
              onClick={() => {
                setHintOn((current) => {
                  const next = !current;
                  if (!next) {
                    clearTimeout(idleTimer.current);
                    setHighlight(null);
                  } else if (!locked && !done) {
                    resetIdle();
                  }
                  return next;
                });
              }}
              aria-label={hintOn ? 'Hint on' : 'Hint off'}
            >
              {lang === 'he' ? 'רמז' : 'Hint'}
            </button>
            <button
              className={`bvs-sound-btn${soundOn ? ' on' : ''}`}
              onClick={() => setSoundOn((current) => !current)}
              aria-label={soundOn ? 'Sound on' : 'Sound off'}
            >
              {soundOn ? '🔊' : '🔇'}
            </button>
            <button className="bvs-exit-btn" onClick={onExit} aria-label="Exit">✕</button>
          </div>
        </div>
      </header>

      <div className="bvs-level-picker">
        {LEVEL_POOLS.map((pool, i) => (
          <button
            key={pool.label.en}
            className={`bvs-level-pill${i + 1 === difficulty ? ' active' : ''}`}
            onClick={() => handleDifficultyChange(i + 1)}
            aria-pressed={i + 1 === difficulty}
          >
            <span className="bvs-level-pill-stars">{'⭐'.repeat(i + 1)}</span>
            <span className="bvs-level-pill-label">{pool.label[lang] || pool.label.en}</span>
          </button>
        ))}
      </div>

      <h1 className="bvs-prompt">{t(lang, 'whoIsBigger')}</h1>

      <div className={`bvs-arena bvs-arena--${itemCount}`}>
        {displayItems.map((item, idx) => {
          const name = lang === 'he' ? item.heName : item.name;
          return (
            <div
              key={`${name}-${idx}`}
              className={`bvs-card-shell${item.isBig ? ' is-big' : ' is-small'}`}
              style={item.visualStyle}
            >
              <button
                className={`bvs-animal-btn${winner === idx ? ' grow' : ''}${highlight === idx ? ' pulse' : ''}${item.isBig ? ' is-big' : ' is-small'}`}
                onClick={() => handleTap(idx)}
                aria-label={name}
              >
                <span className="bvs-read-slot" aria-hidden="true" />
                <span className="bvs-animal-emoji">{item.emoji}</span>
                <span className="bvs-animal-name">{name}</span>
              </button>
              <button
                className="bvs-read-btn"
                onClick={() => handleReadAloud(item)}
                aria-label={lang === 'he' ? `השמע ${name}` : `Read ${name}`}
                type="button"
              >
                {lang === 'he' ? 'הקרא' : 'Read'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
