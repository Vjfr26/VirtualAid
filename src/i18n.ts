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

type LocaleDictionary = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const mergeDeep = (base: unknown, override: unknown): unknown => {
  if (Array.isArray(override)) {
    return override.slice();
  }

  if (isPlainObject(override)) {
    const result: Record<string, unknown> = isPlainObject(base) ? { ...base } : {};
    Object.keys(override).forEach((key) => {
      result[key] = mergeDeep(result[key], override[key]);
    });
    return result;
  }

  if (override !== undefined) {
    return override;
  }

  if (Array.isArray(base)) {
    return base.slice();
  }

  if (isPlainObject(base)) {
    return { ...base };
  }

  return base;
};

const rawLocales: Record<string, LocaleDictionary> = {
  es,
  en,
  fr,
  de,
  it,
  pt,
  ru,
  zh,
  ja,
  ar,
  tr,
  pl,
};

const buildResources = () => {
  const resources: Record<string, { common: LocaleDictionary }> = {};
  Object.entries(rawLocales).forEach(([lng, locale]) => {
    const merged = mergeDeep(deepClone(en) as LocaleDictionary, locale) as LocaleDictionary;
    resources[lng] = { common: merged };
  });
  return resources;
};

const resources = buildResources();


const getInitialLanguage = () => {
  // No usar localStorage durante SSR para evitar desajustes.
  return 'es'; // Idioma inicial consistente para SSR/CSR
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    ns: ['common'],
    defaultNS: 'common',
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
