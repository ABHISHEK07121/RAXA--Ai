"use client";
import { createContext, useContext, ReactNode } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import { usePersistentState } from "../hooks/usePersistentState";

interface LanguageContextType {
  t: Record<string, string>;
  lang: "en" | "hi";
  currentLanguage: "en" | "hi";
  toggleLanguage: () => void;
}

const languages: Record<"en" | "hi", Record<string, string>> = {
  en,
  hi,
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = usePersistentState<"en" | "hi">("raxa_language", "en");

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "hi" : "en"));
  };

  return (
    <LanguageContext.Provider
      value={{ t: languages[lang], lang, currentLanguage: lang, toggleLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
