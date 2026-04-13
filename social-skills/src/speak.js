import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isNative = Capacitor.isNativePlatform();

// Fire-and-forget — never await in component
// always=true: speak regardless of soundOn toggle (e.g. explicit 🔊 tap)
export async function speak(text, _fallback, enabled) {
  if (!enabled) return;

  if (isNative) {
    try { await TextToSpeech.stop(); } catch (e) {}
    try {
      await TextToSpeech.speak({ text, lang: 'he-IL', rate: 0.8, pitch: 1.1, volume: 1.0 });
    } catch (e) {}
    return;
  }

  // Browser fallback
  if (!window.speechSynthesis) return;
  try { window.speechSynthesis.cancel(); } catch (e) {}
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.8;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
