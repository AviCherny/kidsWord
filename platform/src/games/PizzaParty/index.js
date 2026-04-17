import React, { useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './PizzaParty.css';

export default function PizzaParty({ onSuccess }) {
  const { lang, dir } = useLanguage();
  const iframeRef = useRef(null);
  const hasCompletedRef = useRef(false);

  const src = useMemo(() => {
    const base = `${process.env.PUBLIC_URL || ''}/games/pizza-party/index.html`;
    return `${base}?lang=${encodeURIComponent(lang)}`;
  }, [lang]);

  useEffect(() => {
    hasCompletedRef.current = false;
  }, [src]);

  useEffect(() => {
    function handleMessage(event) {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }

      if (event.data?.type === 'pizza-party-complete' && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onSuccess?.();
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSuccess]);

  return (
    <div className="pizza-platform-shell" dir={dir}>
      <iframe
        ref={iframeRef}
        key={src}
        className="pizza-platform-frame"
        src={src}
        title={lang === 'he' ? 'משחק פיצה' : 'Pizza Party'}
        loading="eager"
        allow="autoplay"
      />
    </div>
  );
}
