import React, { useState, useCallback, useEffect, useRef } from 'react';
import './App.css';
import Hub from './components/Hub';
import CreatureCelebration from './components/CreatureCelebration';
import StickerReveal from './components/StickerReveal';
import StickerCollection from './components/StickerCollection';
import LanguageSwitchButton from './components/LanguageSwitchButton';
import { useLanguage } from './context/LanguageContext';
import BigVsSmall from './games/BigVsSmall';
import MemoryGame from './games/MemoryGame';
import SocialSkills from './games/SocialSkills';
import WordShooter from './games/WordShooter';
import PatternGame from './games/PatternGame';
import NumberTrain from './games/NumberTrain';
import ShapeSorter from './games/ShapeSorter';
import LegoBuilder from './games/LegoBuilder';
import LetterMatch from './games/LetterMatch';
import WordRace from './games/WordRace';
import PicturePuzzle from './games/PicturePuzzle';
import BubblePop from './games/BubblePop';
import RescueDog from './games/RescueDog';
import SpiderMan from './games/SpiderMan';
import PJMasks from './games/PJMasks';
import Sonic from './games/Sonic';
import PizzaParty from './games/PizzaParty';
import PawPatrol from './games/PawPatrol';
import ColorBook from './games/ColorBook';
import { getEarnedStickers, earnSticker, migrateLegacyStickers, getEarnedCandy, earnCandy } from './lib/storage';
import { getNextSticker } from './data/stickers';
import { getNextCandy } from './data/candy';
import { getSettings, getGameDifficulty, saveGameDifficulty } from './lib/settings';
import { stopSpeaking } from './speak';

const GAME_COMPONENTS = {
  bigvssmall: BigVsSmall,
  memory: MemoryGame,
  social: SocialSkills,
  shooter: WordShooter,
  lettermatch: LetterMatch,
  wordrace: WordRace,
  picturepuzzle: PicturePuzzle,
  bubblepop: BubblePop,
  pattern: PatternGame,
  numbertrain: NumberTrain,
  shapesorter: ShapeSorter,
  lego: LegoBuilder,
  rescuedog: RescueDog,
  spiderman: SpiderMan,
  pjmasks: PJMasks,
  sonic: Sonic,
  pizzaparty: PizzaParty,
  pawpatrol: PawPatrol,
  colorbook: ColorBook,
};

function createDifficultyConfig(title = 'Difficulty') {
  return {
    title: { en: title, he: title },
    levels: {
      1: { en: 'Easy', he: 'Easy' },
      2: { en: 'Medium', he: 'Medium' },
      3: { en: 'Hard', he: 'Hard' },
      4: { en: 'Expert', he: 'Expert' },
    },
  };
}

