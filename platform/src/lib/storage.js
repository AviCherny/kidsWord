const KEY = 'kids-stickers-earned';
const CANDY_KEY = 'kids-candy-earned';

export function getEarnedStickers() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function earnSticker(id) {
  const current = getEarnedStickers();
  if (!current.includes(id)) {
    localStorage.setItem(KEY, JSON.stringify([...current, id]));
  }
}

export function getEarnedCandy() {
  try {
    return JSON.parse(localStorage.getItem(CANDY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function earnCandy(id) {
  const current = getEarnedCandy();
  if (!current.includes(id)) {
    localStorage.setItem(CANDY_KEY, JSON.stringify([...current, id]));
  }
}

/** Legacy: migrate old integer counter → empty earned list (fresh start) */
export function migrateLegacyStickers() {
  if (localStorage.getItem('kids-stickers') !== null && localStorage.getItem(KEY) === null) {
    localStorage.removeItem('kids-stickers');
    localStorage.setItem(KEY, '[]');
  }
}
