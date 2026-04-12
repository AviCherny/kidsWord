// Memory Game — full card pool
// Each card: { id, emoji, label }
// The game picks N pairs from this pool, duplicates them, then shuffles.

export const CARD_POOL = [
  { id: 'apple',    emoji: '🍎', label: 'Apple'    },
  { id: 'dog',      emoji: '🐶', label: 'Dog'      },
  { id: 'cat',      emoji: '🐱', label: 'Cat'      },
  { id: 'car',      emoji: '🚗', label: 'Car'      },
  { id: 'ball',     emoji: '⚽', label: 'Ball'     },
  { id: 'sun',      emoji: '☀️', label: 'Sun'      },
  { id: 'moon',     emoji: '🌙', label: 'Moon'     },
  { id: 'star',     emoji: '⭐', label: 'Star'     },
  { id: 'fish',     emoji: '🐟', label: 'Fish'     },
  { id: 'bird',     emoji: '🐦', label: 'Bird'     },
  { id: 'frog',     emoji: '🐸', label: 'Frog'     },
  { id: 'pig',      emoji: '🐷', label: 'Pig'      },
  { id: 'cow',      emoji: '🐮', label: 'Cow'      },
  { id: 'duck',     emoji: '🦆', label: 'Duck'     },
  { id: 'rabbit',   emoji: '🐰', label: 'Rabbit'   },
  { id: 'tiger',    emoji: '🐯', label: 'Tiger'    },
  { id: 'elephant', emoji: '🐘', label: 'Elephant' },
  { id: 'lion',     emoji: '🦁', label: 'Lion'     },
  { id: 'bee',      emoji: '🐝', label: 'Bee'      },
  { id: 'butterfly',emoji: '🦋', label: 'Butterfly'},
  { id: 'cake',     emoji: '🎂', label: 'Cake'     },
  { id: 'pizza',    emoji: '🍕', label: 'Pizza'    },
  { id: 'banana',   emoji: '🍌', label: 'Banana'   },
  { id: 'strawberry',emoji:'🍓', label: 'Strawberry'},
];

// Board size options shown at the start screen
// pairs = how many unique card pairs are used
export const BOARD_SIZES = [
  { label: '4 pairs',  pairs: 4,  cols: 4, name: 'Easy'   },
  { label: '6 pairs',  pairs: 6,  cols: 4, name: 'Medium'  },
  { label: '8 pairs',  pairs: 8,  cols: 4, name: 'Hard'    },
  { label: '12 pairs', pairs: 12, cols: 6, name: 'Expert'  },
];