const SHARED_DIFFICULTY_GAMES = {
  bigvssmall: {
    settingsKey: 'bigvssmall',
    title: { en: 'Difficulty', he: 'רמת קושי' },
    levels: {
      1: { en: 'Easy', he: 'קל' },
      2: { en: 'Medium', he: 'בינוני' },
      3: { en: 'Hard', he: 'קשה' },
      4: { en: 'Expert', he: 'מאתגר' },
    },
  },
  shooter: {
    settingsKey: 'shooter',
    title: { en: 'Level', he: 'רמה' },
    levels: {
      1: { en: 'Level 1', he: 'שלב 1' },
      2: { en: 'Level 2', he: 'שלב 2' },
      3: { en: 'Level 3', he: 'שלב 3' },
      4: { en: 'Level 4', he: 'שלב 4' },
    },
  },
  lettermatch: {
    settingsKey: 'letter-match',
    title: { en: 'Difficulty', he: 'רמת קושי' },
    levels: {
      1: { en: 'Easy', he: 'קל' },
      2: { en: 'Medium', he: 'בינוני' },
      3: { en: 'Advanced', he: 'מתקדם' },
      4: { en: 'Hard', he: 'קשה' },
    },
  },
  numbertrain: {
    settingsKey: 'numbertrain',
    title: { en: 'Difficulty', he: 'רמת קושי' },
    levels: {
      1: { en: 'Easy', he: 'קל' },
      2: { en: 'Medium', he: 'בינוני' },
      3: { en: 'Advanced', he: 'מתקדם' },
      4: { en: 'Hard', he: 'קשה' },
    },
  },
  pattern: {
    settingsKey: 'pattern',
    ...createDifficultyConfig(),
  },
  wordrace: {
    settingsKey: 'wordrace',
    ...createDifficultyConfig(),
  },
  picturepuzzle: {
    settingsKey: 'picturepuzzle',
    ...createDifficultyConfig(),
  },
  bubblepop: {
    settingsKey: 'bubblepop',
    ...createDifficultyConfig(),
  },
  lego: {
    settingsKey: 'lego',
    ...createDifficultyConfig(),
  },
  spiderman: {
    settingsKey: 'spiderman',
    ...createDifficultyConfig(),
  },
  sonic: {
    settingsKey: 'sonic',
    title: { en: 'Stages', he: 'שלבים' },
    levels: {
      1: { en: 'Easy (1 stage)', he: 'קל (שלב 1)' },
      2: { en: 'Medium (2 stages)', he: 'בינוני (2 שלבים)' },
      3: { en: 'Hard (3 stages)', he: 'קשה (3 שלבים)' },
    },
  },
};

