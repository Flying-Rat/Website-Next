"use client";

import i18next from "i18next";
import { useSyncExternalStore } from "react";
import { initReactI18next, useTranslation as useTranslationOrg } from "react-i18next";

import csCommon from "../locales/cs.json";
import enCommon from "../locales/en.json";
import { fallbackLng, getOptions, type Language, languages } from "./settings";

const resources = {
  en: { common: enCommon },
  cs: { common: csCommon },
};

const i18nInstance = i18next.use(initReactI18next);

if (!i18nInstance.isInitialized) {
  i18nInstance.init({
    ...getOptions(),
    resources,
    lng: fallbackLng,
  });
}

function subscribeToLanguage(callback: () => void) {
  i18next.on("languageChanged", callback);
  return () => {
    i18next.off("languageChanged", callback);
  };
}

function getLanguageSnapshot(): Language {
  return (i18next.language as Language) || fallbackLng;
}

function getServerSnapshot(): Language {
  return fallbackLng;
}

export function useLanguage(): [Language, (lng: Language) => void] {
  const currentLang = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerSnapshot,
  );

  const changeLanguage = (lng: Language) => {
    i18next.changeLanguage(lng);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", lng);
    }
  };

  return [currentLang, changeLanguage];
}

export const useTranslation = useTranslationOrg;

export { languages };
