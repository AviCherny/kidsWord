import React, { useState, useCallback } from 'react';
import './App.css';
import Hub from './components/Hub';
import CreatureCelebration from './components/CreatureCelebration';
import BigVsSmall from './games/BigVsSmall';
import MemoryGame from './games/MemoryGame';
import SocialSkills from './games/SocialSkills';
import WordShooter from './games/WordShooter';

function getStickers() {
  return parseInt(localStorage.getItem('kids-stickers') || '0', 10);
}

function addSticker() {
  const current = getStickers();
  localStorage.setItem('kids-stickers', String(current + 1));
  return current + 1;
}

export default function App() {
  const [currentGame, setCurrentGame] = useState(null); // null | 'bigvssmall' | 'memory' | 'social' | 'shooter'
  const [showCelebration, setShowCelebration] = useState(false);
  const [stickers, setStickers] = useState(getStickers);

  const handleSuccess = useCallback(() => {
    const newCount = addSticker();
    setStickers(newCount);
    setShowCelebration(true);
  }, []);

  const handleCelebrationDone = useCallback(() => {
    setShowCelebration(false);
    setCurrentGame(null);
  }, []);

  const handleExit = useCallback(() => {
    setCurrentGame(null);
  }, []);

  const GAME_COMPONENTS = {
    bigvssmall: BigVsSmall,
    memory: MemoryGame,
    social: SocialSkills,
    shooter: WordShooter,
  };

  const ActiveGame = currentGame ? GAME_COMPONENTS[currentGame] : null;

  return (
    <div className="platform-root">
      {!currentGame && (
        <Hub onLaunch={setCurrentGame} stickers={stickers} />
      )}
      {ActiveGame && (
        <div className="game-wrapper">
          <ActiveGame onSuccess={handleSuccess} onExit={handleExit} />
        </div>
      )}
      {showCelebration && (
        <CreatureCelebration onDone={handleCelebrationDone} />
      )}
    </div>
  );
}