export default function App() {
  const { lang } = useLanguage();
  const [currentGame, setCurrentGame] = useState(null);
  const [showCollection, setShowCollection] = useState(false);
  const [showCreature, setShowCreature] = useState(false);
  const [stickerReveal, setStickerReveal] = useState(null);
  const [earnedIds, setEarnedIds] = useState([]);
  const [earnedCandyIds, setEarnedCandyIds] = useState([]);
  const [appSettings, setAppSettings] = useState(getSettings);
  const [showDifficultyMenu, setShowDifficultyMenu] = useState(false);
  // Track total wins to alternate sticker / candy
  const totalWinsRef = useRef(0);

  useEffect(() => {
    migrateLegacyStickers();
    const stickers = getEarnedStickers();
    const candy = getEarnedCandy();
    setEarnedIds(stickers);
    setEarnedCandyIds(candy);
    // Restore win parity from saved counts
    totalWinsRef.current = stickers.length + candy.length;
  }, []);

  useEffect(() => {
    setShowDifficultyMenu(false);
  }, [currentGame]);

  const handleSuccess = useCallback(() => {
    totalWinsRef.current += 1;
    const isCandy = totalWinsRef.current % 2 === 0;

    if (isCandy) {
      const current = getEarnedCandy();
      const item = getNextCandy(current);
      const isNew = !current.includes(item.id);
      earnCandy(item.id);
      const updated = getEarnedCandy();
      setEarnedCandyIds(updated);
      setStickerReveal({ sticker: item, earnedCount: updated.length, isNew, type: 'candy' });
    } else {
      const current = getEarnedStickers();
      const sticker = getNextSticker(current);
      const isNew = !current.includes(sticker.id);
      earnSticker(sticker.id);
      const updated = getEarnedStickers();
      setEarnedIds(updated);
      setStickerReveal({ sticker, earnedCount: updated.length, isNew, type: 'sticker' });
    }
    setShowCreature(true);
  }, []);

  const handleCreatureDone = useCallback(() => {
    setShowCreature(false);
  }, []);

  const handleRevealDone = useCallback(() => {
    setStickerReveal(null);
    setCurrentGame(null);
  }, []);

  const handleExit = useCallback(() => {
    stopSpeaking();
    setCurrentGame(null);
  }, []);

  const ActiveGame = currentGame ? GAME_COMPONENTS[currentGame] : null;
  const isFullscreenGame = currentGame === 'sonic' || currentGame === 'pawpatrol';
  const sharedDifficultyConfig = currentGame ? SHARED_DIFFICULTY_GAMES[currentGame] : null;
  const currentDifficulty = sharedDifficultyConfig
    ? getGameDifficulty(
      sharedDifficultyConfig.settingsKey,
      appSettings.gameDifficulties?.[sharedDifficultyConfig.settingsKey] || 1,
    )
    : null;
  const gameInstanceKey = sharedDifficultyConfig ? `${currentGame}:${currentDifficulty}` : currentGame;

  function handleSharedDifficultyChange(nextDifficulty) {
    if (!sharedDifficultyConfig) return;
    saveGameDifficulty(sharedDifficultyConfig.settingsKey, nextDifficulty);
    setAppSettings(getSettings());
    setShowDifficultyMenu(false);
  }

  if (showCollection) {
    return (
      <div className="platform-root">
        <StickerCollection
          earnedIds={earnedIds}
          earnedCandyIds={earnedCandyIds}
          onBack={() => setShowCollection(false)}
        />
      </div>
    );
  }

  return (
    <div className="platform-root">
      {!currentGame && (
        <Hub
          onLaunch={setCurrentGame}
          earnedCount={earnedIds.length}
          onOpenCollection={() => setShowCollection(true)}
          onSettingsChange={setAppSettings}
        />
      )}
      {ActiveGame && (
        <div className={`game-wrapper${isFullscreenGame ? ' game-wrapper--fullscreen' : ''}`}>
          <div className={`game-topbar${isFullscreenGame ? ' game-topbar--fullscreen' : ''}`}>
            <button
              className="game-exit-btn"
              onClick={handleExit}
              type="button"
              aria-label={lang === 'he' ? 'יציאה מהמשחק' : 'Exit game'}
            >
              ✕
            </button>
            {sharedDifficultyConfig && (
              <div className="game-topbar-center">
                <button
                  className="game-difficulty-btn"
                  onClick={() => setShowDifficultyMenu((value) => !value)}
                  type="button"
                  aria-label={sharedDifficultyConfig.title[lang] || sharedDifficultyConfig.title.en}
                  aria-expanded={showDifficultyMenu}
                >
                  <span className="game-difficulty-btn-kicker">
                    {sharedDifficultyConfig.title[lang] || sharedDifficultyConfig.title.en}
                  </span>
                  <span className="game-difficulty-btn-value">
                    {sharedDifficultyConfig.levels[currentDifficulty]?.[lang]
                      || sharedDifficultyConfig.levels[currentDifficulty]?.en
                      || currentDifficulty}
                  </span>
                </button>
                {showDifficultyMenu && (
                  <div
                    className="game-difficulty-menu"
                    role="menu"
                    aria-label={sharedDifficultyConfig.title[lang] || sharedDifficultyConfig.title.en}
                  >
                    {Object.keys(sharedDifficultyConfig.levels).map(Number).map((value) => (
                      <button
                        key={value}
                        className={`game-difficulty-option${value === currentDifficulty ? ' is-active' : ''}`}
                        onClick={() => handleSharedDifficultyChange(value)}
                        type="button"
                        role="menuitemradio"
                        aria-checked={value === currentDifficulty}
                      >
                        <span className="game-difficulty-option-num">{value}</span>
                        <span className="game-difficulty-option-label">
                          {sharedDifficultyConfig.levels[value]?.[lang] || sharedDifficultyConfig.levels[value]?.en}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <LanguageSwitchButton />
          </div>
          <ActiveGame
            key={gameInstanceKey}
            onSuccess={handleSuccess}
            onExit={handleExit}
            facilitatorMode={appSettings.facilitator}
            sharedDifficulty={currentDifficulty || 1}
          />
        </div>
      )}
      {showCreature && (
        <CreatureCelebration onDone={handleCreatureDone} />
      )}
      {!showCreature && stickerReveal && (
        <StickerReveal
          sticker={stickerReveal.sticker}
          earnedCount={stickerReveal.earnedCount}
          isNew={stickerReveal.isNew}
          type={stickerReveal.type}
          onDone={handleRevealDone}
        />
      )}
    </div>
  );
}
