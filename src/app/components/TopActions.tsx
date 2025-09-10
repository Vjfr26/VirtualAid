"use client";
import { useEffect } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
// import Link from 'next/link';
import i18n from '../../i18n';

const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];

export default function TopActions() {
  const { i18n: i18nHook } = useTranslation('common');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const getCurrentLang = () => {
    const found = languages.find(l => l.code === i18nHook.language);
    return found || languages[0];
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      localStorage.setItem('virtualaid_lang', lng);
    }
    setShowLangMenu(false);
  };

  // Al montar, restaurar idioma guardado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('virtualaid_lang');
      if (savedLang && savedLang !== i18nHook.language) {
        i18n.changeLanguage(savedLang);
      }
    }
    // eslint-disable-next-line
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!showLangMenu) return;
    const handleClick = (e: MouseEvent) => {
      const menu = document.getElementById('langMenuDropdown');
      if (menu && !menu.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLangMenu]);

  return (
    <>
      <style>{`
        .langMenuDropdown {
          position: absolute;
          top: 2.5rem;
          right: 0;
          background: #fff;
          border: 1px solid #bbb;
          border-radius: 6px;
          box-shadow: 0 4px 16px #0002;
          z-index: 100;
          min-width: 160px;
        }
        .langMenuOption {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 0.5rem 1.5rem;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          font-weight: 500;
          color: #222;
          font-size: 16px;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
        }
        .langMenuOption:hover {
          background: #e0f2fe;
          color: #2563eb;
          box-shadow: 0 2px 8px #2563eb22;
        }
        .langMenuOption.selected {
          background: linear-gradient(90deg, #2563eb 60%, #10b981 100%);
          color: #fff;
          font-weight: 700;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 9 }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowLangMenu(v => !v)}
            style={{ padding: '0.18rem 0.5rem', borderRadius: 7, border: '1.2px solid #bbb', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#222', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px #0001', height: 32, width: 32, minWidth: 32, minHeight: 32, justifyContent: 'center' }}
            aria-label="Seleccionar idioma"
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{getCurrentLang().flag}</span>
          </button>
          {showLangMenu && (
            <div id="langMenuDropdown" className="langMenuDropdown">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`langMenuOption${i18nHook.language === lang.code ? ' selected' : ''}`}
                >
                  <span style={{ fontSize: 20 }}>{lang.flag}</span> <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
