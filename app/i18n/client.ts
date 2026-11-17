'use client';

import i18next from 'i18next';
import { useSyncExternalStore } from 'react';
import { initReactI18next } from 'react-i18next';

import csCommon from '../locales/cs.json';
import enCommon from '../locales/en.json';
import { tieShortWordsDeep } from '../utils/czechTypography';
import { fallbackLng, getOptions, type Language } from './settings';

const resources = {
  en: { common: enCommon },
  cs: { common: tieShortWordsDeep(csCommon) },
};

const i18nInstance = i18next.use(initReactI18next);

if (!i18nInstance.isInitialized) {
  i18nInstance.init({
    ...getOptions(),
    resources,
    lng: fallbackLng,
  });
} else {
  // This module re-evaluates on hot reload while the i18next singleton lives on.
  // Refresh its bundles so edited locale files show up without restarting dev
  // (otherwise the server keeps rendering raw keys for anything newly added).
  for (const [lng, namespaces] of Object.entries(resources)) {
    i18nInstance.addResourceBundle(lng, 'common', namespaces.common, true, true);
  }
}

function subscribeToLanguage(callback: () => void) {
  i18next.on('languageChanged', callback);
  return () => {
    i18next.off('languageChanged', callback);
  };
}

function getLanguageSnapshot(): Language {
  return (i18next.language as Language) || fallbackLng;
}

function getServerSnapshot(): Language {
  return fallbackLng;
}

function changeLanguage(lng: Language) {
  void i18next.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
    // Screen readers pick their voice, and browsers their hyphenation, from this.
    document.documentElement.lang = lng;
  }
}

export function useLanguage(): [Language, (lng: Language) => void] {
  const currentLang = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerSnapshot,
  );

  return [currentLang, changeLanguage];
}

export { useTranslation } from 'react-i18next';
