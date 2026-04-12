// Word Shooter — level definitions
// Each level: { id, name, objectCount, wordPool, wordsPerGame, targetCorrect, floatSpeed, distractors }
// wordsPerGame words are randomly picked from wordPool at the start of each game session.

export const LEVELS = [
  {
    id: 1,
    name: 'Level 1',
    objectCount: 2,
    targetCorrect: 5,
    floatSpeed: 0,          // no float
    distractors: false,
    wordsPerGame: 4,
    wordPool: [
      { word: 'Apple', emoji: '🍎', label: 'Apple' },
      { word: 'Dog',   emoji: '🐶', label: 'Dog'   },
      { word: 'Car',   emoji: '🚗', label: 'Car'   },
      { word: 'Ball',  emoji: '⚽', label: 'Ball'  },
      { word: 'Hat',   emoji: '🎩', label: 'Hat'   },
      { word: 'Cup',   emoji: '☕', label: 'Cup'   },
      { word: 'Pig',   emoji: '🐷', label: 'Pig'   },
      { word: 'Hen',   emoji: '🐔', label: 'Hen'   },
    ],
  },
  {
    id: 2,
    name: 'Level 2',
    objectCount: 3,
    targetCorrect: 7,
    floatSpeed: 1,          // slow float
    distractors: false,
    wordsPerGame: 5,
    // Similar-sounding pairs to challenge phonological discrimination
    wordPool: [
      { word: 'Cat',   emoji: '🐱', label: 'Cat'   },
      { word: 'Cap',   emoji: '🧢', label: 'Cap'   },
      { word: 'Ship',  emoji: '🚢', label: 'Ship'  },
      { word: 'Sheep', emoji: '🐑', label: 'Sheep' },
      { word: 'Bus',   emoji: '🚌', label: 'Bus'   },
      { word: 'Bat',   emoji: '🦇', label: 'Bat'   },
      { word: 'Pan',   emoji: '🍳', label: 'Pan'   },
      { word: 'Pen',   emoji: '🖊️', label: 'Pen'   },
      { word: 'Fox',   emoji: '🦊', label: 'Fox'   },
      { word: 'Box',   emoji: '📦', label: 'Box'   },
    ],
  },
  {
    id: 3,
    name: 'Level 3',
    objectCount: 3,
    targetCorrect: 7,
    floatSpeed: 1,
    distractors: true,      // 1 visual distractor (non-clickable)
    wordsPerGame: 4,
    // Harder single-syllable words
    wordPool: [
      { word: 'Frog',   emoji: '🐸', label: 'Frog'   },
      { word: 'Crab',   emoji: '🦀', label: 'Crab'   },
      { word: 'Drum',   emoji: '🥁', label: 'Drum'   },
      { word: 'Crown',  emoji: '👑', label: 'Crown'  },
      { word: 'Truck',  emoji: '🚛', label: 'Truck'  },
      { word: 'Shark',  emoji: '🦈', label: 'Shark'  },
      { word: 'Snail',  emoji: '🐌', label: 'Snail'  },
      { word: 'Grapes', emoji: '🍇', label: 'Grapes' },
    ],
  },
  {
    id: 4,
    name: 'Level 4',
    objectCount: 3,
    targetCorrect: 10,
    floatSpeed: 2,          // faster float
    distractors: false,
    wordsPerGame: 4,
    // Two-syllable words for maximum challenge
    wordPool: [
      { word: 'Tiger',   emoji: '🐯', label: 'Tiger'   },
      { word: 'Rabbit',  emoji: '🐰', label: 'Rabbit'  },
      { word: 'Monkey',  emoji: '🐒', label: 'Monkey'  },
      { word: 'Penguin', emoji: '🐧', label: 'Penguin' },
      { word: 'Turtle',  emoji: '🐢', label: 'Turtle'  },
      { word: 'Dragon',  emoji: '🐉', label: 'Dragon'  },
      { word: 'Rocket',  emoji: '🚀', label: 'Rocket'  },
      { word: 'Cactus',  emoji: '🌵', label: 'Cactus'  },
    ],
  },
];

// Visual distractors — never the target word, just visual noise
export const DISTRACTOR_POOL = [
  { emoji: '🌈', label: 'Rainbow'   },
  { emoji: '🎈', label: 'Balloon'   },
  { emoji: '🦋', label: 'Butterfly' },
  { emoji: '🌺', label: 'Hibiscus'  },
];
