import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import Hub from './components/Hub';
import CreatureCelebration from './components/CreatureCelebration';
import StickerReveal from './components/StickerReveal';
import StickerCollection from './components/StickerCollection';
import BigVsSmall from './games/BigVsSmall';
import MemoryGame from './games/MemoryGame';
import SocialSkills from './games/SocialSkills';
import WordShooter from './games/WordShooter';
import { getEarnedStickers, earnSticker, migrateLegacyStickers } from './lib/storage';
import { getNextSticker } from './data/stickers';

const GAME_COMPONENTS = {
  bigvssmall: BigVsSmall,
  memory: MemoryGame,
  social: SocialSkills,
  shooter: WordShooter,
};

export default function App() {
  const [currentGame, setCurrentGame]       = useState(null);
  const [showCollection, setShowCollection] = useState(false);
  const [showCreature, setShowCreature]     = useState(false);
  const [stickerReveal, setStickerReveal]   = useState(null); // { sticker, earnedCount, isNew }
  const [earnedIds, setEarnedIds]           = useState([]);

  useEffect(() => {
    migrateLegacyStickers();
    setEarnedIds(getEarnedStickers());
  }, []);

  const handleSuccess = useCallback(() => {
    const current = getEarnedStickers();
    const sticker = getNextSticker(current);
    const isNew   = !current.includes(sticker.id);
    earnSticker(sticker.id);
    const updated = getEarnedStickers();
    setEarnedIds(updated);
    setStickerReveal({ sticker, earnedCount: updated.length, isNew });
    setShowCreature(true);
  }, []);

  const handleCreatureDone = useCallback(() => {
    setShowCreature(false);
    // StickerReveal takes over from here
  }, []);

  const handleRevealDone = useCallback(() => {
    setStickerReveal(null);
    setCurrentGame(null);
  }, []);

  const handleExit = useCallback(() => {
    setCurrentGame(null);
  }, []);

  const ActiveGame = currentGame ? GAME_COMPONENTS[currentGame] : null;

  if (showCollection) {
    return (
      <div className="platform-root">
        <StickerCollection
          earnedIds={earnedIds}
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
        />
      )}
      {ActiveGame && (
        <div className="game-wrapper">
          <ActiveGame onSuccess={handleSuccess} onExit={handleExit} />
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
          onDone={handleRevealDone}
        />
      )}
    </div>
  );
}
