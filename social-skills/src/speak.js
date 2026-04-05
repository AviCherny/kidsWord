// TTS helper — Hebrew primary, English fallback.
// Fire-and-forget: never awaited, never blocks UI.
// Browser Web Speech API only. Capacitor TTS added later when Android port starts.

export function speak(heText, _enText, enabled) {
  if (!enabled) return;
  if (!window.speechSynthesis) return;

  try { window.speechSynthesis.cancel(); } catch (e) {}

  try {
    // Always use Hebrew (he-IL). getVoices() is async in Chrome — checking it
    // synchronously always returns empty and would incorrectly fall back to English.
    // The browser uses the best available Hebrew voice or its default voice.
    const u = new SpeechSynthesisUtterance(heText);
    u.lang = 'he-IL';
    u.rate = 0.8;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
