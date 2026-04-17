// Custom audio overrides for words where recorded pronunciation is preferred over TTS
// Key: the exact text passed to speak(), Value: filename in /audio/
const CUSTOM_AUDIO = {
  // Category labels (existing)
  'אוכל': 'ochel.mp4',
  'חיות': 'chayot.mp4',
  'רכב':  'rechev.mp4',

  // Animals
  'כלב':     'Dog.m4a',
  'חתול':    'Cat.m4a',
  'חזיר':    'Pig.m4a',
  'תרנגולת': 'Hen.m4a',
  'דג':      'Fish.m4a',
  'ציפור':   'Bird.m4a',
  'ברווז':   'Duck.m4a',
  'דוב':     'Bear.m4a',
  'דבורה':   'Bee.m4a',
  'פרה':     'Cow.m4a',
  'נמלה':    'Ant.m4a',
  'ינשוף':   'Owl.m4a',
  'כבש':     'Sheep.m4a',
  'עטלף':    'Bat.m4a',
  'שועל':    'Fox.m4a',
  'צפרדע':   'Frog.m4a',
  'סרטן':    'Crab.m4a',
  'כריש':    'Shark.m4a',
  'שבלול':   'Snail.m4a',
  'לוויתן':  'Whale.m4a',
  'נשר':     'Eagle.m4a',
  'בואש':    'Skunk.m4a',
  'נמר':     'Tiger.m4a',
  'ארנב':    'Rabbit.m4a',
  'קוף':     'Monkey.m4a',
  'פינגווין': 'Penguin.m4a',
  'צב':      'Turtle.m4a',
  'פיל':     'Elephant.m4a',
  'קנגורו':  'Kangaroo.m4a',
  'תמנון':   'Octopus.m4a',
  'תנין':    'Crocodile.m4a',
  'פלמינגו': 'Flamingo.m4a',
  'עקרב':    'Scorpion.m4a',
  'מדוזה':   'Jellyfish.m4a',
  'טווס':    'Peacock.m4a',
  'דינוזאור': 'Dinosaur.m4a',

  // Food
  'תפוח':    'Apple.m4a',
  'תירס':    'Corn.m4a',
  'חלב':     'Milk.m4a',
  'ביצה':    'Egg.m4a',
  'עוגה':    'Cake.m4a',
  'ענבים':   'Grapes.m4a',
  'אגס':     'Pear.m4a',
  'לחמנייה': 'Bun.m4a',
  'שזיף':    'Plum.m4a',
  'תות':     'Strawberry.m4a',
  'אננס':    'Pineapple.m4a',

  // Vehicles
  'מכונית':  'Car.m4a',
  'ספינה':   'Ship.m4a',
  'אוטובוס': 'Bus.m4a',
  'מטוס':    'Jet.m4a',
  'משאית':   'Truck.m4a',
  'רכבת':    'Train.m4a',
  'רקטה':    'Rocket.m4a',
  'מסוק':    'Helicopter.m4a',

  // Items / Objects
  'כדור':    'Ball.m4a',
  'כובע':    'Hat.m4a',
  'כוס':     'Cup.m4a',
  'ספר':     'Book.m4a',
  'מיטה':    'Bed.m4a',
  'קרח':     'Ice.m4a',
  'מפתח':    'Key.m4a',
  'קופסה':   'Box.m4a',
  'מנורה':   'Lamp.m4a',
  'גרב':     'Sock.m4a',
  'פעמון':   'Bell.m4a',
  'רשת':     'Net.m4a',
  'אגוז':    'Nut.m4a',
  'ספל':     'Mug.m4a',
  'קן':      'Nest.m4a',
  'אוהל':    'Tent.m4a',
  'מנעול':   'Lock.m4a',
  'מפה':     'Map.m4a',
  'תוף':     'Drum.m4a',
  'כתר':     'Crown.m4a',
  'מטאטא':   'Broom.m4a',
  'כפפה':    'Glove.m4a',
  'שמלה':    'Dress.m4a',
  'לבנה':    'Brick.m4a',
  'קש':      'Straw.m4a',
  'אבן':     'Stone.m4a',
  'מגלשה':   'Slide.m4a',
  'נדנדה':   'Swing.m4a',
  'קקטוס':   'Cactus.m4a',
  'מטריה':   'Umbrella.m4a',
  'מחבת':    'Pan.m4a',
  'עט':      'Pen.m4a',

  // English words used by WordRace
  elephant: 'Elephant.m4a',
  dog: 'Dog.m4a',
  cat: 'Cat.m4a',
  fish: 'Fish.m4a',
  duck: 'Duck.m4a',
  bear: 'Bear.m4a',
  frog: 'Frog.m4a',
  tiger: 'Tiger.m4a',
  rabbit: 'Rabbit.m4a',
  monkey: 'Monkey.m4a',
  turtle: 'Turtle.m4a',
  apple: 'Apple.m4a',
  cake: 'Cake.m4a',
  rocket: 'Rocket.m4a',
  train: 'Train.m4a',
  ball: 'Ball.m4a',
  drum: 'Drum.m4a',
  hat: 'Hat.m4a',
  bird: 'Bird.m4a',
  cow: 'Cow.m4a',
};

// Track the currently playing audio element so we can stop it
let currentAudio = null;

function playCustomAudio(filename, onEnd) {
  // Stop any currently playing audio
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
    currentAudio = null;
  }

  const audio = new Audio(`/audio/${filename}`);
  audio.preload = 'auto';
  audio.volume = 1.0;
  currentAudio = audio;

  if (onEnd) {
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
      onEnd();
    };
  } else {
    audio.onended = () => {
      if (currentAudio === audio) currentAudio = null;
    };
  }

  audio.onerror = () => {
    if (currentAudio === audio) currentAudio = null;
    if (onEnd) onEnd();
  };

  audio.play().catch(() => {
    if (currentAudio === audio) currentAudio = null;
    if (onEnd) onEnd();
  });
}

export function stopSpeaking() {
  // Stop any playing audio file
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
    currentAudio = null;
  }
  // Cancel any ongoing speech synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }
}

// Shared TTS — language-aware, web-only (no Capacitor)
export function speak(text, lang, onEnd) {
  if (!text) return;

  if (CUSTOM_AUDIO[text]) {
    try {
      playCustomAudio(CUSTOM_AUDIO[text], onEnd);
    } catch (e) {
      if (onEnd) onEnd();
    }
    return;
  }

  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }
  try { window.speechSynthesis.cancel(); } catch (e) {}
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.lang = lang === 'he' ? 'he-IL' : 'en-US';
    if (onEnd) u.onend = onEnd;
    window.speechSynthesis.speak(u);
  } catch (e) {
    if (onEnd) onEnd();
  }
}
