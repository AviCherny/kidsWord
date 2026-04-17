export const CANDY = [
  { id: 'lollipop',    emoji: '🍭', he: 'סוכרייה על מקל', en: 'Lollipop'    },
  { id: 'candy',       emoji: '🍬', he: 'סוכרייה',        en: 'Candy'       },
  { id: 'chocolate',   emoji: '🍫', he: 'שוקולד',          en: 'Chocolate'   },
  { id: 'cake',        emoji: '🍰', he: 'עוגה',            en: 'Cake'        },
  { id: 'cupcake',     emoji: '🧁', he: 'קאפקייק',         en: 'Cupcake'     },
  { id: 'donut',       emoji: '🍩', he: 'דונאט',           en: 'Donut'       },
  { id: 'cookie',      emoji: '🍪', he: 'עוגייה',          en: 'Cookie'      },
  { id: 'birthday',    emoji: '🎂', he: 'עוגת יום הולדת', en: 'Birthday Cake'},
  { id: 'icecream',    emoji: '🍦', he: 'גלידה',           en: 'Ice Cream'   },
  { id: 'shaved_ice',  emoji: '🍧', he: 'קרח גרוס',        en: 'Shaved Ice'  },
  { id: 'ice_cream2',  emoji: '🍨', he: 'גלידה כדורים',    en: 'Ice Cream Cup'},
  { id: 'dango',       emoji: '🍡', he: 'ממתק יפני',       en: 'Dango'       },
  { id: 'honey',       emoji: '🍯', he: 'דבש',             en: 'Honey'       },
  { id: 'pie',         emoji: '🥧', he: 'פאי',             en: 'Pie'         },
  { id: 'pretzel',     emoji: '🥨', he: 'פרצל',            en: 'Pretzel'     },
  { id: 'pancakes',    emoji: '🥞', he: 'פנקייקס',         en: 'Pancakes'    },
  { id: 'waffle',      emoji: '🧇', he: 'וופל',            en: 'Waffle'      },
  { id: 'popcorn',     emoji: '🍿', he: 'פופקורן',         en: 'Popcorn'     },
  { id: 'cotton_candy',emoji: '🍭', he: 'צמר גפן ממותק',  en: 'Cotton Candy'},
  { id: 'gummy',       emoji: '🐻', he: 'דובי גומי',       en: 'Gummy Bear'  },
];

export const TOTAL_CANDY = CANDY.length;

/** Returns the next candy to earn — first unearned, then cycles */
export function getNextCandy(earnedIds) {
  const unearned = CANDY.filter(c => !earnedIds.includes(c.id));
  if (unearned.length > 0) return unearned[0];
  return CANDY[earnedIds.length % CANDY.length];
}
