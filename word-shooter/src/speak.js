// speak.js — Web Speech API wrapper (reused pattern from social-skills)
export function speak(text, onEnd) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.85;
  u.pitch = 1.1;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}
