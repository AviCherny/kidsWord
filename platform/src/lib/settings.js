const KEY = 'kids-parent-settings';

const DEFAULTS = {
  pin: '1234',
  sound: true,
  facilitator: false,
  hiddenGames: [],
  gameDifficulties: {},
};

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return stored ? { ...DEFAULTS, ...stored } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(updates) {
  const current = getSettings();
  const next = { ...current, ...updates };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function verifyPin(pin) {
  return getSettings().pin === pin;
}

export function isSoundEnabled() {
  return getSettings().sound !== false;
}

export function getGameDifficulty(gameId, fallback = 1) {
  const difficulty = getSettings().gameDifficulties?.[gameId];
  return Number.isInteger(difficulty) && difficulty >= 1 && difficulty <= 4
    ? difficulty
    : fallback;
}

export function saveGameDifficulty(gameId, difficulty) {
  const safeDifficulty = Math.min(4, Math.max(1, Math.round(difficulty)));
  const current = getSettings();
  const gameDifficulties = {
    ...(current.gameDifficulties || {}),
    [gameId]: safeDifficulty,
  };
  saveSettings({ gameDifficulties });
  return safeDifficulty;
}
