'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Cargar idioma guardado al inicializar
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('virtualaid_lang');
      if (savedLang && savedLang !== i18n.language) {
        i18n.changeLanguage(savedLang);
      }
    }
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}
