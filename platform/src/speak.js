// Custom audio overrides for words where recorded pronunciation is preferred over TTS
// Key: the exact text passed to speak(), Value: filename in /audio/
const CUSTOM_AUDIO = {
  'אוכל': 'ochel.mp4',
};

// Shared TTS — language-aware, web-only (no Capacitor)
export function speak(text, lang, onEnd) {
  if (!text) return;

  if (CUSTOM_AUDIO[text]) {
    try {
      const audio = new Audio(`/audio/${CUSTOM_AUDIO[text]}`);
      audio.volume = 1.0;
      if (onEnd) audio.onended = onEnd;
      audio.play().catch(() => { if (onEnd) onEnd(); });
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
