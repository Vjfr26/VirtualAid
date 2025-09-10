import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


import es from '@/../public/locales/es/common.json';
import en from '@/../public/locales/en/common.json';
import fr from '@/../public/locales/fr/common.json';
import de from '@/../public/locales/de/common.json';
import it from '@/../public/locales/it/common.json';
import pt from '@/../public/locales/pt/common.json';
import ru from '@/../public/locales/ru/common.json';
import zh from '@/../public/locales/zh/common.json';
import ja from '@/../public/locales/ja/common.json';
import ar from '@/../public/locales/ar/common.json';
import tr from '@/../public/locales/tr/common.json';
import pl from '@/../public/locales/pl/common.json';


const getInitialLanguage = () => {
  // No usar localStorage durante SSR para evitar desajustes.
  return 'es'; // Idioma inicial consistente para SSR/CSR
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { common: es },
      en: { common: en },
      fr: { common: fr },
      de: { common: de },
      it: { common: it },
      pt: { common: pt },
      ru: { common: ru },
      zh: { common: zh },
      ja: { common: ja },
      ar: { common: ar },
      tr: { common: tr },
      pl: { common: pl },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// En cliente, aplicar idioma almacenado (si existe) tras inicialización
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('virtualaid_lang');
  if (stored) {
    i18n.changeLanguage(stored);
  }
}

// Guardar el idioma en localStorage solo en el lado del cliente
// después de la hidratación para evitar desajustes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined' && window.document) {
    // Solo ejecutar después de que el documento esté completamente cargado
    if (document.readyState === 'complete') {
      localStorage.setItem('virtualaid_lang', lng);
    } else {
      window.addEventListener('load', () => {
        localStorage.setItem('virtualaid_lang', lng);
      });
    }
  }
});

export default i18n;
