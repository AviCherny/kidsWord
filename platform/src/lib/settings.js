const KEY = 'kids-parent-settings';

const DEFAULTS = {
  pin: '1234',
  sound: true,
  facilitator: false,
  hiddenGames: [],
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
