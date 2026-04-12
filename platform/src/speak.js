import { isSoundEnabled } from './lib/settings';

// Shared TTS — language-aware, web-only (no Capacitor)
export function speak(text, lang, onEnd) {
  if (!text) return;
  if (!isSoundEnabled()) {
    if (onEnd) onEnd();
    return;
  }
  if (!window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch (e) {}

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
