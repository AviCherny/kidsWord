import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitchButton({ className = '', compact = false }) {
  const { lang, setLang } = useLanguage();
  const nextIsEnglish = lang === 'he';

  return (
    <button
      className={`lang-switch-btn${compact ? ' lang-switch-btn--compact' : ''}${className ? ` ${className}` : ''}`}
      onClick={() => setLang(nextIsEnglish ? 'en' : 'he')}
      aria-label={nextIsEnglish ? 'Switch to English' : 'Switch to Hebrew'}
      type="button"
    >
      {nextIsEnglish ? 'EN' : 'עב'}
    </button>
  );
}
