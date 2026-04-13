export const STICKERS = [
  { id: 'butterfly',   emoji: '🦋', he: 'פַּרְפַּר',        en: 'Butterfly'  },
  { id: 'bee',         emoji: '🐝', he: 'דְּבוֹרָה',       en: 'Bee'        },
  { id: 'flower_pink', emoji: '🌸', he: 'פֶּרַח',           en: 'Flower'     },
  { id: 'mushroom',    emoji: '🍄', he: 'פִּטְרִיָּה',     en: 'Mushroom'   },
  { id: 'caterpillar', emoji: '🐛', he: 'זַחַל',            en: 'Caterpillar'},
  { id: 'flower_red',  emoji: '🌺', he: 'פֶּרַח אָדֹם',    en: 'Red Flower' },
  { id: 'sunflower',   emoji: '🌻', he: 'חַמָּנִית',       en: 'Sunflower'  },
  { id: 'clover',      emoji: '🍀', he: 'תְּלִתָן',        en: 'Clover'     },
  { id: 'ladybug',     emoji: '🐞', he: 'פָּרָה אֲדֻמָּה', en: 'Ladybug'   },
  { id: 'leaf',        emoji: '🍃', he: 'עֶלֶה',            en: 'Leaf'       },
  { id: 'bird',        emoji: '🐦', he: 'צִפּוֹר',          en: 'Bird'       },
  { id: 'rainbow',     emoji: '🌈', he: 'קֶשֶׁת',           en: 'Rainbow'    },
  { id: 'lizard',      emoji: '🦎', he: 'לְטָאָה',          en: 'Lizard'     },
  { id: 'frog',        emoji: '🐸', he: 'צְפַרְדֵּעַ',     en: 'Frog'       },
  { id: 'snail',       emoji: '🐌', he: 'חִלָּזוֹן',       en: 'Snail'      },
  { id: 'fox',         emoji: '🦊', he: 'שׁוּעָל',          en: 'Fox'        },
  { id: 'rabbit',      emoji: '🐰', he: 'אַרְנָב',          en: 'Rabbit'     },
  { id: 'hedgehog',    emoji: '🦔', he: 'קִפּוֹד',          en: 'Hedgehog'   },
  { id: 'deer',        emoji: '🦌', he: 'אַיָּל',            en: 'Deer'       },
  { id: 'owl',         emoji: '🦉', he: 'יַנְשׁוּף',       en: 'Owl'        },
];

export const TOTAL_STICKERS = STICKERS.length;

/** Returns the next sticker to earn — first unearned, then cycles */
export function getNextSticker(earnedIds) {
  const unearned = STICKERS.filter(s => !earnedIds.includes(s.id));
  if (unearned.length > 0) return unearned[0];
  return STICKERS[earnedIds.length % STICKERS.length];
}
