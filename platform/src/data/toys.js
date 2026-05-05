export const TOYS = [
  { id: 'car',        emoji: '🚗',  he: 'מכונית',       en: 'Car'          },
  { id: 'race_car',   emoji: '🏎️',  he: 'מכונית מירוץ', en: 'Race Car'     },
  { id: 'robot',      emoji: '🤖',  he: 'רובוט',         en: 'Robot'        },
  { id: 'teddy',      emoji: '🧸',  he: 'דובי',          en: 'Teddy Bear'   },
  { id: 'superhero',  emoji: '🦸',  he: 'גיבור על',      en: 'Superhero'    },
  { id: 'dinosaur',   emoji: '🦕',  he: 'דינוזאור',      en: 'Dinosaur'     },
  { id: 'dragon',     emoji: '🐉',  he: 'דרקון',         en: 'Dragon'       },
  { id: 'rocket',     emoji: '🚀',  he: 'רקטה',          en: 'Rocket'       },
  { id: 'train',      emoji: '🚂',  he: 'רכבת',          en: 'Train'        },
  { id: 'truck',      emoji: '🚚',  he: 'משאית',         en: 'Truck'        },
  { id: 'ball',       emoji: '⚽',  he: 'כדור',          en: 'Soccer Ball'  },
  { id: 'basketball', emoji: '🏀',  he: 'כדורסל',        en: 'Basketball'   },
  { id: 'gamepad',    emoji: '🎮',  he: 'שלט משחק',      en: 'Game Pad'     },
  { id: 'yoyo',       emoji: '🪀',  he: 'יויו',           en: 'Yo-Yo'        },
  { id: 'kite',       emoji: '🪁',  he: 'עפיפון',        en: 'Kite'         },
  { id: 'puzzle',     emoji: '🧩',  he: 'פאזל',          en: 'Puzzle'       },
  { id: 'doll',       emoji: '🪆',  he: 'בובה',          en: 'Doll'         },
  { id: 'ufo',        emoji: '🛸',  he: 'חללית',         en: 'Spaceship'    },
  { id: 'sword',      emoji: '⚔️',  he: 'חרב',           en: 'Sword'        },
  { id: 'crown',      emoji: '👑',  he: 'כתר',           en: 'Crown'        },
];

export const TOTAL_TOYS = TOYS.length;

/** Returns the next toy to earn — first unearned, then cycles */
export function getNextToy(earnedIds) {
  const unearned = TOYS.filter(t => !earnedIds.includes(t.id));
  if (unearned.length > 0) return unearned[0];
  return TOYS[earnedIds.length % TOYS.length];
}
