// Word Shooter — level definitions
// Each level: { id, name, objectCount, words: [{word, emoji, label}], targetCorrect, floatSpeed }

export const LEVELS = [
  {
    id: 1,
    name: 'Level 1',
    objectCount: 2,
    targetCorrect: 5,
    floatSpeed: 0,          // no float
    distractors: false,
    words: [
      { word: 'Apple',   emoji: '🍎', label: 'Apple'   },
      { word: 'Dog',     emoji: '🐶', label: 'Dog'     },
      { word: 'Car',     emoji: '🚗', label: 'Car'     },
      { word: 'Ball',    emoji: '⚽', label: 'Ball'    },
    ],
  },
  {
    id: 2,
    name: 'Level 2',
    objectCount: 3,
    targetCorrect: 7,
    floatSpeed: 1,          // slow float
    distractors: false,
    words: [
      { word: 'Cat',    emoji: '🐱', label: 'Cat'    },
      { word: 'Cap',    emoji: '🧢', label: 'Cap'    },
      { word: 'Ship',   emoji: '🚢', label: 'Ship'   },
      { word: 'Sheep',  emoji: '🐑', label: 'Sheep'  },
      { word: 'Car',    emoji: '🚗', label: 'Car'    },
      { word: 'Bus',    emoji: '🚌', label: 'Bus'    },
    ],
  },
  {
    id: 3,
    name: 'Level 3',
    objectCount: 3,
    targetCorrect: 7,
    floatSpeed: 1,
    distractors: true,      // 1 clickable-looking but non-target decoy
    words: [
      { word: 'Sun',    emoji: '☀️', label: 'Sun'   },
      { word: 'Moon',   emoji: '🌙', label: 'Moon'  },
      { word: 'Tree',   emoji: '🌳', label: 'Tree'  },
      { word: 'Fish',   emoji: '🐟', label: 'Fish'  },
    ],
  },
  {
    id: 4,
    name: 'Level 4',
    objectCount: 3,
    targetCorrect: 10,
    floatSpeed: 2,          // faster float
    distractors: false,
    words: [
      { word: 'Star',   emoji: '⭐', label: 'Star'   },
      { word: 'Flower', emoji: '🌸', label: 'Flower' },
      { word: 'Bird',   emoji: '🐦', label: 'Bird'   },
      { word: 'Cake',   emoji: '🎂', label: 'Cake'   },
      { word: 'Boat',   emoji: '⛵', label: 'Boat'   },
    ],
  },
];

// All possible distractor objects (never the target word)
export const DISTRACTOR_POOL = [
  { emoji: '🌈', label: 'Rainbow' },
  { emoji: '🎈', label: 'Balloon' },
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🌺', label: 'Hibiscus' },
];
