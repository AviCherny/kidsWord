import React, { createContext, useContext, useState } from 'react';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('kids-lang') || 'he';
  });

  function setLang(newLang) {
    localStorage.setItem('kids-lang', newLang);
    setLangState(newLang);
  }

  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
